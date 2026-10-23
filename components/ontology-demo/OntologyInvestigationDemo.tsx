'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { CircleHelp, X } from 'lucide-react';
import { financeOntology } from '@/lib/finance-ontology';
import { ExplainerCard } from '@/components/explainers/ExplainerCard';
import {
  getCashCollectionsInvestigationPlan,
  getConceptMetricGroups,
} from '@/lib/finance-ontology-demo';
import { explainInvestigationPlan, explainOntologyGraph } from '@/lib/research-explainers';
import {
  clickableOntologyConcepts,
  getConceptInvestigationDetails,
  type ConceptInvestigationDetails,
} from '@/lib/finance-ontology-investigation';

const nodeLabels: Record<string, string> = {
  CashCollections: 'Cash Collections',
  Payment: 'Payment',
  Claim: 'Claim',
  Payer: 'Payer',
  Denial: 'Denial',
  Visit: 'Visit',
  Authorization: 'Authorization',
  Service: 'Service',
};

function ConceptNode({
  conceptId,
  className,
  selected,
  onSelect,
  children,
}: {
  conceptId: (typeof clickableOntologyConcepts)[number];
  className?: string;
  selected: boolean;
  onSelect: (id: (typeof clickableOntologyConcepts)[number]) => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`od-node ${className ?? ''} ${selected ? 'od-node-selected' : ''}`}
      onClick={() => onSelect(conceptId)}
      aria-pressed={selected}
    >
      {children ?? nodeLabels[conceptId]}
    </button>
  );
}

export function OntologyInvestigationDemo() {
  const plan = useMemo(() => getCashCollectionsInvestigationPlan(), []);
  const metricGroups = useMemo(() => getConceptMetricGroups(), []);
  const [selectedConcept, setSelectedConcept] = useState<(typeof clickableOntologyConcepts)[number] | null>(null);
  const details: ConceptInvestigationDetails | null = selectedConcept
    ? getConceptInvestigationDetails(selectedConcept, plan)
    : null;

  return (
    <div className="od-demo od-demo-v2">
      <section className="od-hero">
        <div className="od-hero-tags">
          <span className="od-badge">Research prototype</span>
          <span className="od-research-note">Research use case — not an approved Financial Agent question</span>
        </div>
        <h2>{plan.question}</h2>
        <p>Use governed financial relationships to determine where the agent should investigate.</p>
      </section>

      <section className="od-panel od-graph-panel">
        <div className="od-panel-head">
          <strong>Financial domain ontology</strong>
          <span>Concept map</span>
        </div>
        <div className="od-legend od-legend-compact">
          <span>
            <b>Investigation</b>
            Start at observed outcome and work upstream
          </span>
          <span>
            <b>Ontology</b>
            Arrows show defined relationship direction
          </span>
        </div>

        <div
          className="od-map"
          role="img"
          aria-label="Ontology concept map starting at Cash Collections, with Payment and Claim upstream, then Payer, Denial, and Visit branches"
        >
          <div className="od-map-stem">
            <ConceptNode
              conceptId="CashCollections"
              className="od-node-root"
              selected={selectedConcept === 'CashCollections'}
              onSelect={setSelectedConcept}
            >
              <em>Investigation starts here</em>
              Cash Collections
              <small>Observed outcome</small>
            </ConceptNode>
            <div className="od-connector">
              <span>↑ contributes_to</span>
              <i>Payment → Cash Collections</i>
            </div>
            <ConceptNode conceptId="Payment" selected={selectedConcept === 'Payment'} onSelect={setSelectedConcept} />
            <div className="od-connector">
              <span>↑ may_result_in</span>
              <i>Claim → Payment</i>
            </div>
            <ConceptNode
              conceptId="Claim"
              className="od-node-hub"
              selected={selectedConcept === 'Claim'}
              onSelect={setSelectedConcept}
            />
          </div>

          <div className="od-map-branches">
            <div className="od-map-branch">
              <div className="od-connector od-connector-down">
                <span>↓ submitted_to</span>
                <i>Claim → Payer</i>
              </div>
              <ConceptNode conceptId="Payer" selected={selectedConcept === 'Payer'} onSelect={setSelectedConcept} />
            </div>
            <div className="od-map-branch">
              <div className="od-connector od-connector-down">
                <span>↓ may_have</span>
                <i>Claim → Denial</i>
              </div>
              <ConceptNode conceptId="Denial" selected={selectedConcept === 'Denial'} onSelect={setSelectedConcept} />
            </div>
            <div className="od-map-branch od-map-branch-visit">
              <div className="od-connector">
                <span>↑ generates</span>
                <i>Visit → Claim</i>
              </div>
              <ConceptNode conceptId="Visit" selected={selectedConcept === 'Visit'} onSelect={setSelectedConcept} />
              <div className="od-visit-fork">
                <div>
                  <div className="od-connector od-connector-down">
                    <span>↓ covered_by</span>
                    <i>Visit → Authorization</i>
                  </div>
                  <ConceptNode
                    conceptId="Authorization"
                    selected={selectedConcept === 'Authorization'}
                    onSelect={setSelectedConcept}
                  />
                </div>
                <div>
                  <div className="od-connector">
                    <span>↑ delivered_as</span>
                    <i>Service → Visit</i>
                  </div>
                  <ConceptNode
                    conceptId="Service"
                    selected={selectedConcept === 'Service'}
                    onSelect={setSelectedConcept}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <ExplainerCard explainer={explainOntologyGraph(plan)} />

        {details && (
          <aside className="od-concept-panel" aria-live="polite">
            <div className="od-concept-panel-head">
              <strong>{details.displayName}</strong>
              <button type="button" onClick={() => setSelectedConcept(null)} aria-label="Close concept details">
                <X size={14} />
              </button>
            </div>
            <p><small>Why relevant</small>{details.relevanceReason}</p>
            <p>
              <small>Defined relationships</small>
              {details.relationships.length === 0
                ? 'None'
                : details.relationships.map((ref) => `${ref.from} → ${ref.relationship} → ${ref.to}`).join(' · ')}
            </p>
            <p>
              <small>Governed metrics</small>
              {details.metricIds.length ? details.metricIds.map((id) => <code key={id}>{id}</code>) : 'None mapped'}
            </p>
            <div className="od-status-row">
              <span><b>Measurement</b> {details.measurementAvailability === 'AVAILABLE' ? 'Metric available' : 'Unsupported'}</span>
              <span><b>Actual evidence</b> Not attached in v0.2</span>
            </div>
            <p><small>Can investigate</small>{details.canInvestigate}</p>
            <p><small>Cannot conclude</small>{details.cannotConclude}</p>
          </aside>
        )}

        <details className="od-details">
          <summary>View ontology relationships</summary>
          <ul>
            {financeOntology.map((edge) => (
              <li key={`${edge.from}-${edge.relationship}-${edge.to}`}>
                <code>{edge.from}</code> → <em>{edge.relationship}</em> → <code>{edge.to}</code>
              </li>
            ))}
          </ul>
        </details>
      </section>

      <section className="od-panel">
        <div className="od-panel-head">
          <strong>Deterministic investigation plan</strong>
          <span>From buildInvestigationPlan()</span>
        </div>
        <ol className="od-invest-steps">
          {plan.steps.map((step) => (
            <li key={step.step}>
              <div className="od-invest-step-head">
                <strong>Step {step.step} — {step.title}</strong>
                <em>Investigate</em>
              </div>
              <p>Concepts: {step.conceptIds.join(', ')}</p>
              <p>
                Metrics:{' '}
                {step.metrics.map((metric) => (
                  <code key={metric.metricId}>{metric.metricId}</code>
                ))}
              </p>
              <p>Suggested visualization: {step.suggestedVisual}</p>
              <div className="od-status-row">
                <span><b>Governed measurement</b> Metric available</span>
                <span><b>Actual evidence</b> Not attached in v0.2</span>
                <span><b>Investigation status</b> Investigate</span>
              </div>
            </li>
          ))}
        </ol>
        <ExplainerCard explainer={explainInvestigationPlan(plan)} />
      </section>

      <section className="od-panel">
        <div className="od-panel-head">
          <strong>From concepts to governed metrics</strong>
          <span>What the agent can measure</span>
        </div>
        <p className="od-path-note">
          The ontology identifies relevant concepts. The metric registry determines what the agent can measure.
        </p>
        <div className="od-metric-cards">
          {metricGroups.map((group) => (
            <div key={group.title} className="od-metric-card">
              <small>{group.title}</small>
              <ul>
                {group.metricIds.map((id) => (
                  <li key={id}><code>{id}</code></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="od-panel">
        <div className="od-panel-head">
          <strong>Right Graph · Right Story</strong>
          <span>Visualization intent</span>
        </div>
        <p className="od-path-note">
          Visualization is selected from the analytical intent and available governed metrics.
        </p>
        <div className="od-story-cards">
          {plan.steps.map((step) => (
            <div key={step.step} className="od-story-card">
              <strong>{step.title.replace(/^Investigate |^Verify /, '')}</strong>
              <span>→ {step.suggestedVisual}</span>
              <em>Placeholder — not a live chart</em>
            </div>
          ))}
        </div>
      </section>

      <section className="od-conclusion">
        <small>Current conclusion</small>
        <strong>Insufficient evidence to assign a cause</strong>
        <p>
          The ontology identifies relevant investigation paths and the metric registry identifies what can be measured.
          Actual evidence must be evaluated before attributing the decline to payment timing, denials, authorization
          issues, or another factor.
        </p>
        <p className="od-path-note">{plan.conclusionMessage}</p>
      </section>

      <section className="od-callout od-callout-compact">
        <CircleHelp size={15} />
        <div>
          <strong>Ontology guides where to investigate. Relationships do not establish causation.</strong>
          <div className="od-cause-example">
            <div>
              <small>Observed</small>
              <span>↑ denial rate</span>
              <span>↓ cash collections</span>
            </div>
            <div className="od-cause-not">
              <small>Does not automatically imply</small>
              <span>Denials → caused → lower collections</span>
            </div>
          </div>
          <p>Supporting evidence is required before making a causal explanation.</p>
        </div>
      </section>

      <section className="od-compare od-compare-v2">
        <div>
          <small>Ontology</small>
          <p>Defines the vocabulary and valid relationships.</p>
          <div className="od-mini-flow">
            <span>Claim</span>
            <em>↓ may_result_in</em>
            <span>Payment</span>
          </div>
        </div>
        <div>
          <small>Knowledge Graph</small>
          <p>Actual instances connected using that model.</p>
          <div className="od-mini-flow">
            <span>Claim C-1001</span>
            <em>↓ may_result_in</em>
            <span>Payment P-283</span>
          </div>
          <b>Not built in v0.2</b>
        </div>
      </section>
    </div>
  );
}
