'use client';

import { useMemo, useState } from 'react';
import { CircleHelp, X } from 'lucide-react';
import { financeOntology } from '@/lib/finance-ontology';
import { ExplainerCard } from '@/components/explainers/ExplainerCard';
import { OntologyGraphSvg } from '@/components/ontology-demo/OntologyGraphSvg';
import {
  getCashCollectionsInvestigationPlan,
  getConceptMetricGroups,
} from '@/lib/finance-ontology-demo';
import { explainInvestigationPlan, explainOntologyGraph } from '@/lib/research-explainers';
import {
  buildInvestigationPlan,
  getConceptInvestigationDetails,
  type ConceptInvestigationDetails,
  type InvestigationPlan,
} from '@/lib/finance-ontology-investigation';
import { investigationPathHighlight } from '@/lib/ontology-graph-layout';

const GRAPH_LABELS: Readonly<Record<string, string>> = {
  CashCollections: 'Cash Collections',
  AccountsReceivable: 'Accounts Receivable',
  PayerRule: 'Payer Rule',
  PayrollObligation: 'Payroll Obligation',
  Authorization: 'Authorization',
  Payment: 'Payment',
  Claim: 'Claim',
  Denial: 'Denial',
  Appeal: 'Appeal',
  Remittance: 'Remittance',
  Visit: 'Visit',
  Service: 'Service',
  Payer: 'Payer',
  Branch: 'Branch',
  Client: 'Client',
};

type PlanOptionId = 'cash-collections-decline' | 'claim-not-paid';

const PLAN_OPTIONS: readonly { id: PlanOptionId; label: string }[] = [
  { id: 'cash-collections-decline', label: 'Why did cash collections fall?' },
  { id: 'claim-not-paid', label: 'Why was this claim not paid?' },
];

function loadPlan(planId: PlanOptionId | null): InvestigationPlan {
  if (planId === 'claim-not-paid') return buildInvestigationPlan('claim-not-paid');
  return getCashCollectionsInvestigationPlan();
}

export function OntologyInvestigationDemo() {
  const [selectedPlanId, setSelectedPlanId] = useState<PlanOptionId | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const plan = useMemo(() => loadPlan(selectedPlanId ?? 'cash-collections-decline'), [selectedPlanId]);
  const highlight = useMemo(
    () => (selectedPlanId ? investigationPathHighlight(plan) : null),
    [selectedPlanId, plan],
  );
  const metricGroups = useMemo(() => getConceptMetricGroups(), []);
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
        <h2>{selectedPlanId ? plan.question : 'Financial ontology graph'}</h2>
        <p>
          {selectedPlanId
            ? 'Highlighted path shows where the selected investigation plan walks the ontology.'
            : 'Use governed financial relationships to determine where the agent should investigate.'}
        </p>
      </section>

      <section className="od-panel od-graph-panel">
        <div className="od-panel-head">
          <strong>Financial domain ontology</strong>
          <span>Drawn graph</span>
        </div>
        <div className="od-legend od-legend-compact">
          <span>
            <b>Investigation</b>
            Select a plan to highlight its path; clear selection to show the full graph
          </span>
          <span>
            <b>Ontology</b>
            Arrows show defined relationship direction
          </span>
        </div>

        <div className="od-plan-picker" role="group" aria-label="Investigation plan selection">
          <button
            type="button"
            className={selectedPlanId === null ? 'active' : ''}
            onClick={() => setSelectedPlanId(null)}
          >
            Full graph
          </button>
          {PLAN_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={selectedPlanId === option.id ? 'active' : ''}
              onClick={() => setSelectedPlanId(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <OntologyGraphSvg
          edges={financeOntology}
          labels={GRAPH_LABELS}
          highlight={highlight}
          selectedConceptId={selectedConcept}
          onSelectConcept={setSelectedConcept}
        />

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
          <summary>View ontology relationships (text fallback)</summary>
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
              <strong>{step.title.replace(/^Investigate |^Verify |^Inspect /, '')}</strong>
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
          Actual evidence must be evaluated before attributing an unpaid claim or collections decline to denials,
          remittance posting, payer rules, or another factor.
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
