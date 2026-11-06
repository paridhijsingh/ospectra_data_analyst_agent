import { describe, expect, it } from 'vitest';
import { financeOntology, financeOntologyConceptIds } from './finance-ontology';
import { buildInvestigationPlan } from './finance-ontology-investigation';
import {
  buildOntologyGraphModel,
  investigationPathHighlight,
  ontologyEdgeKey,
  ontologyEdgeKeyFromRef,
} from './ontology-graph-layout';

describe('ontology graph layout (finance)', () => {
  const model = buildOntologyGraphModel(financeOntology);
  const concepts = financeOntologyConceptIds(financeOntology);

  it('renders one node per finance ontology concept', () => {
    expect(model.nodes).toHaveLength(concepts.length);
    expect(model.nodes.map((node) => node.id).sort()).toEqual(concepts);
  });

  it('renders one edge per finance ontology relationship', () => {
    expect(model.edges).toHaveLength(financeOntology.length);
    expect(model.edges.map((edge) => edge.key).sort()).toEqual(
      financeOntology.map((edge) => ontologyEdgeKey(edge.from, edge.relationship, edge.to)).sort(),
    );
  });

  it('places every node at a finite deterministic coordinate', () => {
    for (const node of model.nodes) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
      expect(node.x).toBeGreaterThan(0);
      expect(node.y).toBeGreaterThan(0);
    }
    const again = buildOntologyGraphModel(financeOntology);
    expect(again.nodes.map((node) => `${node.id}:${node.x},${node.y}`)).toEqual(
      model.nodes.map((node) => `${node.id}:${node.x},${node.y}`),
    );
  });
});

describe('ontology graph investigation path highlight', () => {
  it('highlights exactly the cash-collections plan concepts and relationship refs', () => {
    const plan = buildInvestigationPlan('cash-collections-decline');
    const highlight = investigationPathHighlight(plan);
    const expectedNodes = new Set<string>([plan.observedConcept]);
    const expectedEdges = new Set<string>();
    for (const step of plan.steps) {
      for (const conceptId of step.conceptIds) expectedNodes.add(conceptId);
      for (const ref of step.relationshipRefs) expectedEdges.add(ontologyEdgeKeyFromRef(ref));
    }
    expect(highlight.nodeIds).toEqual([...expectedNodes].sort());
    expect(highlight.edgeKeys).toEqual([...expectedEdges].sort());
    expect(highlight.nodeIds).toContain('CashCollections');
    expect(highlight.edgeKeys).toContain(ontologyEdgeKey('Payment', 'contributes_to', 'CashCollections'));
  });

  it('highlights the claim-not-paid walks Claim→Denial→Appeal and Claim→Remittance→AccountsReceivable', () => {
    const plan = buildInvestigationPlan('claim-not-paid');
    const highlight = investigationPathHighlight(plan);
    expect(highlight.nodeIds).toEqual(
      expect.arrayContaining(['Claim', 'Denial', 'Appeal', 'Remittance', 'AccountsReceivable', 'Payer', 'PayerRule']),
    );
    expect(highlight.edgeKeys).toEqual(
      expect.arrayContaining([
        ontologyEdgeKey('Claim', 'may_have', 'Denial'),
        ontologyEdgeKey('Denial', 'may_be_appealed_via', 'Appeal'),
        ontologyEdgeKey('Claim', 'may_produce', 'Remittance'),
        ontologyEdgeKey('Remittance', 'posts_to', 'AccountsReceivable'),
      ]),
    );
    const stepKeys = plan.steps.flatMap((step) => step.relationshipRefs.map(ontologyEdgeKeyFromRef)).sort();
    expect(highlight.edgeKeys).toEqual([...new Set(stepKeys)].sort());
  });
});
