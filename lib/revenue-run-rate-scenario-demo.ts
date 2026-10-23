/**
 * Presentation fixture for Revenue Run-Rate Scenario v0.2.
 * Source-paper reference parameters only. Not OSpectra actuals.
 * All plateaus and trajectories come from projectRevenueRunRate().
 */
import { projectRevenueRunRate, type RevenueRunRateResult } from './revenue-run-rate-scenario';

export const runRateResearchQuestion =
  'What happens to long-run census and weekly billed revenue if weekly admissions change?';

export const paperReferenceParameters = {
  L: 52,
  h: 30,
  p: 35,
  horizonWeeks: 208,
} as const;

export const paperAdmissionsCases = [
  { n: 1, key: 'n1', label: '1 admission/week', shortLabel: 'n = 1', isBaseline: false },
  { n: 2, key: 'n2', label: '2 admissions/week', shortLabel: 'n = 2', isBaseline: true },
  { n: 3, key: 'n3', label: '3 admissions/week', shortLabel: 'n = 3', isBaseline: false },
] as const;

export type PaperRunRateScenario = {
  n: number;
  key: string;
  label: string;
  shortLabel: string;
  isBaseline: boolean;
  result: RevenueRunRateResult;
};

export function getPaperRunRateScenarios(): PaperRunRateScenario[] {
  return paperAdmissionsCases.map((item) => ({
    ...item,
    result: projectRevenueRunRate({
      n: item.n,
      L: paperReferenceParameters.L,
      h: paperReferenceParameters.h,
      p: paperReferenceParameters.p,
      horizonWeeks: paperReferenceParameters.horizonWeeks,
    }),
  }));
}

export type RunRateChartPoint = {
  t: number;
  year: number;
  n1Revenue: number;
  n2Revenue: number;
  n3Revenue: number;
  n1Census: number;
  n2Census: number;
  n3Census: number;
};

/** Sample engine weekly points at 4-week steps for display. Values remain engine outputs. */
export function toRunRateChartPoints(scenarios: readonly PaperRunRateScenario[]): RunRateChartPoint[] {
  const byKey = Object.fromEntries(scenarios.map((scenario) => [scenario.key, scenario.result.trajectory]));
  const n2 = byKey.n2;
  if (!n2) return [];

  const step = 4;
  const points: RunRateChartPoint[] = [];
  for (let index = 0; index < n2.length; index += step) {
    points.push(chartPointAt(index, byKey));
  }
  const lastIndex = n2.length - 1;
  if (lastIndex >= 0 && lastIndex % step !== 0) {
    points.push(chartPointAt(lastIndex, byKey));
  }
  return points;
}

function chartPointAt(
  index: number,
  byKey: Record<string, RevenueRunRateResult['trajectory']>,
): RunRateChartPoint {
  const t = byKey.n2[index].t;
  return {
    t,
    year: t / 52,
    n1Revenue: byKey.n1[index].revenue,
    n2Revenue: byKey.n2[index].revenue,
    n3Revenue: byKey.n3[index].revenue,
    n1Census: byKey.n1[index].census,
    n2Census: byKey.n2[index].census,
    n3Census: byKey.n3[index].census,
  };
}

export function formatUsd(amount: number, fractionDigits = 0): string {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  });
}

export function formatUsdCompact(amount: number): string {
  if (Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toLocaleString('en-US', { maximumFractionDigits: 0 })}K`;
  }
  return formatUsd(amount);
}

export function formatPercent(fraction: number): string {
  return `${(fraction * 100).toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`;
}

export function formatCensus(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}
