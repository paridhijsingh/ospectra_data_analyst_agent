'use client';

import { useMemo, useState } from 'react';
import { CircleHelp } from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ExplainerCard } from '@/components/explainers/ExplainerCard';
import { explainGrowthTargetChart } from '@/lib/research-explainers';
import {
  analyzeBranchCompanyTarget,
  applyCompanyRevenueCosts,
  branchScenarioDisclaimer,
  interpretBranchExpansion,
  projectCompanyBranches,
} from '@/lib/revenue-run-rate-branch';
import {
  applyRunRateCosts,
  costAssumptionDisclaimer,
  defaultRunRateCostAssumptions,
  directAndVariableExceedRevenue,
  interpretModeledContribution,
  type RunRateCostResult,
} from '@/lib/revenue-run-rate-cost';
import { projectRevenueRunRate, type RevenueRunRateResult } from '@/lib/revenue-run-rate-scenario';
import { analyzeRunRateTarget, requiredSteadyStateAdmissions } from '@/lib/revenue-run-rate-target';
import {
  formatAdmissionsRate,
  formatTargetState,
  formatUsd,
  formatUsdAxis,
  formatUsdMillions,
  formatYearsFromWeeks,
  growthTargetReference,
  type GrowthTargetScenario,
} from '@/lib/revenue-run-rate-target-demo';

const WEEKS_PER_YEAR = growthTargetReference.weeksPerYear;

const TARGET_OPTIONS = [
  { amount: 5_000_000, label: '$5M' },
  { amount: 10_000_000, label: '$10M' },
] as const;

const HORIZON_OPTIONS = [
  { weeks: 52, years: 1, label: '1 year' },
  { weeks: 104, years: 2, label: '2 years' },
  { weeks: 156, years: 3, label: '3 years' },
  { weeks: 208, years: 4, label: '4 years' },
] as const;

const COMPARISON_ADMISSIONS = [
  { n: 1, key: 'n1', label: '1 admission/week' },
  { n: 2, key: 'n2', label: '2 admissions/week' },
  { n: 3, key: 'n3', label: '3 admissions/week' },
] as const;

const ADMISSIONS_MIN = 0.5;
const ADMISSIONS_MAX = 5;
const ADMISSIONS_STEP = 0.1;
const LIFETIME_MIN = 13;
const LIFETIME_MAX = 208;
const HOURS_MIN = 10;
const HOURS_MAX = 40;
const RATE_MIN = 25;
const RATE_MAX = 50;
const DIRECT_RATIO_MIN = 0;
const DIRECT_RATIO_MAX = 1;
const VARIABLE_RATIO_MIN = 0;
const VARIABLE_RATIO_MAX = 0.3;
const FIXED_COST_MIN = 0;
const FIXED_COST_MAX = 100_000;
const FIXED_COST_STEP = 500;
const BRANCH_CAPACITY_MIN = 10;
const BRANCH_CAPACITY_MAX = 200;

const comparisonSeries = [
  { key: 'n1Annualized', n: 1, name: '1 / week', color: '#a78bfa' },
  { key: 'n2Annualized', n: 2, name: '2 / week', color: '#8b6cf5' },
  { key: 'n3Annualized', n: 3, name: '3 / week', color: '#b33d30' },
] as const;

function stateClass(state: GrowthTargetScenario['analysis']['state']): string {
  if (state === 'REACHED') return 'gt-state-reached';
  if (state === 'UNREACHABLE_UNDER_ASSUMPTIONS') return 'gt-state-unreachable';
  return 'gt-state-horizon';
}

function formatWeeklyChurn(lifetimeWeeks: number): string {
  return `${((1 / lifetimeWeeks) * 100).toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}%`;
}

function formatRatioPercent(ratio: number, fractionDigits = 0): string {
  return `${(ratio * 100).toLocaleString('en-US', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  })}%`;
}

function formatMargin(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return formatRatioPercent(value, 1);
}

function contributionClass(value: number): string {
  if (value > 0) return 'gt-econ-positive';
  if (value < 0) return 'gt-econ-negative';
  return '';
}

function clampAdmissions(value: number): number {
  if (!Number.isFinite(value)) return growthTargetReference.referenceAdmissions;
  return Math.min(ADMISSIONS_MAX, Math.max(ADMISSIONS_MIN, value));
}

function clampLifetime(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return growthTargetReference.L;
  return Math.min(LIFETIME_MAX, Math.max(LIFETIME_MIN, Math.round(value)));
}

function clampHours(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return growthTargetReference.h;
  return Math.min(HOURS_MAX, Math.max(HOURS_MIN, Math.round(value)));
}

function clampRate(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return growthTargetReference.p;
  return Math.min(RATE_MAX, Math.max(RATE_MIN, Math.round(value)));
}

function clampRatio(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function clampFixedCost(value: number): number {
  if (!Number.isFinite(value) || value < 0) return defaultRunRateCostAssumptions.fixedOperatingCostPerWeek;
  return Math.min(FIXED_COST_MAX, Math.max(FIXED_COST_MIN, value));
}

function clampOpeningWeek(value: number, horizon: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(0, horizon), Math.max(0, Math.round(value)));
}

function clampCapacity(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 100;
  return Math.min(BRANCH_CAPACITY_MAX, Math.max(BRANCH_CAPACITY_MIN, Math.round(value)));
}

function buildScenario(
  n: number,
  key: string,
  label: string,
  isBaseline: boolean,
  params: {
    L: number;
    h: number;
    p: number;
    horizonWeeks: number;
    targetAnnualizedRunRate: number;
  },
): GrowthTargetScenario {
  const result = projectRevenueRunRate({
    n,
    L: params.L,
    h: params.h,
    p: params.p,
    horizonWeeks: params.horizonWeeks,
  });
  return {
    n,
    key,
    label,
    isBaseline,
    result,
    analysis: analyzeRunRateTarget({
      result,
      targetAnnualizedRunRate: params.targetAnnualizedRunRate,
      weeksPerYear: WEEKS_PER_YEAR,
    }),
  };
}

function toInteractiveChartPoints(
  current: RevenueRunRateResult,
  comparisons: readonly GrowthTargetScenario[],
  targetAnnualizedRunRate: number,
): Array<{
  t: number;
  year: number;
  currentAnnualized: number;
  n1Annualized: number;
  n2Annualized: number;
  n3Annualized: number;
  target: number;
}> {
  const byKey = Object.fromEntries(comparisons.map((scenario) => [scenario.key, scenario.result.trajectory]));
  const step = 4;
  const points: Array<{
    t: number;
    year: number;
    currentAnnualized: number;
    n1Annualized: number;
    n2Annualized: number;
    n3Annualized: number;
    target: number;
  }> = [];
  const push = (index: number) => {
    const week = current.trajectory[index];
    points.push({
      t: week.t,
      year: week.t / WEEKS_PER_YEAR,
      currentAnnualized: week.revenue * WEEKS_PER_YEAR,
      n1Annualized: (byKey.n1?.[index]?.revenue ?? 0) * WEEKS_PER_YEAR,
      n2Annualized: (byKey.n2?.[index]?.revenue ?? 0) * WEEKS_PER_YEAR,
      n3Annualized: (byKey.n3?.[index]?.revenue ?? 0) * WEEKS_PER_YEAR,
      target: targetAnnualizedRunRate,
    });
  };
  for (let index = 0; index < current.trajectory.length; index += step) push(index);
  const lastIndex = current.trajectory.length - 1;
  if (lastIndex >= 0 && lastIndex % step !== 0) push(lastIndex);
  return points;
}

function toCostChartPoints(costs: Pick<RunRateCostResult, 'trajectory'> | { trajectory: RunRateCostResult['trajectory'] }): Array<{
  t: number;
  year: number;
  weeklyRevenue: number;
  totalModeledCost: number;
  modeledContribution: number;
}> {
  const step = 4;
  const points: Array<{
    t: number;
    year: number;
    weeklyRevenue: number;
    totalModeledCost: number;
    modeledContribution: number;
  }> = [];
  const push = (index: number) => {
    const week = costs.trajectory[index];
    points.push({
      t: week.t,
      year: week.t / WEEKS_PER_YEAR,
      weeklyRevenue: week.weeklyRevenue,
      totalModeledCost: week.totalModeledCost,
      modeledContribution: week.modeledContribution,
    });
  };
  for (let index = 0; index < costs.trajectory.length; index += step) push(index);
  const lastIndex = costs.trajectory.length - 1;
  if (lastIndex >= 0 && lastIndex % step !== 0) push(lastIndex);
  return points;
}

export function GrowthTargetScenarioDemo() {
  const [targetAnnualizedRunRate, setTargetAnnualizedRunRate] = useState<number>(
    growthTargetReference.targetAnnualizedRunRate,
  );
  const [n, setN] = useState<number>(growthTargetReference.referenceAdmissions);
  const [lifetimeWeeks, setLifetimeWeeks] = useState<number>(growthTargetReference.L);
  const [serviceHours, setServiceHours] = useState<number>(growthTargetReference.h);
  const [billingRate, setBillingRate] = useState<number>(growthTargetReference.p);
  const [horizonWeeks, setHorizonWeeks] = useState<number>(growthTargetReference.horizonWeeks);
  const [directServiceCostRatio, setDirectServiceCostRatio] = useState<number>(
    defaultRunRateCostAssumptions.directServiceCostRatio,
  );
  const [variableOperatingCostRatio, setVariableOperatingCostRatio] = useState<number>(
    defaultRunRateCostAssumptions.variableOperatingCostRatio,
  );
  const [fixedOperatingCostPerWeek, setFixedOperatingCostPerWeek] = useState<number>(
    defaultRunRateCostAssumptions.fixedOperatingCostPerWeek,
  );
  const [branchExpansionEnabled, setBranchExpansionEnabled] = useState(true);
  const [branch1OpeningWeek, setBranch1OpeningWeek] = useState(0);
  const [branch1Capacity, setBranch1Capacity] = useState(100);
  const [branch2OpeningWeek, setBranch2OpeningWeek] = useState(52);
  const [branch2Admissions, setBranch2Admissions] = useState(2);
  const [branch2Lifetime, setBranch2Lifetime] = useState(52);
  const [branch2Capacity, setBranch2Capacity] = useState(100);

  const modelParams = useMemo(
    () => ({
      L: lifetimeWeeks,
      h: serviceHours,
      p: billingRate,
      horizonWeeks,
      targetAnnualizedRunRate,
    }),
    [lifetimeWeeks, serviceHours, billingRate, horizonWeeks, targetAnnualizedRunRate],
  );

  const current = useMemo(
    () => buildScenario(n, 'current', 'Current scenario', true, modelParams),
    [n, modelParams],
  );

  const comparisonScenarios = useMemo(
    () =>
      COMPARISON_ADMISSIONS.map((item) =>
        buildScenario(item.n, item.key, item.label, Math.abs(item.n - n) < 1e-9, modelParams),
      ),
    [n, modelParams],
  );

  const required = useMemo(
    () =>
      requiredSteadyStateAdmissions({
        L: lifetimeWeeks,
        h: serviceHours,
        p: billingRate,
        targetAnnualizedRunRate,
        weeksPerYear: WEEKS_PER_YEAR,
      }),
    [lifetimeWeeks, serviceHours, billingRate, targetAnnualizedRunRate],
  );

  const costAssumptions = useMemo(
    () => ({
      directServiceCostRatio,
      variableOperatingCostRatio,
      fixedOperatingCostPerWeek,
    }),
    [directServiceCostRatio, variableOperatingCostRatio, fixedOperatingCostPerWeek],
  );

  const singleConfigCosts = useMemo(
    () => applyRunRateCosts(current.result, costAssumptions),
    [current, costAssumptions],
  );

  const company = useMemo(() => {
    const shared = {
      h: serviceHours,
      p: billingRate,
      horizonWeeks,
      weeksPerYear: WEEKS_PER_YEAR,
    };
    return projectCompanyBranches(
      [
        {
          id: 'branch-1',
          name: 'Branch 1',
          openingWeek: clampOpeningWeek(branch1OpeningWeek, horizonWeeks),
          weeklyAdmissions: n,
          clientLifetimeWeeks: lifetimeWeeks,
          maxActiveClients: branch1Capacity,
        },
        {
          id: 'branch-2',
          name: 'Branch 2',
          openingWeek: clampOpeningWeek(branch2OpeningWeek, horizonWeeks),
          weeklyAdmissions: branch2Admissions,
          clientLifetimeWeeks: branch2Lifetime,
          maxActiveClients: branch2Capacity,
        },
      ],
      shared,
    );
  }, [
    n,
    lifetimeWeeks,
    serviceHours,
    billingRate,
    horizonWeeks,
    branch1OpeningWeek,
    branch1Capacity,
    branch2OpeningWeek,
    branch2Admissions,
    branch2Lifetime,
    branch2Capacity,
  ]);

  const companyAnalysis = useMemo(
    () =>
      analyzeBranchCompanyTarget({
        company,
        targetAnnualizedRunRate,
        weeksPerYear: WEEKS_PER_YEAR,
      }),
    [company, targetAnnualizedRunRate],
  );

  const branch1OnlyAnalysis = useMemo(
    () =>
      analyzeBranchCompanyTarget({
        company: projectCompanyBranches([company.branches[0].input], {
          h: serviceHours,
          p: billingRate,
          horizonWeeks,
          weeksPerYear: WEEKS_PER_YEAR,
        }),
        targetAnnualizedRunRate,
        weeksPerYear: WEEKS_PER_YEAR,
      }),
    [company, serviceHours, billingRate, horizonWeeks, targetAnnualizedRunRate],
  );

  const companyCosts = useMemo(
    () => applyCompanyRevenueCosts(company, costAssumptions),
    [company, costAssumptions],
  );

  const costs = branchExpansionEnabled ? companyCosts : singleConfigCosts;
  const activeAnalysis = branchExpansionEnabled ? companyAnalysis : current.analysis;
  const horizonEconomics = costs.atHorizon;
  const annualizedAtHorizon = horizonEconomics.weeklyRevenue * WEEKS_PER_YEAR;
  const interpretation = branchExpansionEnabled
    ? interpretBranchExpansion({
        companyState: companyAnalysis.state,
        branch1State: branch1OnlyAnalysis.state,
        firstReachedWeek: companyAnalysis.firstReachedWeek,
        branch2OpeningWeek,
        modeledContribution: horizonEconomics.modeledContribution,
      })
    : interpretModeledContribution({
        modeledContribution: horizonEconomics.modeledContribution,
        targetReached: current.analysis.state === 'REACHED',
      });

  const companyHorizon = company.trajectory[company.trajectory.length - 1];
  const branchChartPoints = useMemo(() => {
    const step = 4;
    const points: Array<{
      t: number;
      year: number;
      branch1Annualized: number;
      branch2Annualized: number;
      companyAnnualized: number;
      target: number;
    }> = [];
    const push = (index: number) => {
      const week = company.trajectory[index];
      points.push({
        t: week.t,
        year: week.t / WEEKS_PER_YEAR,
        branch1Annualized: (week.branchWeeklyRevenue['branch-1'] ?? 0) * WEEKS_PER_YEAR,
        branch2Annualized: (week.branchWeeklyRevenue['branch-2'] ?? 0) * WEEKS_PER_YEAR,
        companyAnnualized: week.annualizedRunRate,
        target: targetAnnualizedRunRate,
      });
    };
    for (let index = 0; index < company.trajectory.length; index += step) push(index);
    const lastIndex = company.trajectory.length - 1;
    if (lastIndex >= 0 && lastIndex % step !== 0) push(lastIndex);
    return points;
  }, [company, targetAnnualizedRunRate]);

  const chartPoints = useMemo(
    () => toInteractiveChartPoints(current.result, comparisonScenarios, targetAnnualizedRunRate),
    [current, comparisonScenarios, targetAnnualizedRunRate],
  );
  const costChartPoints = useMemo(() => toCostChartPoints(costs), [costs]);

  const horizonYears = horizonWeeks / WEEKS_PER_YEAR;
  const yearTicks = [
    0,
    ...HORIZON_OPTIONS.filter((option) => option.years <= horizonYears).map((option) => option.years),
  ];
  const weeklyChurn = formatWeeklyChurn(lifetimeWeeks);
  const visibleComparisonSeries = comparisonSeries.filter((series) => Math.abs(series.n - n) > 1e-9);
  const firstReachedWeek = activeAnalysis.firstReachedWeek;
  const showCrossingDot = activeAnalysis.state === 'REACHED' && firstReachedWeek != null;
  const crossingYear = showCrossingDot ? firstReachedWeek / WEEKS_PER_YEAR : null;
  const targetLabel =
    TARGET_OPTIONS.find((option) => option.amount === targetAnnualizedRunRate)?.label ??
    formatUsdMillions(targetAnnualizedRunRate);
  const crossingLabel =
    showCrossingDot && firstReachedWeek != null
      ? `reaches ${targetLabel} — week ${firstReachedWeek}`
      : null;
  const ratiosExceedRevenue = directAndVariableExceedRevenue(costAssumptions);

  return (
    <div className="od-demo sd-demo gt-demo">
      <section className="sd-hero">
        <div className="sd-hero-tags">
          <span className="od-badge">Research prototype</span>
          <span className="sd-synthetic-banner">Target analysis</span>
          <span className="sd-synthetic-banner">Deterministic scenario</span>
          <span className="sd-synthetic-banner">Reference parameters — not OSpectra actuals</span>
        </div>
        <p className="rr-kicker">Growth Target v0.6</p>
        <h2>
          What would it take to reach a {formatUsdMillions(targetAnnualizedRunRate)} annualized billed revenue run-rate?
        </h2>
        <p className="sd-hero-sub">
          {formatUsdMillions(targetAnnualizedRunRate)} is an annualized billed run-rate target, not cash collections,
          recognized accounting revenue, profit, a company forecast, or a recommendation. Modeled contribution is not
          accounting profit. Branch expansion is a scenario model, not an OSpectra branch forecast.
        </p>
      </section>

      <section className="gt-target-strip" aria-label="Current scenario result" aria-live="polite">
        <div>
          <small>Annualized billed revenue run-rate target</small>
          <strong>{formatUsdMillions(targetAnnualizedRunRate)}</strong>
          <em>not cash, accounting revenue, or profit</em>
        </div>
        <div>
          <small>Weekly admissions</small>
          <strong>{formatAdmissionsRate(n)}/week</strong>
          <em>scenario assumption n</em>
        </div>
        <div>
          <small>Weekly churn</small>
          <strong>~{weeklyChurn}</strong>
          <em>δ = 1 / L</em>
        </div>
        <div>
          <small>Average client lifetime</small>
          <strong>{lifetimeWeeks} weeks</strong>
          <em>linked to weekly churn</em>
        </div>
        <div>
          <small>Projection horizon</small>
          <strong>{horizonWeeks} weeks</strong>
          <em>~{formatYearsFromWeeks(horizonWeeks, WEEKS_PER_YEAR)} years</em>
        </div>
        <div>
          <small>Annualized modeled plateau</small>
          <strong>{formatUsd(activeAnalysis.annualizedPlateau)}</strong>
          <em>
            {branchExpansionEnabled
              ? `${formatUsd(company.derived.companyWeeklyRevenuePlateau)}/week company billed`
              : `${formatUsd(current.result.derived.revenuePlateau)}/week billed`}
          </em>
        </div>
        <div>
          <small>Target state</small>
          <strong className={`gt-state ${stateClass(activeAnalysis.state)}`}>
            {formatTargetState(activeAnalysis.state)}
          </strong>
          {branchExpansionEnabled ? <em>total company annualized billed run-rate</em> : null}
        </div>
        <div>
          <small>First reached week</small>
          <strong>{firstReachedWeek != null ? `Week ${firstReachedWeek}` : '—'}</strong>
          <em>
            {firstReachedWeek != null
              ? `~${formatYearsFromWeeks(firstReachedWeek, WEEKS_PER_YEAR)} years`
              : activeAnalysis.state === 'UNREACHABLE_UNDER_ASSUMPTIONS'
                ? 'Plateau is below the target'
                : 'Not within this horizon'}
          </em>
        </div>
        <div>
          <small>Approximate years to target</small>
          <strong>
            {firstReachedWeek != null ? `~${formatYearsFromWeeks(firstReachedWeek, WEEKS_PER_YEAR)}` : '—'}
          </strong>
        </div>
        {branchExpansionEnabled ? (
          <>
            <div>
              <small>Total active clients</small>
              <strong>{companyHorizon.totalCensus.toLocaleString('en-US', { maximumFractionDigits: 1 })}</strong>
              <em>end of horizon</em>
            </div>
            <div>
              <small>Branch 1 active clients</small>
              <strong>
                {(companyHorizon.branchCensus['branch-1'] ?? 0).toLocaleString('en-US', { maximumFractionDigits: 1 })}
              </strong>
            </div>
            <div>
              <small>Branch 2 active clients</small>
              <strong>
                {(companyHorizon.branchCensus['branch-2'] ?? 0).toLocaleString('en-US', { maximumFractionDigits: 1 })}
              </strong>
            </div>
            <div>
              <small>Branch 2 opening week</small>
              <strong>Week {branch2OpeningWeek}</strong>
            </div>
          </>
        ) : (
          <div>
            <small>Required steady-state admissions</small>
            <strong>~{formatAdmissionsRate(required.nRequired)}/week</strong>
            <em>mathematical requirement, not a recommendation</em>
          </div>
        )}
      </section>

      <section className="gt-target-strip" aria-label="Modeled weekly economics at horizon" aria-live="polite">
        <div>
          <small>Weekly billed revenue at horizon</small>
          <strong>{formatUsd(horizonEconomics.weeklyRevenue)}</strong>
          <em>week {horizonEconomics.t}</em>
        </div>
        <div>
          <small>Annualized billed run-rate</small>
          <strong>{formatUsd(annualizedAtHorizon)}</strong>
          <em>weekly billed × {WEEKS_PER_YEAR}</em>
        </div>
        <div>
          <small>Direct service cost</small>
          <strong>{formatUsd(horizonEconomics.directServiceCost)}</strong>
          <em>{formatRatioPercent(directServiceCostRatio)} of billed revenue</em>
        </div>
        <div>
          <small>Variable back-office cost</small>
          <strong>{formatUsd(horizonEconomics.variableOperatingCost)}</strong>
          <em>{formatRatioPercent(variableOperatingCostRatio)} of billed revenue</em>
        </div>
        <div>
          <small>Fixed operating cost</small>
          <strong>{formatUsd(fixedOperatingCostPerWeek)}/week</strong>
          <em>does not scale with revenue</em>
        </div>
        <div>
          <small>Total modeled weekly cost</small>
          <strong>{formatUsd(horizonEconomics.totalModeledCost)}</strong>
        </div>
        <div>
          <small>Modeled weekly contribution</small>
          <strong className={contributionClass(horizonEconomics.modeledContribution)}>
            {formatUsd(horizonEconomics.modeledContribution)}
          </strong>
          <em>not accounting profit</em>
        </div>
        <div>
          <small>Modeled contribution margin</small>
          <strong className={contributionClass(horizonEconomics.modeledContribution)}>
            {formatMargin(horizonEconomics.contributionMargin)}
          </strong>
          <em>contribution / weekly billed revenue</em>
        </div>
      </section>
      <p className="gt-cost-disclaimer">{costAssumptionDisclaimer}</p>

      {branchExpansionEnabled ? (
        <p className="od-path-note gt-requirement-note">
          Revenue plateaus when admissions and attrition reach equilibrium under a fixed operating configuration. Branch
          expansion adds new operating capacity and creates another growth phase. The single-configuration model was not
          wrong; it modeled one unchanged operating unit.
        </p>
      ) : (
        <p className="od-path-note gt-requirement-note">
          With L, h, and p at the current reference values, approximately {formatAdmissionsRate(required.nRequired)} average
          weekly admissions supports a {formatUsdMillions(targetAnnualizedRunRate)} annualized steady-state billed run-rate.
          This is a steady-state mathematical requirement, not a claim that the business can operationally achieve this
          admission rate.
        </p>
      )}

      {branchExpansionEnabled ? null : (
      <section className="rr-case-grid" aria-label="Admissions scenarios versus target">
        {comparisonScenarios.map((scenario) => (
          <article key={scenario.key} className={`sd-result-card ${scenario.isBaseline ? 'sd-result-card-scenario' : ''}`}>
            <small>{scenario.isBaseline ? 'Matches current n' : 'Sensitivity'}</small>
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
                <em>~{formatYearsFromWeeks(scenario.analysis.firstReachedWeek, WEEKS_PER_YEAR)} years</em>
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
      )}

      <section className="od-panel rr-chart-panel">
        <div className="od-panel-head">
          <strong>Annualized billed run-rate vs target</strong>
          <span>{branchExpansionEnabled ? 'Company total · not a forecast' : 'Not cash · not accounting revenue'}</span>
        </div>
        <div
          className="rr-chart gt-chart"
          role="img"
          aria-label={
            branchExpansionEnabled
              ? `Branch 1, Branch 2, and total company annualized billed run-rate against a ${formatUsdMillions(targetAnnualizedRunRate)} target`
              : `Current scenario annualized billed run-rate against a ${formatUsdMillions(targetAnnualizedRunRate)} target over ${horizonWeeks} weeks`
          }
        >
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 680, height: 280 }}>
            {branchExpansionEnabled ? (
              <LineChart data={branchChartPoints} margin={{ top: 18, right: 16, bottom: 4, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5ec" />
                <XAxis
                  dataKey="year"
                  type="number"
                  domain={[0, horizonYears]}
                  ticks={yearTicks}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(year) => (year === 0 ? 'Start' : `${year}y`)}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={52}
                  domain={[0, (dataMax: number) => Math.max(dataMax, targetAnnualizedRunRate) * 1.08]}
                  tickFormatter={(value) => formatUsdAxis(Number(value))}
                />
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
                  label={{
                    value: `${formatUsdMillions(targetAnnualizedRunRate)} target`,
                    fill: '#b33d30',
                    fontSize: 11,
                    position: 'insideTopRight',
                  }}
                />
                <ReferenceLine
                  x={branch2OpeningWeek / WEEKS_PER_YEAR}
                  stroke="#918b9c"
                  strokeDasharray="3 3"
                  label={{ value: 'Branch 2 opens', fill: '#746b82', fontSize: 11, position: 'insideTopLeft' }}
                />
                <Line type="monotone" dataKey="branch1Annualized" name="Branch 1" stroke="#a78bfa" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="branch2Annualized" name="Branch 2" stroke="#b33d30" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="companyAnnualized" name="Total company" stroke="#6d3df5" strokeWidth={3} dot={false} />
                {showCrossingDot && crossingYear != null && crossingLabel ? (
                  <ReferenceDot
                    x={crossingYear}
                    y={targetAnnualizedRunRate}
                    r={5}
                    fill="#6d3df5"
                    stroke="#fff"
                    strokeWidth={2}
                    label={{
                      value: crossingLabel,
                      position: 'top',
                      fill: '#4e367f',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  />
                ) : null}
              </LineChart>
            ) : (
              <LineChart data={chartPoints} margin={{ top: 18, right: 16, bottom: 4, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5ec" />
                <XAxis
                  dataKey="year"
                  type="number"
                  domain={[0, horizonYears]}
                  ticks={yearTicks}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(year) => (year === 0 ? 'Start' : `${year}y`)}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={52}
                  domain={[0, (dataMax: number) => Math.max(dataMax, targetAnnualizedRunRate) * 1.08]}
                  tickFormatter={(value) => formatUsdAxis(Number(value))}
                />
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
                  label={{
                    value: `${formatUsdMillions(targetAnnualizedRunRate)} target`,
                    fill: '#b33d30',
                    fontSize: 11,
                    position: 'insideTopRight',
                  }}
                />
                {visibleComparisonSeries.map((series) => (
                  <Line
                    key={series.key}
                    type="monotone"
                    dataKey={series.key}
                    name={series.name}
                    stroke={series.color}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="currentAnnualized"
                  name={`Current (${formatAdmissionsRate(n)} / week)`}
                  stroke="#6d3df5"
                  strokeWidth={3}
                  dot={false}
                />
                {showCrossingDot && crossingYear != null && crossingLabel ? (
                  <ReferenceDot
                    x={crossingYear}
                    y={targetAnnualizedRunRate}
                    r={5}
                    fill="#6d3df5"
                    stroke="#fff"
                    strokeWidth={2}
                    label={{
                      value: crossingLabel,
                      position: 'top',
                      fill: '#4e367f',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  />
                ) : null}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
        {branchExpansionEnabled ? (
          <p className="gt-cost-disclaimer">{branchScenarioDisclaimer}</p>
        ) : (
          <ExplainerCard explainer={explainGrowthTargetChart([current], targetAnnualizedRunRate, WEEKS_PER_YEAR)} />
        )}
      </section>

      <section className="od-panel rr-chart-panel">
        <div className="od-panel-head">
          <strong>Weekly revenue, modeled cost, and contribution</strong>
          <span>Weekly dollars · not the annualized target chart</span>
        </div>
        <div
          className="rr-chart gt-cost-chart"
          aria-label="Weekly billed revenue, total modeled cost, and modeled contribution over the selected horizon"
        >
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 680, height: 220 }}>
            <LineChart data={costChartPoints} margin={{ top: 18, right: 16, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5ec" />
              <XAxis
                dataKey="year"
                type="number"
                domain={[0, horizonYears]}
                ticks={yearTicks}
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
              <ReferenceLine y={0} stroke="#c9c4d2" />
              <Line type="monotone" dataKey="weeklyRevenue" name="Weekly billed revenue" stroke="#6d3df5" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="totalModeledCost" name="Total modeled cost" stroke="#b33d30" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="modeledContribution" name="Modeled contribution" stroke="#4e367f" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="od-panel">
        <div className="od-panel-head">
          <strong>Modeled weekly economics</strong>
          <span>At week {horizonEconomics.t} · not accounting profit</span>
        </div>
        <p className="gt-cost-disclaimer">{costAssumptionDisclaimer}</p>
        {ratiosExceedRevenue ? (
          <p className="gt-cost-warn">
            Modeled variable/direct costs already exceed billed revenue before fixed cost.
          </p>
        ) : null}
        <dl className="gt-econ">
          <div>
            <dt>Billed revenue</dt>
            <dd>{formatUsd(horizonEconomics.weeklyRevenue)}</dd>
          </div>
          <div>
            <dt>Direct service cost</dt>
            <dd>
              {formatUsd(horizonEconomics.directServiceCost)}
              <em>{formatRatioPercent(directServiceCostRatio)} assumption</em>
            </dd>
          </div>
          <div>
            <dt>Variable back-office cost</dt>
            <dd>
              {formatUsd(horizonEconomics.variableOperatingCost)}
              <em>{formatRatioPercent(variableOperatingCostRatio)} assumption</em>
            </dd>
          </div>
          <div>
            <dt>Fixed operating cost</dt>
            <dd>
              {formatUsd(fixedOperatingCostPerWeek)}
              <em>per week</em>
            </dd>
          </div>
          <div>
            <dt>Total modeled weekly cost</dt>
            <dd>{formatUsd(horizonEconomics.totalModeledCost)}</dd>
          </div>
          <div>
            <dt>Modeled contribution</dt>
            <dd className={contributionClass(horizonEconomics.modeledContribution)}>
              {formatUsd(horizonEconomics.modeledContribution)}
            </dd>
          </div>
          <div>
            <dt>Contribution margin</dt>
            <dd className={contributionClass(horizonEconomics.modeledContribution)}>
              {formatMargin(horizonEconomics.contributionMargin)}
            </dd>
          </div>
        </dl>
        <p className="gt-cost-interpret">{interpretation}</p>
        <p className="gt-cost-interpret-note">Deterministic reading of the selected assumptions, not a recommendation.</p>
        <p className="gt-fixed-assumptions">
          Long-run plateau economics, if the trajectory fully reached C*: billed{' '}
          {formatUsd(costs.atPlateau.weeklyRevenue)}/week · modeled contribution{' '}
          {formatUsd(costs.atPlateau.modeledContribution)}/week.
        </p>
      </section>

      <section className="od-panel">
        <div className="od-panel-head">
          <strong>Current model dials</strong>
          <span>Target, volume, retention, horizon, costs, branches</span>
        </div>
        <div className="gt-dials">
          <div>
            <small>Annualized billed revenue run-rate target</small>
            <strong>{formatUsdMillions(targetAnnualizedRunRate)}</strong>
            <div className="gt-dial-pills">
              {TARGET_OPTIONS.map((option) => (
                <button
                  key={option.amount}
                  type="button"
                  className={targetAnnualizedRunRate === option.amount ? 'active' : ''}
                  onClick={() => setTargetAnnualizedRunRate(option.amount)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <label className="gt-dial-custom">
              Custom target
              <input
                type="number"
                min={1}
                step={100000}
                value={targetAnnualizedRunRate}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  if (Number.isFinite(next) && next > 0) setTargetAnnualizedRunRate(next);
                }}
              />
            </label>
          </div>
          <div>
            <small>Weekly admissions / volume</small>
            <strong>{formatAdmissionsRate(n)}/week</strong>
            <em>{branchExpansionEnabled ? 'Branch 1 admissions n' : 'maps to n'}</em>
            <label className="gt-dial-slider">
              Admissions per week
              <input
                type="range"
                min={ADMISSIONS_MIN}
                max={ADMISSIONS_MAX}
                step={ADMISSIONS_STEP}
                value={n}
                onChange={(event) => setN(clampAdmissions(Number(event.target.value)))}
              />
            </label>
          </div>
          <div>
            <small>Churn / average client lifetime</small>
            <strong>{lifetimeWeeks} weeks</strong>
            <em>
              {branchExpansionEnabled
                ? `Branch 1 lifetime · weekly churn ~${weeklyChurn}`
                : `Weekly churn ~${weeklyChurn} (δ = 1 / L)`}
            </em>
            <label className="gt-dial-slider">
              Average lifetime in weeks
              <input
                type="range"
                min={LIFETIME_MIN}
                max={LIFETIME_MAX}
                step={1}
                value={lifetimeWeeks}
                onChange={(event) => setLifetimeWeeks(clampLifetime(Number(event.target.value)))}
              />
            </label>
          </div>
          <div>
            <small>Service hours h</small>
            <strong>{serviceHours} hrs/client/week</strong>
            <em>shared across branches</em>
            <label className="gt-dial-slider">
              Service hours per client-week
              <input
                type="range"
                min={HOURS_MIN}
                max={HOURS_MAX}
                step={1}
                value={serviceHours}
                onChange={(event) => setServiceHours(clampHours(Number(event.target.value)))}
              />
            </label>
          </div>
          <div>
            <small>Billing rate p</small>
            <strong>{formatUsd(billingRate)}/hour</strong>
            <em>shared across branches</em>
            <label className="gt-dial-slider">
              Billing rate per hour
              <input
                type="range"
                min={RATE_MIN}
                max={RATE_MAX}
                step={1}
                value={billingRate}
                onChange={(event) => setBillingRate(clampRate(Number(event.target.value)))}
              />
            </label>
          </div>
          <div>
            <small>Time horizon</small>
            <strong>{horizonWeeks} weeks</strong>
            <em>~{formatYearsFromWeeks(horizonWeeks, WEEKS_PER_YEAR)} years</em>
            <div className="gt-dial-pills">
              {HORIZON_OPTIONS.map((option) => (
                <button
                  key={option.weeks}
                  type="button"
                  className={horizonWeeks === option.weeks ? 'active' : ''}
                  onClick={() => setHorizonWeeks(option.weeks)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="gt-cost-disclaimer">{costAssumptionDisclaimer}</p>
        <div className="gt-dials gt-cost-dials">
          <div>
            <small>Direct cost of service ratio</small>
            <strong>{formatRatioPercent(directServiceCostRatio)}</strong>
            <em>Caregiver / DSP / direct delivery, as % of billed revenue</em>
            <label className="gt-dial-slider">
              Direct service cost ratio
              <input
                type="range"
                min={DIRECT_RATIO_MIN * 100}
                max={DIRECT_RATIO_MAX * 100}
                step={1}
                value={Math.round(directServiceCostRatio * 100)}
                onChange={(event) =>
                  setDirectServiceCostRatio(
                    clampRatio(Number(event.target.value) / 100, DIRECT_RATIO_MIN, DIRECT_RATIO_MAX, defaultRunRateCostAssumptions.directServiceCostRatio),
                  )
                }
              />
            </label>
          </div>
          <div>
            <small>Variable back-office cost ratio</small>
            <strong>{formatRatioPercent(variableOperatingCostRatio)}</strong>
            <em>Variable operating/admin cost, as % of billed revenue</em>
            <label className="gt-dial-slider">
              Variable operating cost ratio
              <input
                type="range"
                min={VARIABLE_RATIO_MIN * 100}
                max={VARIABLE_RATIO_MAX * 100}
                step={1}
                value={Math.round(variableOperatingCostRatio * 100)}
                onChange={(event) =>
                  setVariableOperatingCostRatio(
                    clampRatio(
                      Number(event.target.value) / 100,
                      VARIABLE_RATIO_MIN,
                      VARIABLE_RATIO_MAX,
                      defaultRunRateCostAssumptions.variableOperatingCostRatio,
                    ),
                  )
                }
              />
            </label>
          </div>
          <div>
            <small>Fixed operating cost</small>
            <strong>{formatUsd(fixedOperatingCostPerWeek)}/week</strong>
            <em>Does not vary directly with revenue</em>
            <label className="gt-dial-slider">
              Weekly fixed operating cost
              <input
                type="range"
                min={FIXED_COST_MIN}
                max={FIXED_COST_MAX}
                step={FIXED_COST_STEP}
                value={fixedOperatingCostPerWeek}
                onChange={(event) => setFixedOperatingCostPerWeek(clampFixedCost(Number(event.target.value)))}
              />
            </label>
            <label className="gt-dial-custom">
              Custom weekly fixed cost
              <input
                type="number"
                min={FIXED_COST_MIN}
                step={FIXED_COST_STEP}
                value={fixedOperatingCostPerWeek}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  if (Number.isFinite(next) && next >= 0) setFixedOperatingCostPerWeek(next);
                }}
              />
            </label>
          </div>
        </div>
        <div className="gt-branch-panel">
          <div className="od-panel-head">
            <strong>Branch expansion</strong>
            <span>Scenario model · not an OSpectra forecast</span>
          </div>
          <label className="gt-branch-toggle">
            <input
              type="checkbox"
              checked={branchExpansionEnabled}
              onChange={(event) => setBranchExpansionEnabled(event.target.checked)}
            />
            Enabled
          </label>
          <p className="gt-cost-disclaimer">{branchScenarioDisclaimer}</p>
          <div className="gt-dials gt-cost-dials">
            <div>
              <small>Branch 1</small>
              <strong>Opening week {branch1OpeningWeek}</strong>
              <em>
                Admissions {formatAdmissionsRate(n)}/week · lifetime {lifetimeWeeks} weeks · max {branch1Capacity} clients
              </em>
              <label className="gt-dial-slider">
                Opening week
                <input
                  type="range"
                  min={0}
                  max={horizonWeeks}
                  step={1}
                  value={branch1OpeningWeek}
                  onChange={(event) => setBranch1OpeningWeek(clampOpeningWeek(Number(event.target.value), horizonWeeks))}
                />
              </label>
              <label className="gt-dial-slider">
                Maximum active clients
                <input
                  type="range"
                  min={BRANCH_CAPACITY_MIN}
                  max={BRANCH_CAPACITY_MAX}
                  step={1}
                  value={branch1Capacity}
                  onChange={(event) => setBranch1Capacity(clampCapacity(Number(event.target.value)))}
                />
              </label>
            </div>
            <div>
              <small>Branch 2</small>
              <strong>Opening week {branch2OpeningWeek}</strong>
              <em>
                Admissions {formatAdmissionsRate(branch2Admissions)}/week · lifetime {branch2Lifetime} weeks · max{' '}
                {branch2Capacity} clients
              </em>
              <label className="gt-dial-slider">
                Opening week
                <input
                  type="range"
                  min={0}
                  max={horizonWeeks}
                  step={1}
                  value={branch2OpeningWeek}
                  onChange={(event) => setBranch2OpeningWeek(clampOpeningWeek(Number(event.target.value), horizonWeeks))}
                />
              </label>
              <label className="gt-dial-slider">
                Weekly admissions
                <input
                  type="range"
                  min={ADMISSIONS_MIN}
                  max={ADMISSIONS_MAX}
                  step={ADMISSIONS_STEP}
                  value={branch2Admissions}
                  onChange={(event) => setBranch2Admissions(clampAdmissions(Number(event.target.value)))}
                />
              </label>
              <label className="gt-dial-slider">
                Average lifetime in weeks
                <input
                  type="range"
                  min={LIFETIME_MIN}
                  max={LIFETIME_MAX}
                  step={1}
                  value={branch2Lifetime}
                  onChange={(event) => setBranch2Lifetime(clampLifetime(Number(event.target.value)))}
                />
              </label>
              <label className="gt-dial-slider">
                Maximum active clients
                <input
                  type="range"
                  min={BRANCH_CAPACITY_MIN}
                  max={BRANCH_CAPACITY_MAX}
                  step={1}
                  value={branch2Capacity}
                  onChange={(event) => setBranch2Capacity(clampCapacity(Number(event.target.value)))}
                />
              </label>
            </div>
          </div>
        </div>
        <p className="gt-fixed-assumptions">
          Shared v0.6 assumptions: h = {serviceHours} service hours/client/week · p = {formatUsd(billingRate)}/hour ·
          weeksPerYear = {WEEKS_PER_YEAR} · inception census = 0. Cost and branch defaults are scenario assumptions, not
          validated OSpectra values. Unlimited caregiver supply remains assumed except for the explicit client-capacity
          cap on each branch.
        </p>
        <p className="od-path-note">
          v0.6 lets you vary the annualized billed run-rate target, weekly admissions, retention/churn, service hours,
          billing rate, projection horizon, direct service cost, variable operating cost, fixed operating cost, and
          branch expansion. Scenario values are assumptions, not predictions.
        </p>
        <div className="gt-future">
          <small>Future business scenarios — not modeled in this v0.6 comparison</small>
          <ul>
            <li>Changing service hours by branch</li>
            <li>Changing billing rate by branch</li>
            <li>Caregiver supply constraints</li>
            <li>Payer mix</li>
            <li>Reimbursement timing</li>
            <li>Denial risk</li>
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
            Reference parameters, not OSpectra actuals. The selected admissions rate is not shown as operationally
            achievable. Unlimited caregiver supply remains assumed except for each branch&apos;s explicit client-capacity
            cap.
          </p>
          <p>
            Annualized billed run-rate is not collected cash, accounting revenue, profit, or margin. Modeled
            contribution is not accounting profit.
          </p>
        </div>
      </section>
    </div>
  );
}
