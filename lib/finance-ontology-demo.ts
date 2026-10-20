/**
 * Presentation metadata for the Financial Ontology research demo.
 * Does not calculate metrics and does not change financeOntology edges.
 */

export const ontologyResearchQuestion = 'Why did cash collections fall?';

export type MetricGroup = {
  title: string;
  metricIds: readonly string[];
};

export const ontologyMetricGroups: readonly MetricGroup[] = [
  { title: 'Cash Collections', metricIds: ['cash_collections', 'collection_gap'] },
  { title: 'Payment / AR', metricIds: ['days_to_payment', 'open_ar', 'ar_age'] },
  { title: 'Claims / Denials', metricIds: ['denial_rate', 'denied_claim_value'] },
  { title: 'Authorization', metricIds: ['authorization_exposure'] },
];

export type InvestigationPlanStep = {
  step: number;
  title: string;
  metrics: string;
  suggestedVisual: string;
  storyVisual: string;
};

export const ontologyInvestigationPlan: readonly InvestigationPlanStep[] = [
  {
    step: 1,
    title: 'Collections trend',
    metrics: 'cash_collections / collection_gap',
    suggestedVisual: 'line chart',
    storyVisual: 'Line chart',
  },
  {
    step: 2,
    title: 'Payment / AR timing',
    metrics: 'days_to_payment, open_ar, ar_age',
    suggestedVisual: 'aging buckets or table',
    storyVisual: 'Aging view or table',
  },
  {
    step: 3,
    title: 'Denial investigation',
    metrics: 'denial_rate, denied_claim_value',
    suggestedVisual: 'ranked bar or exception table',
    storyVisual: 'Ranked bar / exception table',
  },
  {
    step: 4,
    title: 'Authorization exceptions',
    metrics: 'authorization_exposure',
    suggestedVisual: 'prioritized exception table',
    storyVisual: 'Prioritized table',
  },
];

/** Ontology edges that support this investigation, shown as labels only. */
export const ontologySupportedEdges = [
  { from: 'Payment', relationship: 'contributes_to', to: 'CashCollections' },
  { from: 'Claim', relationship: 'may_result_in', to: 'Payment' },
  { from: 'Claim', relationship: 'submitted_to', to: 'Payer' },
  { from: 'Claim', relationship: 'may_have', to: 'Denial' },
  { from: 'Visit', relationship: 'covered_by', to: 'Authorization' },
  { from: 'Visit', relationship: 'generates', to: 'Claim' },
  { from: 'Service', relationship: 'delivered_as', to: 'Visit' },
] as const;
