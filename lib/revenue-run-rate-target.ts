/**
 * Growth Target Analysis v0.3 (research-only).
 * Annualizes a validated v0.2 weekly billed run-rate trajectory.
 * Does not recompute census, forecast cash, or recommend actions.
 */
import type { RevenueRunRateResult } from './revenue-run-rate-scenario';

export type TargetReachState =
  | 'REACHED'
  | 'NOT_REACHED_WITHIN_HORIZON'
  | 'UNREACHABLE_UNDER_ASSUMPTIONS';

export type AnalyzeRunRateTargetInput = {
  result: RevenueRunRateResult;
  targetAnnualizedRunRate: number;
  weeksPerYear: number;
};

export type RunRateTargetAnalysis = {
  targetAnnualizedRunRate: number;
  targetWeeklyRunRate: number;
  annualizedPlateau: number;
  state: TargetReachState;
  firstReachedWeek: number | null;
  firstReachedAnnualized: number | null;
};

export type RequiredSteadyStateAdmissionsInput = {
  L: number;
  h: number;
  p: number;
  targetAnnualizedRunRate: number;
  weeksPerYear: number;
};

export type RequiredSteadyStateAdmissions = {
  nRequired: number;
  targetWeeklyRunRate: number;
  impliedWeeklyPlateau: number;
  impliedAnnualizedPlateau: number;
};

function assertFinitePositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a finite number greater than 0.`);
  }
}

function assertTargetResult(result: RevenueRunRateResult): void {
  if (!result || !result.derived || !Array.isArray(result.trajectory)) {
    throw new Error('result must be a RevenueRunRateResult with derived plateaus and a trajectory.');
  }
  if (!Number.isFinite(result.derived.revenuePlateau)) {
    throw new Error('result.derived.revenuePlateau must be a finite number.');
  }
}

export function analyzeRunRateTarget(input: AnalyzeRunRateTargetInput): RunRateTargetAnalysis {
  assertFinitePositive(input.targetAnnualizedRunRate, 'targetAnnualizedRunRate');
  assertFinitePositive(input.weeksPerYear, 'weeksPerYear');
  assertTargetResult(input.result);

  const targetWeeklyRunRate = input.targetAnnualizedRunRate / input.weeksPerYear;
  const annualizedPlateau = input.result.derived.revenuePlateau * input.weeksPerYear;

  const hit = input.result.trajectory.find((week) => Number.isFinite(week.revenue) && week.revenue >= targetWeeklyRunRate);

  if (hit) {
    return {
      targetAnnualizedRunRate: input.targetAnnualizedRunRate,
      targetWeeklyRunRate,
      annualizedPlateau,
      state: 'REACHED',
      firstReachedWeek: hit.t,
      firstReachedAnnualized: hit.revenue * input.weeksPerYear,
    };
  }

  const unreachable = input.result.derived.revenuePlateau < targetWeeklyRunRate;
  return {
    targetAnnualizedRunRate: input.targetAnnualizedRunRate,
    targetWeeklyRunRate,
    annualizedPlateau,
    state: unreachable ? 'UNREACHABLE_UNDER_ASSUMPTIONS' : 'NOT_REACHED_WITHIN_HORIZON',
    firstReachedWeek: null,
    firstReachedAnnualized: null,
  };
}

export function requiredSteadyStateAdmissions(
  input: RequiredSteadyStateAdmissionsInput,
): RequiredSteadyStateAdmissions {
  assertFinitePositive(input.L, 'L');
  assertFinitePositive(input.h, 'h');
  assertFinitePositive(input.p, 'p');
  assertFinitePositive(input.targetAnnualizedRunRate, 'targetAnnualizedRunRate');
  assertFinitePositive(input.weeksPerYear, 'weeksPerYear');

  const targetWeeklyRunRate = input.targetAnnualizedRunRate / input.weeksPerYear;
  const nRequired = targetWeeklyRunRate / (input.h * input.p * input.L);
  const impliedWeeklyPlateau = nRequired * input.h * input.p * input.L;
  const impliedAnnualizedPlateau = impliedWeeklyPlateau * input.weeksPerYear;

  return {
    nRequired,
    targetWeeklyRunRate,
    impliedWeeklyPlateau,
    impliedAnnualizedPlateau,
  };
}
