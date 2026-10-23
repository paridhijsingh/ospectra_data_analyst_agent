'use client';

import { useMemo } from 'react';
import { CircleHelp } from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ExplainerCard } from '@/components/explainers/ExplainerCard';
import { explainGrowthTargetChart } from '@/lib/research-explainers';
import {
  formatAdmissionsRate,
  formatTargetState,
  formatUsd,
  formatUsdAxis,
  formatUsdMillions,
  formatYearsFromWeeks,
  getGrowthTargetRequiredAdmissions,
  getGrowthTargetScenarios,
  growthTargetReference,
  growthTargetResearchQuestion,
  toGrowthTargetChartPoints,
  type GrowthTargetScenario,
} from '@/lib/revenue-run-rate-target-demo';

const series = [
  { key: 'n1Annualized', name: '1 / week', color: '#a78bfa' },
  { key: 'n2Annualized', name: '2 / week (baseline)', color: '#6d3df5' },
  { key: 'n3Annualized', name: '3 / week', color: '#b33d30' },
] as const;

function stateClass(state: GrowthTargetScenario['analysis']['state']): string {
  if (state === 'REACHED') return 'gt-state-reached';
  if (state === 'UNREACHABLE_UNDER_ASSUMPTIONS') return 'gt-state-unreachable';
  return 'gt-state-horizon';
}

export function GrowthTargetScenarioDemo() {
  const required = useMemo(() => getGrowthTargetRequiredAdmissions(), []);
  const scenarios = useMemo(() => getGrowthTargetScenarios(), []);
  const chartPoints = useMemo(() => toGrowthTargetChartPoints(scenarios), [scenarios]);
  const baseline = scenarios.find((scenario) => scenario.isBaseline) ?? scenarios[1];
  const { weeksPerYear, horizonWeeks, targetAnnualizedRunRate } = growthTargetReference;
  const inputs = baseline.result.inputs;

  return (
    <div className="od-demo sd-demo gt-demo">
      <section className="sd-hero">
        <div className="sd-hero-tags">
          <span className="od-badge">Research prototype</span>
          <span className="sd-synthetic-banner">Target analysis</span>
          <span className="sd-synthetic-banner">Deterministic scenario</span>
          <span className="sd-synthetic-banner">Reference parameters — not OSpectra actuals</span>
        </div>
        <p className="rr-kicker">Growth Target v0.3</p>
        <h2>{growthTargetResearchQuestion}</h2>
        <p className="sd-hero-sub">
          {formatUsdMillions(targetAnnualizedRunRate)} is an annualized billed run-rate target, not cash collections,
          recognized accounting revenue, profit, a company forecast, or a recommendation.
        </p>
      </section>

      <section className="gt-target-strip" aria-label="Target summary">
        <div>
          <small>Target</small>
          <strong>{formatUsdMillions(targetAnnualizedRunRate)}</strong>
          <em>annualized billed run-rate</em>
        </div>
        <div>
          <small>Weekly equivalent</small>
          <strong>~{formatUsd(required.targetWeeklyRunRate)}/week</strong>
        </div>
        <div>
          <small>Reference horizon</small>
          <strong>{horizonWeeks} weeks</strong>
          <em>~{formatYearsFromWeeks(horizonWeeks, weeksPerYear)} years</em>
        </div>
        <div>
          <small>Required steady-state admissions</small>
          <strong>~{formatAdmissionsRate(required.nRequired)} starts/week</strong>
        </div>
      </section>

      <p className="od-path-note gt-requirement-note">
        With L, h, and p held at the reference values, approximately {formatAdmissionsRate(required.nRequired)} average
        weekly admissions supports a {formatUsdMillions(targetAnnualizedRunRate)} annualized steady-state billed run-rate.
        This is a steady-state mathematical requirement, not a claim that the business can operationally achieve this
        admission rate.
      </p>

      <section className="rr-case-grid" aria-label="Admissions scenarios versus target">
        {scenarios.map((scenario) => (
          <article key={scenario.key} className={`sd-result-card ${scenario.isBaseline ? 'sd-result-card-scenario' : ''}`}>
            <small>{scenario.isBaseline ? 'Reference baseline' : 'Sensitivity'}</small>
            <h3>{scenario.label}</h3>
            <div className="sd-metric">
              <span>Annualized plateau</span>
              <strong>{formatUsd(scenario.analysis.annualizedPlateau)}</strong>
            </div>
            <div className={`gt-state ${stateClass(scenario.analysis.state)}`}>
              {formatTargetState(scenario.analysis.state)}
            </div>
            {scenario.analysis.firstReachedWeek != null ? (
              <p className="gt-hit">
                First reached: week {scenario.analysis.firstReachedWeek}
                <em>~{formatYearsFromWeeks(scenario.analysis.firstReachedWeek, weeksPerYear)} years</em>
              </p>
            ) : (
              <p className="gt-hit">
                {scenario.analysis.state === 'UNREACHABLE_UNDER_ASSUMPTIONS'
                  ? 'The steady-state plateau remains below the target.'
                  : 'Does not reach the target during this horizon.'}
              </p>
            )}
          </article>
        ))}
      </section>

      <section className="od-panel rr-chart-panel">
        <div className="od-panel-head">
          <strong>Annualized billed run-rate vs target</strong>
          <span>Not cash · not accounting revenue</span>
        </div>
        <div
          className="rr-chart gt-chart"
          role="img"
          aria-label={`Annualized billed run-rate over four years for one, two, and three admissions per week against a ${formatUsdMillions(targetAnnualizedRunRate)} target`}
        >
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 680, height: 280 }}>
            <LineChart data={chartPoints} margin={{ top: 18, right: 16, bottom: 4, left: 8 }}>
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
              <YAxis axisLine={false} tickLine={false} width={52} tickFormatter={(value) => formatUsdAxis(Number(value))} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: '1px solid #e7e5ec' }}
                formatter={(value, name) => [formatUsd(Number(value)), String(name)]}
                labelFormatter={(year) => `Year ${Number(year).toFixed(2)}`}
              />
              <Legend />
              <ReferenceLine
                y={targetAnnualizedRunRate}
                stroke="#b33d30"
                strokeDasharray="5 4"
                label={{ value: `${formatUsdMillions(targetAnnualizedRunRate)} target`, fill: '#b33d30', fontSize: 11, position: 'insideTopRight' }}
              />
              <Line type="monotone" dataKey="n1Annualized" name={series[0].name} stroke={series[0].color} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="n2Annualized" name={series[1].name} stroke={series[1].color} strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="n3Annualized" name={series[2].name} stroke={series[2].color} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <ExplainerCard explainer={explainGrowthTargetChart(scenarios, targetAnnualizedRunRate, weeksPerYear)} />
      </section>

      <section className="od-panel">
        <div className="od-panel-head">
          <strong>Current model dials</strong>
          <span>One lever changed</span>
        </div>
        <div className="gt-dials">
          <div>
            <small>Admissions n</small>
            <strong>{inputs.n}/week</strong>
            <em>reference baseline</em>
          </div>
          <div>
            <small>Average client lifetime L</small>
            <strong>{inputs.L} weeks</strong>
          </div>
          <div>
            <small>Service hours h</small>
            <strong>{inputs.h} hrs/client/week</strong>
          </div>
          <div>
            <small>Billing rate p</small>
            <strong>{formatUsd(inputs.p)}/hour</strong>
          </div>
        </div>
        <p className="od-path-note">
          v0.3 changes admissions while holding the other three model parameters constant.
        </p>
        <div className="gt-future">
          <small>Future business scenarios — not modeled in this v0.3 comparison</small>
          <ul>
            <li>Retention / average lifetime</li>
            <li>Service intensity</li>
            <li>Billing rate</li>
            <li>Branch expansion</li>
            <li>Additional revenue streams</li>
          </ul>
        </div>
      </section>

      <section className="od-panel">
        <div className="od-panel-head">
          <strong>Target-state legend</strong>
          <span>Deterministic labels only</span>
        </div>
        <dl className="gt-legend">
          <div>
            <dt>Reached</dt>
            <dd>The modeled trajectory crosses the target within the selected horizon.</dd>
          </div>
          <div>
            <dt>Not reached within horizon</dt>
            <dd>The modeled plateau supports the target, but the returned trajectory does not reach it during the selected horizon.</dd>
          </div>
          <div>
            <dt>Unreachable under assumptions</dt>
            <dd>The modeled steady-state plateau is below the target.</dd>
          </div>
        </dl>
      </section>

      <section className="od-callout sd-callout-compact">
        <CircleHelp size={15} />
        <div>
          <strong>Scenario, not prediction. Target analysis is not a recommendation.</strong>
          <p>
            Reference parameters, not OSpectra actuals. Unlimited caregiver supply remains assumed. The model does not
            establish whether an admissions rate is operationally achievable.
          </p>
          <p>
            Annualized billed run-rate is not collected cash, accounting revenue, profit, or margin.
          </p>
        </div>
      </section>
    </div>
  );
}
