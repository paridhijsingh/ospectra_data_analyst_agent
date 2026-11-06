import { describe, expect, it } from 'vitest';
import { financeOntology, financeOntologyConceptIds, type OntologyEdge } from './finance-ontology';

const RCM_NEW_CONCEPTS = [
  'Appeal',
  'Remittance',
  'AccountsReceivable',
  'PayerRule',
  'PayrollObligation',
] as const;

const RCM_NEW_EDGES: readonly OntologyEdge[] = [
  { from: 'Authorization', relationship: 'authorizes', to: 'Claim' },
  { from: 'Denial', relationship: 'may_be_appealed_via', to: 'Appeal' },
  { from: 'Claim', relationship: 'may_produce', to: 'Remittance' },
  { from: 'Remittance', relationship: 'posts_to', to: 'AccountsReceivable' },
  { from: 'CashCollections', relationship: 'funds', to: 'PayrollObligation' },
  { from: 'Payer', relationship: 'applies', to: 'PayerRule' },
  { from: 'PayerRule', relationship: 'governs', to: 'Claim' },
];

function undirectedNeighbors(edges: readonly OntologyEdge[]): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();
  for (const edge of edges) {
    if (!graph.has(edge.from)) graph.set(edge.from, new Set());
    if (!graph.has(edge.to)) graph.set(edge.to, new Set());
    graph.get(edge.from)!.add(edge.to);
    graph.get(edge.to)!.add(edge.from);
  }
  return graph;
}

function isReachable(start: string, target: string, edges: readonly OntologyEdge[]): boolean {
  const graph = undirectedNeighbors(edges);
  if (!graph.has(start) || !graph.has(target)) return false;
  const seen = new Set<string>([start]);
  const queue = [start];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === target) return true;
    for (const next of graph.get(current) ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return false;
}

describe('finance ontology RCM extension', () => {
  const concepts = financeOntologyConceptIds();

  it('includes every new RCM concept as an edge endpoint', () => {
    for (const conceptId of RCM_NEW_CONCEPTS) {
      expect(concepts).toContain(conceptId);
    }
  });

  it('does not duplicate existing core concept ids', () => {
    expect(concepts.filter((id) => id === 'Claim')).toHaveLength(1);
    expect(concepts.filter((id) => id === 'Denial')).toHaveLength(1);
    expect(concepts.filter((id) => id === 'Authorization')).toHaveLength(1);
    expect(concepts.filter((id) => id === 'Payer')).toHaveLength(1);
    expect(concepts.filter((id) => id === 'CashCollections')).toHaveLength(1);
    expect(concepts.filter((id) => id === 'AccountsReceivable')).toHaveLength(1);
  });

  it('adds every RCM edge with endpoints that exist in the concept set', () => {
    for (const edge of RCM_NEW_EDGES) {
      expect(financeOntology).toContainEqual(edge);
      expect(concepts).toContain(edge.from);
      expect(concepts).toContain(edge.to);
    }
  });

  it('makes every new RCM concept reachable from Claim on the undirected graph', () => {
    for (const conceptId of RCM_NEW_CONCEPTS) {
      expect(isReachable('Claim', conceptId, financeOntology)).toBe(true);
    }
  });

  it('keeps every edge endpoint free of dangling concept ids', () => {
    for (const edge of financeOntology) {
      expect(concepts).toContain(edge.from);
      expect(concepts).toContain(edge.to);
    }
  });
});
