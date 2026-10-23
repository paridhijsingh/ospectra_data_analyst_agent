'use client';

import { CircleHelp } from 'lucide-react';
import { compareCashTimingScenario } from '@/lib/cash-timing-scenario';
import { ExplainerCard } from '@/components/explainers/ExplainerCard';
import {
  delayedReimbursementFixture,
  formatUsd,
  scenarioDisplayCopy,
  scenarioResearchQuestion,
} from '@/lib/cash-timing-scenario-demo';
import { explainCashTimingComparison, explainCashTimingTimeline } from '@/lib/research-explainers';

export function CashTimingScenarioDemo() {
  const result = compareCashTimingScenario(delayedReimbursementFixture);
  const copy = scenarioDisplayCopy;

  return (
    <div className="od-demo sd-demo">
      <section className="sd-hero">
        <div className="sd-hero-tags">
          <span className="od-badge">Research prototype</span>
          <span className="sd-synthetic-banner">Synthetic data — not OSpectra actuals</span>
        </div>
        <h2>What if a $40K reimbursement arrives 14 days late?</h2>
        <p className="sd-hero-sub">Compare baseline cash availability with a delayed reimbursement scenario.</p>
        <p className="sd-hero-secondary">{scenarioResearchQuestion}</p>
      </section>

      <section className="sd-compare-wrap" aria-label="Baseline versus delayed scenario">
        <article className="sd-result-card">
          <small>Baseline</small>
          <div className="sd-metric">
            <span>Cash before obligation</span>
            <strong>{formatUsd(result.baselineCashBeforeObligation)}</strong>
          </div>
          <div className="sd-metric">
            <span>Shortfall</span>
            <strong>{formatUsd(result.baselineShortfall)}</strong>
          </div>
        </article>

        <div className="sd-delta" aria-label="Timing difference">
          <span>Timing difference</span>
          <strong>{formatUsd(result.timingDifference)}</strong>
          <small>available before obligation</small>
        </div>

        <article className="sd-result-card sd-result-card-scenario">
          <small>14-day delay</small>
          <div className="sd-metric">
            <span>Cash before obligation</span>
            <strong>{formatUsd(result.scenarioCashBeforeObligation)}</strong>
          </div>
          <div className="sd-metric sd-metric-alert">
            <span>Shortfall</span>
            <strong>{formatUsd(result.scenarioShortfall)}</strong>
          </div>
          </article>
        </section>
        <ExplainerCard explainer={explainCashTimingComparison(result)} />

      <section className="od-panel sd-timeline-panel">
        <div className="od-panel-head">
          <strong>Receipt timeline</strong>
          <span>Dates relative to the obligation cutoff</span>
        </div>
        <div className="sd-rail" role="img" aria-label="Timeline from October 2 through October 19 showing Receipt B moving past the October 6 obligation">
          <div className="sd-rail-line" />
          <div className="sd-rail-points">
            <div className="sd-point">
              <i />
              <strong>Oct 2</strong>
              <span>Receipt A</span>
              <b>+$15K</b>
            </div>
            <div className="sd-point sd-point-baseline">
              <i />
              <strong>Oct 5</strong>
              <span>Receipt B</span>
              <b>+$40K</b>
              <em>Baseline arrival</em>
            </div>
            <div className="sd-point sd-point-cutoff">
              <i />
              <strong>Oct 6</strong>
              <span>Obligation</span>
              <b>$70K</b>
              <em>Cutoff</em>
            </div>
            <div className="sd-point sd-point-scenario">
              <i />
              <strong>Oct 19</strong>
              <span>Receipt B</span>
              <b>+$40K</b>
              <em>Scenario arrival</em>
            </div>
          </div>
          <div className="sd-delay-bridge" aria-hidden="true">
            <span>+14 DAYS</span>
          </div>
        </div>
      </section>
        <ExplainerCard explainer={explainCashTimingTimeline(result, delayedReimbursementFixture)} />

      <div className="sd-change-strip">
        <strong>Only assumption changed</strong>
        <span>Receipt B arrival</span>
        <b>Oct 5 → Oct 19</b>
        <em>+14 calendar days</em>
        <small>Amounts, opening cash, and obligation remain unchanged.</small>
      </div>

      <section className="od-panel sd-assumptions-compact">
        <div className="od-panel-head">
          <strong>Synthetic assumptions</strong>
        </div>
        <table>
          <tbody>
            <tr><th>Opening cash</th><td>{copy.openingCashLabel}</td></tr>
            <tr><th>Receipt A</th><td>$15,000 · Oct 2</td></tr>
            <tr><th>Receipt B</th><td>$40,000 · Oct 5</td></tr>
            <tr><th>Obligation</th><td>$70,000 · Oct 6</td></tr>
          </tbody>
        </table>
      </section>

      <section className="od-callout sd-callout-compact">
        <CircleHelp size={15} />
        <div>
          <strong>Cash before obligation is measured before subtracting the obligation.</strong>
          <p>Results are synthetic and deterministic, not a prediction of OSpectra cash.</p>
        </div>
      </section>

      <section className="sd-ontology-note">
        <code>Payment → contributes_to → CashCollections</code>
        <span>Ontology defines business relationships; the scenario calculation layer computes the result.</span>
      </section>
    </div>
  );
}
