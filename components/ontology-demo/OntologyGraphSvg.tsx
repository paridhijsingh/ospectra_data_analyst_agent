'use client';

import { useMemo } from 'react';
import type { OntologyEdge } from '@/lib/finance-ontology';
import {
  buildOntologyGraphModel,
  ontologyGraphNodeSize,
  type OntologyGraphHighlight,
} from '@/lib/ontology-graph-layout';

type OntologyGraphSvgProps = {
  edges: readonly OntologyEdge[];
  labels?: Readonly<Record<string, string>>;
  highlight?: OntologyGraphHighlight | null;
  selectedConceptId?: string | null;
  onSelectConcept?: (conceptId: string) => void;
};

function endpoint(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  nodeW: number,
  nodeH: number,
  atSource: boolean,
): { x: number; y: number } {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.hypot(dx, dy) || 1;
  const hw = nodeW / 2;
  const hh = nodeH / 2;
  // Move from center toward the other node until the rounded-rect boundary.
  const ux = dx / len;
  const uy = dy / len;
  const tx = Math.abs(ux) < 1e-6 ? Number.POSITIVE_INFINITY : hw / Math.abs(ux);
  const ty = Math.abs(uy) < 1e-6 ? Number.POSITIVE_INFINITY : hh / Math.abs(uy);
  const t = Math.min(tx, ty);
  if (atSource) {
    return { x: fromX + ux * t, y: fromY + uy * t };
  }
  return { x: toX - ux * t, y: toY - uy * t };
}

export function OntologyGraphSvg({
  edges,
  labels,
  highlight = null,
  selectedConceptId = null,
  onSelectConcept,
}: OntologyGraphSvgProps) {
  const model = useMemo(() => buildOntologyGraphModel(edges, labels), [edges, labels]);
  const nodeById = useMemo(() => new Map(model.nodes.map((node) => [node.id, node])), [model.nodes]);
  const highlightedNodes = useMemo(() => new Set(highlight?.nodeIds ?? []), [highlight]);
  const highlightedEdges = useMemo(() => new Set(highlight?.edgeKeys ?? []), [highlight]);
  const pathActive = Boolean(highlight && (highlight.nodeIds.length > 0 || highlight.edgeKeys.length > 0));
  const { width: nodeW, height: nodeH } = ontologyGraphNodeSize;

  return (
    <div className="od-svg-wrap">
      <svg
        className="od-svg-graph"
        viewBox={`0 0 ${model.width} ${model.height}`}
        role="img"
        aria-label="Financial ontology graph with concepts as nodes and labelled relationship edges"
        data-ontology-node-count={model.nodes.length}
        data-ontology-edge-count={model.edges.length}
      >
        <defs>
          <marker
            id="od-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="od-svg-arrow" />
          </marker>
          <marker
            id="od-arrow-active"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="od-svg-arrow-active" />
          </marker>
        </defs>

        {model.edges.map((edge) => {
          const from = nodeById.get(edge.from);
          const to = nodeById.get(edge.to);
          if (!from || !to) return null;
          const start = endpoint(from.x, from.y, to.x, to.y, nodeW, nodeH, true);
          const end = endpoint(from.x, from.y, to.x, to.y, nodeW, nodeH, false);
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;
          const active = !pathActive || highlightedEdges.has(edge.key);
          const dimmed = pathActive && !highlightedEdges.has(edge.key);
          return (
            <g
              key={edge.key}
              className={`od-svg-edge ${active ? 'od-svg-edge-active' : ''} ${dimmed ? 'od-svg-dimmed' : ''}`}
              data-edge-key={edge.key}
              data-highlighted={highlightedEdges.has(edge.key) ? 'true' : 'false'}
            >
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                markerEnd={dimmed ? 'url(#od-arrow)' : pathActive ? 'url(#od-arrow-active)' : 'url(#od-arrow)'}
              />
              <rect
                x={midX - Math.min(54, 4 + edge.relationship.length * 3.2)}
                y={midY - 9}
                width={Math.min(108, 8 + edge.relationship.length * 6.4)}
                height={16}
                rx={4}
                className="od-svg-edge-label-bg"
              />
              <text x={midX} y={midY + 3} textAnchor="middle" className="od-svg-edge-label">
                {edge.relationship}
              </text>
            </g>
          );
        })}

        {model.nodes.map((node) => {
          const onPath = !pathActive || highlightedNodes.has(node.id);
          const dimmed = pathActive && !highlightedNodes.has(node.id);
          const selected = selectedConceptId === node.id;
          return (
            <g
              key={node.id}
              className={`od-svg-node ${onPath ? 'od-svg-node-active' : ''} ${dimmed ? 'od-svg-dimmed' : ''} ${selected ? 'od-svg-node-selected' : ''}`}
              transform={`translate(${node.x - nodeW / 2} ${node.y - nodeH / 2})`}
              data-concept-id={node.id}
              data-highlighted={highlightedNodes.has(node.id) ? 'true' : 'false'}
            >
              <rect
                width={nodeW}
                height={nodeH}
                rx={10}
                role={onSelectConcept ? 'button' : undefined}
                tabIndex={onSelectConcept ? 0 : undefined}
                aria-label={node.label}
                aria-pressed={onSelectConcept ? selected : undefined}
                onClick={onSelectConcept ? () => onSelectConcept(node.id) : undefined}
                onKeyDown={
                  onSelectConcept
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onSelectConcept(node.id);
                        }
                      }
                    : undefined
                }
              />
              <text x={nodeW / 2} y={nodeH / 2 + 4} textAnchor="middle" className="od-svg-node-label">
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
