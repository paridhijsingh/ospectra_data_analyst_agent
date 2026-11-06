/**
 * Deterministic ontology graph layout + investigation-path highlighting.
 * Presentation helpers only — not imported by routing or chat answers.
 */
import {
  financeOntologyConceptIds,
  type OntologyEdge,
} from './finance-ontology';
import type { InvestigationPlan, OntologyRelationshipRef } from './finance-ontology-investigation';

export type OntologyGraphNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  layer: number;
};

export type OntologyGraphEdge = {
  key: string;
  from: string;
  to: string;
  relationship: string;
};

export type OntologyGraphModel = {
  nodes: readonly OntologyGraphNode[];
  edges: readonly OntologyGraphEdge[];
  width: number;
  height: number;
};

export type OntologyGraphHighlight = {
  nodeIds: readonly string[];
  edgeKeys: readonly string[];
};

const DEFAULT_LABELS: Readonly<Record<string, string>> = {
  CashCollections: 'Cash Collections',
  AccountsReceivable: 'Accounts Receivable',
  PayerRule: 'Payer Rule',
  PayrollObligation: 'Payroll Obligation',
};

const NODE_WIDTH = 148;
const NODE_HEIGHT = 42;
const LAYER_GAP_Y = 118;
const PAD_X = 56;
const PAD_Y = 40;

export function ontologyEdgeKey(from: string, relationship: string, to: string): string {
  return `${from}|${relationship}|${to}`;
}

export function ontologyEdgeKeyFromRef(ref: OntologyRelationshipRef): string {
  return ontologyEdgeKey(ref.from, ref.relationship, ref.to);
}

function labelFor(id: string, labels?: Readonly<Record<string, string>>): string {
  return labels?.[id] ?? DEFAULT_LABELS[id] ?? id;
}

/** BFS layering from roots; already-placed nodes are not moved (cycle-safe). */
export function assignOntologyLayers(edges: readonly OntologyEdge[]): Map<string, number> {
  const concepts = financeOntologyConceptIds(edges);
  const outgoing = new Map<string, string[]>();
  const indegree = new Map<string, number>();
  for (const id of concepts) {
    outgoing.set(id, []);
    indegree.set(id, 0);
  }
  for (const edge of edges) {
    outgoing.get(edge.from)!.push(edge.to);
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
  }

  const layers = new Map<string, number>();
  const queue = concepts.filter((id) => (indegree.get(id) ?? 0) === 0).sort();
  if (queue.length === 0 && concepts.length > 0) {
    queue.push([...concepts].sort()[0]);
  }
  for (const id of queue) layers.set(id, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const nextLayer = (layers.get(current) ?? 0) + 1;
    for (const neighbor of [...(outgoing.get(current) ?? [])].sort()) {
      if (layers.has(neighbor)) continue;
      layers.set(neighbor, nextLayer);
      queue.push(neighbor);
    }
  }

  for (const id of concepts) {
    if (!layers.has(id)) layers.set(id, 0);
  }
  return layers;
}

export function buildOntologyGraphModel(
  edges: readonly OntologyEdge[],
  labels?: Readonly<Record<string, string>>,
): OntologyGraphModel {
  const conceptIds = financeOntologyConceptIds(edges);
  const layers = assignOntologyLayers(edges);
  const byLayer = new Map<number, string[]>();
  for (const id of conceptIds) {
    const layer = layers.get(id) ?? 0;
    const bucket = byLayer.get(layer) ?? [];
    bucket.push(id);
    byLayer.set(layer, bucket);
  }
  for (const [, bucket] of byLayer) bucket.sort();

  const layerIndexes = [...byLayer.keys()].sort((a, b) => a - b);
  const maxCount = Math.max(1, ...layerIndexes.map((layer) => byLayer.get(layer)!.length));
  const width = Math.max(720, PAD_X * 2 + maxCount * (NODE_WIDTH + 28));
  const height = PAD_Y * 2 + Math.max(1, layerIndexes.length) * LAYER_GAP_Y;

  const nodes: OntologyGraphNode[] = [];
  for (const layer of layerIndexes) {
    const bucket = byLayer.get(layer)!;
    const span = width - PAD_X * 2;
    const step = bucket.length === 1 ? 0 : span / (bucket.length - 1);
    bucket.forEach((id, index) => {
      const x =
        bucket.length === 1
          ? width / 2
          : PAD_X + index * step;
      const y = PAD_Y + NODE_HEIGHT / 2 + layer * LAYER_GAP_Y;
      nodes.push({
        id,
        label: labelFor(id, labels),
        x,
        y,
        layer,
      });
    });
  }

  const graphEdges: OntologyGraphEdge[] = edges.map((edge) => ({
    key: ontologyEdgeKey(edge.from, edge.relationship, edge.to),
    from: edge.from,
    to: edge.to,
    relationship: edge.relationship,
  }));

  return { nodes, edges: graphEdges, width, height };
}

export function investigationPathHighlight(plan: InvestigationPlan): OntologyGraphHighlight {
  const nodeIds = new Set<string>([plan.observedConcept]);
  const edgeKeys = new Set<string>();
  for (const step of plan.steps) {
    for (const conceptId of step.conceptIds) nodeIds.add(conceptId);
    for (const ref of step.relationshipRefs) edgeKeys.add(ontologyEdgeKeyFromRef(ref));
  }
  return {
    nodeIds: [...nodeIds].sort(),
    edgeKeys: [...edgeKeys].sort(),
  };
}

export const ontologyGraphNodeSize = {
  width: NODE_WIDTH,
  height: NODE_HEIGHT,
} as const;
