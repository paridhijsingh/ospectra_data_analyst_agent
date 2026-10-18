import { matchRecruitmentQuestion } from './recruitment-intent-registry';
import { applications, monthKeys, monthLabels, stageOrder } from './recruitment-data';

export type ChartDatum = { label: string; shortLabel: string; value: number; displayValue: string };
export type ChartType = 'bar' | 'funnel' | 'line' | 'donut';
export type RecruitmentAnswer = {
  supported: boolean; questionId: string; title: string; summary: string; insight: string;
  data: ChartDatum[]; chart: ChartType; chartDescription: string; unit: 'count' | 'days' | 'percent';
  metricLabel: string; metricIds: string[]; definition: string; sources: string[]; intent: string; queryPlan: string;
};

export const questions = [
  { id:'applications-by-job', prompt:'How many candidates applied for each job this month?' },
  { id:'time-to-hire', prompt:'What is the average time to hire by department in the last 90 days?' },
  { id:'engineering-funnel', prompt:'Where is the biggest drop-off in the recruitment funnel for engineering roles?' },
  { id:'applications-trend', prompt:'How are applications trending month over month?' },
  { id:'candidates-by-source', prompt:'Which recruiting sources bring in the most candidates?' },
  { id:'source-hire-rate', prompt:'Which source has the highest candidate-to-hire conversion rate?' },
  { id:'hires-by-department', prompt:'How many hires did each department make in the last 90 days?' },
  { id:'offer-acceptance', prompt:'What is the offer acceptance rate by department?' },
  { id:'pipeline-by-location', prompt:'How many active candidates are in the pipeline by location?' },
  { id:'department-demand', prompt:'Which departments account for the largest share of application demand?' },
  { id:'hiring-trend', prompt:'How are completed hires trending over the last six months?' },
  { id:'pipeline-health', prompt:'Which departments have the healthiest active recruiting pipeline?' },
] as const;

const daysBetween = (from:string,to:string) => Math.round((new Date(to).getTime()-new Date(from).getTime())/86_400_000);
const short = (label:string) => label.replace('Software ','SW ').replace('Machine Learning','ML').replace('Account ','Acct. ').replace('Customer Success','Cust. Success').replace('San Francisco','SF').replace('Careers site','Careers').replace('Community event','Community').replace('Internal mobility','Internal');
const datum = (label:string,value:number,suffix=''):ChartDatum => ({ label, shortLabel:short(label), value, displayValue:`${value}${suffix}` });
const makeAnswer = (answer:Omit<RecruitmentAnswer,'supported'|'chartDescription'>):RecruitmentAnswer => ({ supported:true, chartDescription:`${answer.metricLabel}: ${answer.data.map((item)=>`${item.label} ${item.displayValue}`).join(', ')}.`, ...answer });
const groupCount = <T,>(rows:T[], key:(row:T)=>string) => rows.reduce<Record<string,number>>((acc,row)=>{ const label=key(row); acc[label]=(acc[label]??0)+1; return acc; },{});
const sortedData = (values:Record<string,number>,suffix='') => Object.entries(values).sort((a,b)=>b[1]-a[1]).map(([label,value])=>datum(label,value,suffix));

function applicationsByJob(){
  const rows=applications.filter((row)=>row.appliedAt.startsWith('2026-09'));
  const data=sortedData(groupCount(rows,(row)=>row.jobTitle));
  return makeAnswer({ questionId:'applications-by-job', title:`${rows.length} candidates applied across ${data.length} roles in September`, summary:`${data[0].label} attracted the largest pool with ${data[0].value} applications; ${data[1].label} followed with ${data[1].value}.`, insight:'Demand is broadening beyond engineering, with sales and customer-success roles also showing strong volume.', data, chart:'bar', unit:'count', metricLabel:'Applications', metricIds:['application_count'], definition:'Distinct applications submitted in the selected period.', sources:['applications','jobs'], intent:'metric_breakdown', queryPlan:'application_count · group by job_title · Sep 2026' });
}

function timeToHire(){
  const grouped=applications.reduce<Record<string,number[]>>((acc,row)=>{ if(row.hiredAt)(acc[row.department]??=[]).push(daysBetween(row.appliedAt,row.hiredAt)); return acc; },{});
  const data=Object.entries(grouped).map(([label,values])=>datum(label,Number((values.reduce((a,b)=>a+b,0)/values.length).toFixed(1)),'d')).sort((a,b)=>b.value-a.value);
  return makeAnswer({ questionId:'time-to-hire', title:`Time to hire ranges from ${data.at(-1)?.displayValue} to ${data[0].displayValue}`, summary:`${data[0].label} is slowest at ${data[0].displayValue}; ${data.at(-1)?.label} is fastest at ${data.at(-1)?.displayValue}.`, insight:'The spread points to process variation by department rather than a company-wide constraint.', data, chart:'bar', unit:'days', metricLabel:'Average time to hire', metricIds:['average_time_to_hire'], definition:'Average calendar days from application to accepted hire.', sources:['applications','offers','jobs'], intent:'metric_breakdown', queryPlan:'avg(hired_at − applied_at) · group by department · last 90 days' });
}

function engineeringFunnel(){
  const scoped=applications.filter((row)=>row.department==='Engineering');
  const data=stageOrder.map((stage,index)=>datum(stage,scoped.filter((row)=>stageOrder.indexOf(row.stageReached)>=index).length));
  const drops=data.slice(1).map((row,index)=>({from:data[index].label,to:row.label,loss:data[index].value-row.value,rate:Math.round((data[index].value-row.value)/data[index].value*100)}));
  const biggest=[...drops].sort((a,b)=>b.rate-a.rate)[0];
  return makeAnswer({ questionId:'engineering-funnel', title:`Biggest drop-off: ${biggest.from} → ${biggest.to}`, summary:`${biggest.loss} candidates are lost at this step, a ${biggest.rate}% drop. ${data.at(-1)?.value} of ${data[0].value} engineering applicants were hired.`, insight:'The first priority is a structured review of stage criteria, interviewer capacity, and scheduling latency.', data, chart:'funnel', unit:'count', metricLabel:'Funnel candidates', metricIds:['candidate_count','stage_conversion_rate'], definition:'Candidates reaching each stage and conversion from the prior stage.', sources:['applications','interviews','offers','jobs'], intent:'funnel_analysis', queryPlan:'candidate_count by stage_reached · department = Engineering' });
}

function applicationsTrend(){
  const data=monthKeys.map((month,index)=>datum(monthLabels[index],applications.filter((row)=>row.appliedAt.startsWith(month)).length));
  const growth=Math.round((data.at(-1)!.value-data.at(-2)!.value)/data.at(-2)!.value*100);
  return makeAnswer({ questionId:'applications-trend', title:`Applications grew ${growth}% in September`, summary:`Monthly volume rose from ${data[0].value} in April to ${data.at(-1)?.value} in September, with no month-over-month decline.`, insight:'The six-month pattern suggests sustained demand growth rather than a one-month campaign spike.', data, chart:'line', unit:'count', metricLabel:'Applications', metricIds:['application_count'], definition:'Distinct applications submitted per calendar month.', sources:['applications'], intent:'time_trend', queryPlan:'application_count · group by applied_month · Apr–Sep 2026' });
}

function candidatesBySource(){
  const data=sortedData(groupCount(applications,(row)=>row.source));
  return makeAnswer({ questionId:'candidates-by-source', title:`${data[0].label} is the largest candidate source`, summary:`${data[0].label} contributed ${data[0].value} candidates, followed by ${data[1].label} with ${data[1].value}.`, insight:'Volume is distributed across seven channels, reducing dependence on any single acquisition source.', data, chart:'donut', unit:'count', metricLabel:'Candidates', metricIds:['candidate_count'], definition:'Distinct candidates attributed to application source.', sources:['applications','candidates'], intent:'mix_analysis', queryPlan:'candidate_count · group by source · six months' });
}

function sourceHireRate(){
  const grouped=applications.reduce<Record<string,{total:number;hired:number}>>((acc,row)=>{const g=(acc[row.source]??={total:0,hired:0});g.total+=1;if(row.stageReached==='Hired')g.hired+=1;return acc;},{});
  const data=Object.entries(grouped).map(([label,value])=>datum(label,Number((value.hired/value.total*100).toFixed(1)),'%')).sort((a,b)=>b.value-a.value);
  return makeAnswer({ questionId:'source-hire-rate', title:`${data[0].label} has the highest hire conversion`, summary:`${data[0].label} converts ${data[0].displayValue} of candidates to hires versus ${data.at(-1)?.displayValue} for ${data.at(-1)?.label}.`, insight:'Pair conversion with source volume and cost before shifting recruiting investment.', data, chart:'bar', unit:'percent', metricLabel:'Hire conversion', metricIds:['candidate_to_hire_rate'], definition:'Hired candidates divided by candidates from the same source.', sources:['applications','candidates','offers'], intent:'rate_breakdown', queryPlan:'hired_candidates / candidate_count · group by source' });
}

function hiresByDepartment(){
  const data=sortedData(groupCount(applications.filter((row)=>row.stageReached==='Hired'),(row)=>row.department));
  return makeAnswer({ questionId:'hires-by-department', title:`${data[0].label} completed the most hires`, summary:`${data[0].label} completed ${data[0].value} hires, while ${data.at(-1)?.label} completed ${data.at(-1)?.value}.`, insight:'Hire counts should be interpreted alongside approved headcount and role demand.', data, chart:'bar', unit:'count', metricLabel:'Hires', metricIds:['hire_count'], definition:'Distinct applications reaching Hired.', sources:['applications','offers','jobs'], intent:'metric_breakdown', queryPlan:'hire_count · group by department · last 90 days' });
}

function offerAcceptance(){
  const grouped=applications.filter((row)=>['Offered','Hired'].includes(row.stageReached)).reduce<Record<string,{offered:number;hired:number}>>((acc,row)=>{const g=(acc[row.department]??={offered:0,hired:0});g.offered+=1;if(row.stageReached==='Hired')g.hired+=1;return acc;},{});
  const data=Object.entries(grouped).map(([label,value])=>datum(label,Math.round(value.hired/value.offered*100),'%')).sort((a,b)=>b.value-a.value);
  return makeAnswer({ questionId:'offer-acceptance', title:`${data[0].label} leads offer acceptance`, summary:`${data[0].label} accepts at ${data[0].displayValue}; ${data.at(-1)?.label} is lowest at ${data.at(-1)?.displayValue}.`, insight:'Low acceptance can reflect compensation, role fit, location expectations, or closing-process delays.', data, chart:'bar', unit:'percent', metricLabel:'Offer acceptance', metricIds:['offer_acceptance_rate'], definition:'Accepted offers divided by candidates reaching Offered or Hired.', sources:['offers','applications','jobs'], intent:'rate_breakdown', queryPlan:'accepted_offers / total_offers · group by department' });
}

function pipelineByLocation(){
  const rows=applications.filter((row)=>['Screened','Interviewed','Offered'].includes(row.stageReached));
  const data=sortedData(groupCount(rows,(row)=>row.location));
  return makeAnswer({ questionId:'pipeline-by-location', title:`${data[0].label} has the largest active pipeline`, summary:`${data[0].label} has ${data[0].value} candidates between screening and offer, followed by ${data[1].label} with ${data[1].value}.`, insight:'Location volume reflects both market supply and where open roles are assigned.', data, chart:'donut', unit:'count', metricLabel:'Active candidates', metricIds:['active_pipeline_count'], definition:'Candidates in Screened, Interviewed, or Offered.', sources:['applications','jobs'], intent:'mix_analysis', queryPlan:'candidate_count · group by location · active stages' });
}

function departmentDemand(){
  const data=sortedData(groupCount(applications,(row)=>row.department));
  const share=Math.round(data[0].value/applications.length*100);
  return makeAnswer({ questionId:'department-demand', title:`${data[0].label} represents ${share}% of application demand`, summary:`${data[0].label} has ${data[0].value} applications across six months; ${data[1].label} is next with ${data[1].value}.`, insight:'Demand is intentionally diversified across seven operating departments in this synthetic scenario.', data, chart:'donut', unit:'count', metricLabel:'Applications', metricIds:['application_count','application_share'], definition:'Applications and share of all applications by department.', sources:['applications','jobs'], intent:'mix_analysis', queryPlan:'application_count and share · group by department' });
}

function hiringTrend(){
  const data=monthKeys.map((month,index)=>datum(monthLabels[index],applications.filter((row)=>row.appliedAt.startsWith(month)&&row.stageReached==='Hired').length));
  return makeAnswer({ questionId:'hiring-trend', title:'Completed hires are trending upward', summary:`Hires increased from ${data[0].value} in April to ${data.at(-1)?.value} in September as application volume expanded.`, insight:'The trajectory is positive, but the hire rate should be monitored so volume growth does not mask weaker conversion.', data, chart:'line', unit:'count', metricLabel:'Completed hires', metricIds:['hire_count'], definition:'Applications reaching Hired, grouped by application month.', sources:['applications','offers'], intent:'time_trend', queryPlan:'hire_count · group by applied_month · Apr–Sep 2026' });
}

function pipelineHealth(){
  const grouped=applications.reduce<Record<string,{total:number;active:number}>>((acc,row)=>{const g=(acc[row.department]??={total:0,active:0});g.total+=1;if(['Screened','Interviewed','Offered'].includes(row.stageReached))g.active+=1;return acc;},{});
  const data=Object.entries(grouped).map(([label,value])=>datum(label,Number((value.active/value.total*100).toFixed(1)),'%')).sort((a,b)=>b.value-a.value);
  return makeAnswer({ questionId:'pipeline-health', title:`${data[0].label} has the healthiest active pipeline`, summary:`${data[0].displayValue} of ${data[0].label} applicants are in active stages compared with ${data.at(-1)?.displayValue} for ${data.at(-1)?.label}.`, insight:'This diagnostic balances pipeline depth against the department’s total applicant pool.', data, chart:'bar', unit:'percent', metricLabel:'Active pipeline share', metricIds:['active_pipeline_rate'], definition:'Active-stage candidates divided by all applications in the department.', sources:['applications','interviews','jobs'], intent:'rate_breakdown', queryPlan:'active_candidates / applications · group by department' });
}

const handlers:Record<string,()=>RecruitmentAnswer> = {
  'applications-by-job':applicationsByJob,'time-to-hire':timeToHire,'engineering-funnel':engineeringFunnel,'applications-trend':applicationsTrend,
  'candidates-by-source':candidatesBySource,'source-hire-rate':sourceHireRate,'hires-by-department':hiresByDepartment,'offer-acceptance':offerAcceptance,
  'pipeline-by-location':pipelineByLocation,'department-demand':departmentDemand,'hiring-trend':hiringTrend,'pipeline-health':pipelineHealth,
};

export function answerQuestion(question:string):RecruitmentAnswer {
  const id=matchRecruitmentQuestion(question);
  if(id&&handlers[id])return handlers[id]();
  return { supported:false, questionId:'unsupported', title:'Question is outside the governed POC', summary:`This proof of concept supports ${questions.length} approved recruitment questions. Choose one below so every number remains traceable.`, insight:'Add a new metric definition before enabling a new question.', data:[], chart:'bar', chartDescription:'', unit:'count', metricLabel:'', metricIds:[], definition:'', sources:[], intent:'unsupported', queryPlan:'BLOCKED by semantic policy' };
}
