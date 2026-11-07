'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BadgeDollarSign, Bell, Bookmark, BriefcaseBusiness, CalendarClock, Check, CheckCircle2, ChevronDown, CircleHelp, ClipboardCheck, ClipboardList, Database, FileText, GitBranch, Grid2X2, HelpCircle, Home, ListFilter, MessageSquare, Network, Send, Settings, ShieldCheck, Snowflake, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AnswerFeedbackControls } from '@/components/answer/AnswerFeedbackControls';
import { ExplainerCard } from '@/components/explainers/ExplainerCard';
import { FinancialReportsView } from '@/components/financial/FinancialReportsView';
import { Sep24ScorecardView } from '@/components/financial/Sep24ScorecardView';
import { answerQualityIndicatorLabel, answerSourceChipLabel } from '@/lib/answer-card-ui';
import { questions, type RecruitmentAnswer } from '@/lib/metric-engine';
import { financialQuestions } from '@/lib/financial-metrics';
import { recruitmentCoverage } from '@/lib/recruitment-data';
import { runOrchestrator, semanticHonestyLabel, type AgentId } from '@/lib/orchestrator';
import type { GovernedExplainer } from '@/lib/visualization-explainer';

const chartColors=['#6d3df5','#8b5cf6','#a78bfa','#c4b5fd','#ec4899','#38bdf8','#14b8a6','#f59e0b'];
const agents={
  recruitment:{ id:'recruitment' as const,name:'Recruitment Analyst',short:'RA',domain:'Recruitment',icon:BriefcaseBusiness,questions,metrics:`12 approved metrics · ${recruitmentCoverage.applications.toLocaleString()} applications`,sources:'Applications, Jobs, Interviews, Offers',coverage:[`${recruitmentCoverage.months} months`,`${recruitmentCoverage.roles} roles`,`${recruitmentCoverage.departments} departments`,`${recruitmentCoverage.locations} locations`,`${recruitmentCoverage.sources} sources`] },
  financial:{ id:'financial' as const,name:'Financial Data Analyst',short:'FA',domain:'Finance',icon:BadgeDollarSign,questions:financialQuestions,metrics:'25 templates · 10 computed · Scope A synthetic',sources:'GL, AR, Claims, Payments, Payroll, Budgets, Visits, Authorizations, Synthetic finance',coverage:['24-mo Scope A','6 branches','8 payers','5 service lines','13 sources'] },
};

type FinanceSurface = 'chat' | 'reports' | 'scorecard';

function financeHonestyBanner(answer: RecruitmentAnswer): string {
  if (answer.answerSource === 'synthetic_computed') return 'Synthetic dataset — computed, not governed';
  return 'Static template — not computed, not governed';
}

function answerExplainer(answer: RecruitmentAnswer): GovernedExplainer | null {
  if (answer.answerSource !== 'synthetic_computed' || !answer.supported) return null;
  if (!answer.comparativeInsight && !answer.nextAction && !answer.followUps) return null;
  return {
    id: `finance-${answer.questionId}`,
    title: 'Computed finding',
    mode: 'visualization',
    whatYouAreLookingAt: answer.chartDescription || answer.definition,
    whatItShows: answer.summary,
    whyItMatters: answer.insight,
    boundedConclusion: answer.title,
    comparativeInsight: answer.comparativeInsight,
    nextAction: answer.nextAction,
    followUps: answer.followUps,
    limitations: answer.limitations ?? ['Synthetic dataset — computed, not governed'],
  };
}

function ResultChart({answer}:{answer:RecruitmentAnswer}){
  if(answer.chart==='donut') return <div className="os-chart os-chart-donut" role="img" aria-label={answer.chartDescription}><ResponsiveContainer width="58%" height="100%" initialDimension={{width:360,height:220}}><PieChart><Tooltip formatter={(_,__,item)=>[item.payload.displayValue,answer.metricLabel]}/><Pie data={answer.data} dataKey="value" nameKey="label" innerRadius={48} outerRadius={82} paddingAngle={2}>{answer.data.map((entry,index)=><Cell key={entry.label} fill={chartColors[index%chartColors.length]}/>)}</Pie></PieChart></ResponsiveContainer><div className="os-chart-key">{answer.data.map((entry,index)=><div key={entry.label}><i style={{background:chartColors[index%chartColors.length]}}/><span>{entry.label}</span><strong>{entry.displayValue}</strong></div>)}</div></div>;
  if(answer.chart==='line') return <div className="os-chart" role="img" aria-label={answer.chartDescription}><ResponsiveContainer width="100%" height="100%" initialDimension={{width:680,height:220}}><LineChart data={answer.data} margin={{top:18,right:20,bottom:4,left:-8}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5ec"/><XAxis dataKey="shortLabel" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false}/><Tooltip contentStyle={{borderRadius:10,border:'1px solid #e7e5ec'}} formatter={(_,__,item)=>[item.payload.displayValue,answer.metricLabel]}/><Legend/><Line type="monotone" dataKey="value" name={answer.metricLabel} stroke="#6d3df5" strokeWidth={3} dot={{r:4,fill:'#fff',strokeWidth:3}} activeDot={{r:6}}/></LineChart></ResponsiveContainer></div>;
  const isFunnel=answer.chart==='funnel';
  return <div className="os-chart" role="img" aria-label={answer.chartDescription}><ResponsiveContainer width="100%" height="100%" initialDimension={{width:680,height:220}}><BarChart data={answer.data} layout={isFunnel?'vertical':'horizontal'} margin={isFunnel?{top:8,right:44,bottom:0,left:16}:{top:18,right:4,bottom:4,left:-12}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5ec"/>{isFunnel?<><XAxis type="number" hide/><YAxis dataKey="label" type="category" axisLine={false} tickLine={false} width={80}/></>:<><XAxis dataKey="shortLabel" axisLine={false} tickLine={false} interval={0}/><YAxis axisLine={false} tickLine={false}/></>}<Tooltip contentStyle={{borderRadius:10,border:'1px solid #e7e5ec'}} formatter={(_,__,item)=>[item.payload.displayValue,answer.metricLabel]}/><Bar dataKey="value" radius={isFunnel?[0,6,6,0]:[6,6,2,2]}>{answer.data.map((entry,index)=><Cell key={entry.label} fill={chartColors[index%chartColors.length]}/>)}<LabelList dataKey="displayValue" position={isFunnel?'right':'top'} fill="#36333d" fontSize={10} fontWeight={600}/></Bar></BarChart></ResponsiveContainer></div>;
}

function headline(answer:RecruitmentAnswer){const leader=answer.data[0];return{label:answer.metricLabel,value:leader?.displayValue??'—',delta:leader?.label??'No result'};}

export default function HomePage(){
  const [agentId,setAgentId]=useState<AgentId>('recruitment');
  const [financeSurface,setFinanceSurface]=useState<FinanceSurface>('chat');
  const [selected,setSelected]=useState<Record<AgentId,string>>({recruitment:questions[2].prompt,financial:financialQuestions[0].prompt});
  const [draft,setDraft]=useState('');
  const [showLineage,setShowLineage]=useState(false);
  const [questionsOpen,setQuestionsOpen]=useState(false);
  const agent=agents[agentId];
  const selectedQuestion=selected[agentId];
  const result=useMemo(()=>runOrchestrator(agentId,selectedQuestion),[agentId,selectedQuestion]);
  const {answer,narrative,trace}=result;
  const metric=headline(answer);
  const AgentIcon=agent.icon;
  const honestyLabel=agentId==='financial'?financeHonestyBanner(answer):`Governed semantic layer · ${agent.metrics}`;
  const computedExplainer=answerExplainer(answer);
  const switchAgent=(next:AgentId)=>{setAgentId(next);setShowLineage(false);setDraft('');setFinanceSurface('chat');};
  const chooseQuestion=(prompt:string)=>{setSelected((current)=>({...current,[agentId]:prompt}));setShowLineage(false);setQuestionsOpen(false);setFinanceSurface('chat');};

  useEffect(()=>{
    const context=document.modelContext;if(!context?.registerTool)return;const lifecycle=new AbortController();
    void Promise.resolve(context.registerTool({name:'show_ospectra_insight',title:'Show OSpectra insight',description:'Switch to an approved OSpectra analyst and display one governed insight.',inputSchema:{type:'object',properties:{agent:{type:'string',enum:['recruitment','financial']},questionId:{type:'string'}},required:['agent','questionId'],additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(input:unknown){if(typeof input!=='object'||!input)throw new Error('Invalid input.');const value=input as{agent?:string;questionId?:string};if(value.agent==='recruitment'){const q=questions.find((item)=>item.id===value.questionId);if(!q)throw new Error('Unsupported recruitment question.');setAgentId('recruitment');setSelected((current)=>({...current,recruitment:q.prompt}));}else if(value.agent==='financial'){const q=financialQuestions.find((item)=>item.id===value.questionId);if(!q)throw new Error('Unsupported financial question.');setAgentId('financial');setSelected((current)=>({...current,financial:q.prompt}));}else throw new Error('Unsupported agent.');return{agent:value.agent,questionId:value.questionId,status:'displayed'};}},{signal:lifecycle.signal})).catch(()=>undefined);
    return()=>lifecycle.abort();
  },[]);

  function ask(event:FormEvent){event.preventDefault();if(!draft.trim())return;setSelected((current)=>({...current,[agentId]:draft.trim()}));setDraft('');setShowLineage(false);setFinanceSurface('chat');}
  const showReports=agentId==='financial'&&financeSurface==='reports';
  const showScorecard=agentId==='financial'&&financeSurface==='scorecard';
  const chatActive=agentId!=='financial'||financeSurface==='chat';
  const financeHeader=showReports?'OSpectra / Reports':showScorecard?'OSpectra / Scorecard':`OSpectra / Ask ${agent.name}`;
  const sourceChipLabel=answerSourceChipLabel(agentId,answer);
  const qualityIndicatorLabel=answerQualityIndicatorLabel(answer,trace);
  const openScorecardQuestion=(prompt:string)=>{setAgentId('financial');setSelected((current)=>({...current,financial:prompt}));setShowLineage(false);setFinanceSurface('chat');};
  const openScorecardReports=()=>{setAgentId('financial');setFinanceSurface('reports');};

  return <div className="os-shell">
    <aside className="os-sidebar"><div className="os-brand"><span>O</span><div><strong>OSpectra</strong><small>Data Analyst Platform</small></div></div><div className="os-agent-switch"><span>ACTIVE AGENT</span><DropdownMenu><DropdownMenuTrigger><AgentIcon size={16}/><strong>{agent.name}</strong><ChevronDown size={14}/></DropdownMenuTrigger><DropdownMenuContent align="start" className="os-agent-menu"><DropdownMenuGroup><DropdownMenuLabel>Choose analyst</DropdownMenuLabel><DropdownMenuSeparator/>{Object.values(agents).map((item)=>{const Icon=item.icon;return <DropdownMenuItem key={item.id} onClick={()=>switchAgent(item.id)}><Icon size={16}/><span>{item.name}</span>{item.id===agentId&&<Check size={14}/>}</DropdownMenuItem>})}</DropdownMenuGroup></DropdownMenuContent></DropdownMenu></div><nav>
      <button type="button" className="os-nav"><Home size={17}/><span>Home</span></button>
      <button type="button" className={`os-nav ${chatActive?'active':''}`} onClick={()=>setFinanceSurface('chat')}><MessageSquare size={17}/><span>Ask {agent.domain} Analyst</span></button>
      {agentId==='financial'&&<button type="button" className={`os-nav ${showReports?'active':''}`} onClick={()=>setFinanceSurface('reports')}><FileText size={17}/><span>Reports</span></button>}
      {agentId==='financial'&&<button type="button" className={`os-nav ${showScorecard?'active':''}`} onClick={()=>setFinanceSurface('scorecard')}><ClipboardList size={17}/><span>Scorecard</span></button>}
      <button type="button" className="os-nav"><Grid2X2 size={17}/><span>Dashboards</span></button>
      <button type="button" className="os-nav"><Bookmark size={17}/><span>Saved Analyses</span></button>
      <button type="button" className="os-nav"><Database size={17}/><span>Data Sources</span></button>
      <button type="button" className="os-nav"><ClipboardCheck size={17}/><span>Reviews</span></button>
      <button type="button" className="os-nav"><Bell size={17}/><span>Notifications</span></button>
      <button type="button" className="os-nav"><Settings size={17}/><span>Settings</span></button>
      <Link href="/ontology-demo" className="os-nav"><Network size={17}/><span>Ontology Research</span></Link>
      <Link href="/scenario-demo" className="os-nav"><CalendarClock size={17}/><span>Scenario Research</span></Link>
    </nav><div className="os-sidebar-foot"><span>Governed & read-only</span><small>{agent.name} v1.1</small></div></aside>
    <div className="os-stage"><header className="os-header"><div className="os-header-title"><div><strong>{agent.name} Agent</strong><span>{agent.domain}</span></div><small>{financeHeader}</small></div><div className="os-header-actions"><button aria-label="Notifications"><Bell size={17}/></button><button aria-label="Help"><HelpCircle size={17}/></button><i/><div className="os-user"><div><strong>OSpectra</strong><span>Manager Access</span></div><b>OS</b></div><div className="os-role"><small>Current workspace</small><button>{agent.domain}<ChevronDown size={14}/></button></div></div></header>
      <main className="os-main">{showReports?<div className="os-conversation"><FinancialReportsView/></div>:showScorecard?<div className="os-conversation"><Sep24ScorecardView onAskQuestion={openScorecardQuestion} onOpenReports={openScorecardReports}/></div>:<div className="os-conversation"><div className="os-scope"><span>{agent.domain}</span><span>{agentId==='financial'?'24-month Scope A':'Six-month view'}</span><span>Synthetic POC data</span></div><button className="os-import"><Snowflake size={13}/> {honestyLabel}</button><div className="os-coverage">{agent.coverage.map((item)=><span key={item}>{item}</span>)}</div>
        <div className="os-thread"><div className="os-user-bubble">{selectedQuestion}</div><div className="os-agent-row"><div className="os-agent-avatar">{agent.short}</div><section className="os-answer-card"><div className="os-answer-kicker"><Sparkles size={13}/><span>Orchestrated analysis</span><b>Traceable</b></div>{!answer.supported&&answer.nearestConcept?<p className="os-answer-nearest">I don&apos;t have an answer for your question yet. The closest defined concept is <strong>{answer.nearestConcept}</strong>.</p>:null}<h2>{answer.title}</h2><p className="os-answer-text">{answer.summary}</p><p className="os-answer-meta">Sources: {answer.sources.join(', ')||'none'} · {agentId==='financial'?financeHonestyBanner(answer):'Synthetic data'} · Quality checks {answer.supported?'passed':'blocked'}</p>{(sourceChipLabel||qualityIndicatorLabel||answer.supported)?<div className="os-answer-chrome">{sourceChipLabel?<span className="os-source-chip">{sourceChipLabel}</span>:null}{qualityIndicatorLabel?<span className="os-quality-indicator">{qualityIndicatorLabel}</span>:null}{answer.supported?<AnswerFeedbackControls key={`${agentId}:${answer.questionId}:${selectedQuestion}`} aria-label={`Feedback for ${answer.questionId}`}/>:null}</div>:null}{answer.supported&&<><div className="os-metric-strip"><div><span>{metric.label}</span><strong>{metric.value}</strong></div><p className="good"><i/>{metric.delta}</p></div><ResultChart answer={answer}/>{computedExplainer?<ExplainerCard explainer={computedExplainer}/>:null}<div className="os-narrative"><div><small>WHAT HAPPENED</small><p>{narrative.whatHappened}</p></div><div><small>WHY IT MATTERS</small><p>{narrative.businessImpact}</p></div><div><small>RECOMMENDED NEXT STEP</small><p>{narrative.nextStep}</p></div></div><div className="os-insight"><CircleHelp size={14}/><span><strong>Analyst interpretation:</strong> {narrative.whyItMatters}</span></div></>}<div className="os-orchestration"><div className="os-orchestration-head"><div><GitBranch size={14}/><strong>Process orchestration</strong></div><span>Deterministic modular workflow</span></div><div className="os-process-flow">{trace.map((step,index)=><div className={step.status} key={step.id}><span>{step.status==='complete'?<CheckCircle2 size={13}/>:<ShieldCheck size={13}/>}</span><strong>{step.label}</strong><small>{step.detail}</small>{index<trace.length-1&&<i/>}</div>)}</div></div><div className="os-actions"><button>Save Analysis</button><button><Snowflake size={12}/> Freeze Analysis</button><button>Export<ChevronDown size={12}/></button><button>Add to Dashboard</button><button onClick={()=>setShowLineage(!showLineage)}>View Analysis Details</button></div>{showLineage&&<div className="os-lineage"><div><span>Source</span><code>{semanticHonestyLabel(agentId,answer)}</code></div><div><span>Metric</span><code>{answer.metricIds.join(', ')||'No approved metric'}</code></div><div><span>Definition</span><code>{answer.definition||'Not available'}</code></div><div><span>Query plan</span><code>{answer.queryPlan}</code></div><div><span>Execution</span><code>Router → semantic validator → metric executor → quality guard → narrative composer</code></div><div><span>Policy</span><code>{answer.supported?'PASS — approved fields and joins only':'BLOCKED — outside governed scope'}</code></div></div>}</section></div></div>
        <div className="os-composer-wrap"><Dialog open={questionsOpen} onOpenChange={setQuestionsOpen}><DialogTrigger className="os-question-trigger"><ListFilter size={15}/><span><small>{agent.domain} sample questions</small><strong>{selectedQuestion}</strong></span><b>{agent.questions.length}</b><ChevronDown size={15}/></DialogTrigger><DialogContent className="os-question-dialog"><DialogHeader><DialogTitle>{agent.name} questions</DialogTitle><DialogDescription>{agentId==='financial'?'Select a sample question. Template answers stay Static template — not computed, not governed; compute answers are Synthetic dataset — computed, not governed.':`Select an approved question from the ${agent.domain.toLowerCase()} semantic layer.`}</DialogDescription></DialogHeader><div className="os-question-grid">{agent.questions.map((q,index)=><button key={q.id} className={q.prompt===selectedQuestion?'selected':''} onClick={()=>chooseQuestion(q.prompt)}><span>{String(index+1).padStart(2,'0')}</span><strong>{q.prompt}</strong></button>)}</div></DialogContent></Dialog><form className="os-composer" onSubmit={ask}><Input value={draft} onChange={(event)=>setDraft(event.target.value)} placeholder={agentId==='financial'?`Ask a ${agent.domain.toLowerCase()} question…`:`Ask a governed ${agent.domain.toLowerCase()} question…`} aria-label={`Ask a ${agent.domain.toLowerCase()} question`}/><Button type="submit" aria-label="Submit question"><Send size={16}/></Button></form><p className="os-approved">Approved sources: {agent.sources}. Read-only; all displayed records are synthetic.</p></div>
      </div>}</main></div>
  </div>;
}
