import { CircleHelp } from 'lucide-react';
import {
  ontologyInvestigationPlan,
  ontologyMetricGroups,
  ontologyResearchQuestion,
  ontologySupportedEdges,
} from '@/lib/finance-ontology-demo';

export function OntologyInvestigationDemo() {
  return (
    <div className="od-demo od-demo-v2">
      <section className="od-hero">
        <div className="od-hero-tags">
          <span className="od-badge">Research prototype</span>
          <span className="od-research-note">Research use case — not an approved Financial Agent question</span>
        </div>
        <h2>{ontologyResearchQuestion}</h2>
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
            <div className="od-node od-node-root">
              <em>Investigation starts here</em>
              Cash Collections
              <small>Observed outcome</small>
            </div>
            <div className="od-connector">
              <span>↑ contributes_to</span>
              <i>Payment → Cash Collections</i>
            </div>
            <div className="od-node">Payment</div>
            <div className="od-connector">
              <span>↑ may_result_in</span>
              <i>Claim → Payment</i>
            </div>
            <div className="od-node od-node-hub">Claim</div>
          </div>

          <div className="od-map-branches">
            <div className="od-map-branch">
              <div className="od-connector od-connector-down">
                <span>↓ submitted_to</span>
                <i>Claim → Payer</i>
              </div>
              <div className="od-node">Payer</div>
            </div>
            <div className="od-map-branch">
              <div className="od-connector od-connector-down">
                <span>↓ may_have</span>
                <i>Claim → Denial</i>
              </div>
              <div className="od-node">Denial</div>
            </div>
            <div className="od-map-branch od-map-branch-visit">
              <div className="od-connector">
                <span>↑ generates</span>
                <i>Visit → Claim</i>
              </div>
              <div className="od-node">Visit</div>
              <div className="od-visit-fork">
                <div>
                  <div className="od-connector od-connector-down">
                    <span>↓ covered_by</span>
                    <i>Visit → Authorization</i>
                  </div>
                  <div className="od-node">Authorization</div>
                </div>
                <div>
                  <div className="od-connector">
                    <span>↑ delivered_as</span>
                    <i>Service → Visit</i>
                  </div>
                  <div className="od-node">Service</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <details className="od-details">
          <summary>View ontology relationships</summary>
          <ul>
            {ontologySupportedEdges.map((edge) => (
              <li key={`${edge.from}-${edge.relationship}-${edge.to}`}>
                <code>{edge.from}</code> → <em>{edge.relationship}</em> → <code>{edge.to}</code>
              </li>
            ))}
          </ul>
        </details>
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
          {ontologyMetricGroups.map((group) => (
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
          {ontologyInvestigationPlan.map((item) => (
            <div key={item.step} className="od-story-card">
              <strong>{item.title}</strong>
              <span>→ {item.storyVisual}</span>
              <em>Placeholder — not a live chart</em>
            </div>
          ))}
        </div>
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
          <b>Not built in v0.1</b>
        </div>
      </section>
    </div>
  );
}
