/**
 * Governed Financial routing. There is no Financial semantic catalog.
 * Metric IDs are the ones already returned by the static templates.
 * `exact` compares the whole normalized question. `includes` requires every term.
 * Lower precedence is tried first. Exact rules use 0 and run before includes rules.
 */
export type FinancialQuestionId =
  | 'collections-gap'
  | 'insurance-bridge'
  | 'cash-forecast'
  | 'denial-scenario'
  | 'auth-scenario'
  | 'payer-delays'
  | 'reimbursement'
  | 'denied-exposure'
  | 'claim-status'
  | 'recovery'
  | 'ar-risk'
  | 'ar-lineage'
  | 'unauthorized-care'
  | 'unused-auth'
  | 'expiring-auth'
  | 'unbilled-visits'
  | 'evv-delays'
  | 'budget'
  | 'division-risk'
  | 'margin'
  | 'cash-coverage'
  | 'cash-by-branch'
  | 'workflow-cost'
  | 'rcm-bottleneck'
  | 'combined-exposure';

export type FinancialTemplateKey =
  | 'collections'
  | 'forecast'
  | 'payer'
  | 'claims'
  | 'ar'
  | 'authorization'
  | 'visits'
  | 'budget'
  | 'margin'
  | 'cash'
  | 'workflow'
  | 'exposure';

export type FinancialTerminology = {
  allOf: readonly string[];
  match: 'exact' | 'includes';
  precedence: number;
};

export type FinancialIntentEntry = {
  id: FinancialQuestionId;
  intent: string;
  metricIds: readonly string[];
  templateKey: FinancialTemplateKey;
  acceptedTerminology: readonly FinancialTerminology[];
};

const exact = (term: string): FinancialTerminology => ({ allOf: [term], match: 'exact', precedence: 0 });
const includes = (precedence: number, ...allOf: string[]): FinancialTerminology => ({ allOf, match: 'includes', precedence });

const collectionsMetrics = ['earned_revenue', 'cash_collections', 'collection_gap'] as const;
const forecastMetrics = ['available_cash', 'cash_forecast'] as const;
const payerMetrics = ['days_to_payment'] as const;
const claimsMetrics = ['denied_claim_value', 'denial_rate'] as const;
const arMetrics = ['open_ar', 'ar_age'] as const;
const authorizationMetrics = ['authorization_exposure', 'unused_authorized_hours'] as const;
const visitsMetrics = ['unbilled_visit_value'] as const;
const budgetMetrics = ['budget_variance'] as const;
const marginMetrics = ['gross_margin', 'payroll_cost', 'overtime_rate'] as const;
const cashMetrics = ['available_cash'] as const;
const workflowMetrics = ['manual_workflow_cost'] as const;
const exposureMetrics = ['financial_exposure'] as const;

export const financialIntentRegistry: readonly FinancialIntentEntry[] = [
  {
    id: 'collections-gap',
    intent: 'variance_analysis',
    metricIds: collectionsMetrics,
    templateKey: 'collections',
    acceptedTerminology: [
      exact('collections-gap'),
      exact('why is cash collection lagging behind earned revenue this month?'),
    ],
  },
  {
    id: 'insurance-bridge',
    intent: 'variance_analysis',
    metricIds: collectionsMetrics,
    templateKey: 'collections',
    acceptedTerminology: [
      exact('insurance-bridge'),
      exact('why did insurance collections decrease despite billable hours remaining flat?'),
    ],
  },
  {
    id: 'cash-forecast',
    intent: 'forecast',
    metricIds: forecastMetrics,
    templateKey: 'forecast',
    acceptedTerminology: [
      exact('cash-forecast'),
      exact('what is the projected cash position over the next 30–60 days based on outstanding claims?'),
      includes(4, 'cash position', 'will'),
      includes(4, 'cash position', 'look'),
      includes(4, 'projected', 'cash'),
      includes(4, 'reimbursement', 'later'),
    ],
  },
  {
    id: 'denial-scenario',
    intent: 'forecast',
    metricIds: forecastMetrics,
    templateKey: 'forecast',
    acceptedTerminology: [
      exact('denial-scenario'),
      exact('what happens to the 60-day cash forecast if the denial rate decreases from 8% to 4%?'),
      includes(2, 'what if', 'denial', 'forecast'),
    ],
  },
  {
    id: 'auth-scenario',
    intent: 'forecast',
    metricIds: forecastMetrics,
    templateKey: 'forecast',
    acceptedTerminology: [
      exact('auth-scenario'),
      exact('how would a 10% improvement in authorization utilization affect revenue and collections?'),
      includes(3, 'what if', 'authorization', 'utilization'),
    ],
  },
  {
    id: 'payer-delays',
    intent: 'payer_analysis',
    metricIds: payerMetrics,
    templateKey: 'payer',
    acceptedTerminology: [
      exact('payer-delays'),
      exact('which payers have the longest payment delays between claim submission and cash receipt?'),
      includes(5, 'payer', 'longest'),
      includes(5, 'payer', 'delay'),
    ],
  },
  {
    id: 'reimbursement',
    intent: 'payer_analysis',
    metricIds: payerMetrics,
    templateKey: 'payer',
    acceptedTerminology: [
      exact('reimbursement'),
      exact('what is the variance between expected reimbursement rates and actual payer payments?'),
    ],
  },
  {
    id: 'denied-exposure',
    intent: 'root_cause_analysis',
    metricIds: claimsMetrics,
    templateKey: 'claims',
    acceptedTerminology: [
      exact('denied-exposure'),
      exact('how much revenue is currently trapped in denied claims, and what are the primary denial drivers?'),
    ],
  },
  {
    id: 'claim-status',
    intent: 'root_cause_analysis',
    metricIds: claimsMetrics,
    templateKey: 'claims',
    acceptedTerminology: [
      exact('claim-status'),
      exact('what is the financial exposure from rejected claims compared with denied claims?'),
    ],
  },
  {
    id: 'recovery',
    intent: 'root_cause_analysis',
    metricIds: claimsMetrics,
    templateKey: 'claims',
    acceptedTerminology: [
      exact('recovery'),
      exact('how much revenue was recovered or protected following intervention on denied claims?'),
    ],
  },
  {
    id: 'ar-risk',
    intent: 'aging_analysis',
    metricIds: arMetrics,
    templateKey: 'ar',
    acceptedTerminology: [
      exact('ar-risk'),
      exact('which ar aging buckets present the highest collection risk?'),
      includes(6, 'receivables', 'old'),
      includes(6, 'receivables', 'tied'),
    ],
  },
  {
    id: 'ar-lineage',
    intent: 'aging_analysis',
    metricIds: arMetrics,
    templateKey: 'ar',
    acceptedTerminology: [
      exact('ar-lineage'),
      exact('what operational care records explain an outstanding ar balance?'),
    ],
  },
  {
    id: 'unauthorized-care',
    intent: 'exposure_analysis',
    metricIds: authorizationMetrics,
    templateKey: 'authorization',
    acceptedTerminology: [
      exact('unauthorized-care'),
      exact('how much revenue is potentially unbillable due to care provided outside valid authorization periods?'),
    ],
  },
  {
    id: 'unused-auth',
    intent: 'exposure_analysis',
    metricIds: authorizationMetrics,
    templateKey: 'authorization',
    acceptedTerminology: [
      exact('unused-auth'),
      exact('what is the dollar exposure from unused authorization hours across active client care plans?'),
    ],
  },
  {
    id: 'expiring-auth',
    intent: 'exposure_analysis',
    metricIds: authorizationMetrics,
    templateKey: 'authorization',
    acceptedTerminology: [
      exact('expiring-auth'),
      exact('which client accounts have authorizations expiring within the next 14 days?'),
    ],
  },
  {
    id: 'unbilled-visits',
    intent: 'root_cause_analysis',
    metricIds: visitsMetrics,
    templateKey: 'visits',
    acceptedTerminology: [
      exact('unbilled-visits'),
      exact('what is the total dollar value of unbilled visits associated with documentation or evv exceptions?'),
      includes(7, 'not billed', 'delivered'),
      includes(7, 'unbilled', 'visit'),
    ],
  },
  {
    id: 'evv-delays',
    intent: 'root_cause_analysis',
    metricIds: visitsMetrics,
    templateKey: 'visits',
    acceptedTerminology: [
      exact('evv-delays'),
      exact('how do missing visit records or evv discrepancies relate to billing delays?'),
    ],
  },
  {
    id: 'budget',
    intent: 'variance_analysis',
    metricIds: budgetMetrics,
    templateKey: 'budget',
    acceptedTerminology: [
      exact('budget'),
      exact('how is spending tracking against departmental operating budget?'),
      includes(8, 'versus', 'budget'),
      includes(8, 'against', 'budget'),
    ],
  },
  {
    id: 'division-risk',
    intent: 'variance_analysis',
    metricIds: budgetMetrics,
    templateKey: 'budget',
    acceptedTerminology: [
      exact('division-risk'),
      exact('which operational divisions have the largest budget variance alongside operational issues?'),
    ],
  },
  {
    id: 'margin',
    intent: 'margin_analysis',
    metricIds: marginMetrics,
    templateKey: 'margin',
    acceptedTerminology: [
      exact('margin'),
      exact('what is caregiver payroll cost relative to billed revenue, and how does overtime affect gross margin?'),
    ],
  },
  {
    id: 'cash-coverage',
    intent: 'cash_analysis',
    metricIds: cashMetrics,
    templateKey: 'cash',
    acceptedTerminology: [
      exact('cash-coverage'),
      exact('how does current bank cash compare with short-term payroll and vendor commitments?'),
    ],
  },
  {
    id: 'cash-by-branch',
    intent: 'cash_analysis',
    metricIds: cashMetrics,
    templateKey: 'cash',
    acceptedTerminology: [
      exact('cash-by-branch'),
      exact('what is the current cash position by branch?'),
      includes(1, 'cash', 'branch'),
    ],
  },
  {
    id: 'workflow-cost',
    intent: 'cost_analysis',
    metricIds: workflowMetrics,
    templateKey: 'workflow',
    acceptedTerminology: [
      exact('workflow-cost'),
      exact('what is the operational cost of manual billing and denial-management workflows?'),
      includes(9, 'manual', 'cost'),
    ],
  },
  {
    id: 'rcm-bottleneck',
    intent: 'cost_analysis',
    metricIds: workflowMetrics,
    templateKey: 'workflow',
    acceptedTerminology: [
      exact('rcm-bottleneck'),
      exact('where are manual intervention bottlenecks in the rcm cycle?'),
    ],
  },
  {
    id: 'combined-exposure',
    intent: 'exposure_analysis',
    metricIds: exposureMetrics,
    templateKey: 'exposure',
    acceptedTerminology: [
      exact('combined-exposure'),
      exact('what is the combined exposure from unbilled visits, denials, unused authorizations, and underpayments?'),
    ],
  },
];

const routingRules = financialIntentRegistry.flatMap((entry) =>
  entry.acceptedTerminology.map((rule) => ({ entry, ...rule })),
);

function matchesRule(normalized: string, rule: FinancialTerminology): boolean {
  if (rule.match === 'exact') return rule.allOf.length === 1 && normalized === rule.allOf[0];
  return rule.allOf.every((term) => normalized.includes(term));
}

export function matchFinancialIntent(question: string): FinancialIntentEntry | undefined {
  const normalized = question.toLowerCase();
  const exactMatch = routingRules.find((rule) => rule.match === 'exact' && matchesRule(normalized, rule));
  if (exactMatch) return exactMatch.entry;
  return [...routingRules]
    .filter((rule) => rule.match === 'includes')
    .sort((left, right) => left.precedence - right.precedence)
    .find((rule) => matchesRule(normalized, rule))?.entry;
}
