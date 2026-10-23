/**
 * Presentation helpers for the Financial Ontology research demo.
 * Investigation steps and metric mappings are owned by finance-ontology-investigation.ts.
 */
import { financeOntology } from './finance-ontology';
import { buildInvestigationPlan, conceptMetricMap } from './finance-ontology-investigation';

export const ontologyResearchQuestion = 'Why did cash collections fall?';

export const ontologySupportedEdges = financeOntology
  .filter((edge) =>
    [
      'contributes_to',
      'may_result_in',
      'submitted_to',
      'may_have',
      'covered_by',
      'generates',
      'delivered_as',
    ].includes(edge.relationship),
  )
  .map((edge) => ({ from: edge.from, relationship: edge.relationship, to: edge.to }));

export function getCashCollectionsInvestigationPlan() {
  return buildInvestigationPlan('cash-collections-decline');
}

export function getConceptMetricGroups() {
  return [
    { title: 'Cash Collections', metricIds: conceptMetricMap.CashCollections },
    { title: 'Payment / AR', metricIds: [...conceptMetricMap.Payment, ...conceptMetricMap.Claim] },
    { title: 'Claims / Denials', metricIds: conceptMetricMap.Denial },
    { title: 'Authorization', metricIds: conceptMetricMap.Authorization },
  ] as const;
}
