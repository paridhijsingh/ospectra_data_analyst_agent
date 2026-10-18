import { answerFinancialQuestion } from './financial-metrics';
import { answerQuestion, type RecruitmentAnswer } from './metric-engine';

export type AgentId='recruitment'|'financial';
export type ProcessStep={ id:string; label:string; detail:string; status:'complete'|'blocked' };
export type Narrative={ whatHappened:string; whyItMatters:string; businessImpact:string; nextStep:string };
export type OrchestratedResult={ answer:RecruitmentAnswer; narrative:Narrative; trace:ProcessStep[]; executionMode:'deterministic-poc' };

const impactByIntent:Record<string,string>={
  metric_breakdown:'This reveals where volume is concentrated so operating capacity can be aligned with demand.',
  time_trend:'A sustained pattern affects forecasting and is more actionable than a one-period fluctuation.',
  funnel_analysis:'Improving the weakest transition can lift downstream outcomes without increasing top-of-funnel volume.',
  rate_breakdown:'The rate highlights efficiency differences that raw volume alone can hide.',
  mix_analysis:'The mix shows concentration risk and whether the operating portfolio is balanced.',
  variance_analysis:'The variance separates expected performance from the operational gap requiring action.',
  forecast:'The forecast supports near-term planning while making timing uncertainty explicit.',
  payer_analysis:'Payer-specific delays concentrate working-capital risk and direct follow-up effort.',
  exposure_analysis:'Exposure quantifies value requiring validation; it is not automatically realized loss.',
  root_cause_analysis:'A concentrated cause profile allows the team to prioritize the few controls with the largest value.',
  aging_analysis:'Older balances have lower expected recovery and should receive risk-weighted attention.',
  cash_analysis:'Branch-level liquidity indicates where upcoming obligations may need active management.',
  margin_analysis:'Margin compression reduces operating flexibility even when revenue remains stable.',
  cost_analysis:'The cost baseline makes automation and process-redesign decisions measurable.',
  unsupported:'The semantic guardrail prevents an unverified calculation from being presented as fact.',
};

const nextByIntent:Record<string,string>={
  metric_breakdown:'Open the highest segment, compare it with plan, and review the underlying records.',
  time_trend:'Compare the trend with capacity, campaign, and seasonality changes before taking action.',
  funnel_analysis:'Inspect stage-level wait time and reason codes for the largest drop-off.',
  rate_breakdown:'Review the highest- and lowest-rate cohorts with minimum-volume thresholds.',
  mix_analysis:'Compare concentration with target mix and downstream outcome quality.',
  variance_analysis:'Assign each driver to an owner and validate the recoverable portion of the gap.',
  forecast:'Stress-test payer timing and payroll assumptions with a downside scenario.',
  payer_analysis:'Create a payer worklist ordered by dollars, age, and recoverability.',
  exposure_analysis:'Validate overlap, recovery probability, and accountable owner for each exposure class.',
  root_cause_analysis:'Start with the top two causes and measure prevented dollars after remediation.',
  aging_analysis:'Prioritize old balances with denial status, high value, and recent payer activity.',
  cash_analysis:'Compare low-coverage branches with the next two payroll and vendor cycles.',
  margin_analysis:'Separate overtime, utilization, rate, and service-mix effects in the next drill-down.',
  cost_analysis:'Model automation ROI using conservative time-saved and implementation-cost assumptions.',
  unsupported:'Choose an approved question or add a governed metric definition first.',
};

export function runOrchestrator(agentId:AgentId,question:string):OrchestratedResult {
  const answer=agentId==='recruitment'?answerQuestion(question):answerFinancialQuestion(question);
  const status=answer.supported?'complete':'blocked';
  const domain=agentId==='recruitment'?'Recruitment':'Finance';
  return {
    answer,
    narrative:{
      whatHappened:answer.summary,
      whyItMatters:answer.insight||'The question is outside the approved semantic scope.',
      businessImpact:impactByIntent[answer.intent]??'This result provides a governed signal for operational review.',
      nextStep:nextByIntent[answer.intent]??'Review the supporting records and validate the decision with the metric owner.',
    },
    trace:[
      {id:'router',label:'Intent router',detail:`Routed to the ${domain} analyst and classified ${answer.intent.replaceAll('_',' ')}.`,status:'complete'},
      {id:'semantic',label:'Semantic validator',detail:answer.supported?`Matched approved metric(s): ${answer.metricIds.join(', ')}.`:'No approved metric matched the request.',status},
      {id:'executor',label:'Metric executor',detail:answer.supported?`Executed a read-only plan across ${answer.sources.length} synthetic source domains.`:'Execution stopped by policy.',status},
      {id:'quality',label:'Quality guard',detail:answer.supported?'Passed freshness, field-policy, denominator, and traceability checks.':'No result was released.',status},
      {id:'narrative',label:'Narrative composer',detail:answer.supported?'Assembled the finding, driver, impact, and recommended next investigation.':'Returned a governed boundary message.',status},
    ],
    executionMode:'deterministic-poc',
  };
}
