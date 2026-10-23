/**
 * Isolated admissions → census → weekly billed run-rate scenario.
 * Constant-parameter inception model. Not a forecast, not cash, not used by Financial routing.
 */

export const revenueRunRateModelId = 'cespedes-inception-run-rate-v0.2' as const;

export type RevenueRunRateInput = {
  n: number;
  L: number;
  h: number;
  p: number;
  horizonWeeks: number;
};

export type RevenueRunRateDerived = {
  revenuePerClientWeek: number;
  weeklyAttritionFraction: number;
  censusPlateau: number;
  revenuePlateau: number;
};

export type RevenueRunRateAssumptions = {
  constantAdmissions: true;
  constantAttrition: true;
  uniformServiceIntensity: true;
  unlimitedCaregiverSupply: true;
  inceptionCensus: 0;
};

export type RevenueRunRateWeek = {
  t: number;
  census: number;
  revenue: number;
};

export type RevenueRunRateResult = {
  modelId: typeof revenueRunRateModelId;
  inputs: RevenueRunRateInput;
  derived: RevenueRunRateDerived;
  assumptions: RevenueRunRateAssumptions;
  trajectory: readonly RevenueRunRateWeek[];
};

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

export function projectRevenueRunRate(input: RevenueRunRateInput): RevenueRunRateResult {
  assertFiniteNonNegative(input.n, 'n');
  assertFinitePositive(input.L, 'L');
  assertFiniteNonNegative(input.h, 'h');
  assertFiniteNonNegative(input.p, 'p');
  assertNonNegativeInteger(input.horizonWeeks, 'horizonWeeks');

  const revenuePerClientWeek = input.h * input.p;
  const weeklyAttritionFraction = 1 / input.L;
  const censusPlateau = input.n * input.L;
  const revenuePlateau = input.n * revenuePerClientWeek * input.L;

  const trajectory: RevenueRunRateWeek[] = [];
  let census = 0;
  for (let t = 0; t <= input.horizonWeeks; t += 1) {
    trajectory.push({ t, census, revenue: census * revenuePerClientWeek });
    census = census * (1 - weeklyAttritionFraction) + input.n;
  }

  return {
    modelId: revenueRunRateModelId,
    inputs: {
      n: input.n,
      L: input.L,
      h: input.h,
      p: input.p,
      horizonWeeks: input.horizonWeeks,
    },
    derived: {
      revenuePerClientWeek,
      weeklyAttritionFraction,
      censusPlateau,
      revenuePlateau,
    },
    assumptions: {
      constantAdmissions: true,
      constantAttrition: true,
      uniformServiceIntensity: true,
      unlimitedCaregiverSupply: true,
      inceptionCensus: 0,
    },
    trajectory,
  };
}
