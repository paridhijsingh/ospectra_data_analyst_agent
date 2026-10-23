/**
 * Presentation fixture for Growth Target Scenario v0.3.
 * Reference parameters only. Not OSpectra actuals.
 * Trajectories come from projectRevenueRunRate(); classification from analyzeRunRateTarget().
 */
import { projectRevenueRunRate, type RevenueRunRateResult } from './revenue-run-rate-scenario';
import {
  analyzeRunRateTarget,
  requiredSteadyStateAdmissions,
  type RunRateTargetAnalysis,
  type TargetReachState,
} from './revenue-run-rate-target';

export const growthTargetResearchQuestion =
  'What would it take to reach a $5M annualized billed revenue run-rate?';

export const growthTargetReference = {
  targetAnnualizedRunRate: 5_000_000,
  weeksPerYear: 52,
  L: 52,
  h: 30,
  p: 35,
  horizonWeeks: 208,
  referenceAdmissions: 2,
} as const;

export const growthTargetAdmissionsCases = [
  { n: 1, key: 'n1', label: '1 admission/week', isBaseline: false },
  { n: 2, key: 'n2', label: '2 admissions/week', isBaseline: true },
  { n: 3, key: 'n3', label: '3 admissions/week', isBaseline: false },
] as const;

export type GrowthTargetScenario = {
  n: number;
  key: string;
  label: string;
  isBaseline: boolean;
  result: RevenueRunRateResult;
  analysis: RunRateTargetAnalysis;
};

export function getGrowthTargetRequiredAdmissions() {
  return requiredSteadyStateAdmissions({
    L: growthTargetReference.L,
    h: growthTargetReference.h,
    p: growthTargetReference.p,
    targetAnnualizedRunRate: growthTargetReference.targetAnnualizedRunRate,
    weeksPerYear: growthTargetReference.weeksPerYear,
  });
}

export function getGrowthTargetScenarios(): GrowthTargetScenario[] {
  return growthTargetAdmissionsCases.map((item) => {
    const result = projectRevenueRunRate({
      n: item.n,
      L: growthTargetReference.L,
      h: growthTargetReference.h,
      p: growthTargetReference.p,
      horizonWeeks: growthTargetReference.horizonWeeks,
    });
    return {
      ...item,
      result,
      analysis: analyzeRunRateTarget({
        result,
        targetAnnualizedRunRate: growthTargetReference.targetAnnualizedRunRate,
        weeksPerYear: growthTargetReference.weeksPerYear,
      }),
    };
  });
}

export type GrowthTargetChartPoint = {
  t: number;
  year: number;
  n1Annualized: number;
  n2Annualized: number;
  n3Annualized: number;
  target: number;
};

export function toGrowthTargetChartPoints(scenarios: readonly GrowthTargetScenario[]): GrowthTargetChartPoint[] {
  const byKey = Object.fromEntries(scenarios.map((scenario) => [scenario.key, scenario.result.trajectory]));
  const n2 = byKey.n2;
  if (!n2) return [];
  const weeksPerYear = growthTargetReference.weeksPerYear;
  const target = growthTargetReference.targetAnnualizedRunRate;
  const step = 4;
  const points: GrowthTargetChartPoint[] = [];
  const push = (index: number) => {
    const t = byKey.n2[index].t;
    points.push({
      t,
      year: t / weeksPerYear,
      n1Annualized: byKey.n1[index].revenue * weeksPerYear,
      n2Annualized: byKey.n2[index].revenue * weeksPerYear,
      n3Annualized: byKey.n3[index].revenue * weeksPerYear,
      target,
    });
  };
  for (let index = 0; index < n2.length; index += step) push(index);
  const lastIndex = n2.length - 1;
  if (lastIndex >= 0 && lastIndex % step !== 0) push(lastIndex);
  return points;
}

export function formatUsd(amount: number, fractionDigits = 0): string {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  });
}

export function formatUsdMillions(amount: number): string {
  return `$${(amount / 1_000_000).toLocaleString('en-US', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  })}M`;
}

export function formatUsdAxis(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
  }
  if (Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toLocaleString('en-US', { maximumFractionDigits: 0 })}K`;
  }
  return formatUsd(amount);
}

export function formatAdmissionsRate(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

export function formatYearsFromWeeks(weeks: number, weeksPerYear: number): string {
  return (weeks / weeksPerYear).toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
}

export function formatTargetState(state: TargetReachState): string {
  if (state === 'REACHED') return 'Reached';
  if (state === 'NOT_REACHED_WITHIN_HORIZON') return 'Not reached within horizon';
  return 'Unreachable under assumptions';
}
