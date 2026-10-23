'use client';

import { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ExplainerCard } from '@/components/explainers/ExplainerCard';
import { explainCensusChart, explainRevenueRunRateChart } from '@/lib/research-explainers';
import {
  formatCensus,
  formatPercent,
  formatUsd,
  formatUsdCompact,
  getPaperRunRateScenarios,
  runRateResearchQuestion,
  toRunRateChartPoints,
} from '@/lib/revenue-run-rate-scenario-demo';

const series = [
  { key: 'n1', name: '1 / week', color: '#a78bfa' },
  { key: 'n2', name: '2 / week (baseline)', color: '#6d3df5' },
  { key: 'n3', name: '3 / week', color: '#b33d30' },
] as const;

export function RevenueRunRateScenarioDemo() {
  const scenarios = useMemo(() => getPaperRunRateScenarios(), []);
  const chartPoints = useMemo(() => toRunRateChartPoints(scenarios), [scenarios]);
  const baseline = scenarios.find((scenario) => scenario.isBaseline) ?? scenarios[1];
  const derived = baseline.result.derived;
  const inputs = baseline.result.inputs;

  return (
    <div className="od-demo sd-demo rr-demo">
      <section className="sd-hero">
        <div className="sd-hero-tags">
          <span className="od-badge">Research prototype</span>
          <span className="sd-synthetic-banner">Paper-based model</span>
          <span className="sd-synthetic-banner">Deterministic scenario</span>
          <span className="sd-synthetic-banner">Reference parameters — not OSpectra actuals</span>
        </div>
        <p className="rr-kicker">Revenue Run-Rate v0.2</p>
        <h2>{runRateResearchQuestion}</h2>
        <p className="sd-hero-sub">
          Compare long-run census and weekly billed run-rate when weekly admissions change and other
          parameters stay fixed.
        </p>
        <p className="sd-hero-secondary">
          Weekly billed run-rate, not cash collections, not an accounting forecast, and not a prediction
          of actual future revenue.
        </p>
      </section>

      <section className="rr-param-strip" aria-label="Held-constant reference parameters">
        <div>
          <small>Average client lifetime</small>
          <strong>{inputs.L} weeks</strong>
        </div>
        <div>
          <small>Service hours</small>
          <strong>{inputs.h} hrs/client/week</strong>
        </div>
        <div>
          <small>Billing rate</small>
          <strong>{formatUsd(inputs.p)}/hour</strong>
        </div>
        <div>
          <small>Revenue / client-week</small>
          <strong>{formatUsd(derived.revenuePerClientWeek)}</strong>
          <em>from engine</em>
        </div>
        <div>
          <small>Weekly attrition</small>
          <strong>~{formatPercent(derived.weeklyAttritionFraction)}</strong>
          <em>from engine</em>
        </div>
      </section>

      <section className="rr-case-grid" aria-label="Admissions sensitivity plateaus">
        {scenarios.map((scenario) => (
          <article key={scenario.key} className={`sd-result-card ${scenario.isBaseline ? 'sd-result-card-scenario' : ''}`}>
            <small>{scenario.isBaseline ? 'Baseline' : 'Sensitivity'}</small>
            <h3>{scenario.label}</h3>
            <div className="sd-metric">
              <span>Census plateau</span>
              <strong>{formatCensus(scenario.result.derived.censusPlateau)}</strong>
            </div>
            <div className="sd-metric">
              <span>Weekly revenue plateau</span>
              <strong>{formatUsd(scenario.result.derived.revenuePlateau)}/week</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="od-panel rr-chart-panel">
        <div className="od-panel-head">
          <strong>Revenue run-rate over time</strong>
          <span>Weekly billed run-rate · not cash</span>
        </div>
        <div className="rr-chart" role="img" aria-label="Weekly billed revenue run-rate over four years for one, two, and three admissions per week">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 680, height: 260 }}>
            <LineChart data={chartPoints} margin={{ top: 12, right: 16, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5ec" />
              <XAxis
                dataKey="year"
                type="number"
                domain={[0, 4]}
                ticks={[0, 1, 2, 3, 4]}
                axisLine={false}
                tickLine={false}
                tickFormatter={(year) => (year === 0 ? 'Start' : `${year}y`)}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={56}
                tickFormatter={(value) => formatUsdCompact(Number(value))}
              />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: '1px solid #e7e5ec' }}
                formatter={(value, name) => [`${formatUsd(Number(value))}/week`, String(name)]}
                labelFormatter={(year) => `Year ${Number(year).toFixed(2)}`}
              />
              <Legend />
              <Line type="monotone" dataKey="n1Revenue" name={series[0].name} stroke={series[0].color} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="n2Revenue" name={series[1].name} stroke={series[1].color} strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="n3Revenue" name={series[2].name} stroke={series[2].color} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <ExplainerCard explainer={explainRevenueRunRateChart(scenarios)} />
      </section>

      <section className="od-panel rr-chart-panel">
        <div className="od-panel-head">
          <strong>Active client census over time</strong>
          <span>Same engine trajectories</span>
        </div>
        <div className="rr-chart" role="img" aria-label="Active client census over four years for one, two, and three admissions per week">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 680, height: 240 }}>
            <LineChart data={chartPoints} margin={{ top: 12, right: 16, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5ec" />
              <XAxis
                dataKey="year"
                type="number"
                domain={[0, 4]}
                ticks={[0, 1, 2, 3, 4]}
                axisLine={false}
                tickLine={false}
                tickFormatter={(year) => (year === 0 ? 'Start' : `${year}y`)}
              />
              <YAxis axisLine={false} tickLine={false} width={40} tickFormatter={(value) => formatCensus(Number(value))} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: '1px solid #e7e5ec' }}
                formatter={(value, name) => [formatCensus(Number(value)), String(name)]}
                labelFormatter={(year) => `Year ${Number(year).toFixed(2)}`}
              />
              <Legend />
              <Line type="monotone" dataKey="n1Census" name={series[0].name} stroke={series[0].color} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="n2Census" name={series[1].name} stroke={series[1].color} strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="n3Census" name={series[2].name} stroke={series[2].color} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <ExplainerCard explainer={explainCensusChart(scenarios)} />
      </section>

      <section className="od-panel">
        <div className="od-panel-head">
          <strong>How the model works</strong>
          <span>Constant-parameter inception</span>
        </div>
        <ol className="rr-model-steps">
          <li>Admissions add clients each week at a constant rate n.</li>
          <li>A constant fraction of active clients exits each week: δ = 1 / L.</li>
          <li>Census follows C(t+1) = C(t)(1 − δ) + n and approaches a plateau.</li>
          <li>Weekly billed run-rate follows the census: R(t) = C(t) × h × p.</li>
          <li>With L, h, and p held constant, changing n changes the plateau proportionally.</li>
        </ol>
        <div className="rr-formulas">
          <code>δ = 1 / L</code>
          <code>C(t+1) = C(t)(1 − δ) + n</code>
          <code>R(t) = C(t) × h × p</code>
          <code>C* = n × L</code>
          <code>R* = n × h × p × L</code>
        </div>
      </section>

      <section className="rr-bounds">
        <article className="od-panel">
          <div className="od-panel-head">
            <strong>Source assumptions</strong>
            <span>Held in v0.2</span>
          </div>
          <ul>
            <li>Constant admissions</li>
            <li>Constant weekly attrition</li>
            <li>Uniform service intensity</li>
            <li>Unlimited caregiver supply</li>
          </ul>
        </article>
        <article className="od-panel rr-not-modeled">
          <div className="od-panel-head">
            <strong>Not modeled in v0.2</strong>
            <span>Separate from Cash Timing</span>
          </div>
          <ul>
            <li>Reimbursement timing</li>
            <li>Cash collections</li>
            <li>Payroll</li>
            <li>AR / AP</li>
            <li>Denials</li>
            <li>Authorization exposure</li>
            <li>Caregiver capacity constraints</li>
            <li>Profit / margin</li>
          </ul>
        </article>
      </section>

      <section className="od-panel rr-provenance">
        <div className="od-panel-head">
          <strong>Paper provenance</strong>
          <span>Research validation source</span>
        </div>
        <p>
          <b>Model</b>
          Forecasting Homecare Revenue: A Run-Rate Model Linking Admissions and Attrition
        </p>
        <p>
          <b>Author</b>
          E. Ignacio Céspedes
        </p>
        <p>
          <b>Reference parameters</b>
          n = 1 / 2 / 3 · L = {inputs.L} weeks · h = {inputs.h} hrs/client/week · p = {formatUsd(inputs.p)}/hr ·
          horizon = {inputs.horizonWeeks} weeks
        </p>
        <p className="od-path-note">
          This paper is a research reference, not an OSpectra model. These parameters were not calibrated
          on OSpectra actuals, and the author did not validate OSpectra data in this prototype.
        </p>
      </section>
    </div>
  );
}
