import { matchFinancialIntent } from './financial-intent-registry';
import type { RecruitmentAnswer } from './metric-engine';

export const financialQuestions = [
  { id:'collections-gap', prompt:'Why is cash collection lagging behind earned revenue this month?' },
  { id:'cash-forecast', prompt:'What is the projected cash position over the next 30–60 days based on outstanding claims?' },
  { id:'payer-delays', prompt:'Which payers have the longest payment delays between claim submission and cash receipt?' },
  { id:'denied-exposure', prompt:'How much revenue is currently trapped in denied claims, and what are the primary denial drivers?' },
  { id:'claim-status', prompt:'What is the financial exposure from rejected claims compared with denied claims?' },
  { id:'ar-risk', prompt:'Which AR aging buckets present the highest collection risk?' },
  { id:'unauthorized-care', prompt:'How much revenue is potentially unbillable due to care provided outside valid authorization periods?' },
  { id:'unused-auth', prompt:'What is the dollar exposure from unused authorization hours across active client care plans?' },
  { id:'expiring-auth', prompt:'Which client accounts have authorizations expiring within the next 14 days?' },
  { id:'unbilled-visits', prompt:'What is the total dollar value of unbilled visits associated with documentation or EVV exceptions?' },
  { id:'evv-delays', prompt:'How do missing visit records or EVV discrepancies relate to billing delays?' },
  { id:'reimbursement', prompt:'What is the variance between expected reimbursement rates and actual payer payments?' },
  { id:'recovery', prompt:'How much revenue was recovered or protected following intervention on denied claims?' },
  { id:'budget', prompt:'How is spending tracking against departmental operating budget?' },
  { id:'margin', prompt:'What is caregiver payroll cost relative to billed revenue, and how does overtime affect gross margin?' },
  { id:'cash-coverage', prompt:'How does current bank cash compare with short-term payroll and vendor commitments?' },
  { id:'workflow-cost', prompt:'What is the operational cost of manual billing and denial-management workflows?' },
  { id:'rcm-bottleneck', prompt:'Where are manual intervention bottlenecks in the RCM cycle?' },
  { id:'denial-scenario', prompt:'What happens to the 60-day cash forecast if the denial rate decreases from 8% to 4%?' },
  { id:'auth-scenario', prompt:'How would a 10% improvement in authorization utilization affect revenue and collections?' },
  { id:'insurance-bridge', prompt:'Why did insurance collections decrease despite billable hours remaining flat?' },
  { id:'division-risk', prompt:'Which operational divisions have the largest budget variance alongside operational issues?' },
  { id:'ar-lineage', prompt:'What operational care records explain an outstanding AR balance?' },
  { id:'combined-exposure', prompt:'What is the combined exposure from unbilled visits, denials, unused authorizations, and underpayments?' },
  { id:'cash-by-branch', prompt:'What is the current cash position by branch?' },
] as const;

type Datum={label:string;value:number;displayValue:string;shortLabel:string};
const data=(rows:Array<[string,number,string]>):Datum[]=>rows.map(([label,value,displayValue])=>({label,value,displayValue,shortLabel:label.length>15?`${label.slice(0,13)}…`:label}));
const template=(value:Omit<RecruitmentAnswer,'questionId'>)=>value;

const templates:Record<string,Omit<RecruitmentAnswer,'questionId'>>={
  collections:template({ supported:true,title:'Collections are $184K below earned revenue',summary:'Earned revenue held steady, but payer timing, denials, and billing-release delays reduced posted cash.',insight:'Payment timing explains $91K of the gap; denied and unbilled claims account for most of the remainder.',data:data([['Earned revenue',1438,'$1.44M'],['Cash collections',1254,'$1.25M'],['Prior month',1381,'$1.38M'],['90-day average',1342,'$1.34M']]),chart:'bar',chartDescription:'Earned revenue and cash collection comparison.',unit:'count',metricLabel:'Revenue / collections ($K)',metricIds:['earned_revenue','cash_collections','collection_gap'],definition:'Earned revenue less posted cash collections for the period.',sources:['general_ledger','claims','payments','remittance'],intent:'variance_analysis',queryPlan:'earned_revenue - cash_collections · current month' }),
  forecast:template({ supported:true,title:'Cash is projected to reach $4.42M in 60 days',summary:'Expected payer receipts recover the near-term payroll dip and produce a stronger ending position.',insight:'Payer timing remains the largest sensitivity; a seven-day delay would reduce the 30-day position by roughly $310K.',data:data([['Today',3860,'$3.86M'],['15 days',3720,'$3.72M'],['30 days',4080,'$4.08M'],['45 days',4215,'$4.22M'],['60 days',4420,'$4.42M']]),chart:'line',chartDescription:'Projected cash balance from today through 60 days.',unit:'count',metricLabel:'Projected cash ($K)',metricIds:['available_cash','cash_forecast'],definition:'Current cash plus expected collections less committed payroll and vendor outflows.',sources:['bank_cash','claims','payments','payroll','accounts_payable'],intent:'forecast',queryPlan:'cash balance projection · expected inflows/outflows · 60 days' }),
  payer:template({ supported:true,title:'Two payers exceed the 45-day payment target',summary:'State Medicaid and Horizon Health show the longest average lag from clean-claim submission to receipt.',insight:'The delay is concentrated in authorization matching and manual attachment review, not across all payers.',data:data([['State Medicaid',58,'58d'],['Horizon Health',51,'51d'],['Evergreen',43,'43d'],['Blue Horizon',38,'38d'],['UnitedCare',35,'35d'],['Aetna',31,'31d'],['Medicare',27,'27d'],['Self-pay',12,'12d']]),chart:'bar',chartDescription:'Average payment delay by payer.',unit:'days',metricLabel:'Average payment delay',metricIds:['days_to_payment'],definition:'Average calendar days from clean claim submission to posted cash receipt.',sources:['claims','remittance','payments','payer_master'],intent:'payer_analysis',queryPlan:'avg(payment_date - clean_claim_date) · group by payer' }),
  exposure:template({ supported:true,title:'$1.03M of non-overlapping exposure is identified',summary:'The total combines unused authorizations, denied claims, unbilled visits, and suspected underpayments after overlap removal.',insight:'Exposure is not confirmed loss; each category has a different recovery probability and operational owner.',data:data([['Unused auth',418,'$418K'],['Denied claims',312,'$312K'],['Unbilled visits',227,'$227K'],['Underpayments',73,'$73K']]),chart:'donut',chartDescription:'Potential financial exposure by category.',unit:'count',metricLabel:'Potential exposure ($K)',metricIds:['financial_exposure'],definition:'Deduplicated potential financial value requiring investigation.',sources:['claims','billing','authorizations','payments','visits'],intent:'exposure_analysis',queryPlan:'deduplicate exposure records · sum by category' }),
  claims:template({ supported:true,title:'Denied claims carry $312K of exposure',summary:'Missing authorization, coding validation, and timely-filing edits are the largest synthetic denial drivers.',insight:'The top three drivers represent 76% of denied dollars, creating a focused recovery queue.',data:data([['Missing authorization',96,'$96K'],['Coding validation',78,'$78K'],['Timely filing',63,'$63K'],['Eligibility',41,'$41K'],['Medical necessity',34,'$34K']]),chart:'bar',chartDescription:'Denied claim dollars by root cause.',unit:'count',metricLabel:'Denied exposure ($K)',metricIds:['denied_claim_value','denial_rate'],definition:'Submitted claim value currently in denied status, grouped by normalized denial cause.',sources:['claims','denials','authorizations'],intent:'root_cause_analysis',queryPlan:'denied_claim_value · group by denial_cause' }),
  ar:template({ supported:true,title:'$684K of AR is older than 60 days',summary:'Older receivables are 28% of total AR and are concentrated in three payer portfolios.',insight:'Prioritize older balances with active denial or rejection status before routine follow-up.',data:data([['0–30 days',1018,'$1.02M'],['31–60',744,'$744K'],['61–90',392,'$392K'],['91–120',178,'$178K'],['120+',114,'$114K']]),chart:'bar',chartDescription:'Accounts receivable aging buckets.',unit:'count',metricLabel:'Open AR ($K)',metricIds:['open_ar','ar_age'],definition:'Open receivable balance aged from original claim submission.',sources:['accounts_receivable','claims','payments'],intent:'aging_analysis',queryPlan:'open_ar · group by aging_bucket' }),
  authorization:template({ supported:true,title:'Authorization exposure is concentrated in two service lines',summary:'Skilled Nursing and Personal Care represent most unused or out-of-period authorized value.',insight:'Expiring plans should be reviewed first because prevention has a higher expected return than retrospective appeal.',data:data([['Skilled Nursing',174,'$174K'],['Personal Care',139,'$139K'],['Therapy',71,'$71K'],['Respite',34,'$34K']]),chart:'donut',chartDescription:'Authorization-related exposure by service line.',unit:'count',metricLabel:'Authorization exposure ($K)',metricIds:['authorization_exposure','unused_authorized_hours'],definition:'Potential value associated with unused or invalid authorization coverage.',sources:['authorizations','care_plans','visits','rates'],intent:'exposure_analysis',queryPlan:'authorized hours × contracted rate · group by service line' }),
  visits:template({ supported:true,title:'$227K of visits are not yet billable',summary:'Missing EVV confirmation and unsigned clinical documentation drive most of the unbilled queue.',insight:'Clearing the top two exception types would release an estimated $159K into the next billing cycle.',data:data([['Missing EVV',91,'$91K'],['Unsigned note',68,'$68K'],['Schedule mismatch',39,'$39K'],['Rate missing',18,'$18K'],['Other',11,'$11K']]),chart:'bar',chartDescription:'Unbilled visit value by exception.',unit:'count',metricLabel:'Unbilled value ($K)',metricIds:['unbilled_visit_value'],definition:'Completed visit value blocked from billing by an unresolved exception.',sources:['visits','evv','clinical_notes','billing'],intent:'root_cause_analysis',queryPlan:'completed_visit_value · group by billing_exception' }),
  budget:template({ supported:true,title:'Operating expense is 4.7% over budget',summary:'Actual operating expense is $2.14M versus a $2.04M month-to-date budget.',insight:'Caregiver overtime and contract labor account for most of the unfavorable variance.',data:data([['Care delivery',68,'+$68K'],['Contract labor',31,'+$31K'],['Technology',14,'+$14K'],['Supplies',8,'+$8K'],['Administration',-11,'-$11K'],['Facilities',-14,'-$14K']]),chart:'bar',chartDescription:'Budget variance by operating division.',unit:'count',metricLabel:'Budget variance ($K)',metricIds:['budget_variance'],definition:'Actual operating expense less approved budget.',sources:['general_ledger','budget','payroll','procurement'],intent:'variance_analysis',queryPlan:'actual - budget · group by division' }),
  cash:template({ supported:true,title:'Available cash is $5.18M across six branches',summary:'South has the strongest balance while Central has the lowest estimated days of cash on hand.',insight:'Central and Atlanta should be reviewed against the next payroll and high-confidence payer receipts.',data:data([['South',1210,'$1.21M'],['North',1040,'$1.04M'],['West',920,'$920K'],['East',810,'$810K'],['Central',690,'$690K'],['Atlanta',510,'$510K']]),chart:'donut',chartDescription:'Available cash by branch.',unit:'count',metricLabel:'Available cash ($K)',metricIds:['available_cash'],definition:'Cleared bank balance less restricted cash and outstanding disbursements.',sources:['bank_cash','accounts_payable','payroll'],intent:'cash_analysis',queryPlan:'available_cash · group by branch' }),
  margin:template({ supported:true,title:'Gross margin fell 2.3 points as overtime increased',summary:'Caregiver payroll grew faster than billed revenue, reducing gross margin to 29.1%.',insight:'Overtime increased 17% in Skilled Nursing while billable utilization remained nearly flat.',data:data([['April',31.8,'31.8%'],['May',31.5,'31.5%'],['June',31.9,'31.9%'],['July',31.4,'31.4%'],['August',30.2,'30.2%'],['September',29.1,'29.1%']]),chart:'line',chartDescription:'Gross margin trend over six months.',unit:'percent',metricLabel:'Gross margin',metricIds:['gross_margin','payroll_cost','overtime_rate'],definition:'(Billed revenue - direct caregiver payroll) divided by billed revenue.',sources:['revenue','payroll','visits'],intent:'margin_analysis',queryPlan:'gross_margin · group by month · Apr–Sep 2026' }),
  workflow:template({ supported:true,title:'Manual RCM work costs an estimated $286K monthly',summary:'Recorded staff effort and rework are concentrated in billing review and denial follow-up.',insight:'The best automation candidate combines high cost, repeated rules, and a measurable exception rate.',data:data([['Billing review',96,'$96K'],['Denial follow-up',82,'$82K'],['Documentation rework',64,'$64K'],['Authorization checks',27,'$27K'],['Supervision',17,'$17K']]),chart:'bar',chartDescription:'Manual workflow cost by process.',unit:'count',metricLabel:'Workflow cost ($K)',metricIds:['manual_workflow_cost'],definition:'Staff hours times loaded labor rate plus measured rework cost.',sources:['time_tracking','payroll','billing','denials'],intent:'cost_analysis',queryPlan:'staff_hours × loaded_rate + rework_cost · group by process' }),
};

const unsupportedFinancialAnswer: RecruitmentAnswer = {
  supported: false,
  questionId: 'unsupported',
  title: 'Question is outside the governed financial analyses',
  summary: '',
  insight: '',
  data: [],
  chart: 'bar',
  chartDescription: '',
  unit: 'count',
  metricLabel: '',
  metricIds: [],
  definition: '',
  sources: [],
  intent: 'unsupported',
  queryPlan: 'BLOCKED',
};

export function answerFinancialQuestion(question:string):RecruitmentAnswer {
  const matched=matchFinancialIntent(question);
  if(!matched)return unsupportedFinancialAnswer;
  return {...templates[matched.templateKey],questionId:matched.id};
}
