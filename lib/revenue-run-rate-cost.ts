/**
 * Growth Target cost overlay v0.5 (research-only).
 * Derives modeled weekly costs from an existing billed run-rate trajectory.
 * Does not recompute census, forecast cash, or treat contribution as accounting profit.
 */
import type { RevenueRunRateResult } from './revenue-run-rate-scenario';

export const costAssumptionDisclaimer = 'Scenario assumptions — not OSpectra actuals.';

export const defaultRunRateCostAssumptions = {
  directServiceCostRatio: 0.65,
  variableOperatingCostRatio: 0.08,
  fixedOperatingCostPerWeek: 25_000,
} as const;

export type RunRateCostAssumptions = {
  directServiceCostRatio: number;
  variableOperatingCostRatio: number;
  fixedOperatingCostPerWeek: number;
};

export type WeeklyEconomics = {
  weeklyRevenue: number;
  directServiceCost: number;
  variableOperatingCost: number;
  fixedOperatingCost: number;
  totalModeledCost: number;
  modeledContribution: number;
  contributionMargin: number | null;
};

export type RunRateCostWeek = WeeklyEconomics & {
  t: number;
};

export type RunRateCostResult = {
  assumptions: RunRateCostAssumptions;
  directAndVariableExceedRevenue: boolean;
  trajectory: readonly RunRateCostWeek[];
  atHorizon: RunRateCostWeek;
  atPlateau: WeeklyEconomics;
};

function assertFiniteNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative finite number.`);
  }
}

function assertDirectRatio(value: number): void {
  assertFiniteNonNegative(value, 'directServiceCostRatio');
  if (value > 1) {
    throw new Error('directServiceCostRatio must be less than or equal to 1.');
  }
}

function assertCostResult(result: RevenueRunRateResult): void {
  if (!result || !result.derived || !Array.isArray(result.trajectory) || result.trajectory.length === 0) {
    throw new Error('result must be a RevenueRunRateResult with a non-empty trajectory.');
  }
  if (!Number.isFinite(result.derived.revenuePlateau) || result.derived.revenuePlateau < 0) {
    throw new Error('result.derived.revenuePlateau must be a non-negative finite number.');
  }
}

export function directAndVariableExceedRevenue(assumptions: Pick<RunRateCostAssumptions, 'directServiceCostRatio' | 'variableOperatingCostRatio'>): boolean {
  return assumptions.directServiceCostRatio + assumptions.variableOperatingCostRatio > 1;
}

export function calculateWeeklyEconomics(
  weeklyRevenue: number,
  assumptions: RunRateCostAssumptions,
): WeeklyEconomics {
  assertFiniteNonNegative(weeklyRevenue, 'weeklyRevenue');
  assertDirectRatio(assumptions.directServiceCostRatio);
  assertFiniteNonNegative(assumptions.variableOperatingCostRatio, 'variableOperatingCostRatio');
  assertFiniteNonNegative(assumptions.fixedOperatingCostPerWeek, 'fixedOperatingCostPerWeek');

  const directServiceCost = weeklyRevenue * assumptions.directServiceCostRatio;
  const variableOperatingCost = weeklyRevenue * assumptions.variableOperatingCostRatio;
  const fixedOperatingCost = assumptions.fixedOperatingCostPerWeek;
  const totalModeledCost = directServiceCost + variableOperatingCost + fixedOperatingCost;
  const modeledContribution = weeklyRevenue - totalModeledCost;
  const contributionMargin = weeklyRevenue === 0 ? null : modeledContribution / weeklyRevenue;

  return {
    weeklyRevenue,
    directServiceCost,
    variableOperatingCost,
    fixedOperatingCost,
    totalModeledCost,
    modeledContribution,
    contributionMargin,
  };
}

export function applyRunRateCosts(
  result: RevenueRunRateResult,
  assumptions: RunRateCostAssumptions,
): RunRateCostResult {
  assertCostResult(result);
  const atPlateau = calculateWeeklyEconomics(result.derived.revenuePlateau, assumptions);
  const trajectory = result.trajectory.map((week) => ({
    t: week.t,
    ...calculateWeeklyEconomics(week.revenue, assumptions),
  }));
  const atHorizon = trajectory[trajectory.length - 1];

  return {
    assumptions: {
      directServiceCostRatio: assumptions.directServiceCostRatio,
      variableOperatingCostRatio: assumptions.variableOperatingCostRatio,
      fixedOperatingCostPerWeek: assumptions.fixedOperatingCostPerWeek,
    },
    directAndVariableExceedRevenue: directAndVariableExceedRevenue(assumptions),
    trajectory,
    atHorizon,
    atPlateau,
  };
}

export function interpretModeledContribution(input: {
  modeledContribution: number;
  targetReached: boolean;
}): string {
  if (!Number.isFinite(input.modeledContribution)) {
    throw new Error('modeledContribution must be a finite number.');
  }
  if (input.targetReached && input.modeledContribution < 0) {
    return 'The modeled revenue target is reached, but the selected cost assumptions do not produce positive modeled contribution.';
  }
  if (input.modeledContribution > 0) {
    return 'The selected assumptions produce positive modeled contribution at the end of the horizon.';
  }
  if (input.modeledContribution < 0) {
    return 'The selected assumptions produce negative modeled contribution at the end of the horizon.';
  }
  return 'The selected assumptions produce zero modeled contribution at the end of the horizon.';
}
