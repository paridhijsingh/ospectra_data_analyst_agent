/**
 * Growth Target Branch Expansion v0.6 (research-only).
 * Separate capped-branch scenario family. Does not replace the single-configuration recurrence.
 */
import { calculateWeeklyEconomics, type RunRateCostAssumptions, type WeeklyEconomics } from './revenue-run-rate-cost';
import type { RunRateTargetAnalysis, TargetReachState } from './revenue-run-rate-target';

export const branchScenarioDisclaimer =
  'Reference scenario assumptions — not OSpectra actual branch capacity.';

export type BranchScenarioInput = {
  id: string;
  name: string;
  openingWeek: number;
  weeklyAdmissions: number;
  clientLifetimeWeeks: number;
  maxActiveClients: number;
};

export type BranchScenarioWeek = {
  t: number;
  census: number;
  weeklyRevenue: number;
};

export type BranchScenarioDerived = {
  uncappedCensusPlateau: number;
  censusPlateau: number;
  weeklyRevenuePlateau: number;
  annualizedPlateau: number;
};

export type BranchScenarioResult = {
  input: BranchScenarioInput;
  derived: BranchScenarioDerived;
  trajectory: readonly BranchScenarioWeek[];
};

export type CompanyBranchScenarioWeek = {
  t: number;
  totalCensus: number;
  totalWeeklyRevenue: number;
  annualizedRunRate: number;
  branchCensus: Readonly<Record<string, number>>;
  branchWeeklyRevenue: Readonly<Record<string, number>>;
};

export type CompanyBranchDerived = {
  companyCensusPlateau: number;
  companyWeeklyRevenuePlateau: number;
  companyAnnualizedPlateau: number;
  branchPlateaus: readonly BranchScenarioDerived[];
};

export type CompanyBranchScenarioResult = {
  branches: readonly BranchScenarioResult[];
  derived: CompanyBranchDerived;
  trajectory: readonly CompanyBranchScenarioWeek[];
};

export type BranchSharedParameters = {
  h: number;
  p: number;
  horizonWeeks: number;
  weeksPerYear: number;
};

export const defaultBranchScenarios: readonly BranchScenarioInput[] = [
  {
    id: 'branch-1',
    name: 'Branch 1',
    openingWeek: 0,
    weeklyAdmissions: 2,
    clientLifetimeWeeks: 52,
    maxActiveClients: 100,
  },
  {
    id: 'branch-2',
    name: 'Branch 2',
    openingWeek: 52,
    weeklyAdmissions: 2,
    clientLifetimeWeeks: 52,
    maxActiveClients: 100,
  },
];

function assertFiniteNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative finite number.`);
  }
}

function assertFinitePositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a finite number greater than 0.`);
  }
}

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative finite integer.`);
  }
}

function assertBranchInput(input: BranchScenarioInput): void {
  if (!input || typeof input.id !== 'string' || input.id.length === 0) {
    throw new Error('id must be a non-empty string.');
  }
  assertNonNegativeInteger(input.openingWeek, 'openingWeek');
  assertFiniteNonNegative(input.weeklyAdmissions, 'weeklyAdmissions');
  assertFinitePositive(input.clientLifetimeWeeks, 'clientLifetimeWeeks');
  assertFiniteNonNegative(input.maxActiveClients, 'maxActiveClients');
}

function assertShared(shared: BranchSharedParameters): void {
  assertFiniteNonNegative(shared.h, 'h');
  assertFiniteNonNegative(shared.p, 'p');
  assertNonNegativeInteger(shared.horizonWeeks, 'horizonWeeks');
  assertFinitePositive(shared.weeksPerYear, 'weeksPerYear');
}

export function branchSteadyStateCensus(input: BranchScenarioInput): number {
  assertBranchInput(input);
  return Math.min(input.weeklyAdmissions * input.clientLifetimeWeeks, input.maxActiveClients);
}

export function projectBranchScenario(
  input: BranchScenarioInput,
  shared: BranchSharedParameters,
): BranchScenarioResult {
  assertBranchInput(input);
  assertShared(shared);

  const revenuePerClientWeek = shared.h * shared.p;
  const weeklyAttritionFraction = 1 / input.clientLifetimeWeeks;
  const uncappedCensusPlateau = input.weeklyAdmissions * input.clientLifetimeWeeks;
  const censusPlateau = Math.min(uncappedCensusPlateau, input.maxActiveClients);
  const weeklyRevenuePlateau = censusPlateau * revenuePerClientWeek;
  const annualizedPlateau = weeklyRevenuePlateau * shared.weeksPerYear;

  const trajectory: BranchScenarioWeek[] = [];
  let census = 0;
  for (let t = 0; t <= shared.horizonWeeks; t += 1) {
    if (t < input.openingWeek) census = 0;
    census = Math.max(0, census);
    trajectory.push({ t, census, weeklyRevenue: census * revenuePerClientWeek });
    if (t >= input.openingWeek) {
      census = Math.max(
        0,
        Math.min(input.maxActiveClients, census * (1 - weeklyAttritionFraction) + input.weeklyAdmissions),
      );
    } else {
      census = 0;
    }
  }

  return {
    input: { ...input },
    derived: {
      uncappedCensusPlateau,
      censusPlateau,
      weeklyRevenuePlateau,
      annualizedPlateau,
    },
    trajectory,
  };
}

export function projectCompanyBranches(
  branches: readonly BranchScenarioInput[],
  shared: BranchSharedParameters,
): CompanyBranchScenarioResult {
  if (!Array.isArray(branches) || branches.length === 0) {
    throw new Error('branches must be a non-empty array.');
  }
  const ids = branches.map((branch) => branch.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error('branch ids must be unique.');
  }

  const results = branches.map((branch) => projectBranchScenario(branch, shared));
  const companyCensusPlateau = results.reduce((sum, branch) => sum + branch.derived.censusPlateau, 0);
  const companyWeeklyRevenuePlateau = results.reduce((sum, branch) => sum + branch.derived.weeklyRevenuePlateau, 0);
  const companyAnnualizedPlateau = companyWeeklyRevenuePlateau * shared.weeksPerYear;

  const trajectory: CompanyBranchScenarioWeek[] = [];
  for (let t = 0; t <= shared.horizonWeeks; t += 1) {
    const branchCensus: Record<string, number> = {};
    const branchWeeklyRevenue: Record<string, number> = {};
    let totalCensus = 0;
    let totalWeeklyRevenue = 0;
    for (const branch of results) {
      const week = branch.trajectory[t];
      branchCensus[branch.input.id] = week.census;
      branchWeeklyRevenue[branch.input.id] = week.weeklyRevenue;
      totalCensus += week.census;
      totalWeeklyRevenue += week.weeklyRevenue;
    }
    trajectory.push({
      t,
      totalCensus,
      totalWeeklyRevenue,
      annualizedRunRate: totalWeeklyRevenue * shared.weeksPerYear,
      branchCensus,
      branchWeeklyRevenue,
    });
  }

  return {
    branches: results,
    derived: {
      companyCensusPlateau,
      companyWeeklyRevenuePlateau,
      companyAnnualizedPlateau,
      branchPlateaus: results.map((branch) => branch.derived),
    },
    trajectory,
  };
}

export function analyzeBranchCompanyTarget(input: {
  company: CompanyBranchScenarioResult;
  targetAnnualizedRunRate: number;
  weeksPerYear: number;
}): RunRateTargetAnalysis {
  if (!Number.isFinite(input.targetAnnualizedRunRate) || input.targetAnnualizedRunRate <= 0) {
    throw new Error('targetAnnualizedRunRate must be a finite number greater than 0.');
  }
  if (!Number.isFinite(input.weeksPerYear) || input.weeksPerYear <= 0) {
    throw new Error('weeksPerYear must be a finite number greater than 0.');
  }

  const targetWeeklyRunRate = input.targetAnnualizedRunRate / input.weeksPerYear;
  const annualizedPlateau = input.company.derived.companyAnnualizedPlateau;
  const hit = input.company.trajectory.find(
    (week) => Number.isFinite(week.annualizedRunRate) && week.annualizedRunRate >= input.targetAnnualizedRunRate,
  );

  if (hit) {
    return {
      targetAnnualizedRunRate: input.targetAnnualizedRunRate,
      targetWeeklyRunRate,
      annualizedPlateau,
      state: 'REACHED',
      firstReachedWeek: hit.t,
      firstReachedAnnualized: hit.annualizedRunRate,
    };
  }

  const unreachable = annualizedPlateau < input.targetAnnualizedRunRate;
  return {
    targetAnnualizedRunRate: input.targetAnnualizedRunRate,
    targetWeeklyRunRate,
    annualizedPlateau,
    state: unreachable ? 'UNREACHABLE_UNDER_ASSUMPTIONS' : 'NOT_REACHED_WITHIN_HORIZON',
    firstReachedWeek: null,
    firstReachedAnnualized: null,
  };
}

export function applyCompanyRevenueCosts(
  company: CompanyBranchScenarioResult,
  assumptions: RunRateCostAssumptions,
): {
  trajectory: readonly (WeeklyEconomics & { t: number })[];
  atHorizon: WeeklyEconomics & { t: number };
  atPlateau: WeeklyEconomics;
} {
  const trajectory = company.trajectory.map((week) => ({
    t: week.t,
    ...calculateWeeklyEconomics(week.totalWeeklyRevenue, assumptions),
  }));
  return {
    trajectory,
    atHorizon: trajectory[trajectory.length - 1],
    atPlateau: calculateWeeklyEconomics(company.derived.companyWeeklyRevenuePlateau, assumptions),
  };
}

export function interpretBranchExpansion(input: {
  companyState: TargetReachState;
  branch1State: TargetReachState;
  firstReachedWeek: number | null;
  branch2OpeningWeek: number;
  modeledContribution: number;
}): string {
  if (!Number.isFinite(input.modeledContribution)) {
    throw new Error('modeledContribution must be a finite number.');
  }
  if (input.companyState === 'REACHED' && input.modeledContribution < 0) {
    return 'The expanded revenue scenario reaches the target, but the selected cost assumptions produce negative modeled contribution.';
  }
  if (input.companyState === 'UNREACHABLE_UNDER_ASSUMPTIONS') {
    return 'The selected branch configuration remains below the target under the current assumptions.';
  }
  if (input.companyState === 'REACHED' && input.branch1State === 'UNREACHABLE_UNDER_ASSUMPTIONS') {
    return 'The target is not supported by the first operating configuration alone, but the modeled branch expansion raises company capacity enough to support it.';
  }
  if (
    input.companyState === 'REACHED' &&
    input.firstReachedWeek != null &&
    input.firstReachedWeek >= input.branch2OpeningWeek &&
    input.branch1State !== 'REACHED'
  ) {
    return 'The modeled target is first reached after the second branch becomes active.';
  }
  if (input.companyState === 'NOT_REACHED_WITHIN_HORIZON') {
    return 'The selected branch configuration can support the target in the long run, but the modeled trajectory does not reach it during this horizon.';
  }
  if (input.modeledContribution > 0) {
    return 'The selected assumptions produce positive modeled contribution at the end of the horizon.';
  }
  if (input.modeledContribution < 0) {
    return 'The selected assumptions produce negative modeled contribution at the end of the horizon.';
  }
  return 'The selected assumptions produce zero modeled contribution at the end of the horizon.';
}
