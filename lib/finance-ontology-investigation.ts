/**
 * Financial Ontology Investigation Engine v0.2 (research-only).
 * Builds deterministic investigation plans. Does not calculate metrics,
 * attach instance evidence, or authorize causal conclusions.
 */
import { financeOntology, type OntologyEdge } from './finance-ontology';

export type EvidenceState = 'AVAILABLE' | 'MISSING_EVIDENCE' | 'UNSUPPORTED' | 'INVESTIGATE';
export type ConclusionState = 'INSUFFICIENT_EVIDENCE' | 'BOUNDED_FINDING';
export type MeasurementAvailability = 'AVAILABLE' | 'UNSUPPORTED';
export type ActualEvidenceAvailability = 'NOT_ATTACHED' | 'ATTACHED';

export type OntologyRelationshipRef = {
  from: string;
  relationship: string;
  to: string;
};

export type MetricEvidence = {
  metricId: string;
  /** A governed measurement exists for this ID. Not proof of change or cause. */
  measurementAvailability: MeasurementAvailability;
  /** Instance-level evidence for this research engine. Always NOT_ATTACHED in v0.2. */
  actualEvidenceAvailability: ActualEvidenceAvailability;
};

export type InvestigationStep = {
  step: number;
  title: string;
  conceptIds: readonly string[];
  metricIds: readonly string[];
  metrics: readonly MetricEvidence[];
  suggestedVisual: string;
  /** Ontology relevance for this step — not a conclusion. */
  investigationStatus: 'INVESTIGATE';
  relationshipRefs: readonly OntologyRelationshipRef[];
  /** Step-level actual evidence. Always MISSING_EVIDENCE in v0.2. */
  actualEvidenceState: 'MISSING_EVIDENCE';
};

export type InvestigationPlan = {
  researchQuestionId: string;
  question: string;
  observedConcept: string;
  steps: readonly InvestigationStep[];
  conclusionState: ConclusionState;
  conclusionMessage: string;
  allowsCausalConclusion: false;
};

/** Research-only concept → existing metric IDs. Empty means no governed measurement for that concept in this analysis. */
export const conceptMetricMap: Readonly<Record<string, readonly string[]>> = {
  CashCollections: ['cash_collections', 'collection_gap'],
  Payment: ['days_to_payment'],
  Claim: ['open_ar', 'ar_age'],
  Denial: ['denial_rate', 'denied_claim_value'],
  Authorization: ['authorization_exposure'],
  Branch: [],
};

export const knownGovernedMetricIds = [
  'earned_revenue',
  'cash_collections',
  'collection_gap',
  'available_cash',
  'cash_forecast',
  'days_to_payment',
  'financial_exposure',
  'denied_claim_value',
  'denial_rate',
  'open_ar',
  'ar_age',
  'authorization_exposure',
  'unused_authorized_hours',
  'unbilled_visit_value',
  'budget_variance',
  'gross_margin',
  'payroll_cost',
  'overtime_rate',
  'manual_workflow_cost',
] as const;

type ResearchCaseDefinition = {
  id: string;
  question: string;
  observedConcept: string;
  steps: readonly {
    title: string;
    conceptIds: readonly string[];
    metricIds: readonly string[];
    suggestedVisual: string;
    relationshipRefs: readonly OntologyRelationshipRef[];
  }[];
};

const cashCollectionsDeclineCase: ResearchCaseDefinition = {
  id: 'cash-collections-decline',
  question: 'Why did cash collections fall?',
  observedConcept: 'CashCollections',
  steps: [
    {
      title: 'Verify collections trend',
      conceptIds: ['CashCollections'],
      metricIds: ['cash_collections', 'collection_gap'],
      suggestedVisual: 'Line chart',
      relationshipRefs: [{ from: 'Payment', relationship: 'contributes_to', to: 'CashCollections' }],
    },
    {
      title: 'Investigate payment / AR timing',
      conceptIds: ['Payment', 'Claim'],
      metricIds: ['days_to_payment', 'open_ar', 'ar_age'],
      suggestedVisual: 'AR aging view or table',
      relationshipRefs: [
        { from: 'Claim', relationship: 'may_result_in', to: 'Payment' },
        { from: 'Payment', relationship: 'contributes_to', to: 'CashCollections' },
      ],
    },
    {
      title: 'Investigate claim / denial exceptions',
      conceptIds: ['Claim', 'Denial'],
      metricIds: ['denial_rate', 'denied_claim_value'],
      suggestedVisual: 'Ranked bar or exception table',
      relationshipRefs: [
        { from: 'Claim', relationship: 'may_have', to: 'Denial' },
        { from: 'Claim', relationship: 'may_result_in', to: 'Payment' },
      ],
    },
    {
      title: 'Investigate authorization exposure',
      conceptIds: ['Authorization'],
      metricIds: ['authorization_exposure'],
      suggestedVisual: 'Prioritized exception table',
      relationshipRefs: [{ from: 'Visit', relationship: 'covered_by', to: 'Authorization' }],
    },
  ],
};

const researchCases: Readonly<Record<string, ResearchCaseDefinition>> = {
  [cashCollectionsDeclineCase.id]: cashCollectionsDeclineCase,
};

export function relationshipExists(ref: OntologyRelationshipRef, edges: readonly OntologyEdge[] = financeOntology): boolean {
  return edges.some(
    (edge) => edge.from === ref.from && edge.relationship === ref.relationship && edge.to === ref.to,
  );
}

export function assertRelationshipRefsExist(refs: readonly OntologyRelationshipRef[]): void {
  for (const ref of refs) {
    if (!relationshipExists(ref)) {
      throw new Error(
        `Investigation plan references nonexistent ontology relationship: ${ref.from} → ${ref.relationship} → ${ref.to}`,
      );
    }
  }
}

function metricEvidence(metricId: string): MetricEvidence {
  const known = (knownGovernedMetricIds as readonly string[]).includes(metricId);
  return {
    metricId,
    measurementAvailability: known ? 'AVAILABLE' : 'UNSUPPORTED',
    actualEvidenceAvailability: 'NOT_ATTACHED',
  };
}

function buildStep(
  index: number,
  definition: ResearchCaseDefinition['steps'][number],
): InvestigationStep {
  assertRelationshipRefsExist(definition.relationshipRefs);
  return {
    step: index + 1,
    title: definition.title,
    conceptIds: definition.conceptIds,
    metricIds: definition.metricIds,
    metrics: definition.metricIds.map(metricEvidence),
    suggestedVisual: definition.suggestedVisual,
    investigationStatus: 'INVESTIGATE',
    relationshipRefs: definition.relationshipRefs,
    actualEvidenceState: 'MISSING_EVIDENCE',
  };
}

export function buildInvestigationPlan(researchQuestionId: string): InvestigationPlan {
  const researchCase = researchCases[researchQuestionId];
  if (!researchCase) {
    throw new Error(`Unsupported research investigation case: ${researchQuestionId}`);
  }

  const steps = researchCase.steps.map((step, index) => buildStep(index, step));

  return {
    researchQuestionId: researchCase.id,
    question: researchCase.question,
    observedConcept: researchCase.observedConcept,
    steps,
    conclusionState: 'INSUFFICIENT_EVIDENCE',
    conclusionMessage:
      'Relevant governed measurements are available, but no instance-level evidence is attached to this research investigation. Insufficient evidence to assign a cause.',
    allowsCausalConclusion: false,
  };
}

export type ConceptInvestigationDetails = {
  conceptId: string;
  displayName: string;
  relevanceReason: string;
  relationships: readonly OntologyRelationshipRef[];
  metricIds: readonly string[];
  measurementAvailability: MeasurementAvailability;
  actualEvidenceAvailability: ActualEvidenceAvailability;
  canInvestigate: string;
  cannotConclude: string;
};

const conceptDisplayNames: Record<string, string> = {
  CashCollections: 'Cash Collections',
  Payment: 'Payment',
  Claim: 'Claim',
  Denial: 'Denial',
  Authorization: 'Authorization',
  Visit: 'Visit',
  Service: 'Service',
  Payer: 'Payer',
  Branch: 'Branch',
  Client: 'Client',
};

const relevanceCopy: Record<string, string> = {
  CashCollections: 'Observed outcome for this research question.',
  Payment: 'Payments contribute to cash collections.',
  Claim: 'Claims may result in payments and may have denials.',
  Denial: 'Claims may have denials.',
  Authorization: 'Visits are covered by authorizations that can create exposure.',
  Visit: 'Visits generate claims and are covered by authorizations.',
  Service: 'Services are delivered as visits.',
  Payer: 'Claims are submitted to payers.',
  Branch: 'Claims may be associated with a branch, but no collections-by-branch metric is governed.',
};

export function getConceptInvestigationDetails(
  conceptId: string,
  plan: InvestigationPlan = buildInvestigationPlan('cash-collections-decline'),
): ConceptInvestigationDetails {
  const relationships = financeOntology
    .filter((edge) => edge.from === conceptId || edge.to === conceptId)
    .map((edge) => ({ from: edge.from, relationship: edge.relationship, to: edge.to }));

  const mapped = conceptMetricMap[conceptId] ?? [];
  const usedInPlan = plan.steps.flatMap((step) => (step.conceptIds.includes(conceptId) ? step.metricIds : []));
  const metricIds = [...new Set([...mapped, ...usedInPlan])];
  const measurementAvailability: MeasurementAvailability =
    metricIds.length > 0 && metricIds.every((id) => (knownGovernedMetricIds as readonly string[]).includes(id))
      ? 'AVAILABLE'
      : 'UNSUPPORTED';

  return {
    conceptId,
    displayName: conceptDisplayNames[conceptId] ?? conceptId,
    relevanceReason: relevanceCopy[conceptId] ?? 'Related concept in the financial ontology.',
    relationships,
    metricIds,
    measurementAvailability,
    actualEvidenceAvailability: 'NOT_ATTACHED',
    canInvestigate:
      metricIds.length > 0
        ? `Whether governed metrics (${metricIds.join(', ')}) changed during the relevant period.`
        : 'Ontology context only; no governed collections measurement is mapped for this concept.',
    cannotConclude: `That ${conceptDisplayNames[conceptId] ?? conceptId} caused lower cash collections without supporting instance-level evidence.`,
  };
}

export const clickableOntologyConcepts = [
  'CashCollections',
  'Payment',
  'Claim',
  'Payer',
  'Denial',
  'Visit',
  'Authorization',
  'Service',
] as const;
