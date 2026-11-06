import { describe, expect, it } from 'vitest';
import { financeOntology } from './finance-ontology';
import {
  assertRelationshipRefsExist,
  buildInvestigationPlan,
  conceptMetricMap,
  knownGovernedMetricIds,
  relationshipExists,
  type OntologyRelationshipRef,
} from './finance-ontology-investigation';

function isDirectedWalk(path: readonly OntologyRelationshipRef[]): boolean {
  for (let index = 0; index < path.length - 1; index += 1) {
    if (path[index].to !== path[index + 1].from) return false;
  }
  return true;
}

describe('buildInvestigationPlan cash-collections-decline', () => {
  const plan = buildInvestigationPlan('cash-collections-decline');

  it('returns four ordered steps', () => {
    expect(plan.steps).toHaveLength(4);
    expect(plan.steps.map((step) => step.step)).toEqual([1, 2, 3, 4]);
    expect(plan.steps.map((step) => step.title)).toEqual([
      'Verify collections trend',
      'Investigate payment / AR timing',
      'Investigate claim / denial exceptions',
      'Investigate authorization exposure',
    ]);
  });

  it('uses CashCollections as the observed concept', () => {
    expect(plan.observedConcept).toBe('CashCollections');
    expect(plan.question).toBe('Why did cash collections fall?');
  });

  it('references only existing approved metric IDs', () => {
    const metricIds = plan.steps.flatMap((step) => step.metricIds);
    for (const metricId of metricIds) {
      expect(knownGovernedMetricIds).toContain(metricId);
    }
  });

  it('preserves expected concept-to-metric mappings', () => {
    expect(conceptMetricMap.CashCollections).toEqual(['cash_collections', 'collection_gap']);
    expect(conceptMetricMap.Payment).toEqual(['days_to_payment']);
    expect(conceptMetricMap.Claim).toEqual(['open_ar', 'ar_age']);
    expect(conceptMetricMap.Denial).toEqual(['denial_rate', 'denied_claim_value']);
    expect(conceptMetricMap.Authorization).toEqual(['authorization_exposure']);
    expect(plan.steps[0].metricIds).toEqual(['cash_collections', 'collection_gap']);
    expect(plan.steps[1].metricIds).toEqual(['days_to_payment', 'open_ar', 'ar_age']);
    expect(plan.steps[2].metricIds).toEqual(['denial_rate', 'denied_claim_value']);
    expect(plan.steps[3].metricIds).toEqual(['authorization_exposure']);
  });

  it('only declares ontology relationships that exist in financeOntology', () => {
    for (const step of plan.steps) {
      for (const ref of step.relationshipRefs) {
        expect(relationshipExists(ref, financeOntology)).toBe(true);
      }
    }
  });

  it('returns INSUFFICIENT_EVIDENCE and never authorizes a causal conclusion', () => {
    expect(plan.conclusionState).toBe('INSUFFICIENT_EVIDENCE');
    expect(plan.allowsCausalConclusion).toBe(false);
    expect(plan.conclusionMessage).toMatch(/Insufficient evidence to assign a cause/i);
    for (const step of plan.steps) {
      expect(step.investigationStatus).toBe('INVESTIGATE');
    }
  });

  it('treats measurement availability as distinct from actual evidence', () => {
    for (const step of plan.steps) {
      expect(step.actualEvidenceState).toBe('MISSING_EVIDENCE');
      for (const metric of step.metrics) {
        expect(metric.measurementAvailability).toBe('AVAILABLE');
        expect(metric.actualEvidenceAvailability).toBe('NOT_ATTACHED');
      }
    }
  });

  it('does not fabricate a Branch collections metric', () => {
    expect(conceptMetricMap.Branch).toEqual([]);
    const allMetrics = plan.steps.flatMap((step) => step.metricIds);
    expect(allMetrics.some((id) => id.includes('branch') && id.includes('collection'))).toBe(false);
  });
});

describe('buildInvestigationPlan unknown cases', () => {
  it('does not silently default unknown research cases', () => {
    expect(() => buildInvestigationPlan('ar-aging-increase')).toThrow(/Unsupported research investigation case/);
    expect(() => buildInvestigationPlan('cash-collections-decline')).not.toThrow();
  });
});

describe('buildInvestigationPlan claim-not-paid', () => {
  const plan = buildInvestigationPlan('claim-not-paid');

  it('returns four ordered steps from the Claim observation', () => {
    expect(plan.researchQuestionId).toBe('claim-not-paid');
    expect(plan.observedConcept).toBe('Claim');
    expect(plan.question).toBe('Why was this claim not paid?');
    expect(plan.steps).toHaveLength(4);
    expect(plan.steps.map((step) => step.step)).toEqual([1, 2, 3, 4]);
    expect(plan.steps.map((step) => step.title)).toEqual([
      'Inspect claim payment and denial outcomes',
      'Investigate denial and appeal path',
      'Investigate remittance posting to receivables',
      'Investigate payer rules governing the claim',
    ]);
  });

  it('only declares ontology relationships that exist in financeOntology', () => {
    const refs = plan.steps.flatMap((step) => step.relationshipRefs);
    expect(() => assertRelationshipRefsExist(refs)).not.toThrow();
    for (const ref of refs) {
      expect(relationshipExists(ref, financeOntology)).toBe(true);
    }
  });

  it('walks Claim → Denial → Appeal over asserted edges', () => {
    const denialAppealPath = plan.steps[1].relationshipRefs;
    expect(denialAppealPath).toEqual([
      { from: 'Claim', relationship: 'may_have', to: 'Denial' },
      { from: 'Denial', relationship: 'may_be_appealed_via', to: 'Appeal' },
    ]);
    expect(isDirectedWalk(denialAppealPath)).toBe(true);
  });

  it('walks Claim → Remittance → AccountsReceivable over asserted edges', () => {
    const remittancePath = plan.steps[2].relationshipRefs;
    expect(remittancePath).toEqual([
      { from: 'Claim', relationship: 'may_produce', to: 'Remittance' },
      { from: 'Remittance', relationship: 'posts_to', to: 'AccountsReceivable' },
    ]);
    expect(isDirectedWalk(remittancePath)).toBe(true);
  });

  it('references only existing approved metric IDs', () => {
    for (const metricId of plan.steps.flatMap((step) => step.metricIds)) {
      expect(knownGovernedMetricIds).toContain(metricId);
    }
  });

  it('maps new RCM concepts without inventing metric ids', () => {
    expect(conceptMetricMap.Appeal).toEqual([]);
    expect(conceptMetricMap.Remittance).toEqual([]);
    expect(conceptMetricMap.PayerRule).toEqual([]);
    expect(conceptMetricMap.PayrollObligation).toEqual([]);
    expect(conceptMetricMap.AccountsReceivable).toEqual(['open_ar', 'ar_age']);
  });

  it('returns INSUFFICIENT_EVIDENCE and never authorizes a causal conclusion', () => {
    expect(plan.conclusionState).toBe('INSUFFICIENT_EVIDENCE');
    expect(plan.allowsCausalConclusion).toBe(false);
    for (const step of plan.steps) {
      expect(step.investigationStatus).toBe('INVESTIGATE');
      expect(step.actualEvidenceState).toBe('MISSING_EVIDENCE');
    }
  });
});
