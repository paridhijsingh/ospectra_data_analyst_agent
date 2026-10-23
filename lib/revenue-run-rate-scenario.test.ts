import { describe, expect, it } from 'vitest';
import {
  projectRevenueRunRate,
  revenueRunRateModelId,
  type RevenueRunRateInput,
} from './revenue-run-rate-scenario';

const PAPER_BASELINE = {
  n: 2,
  L: 52,
  h: 30,
  p: 35,
} as const;

const paperInput = (overrides: Partial<RevenueRunRateInput> = {}): RevenueRunRateInput => ({
  ...PAPER_BASELINE,
  horizonWeeks: 52,
  ...overrides,
});

const closedFormRevenue = (t: number, revenuePlateau: number, delta: number): number =>
  revenuePlateau * (1 - (1 - delta) ** t);

const atWeek = (result: ReturnType<typeof projectRevenueRunRate>, t: number) => {
  const point = result.trajectory.find((week) => week.t === t);
  if (!point) throw new Error(`Missing trajectory point t=${t}`);
  return point;
};

describe('projectRevenueRunRate paper baseline', () => {
  const result = projectRevenueRunRate(paperInput());

  it('uses the inception run-rate model id', () => {
    expect(result.modelId).toBe(revenueRunRateModelId);
    expect(result.modelId).toBe('cespedes-inception-run-rate-v0.2');
  });

  it('echoes caller inputs and does not substitute hidden defaults', () => {
    expect(result.inputs).toEqual({ n: 2, L: 52, h: 30, p: 35, horizonWeeks: 52 });
  });

  it('derives paper baseline v, delta, C*, and R*', () => {
    expect(result.derived.revenuePerClientWeek).toBe(1050);
    expect(result.derived.weeklyAttritionFraction).toBe(1 / 52);
    expect(result.derived.censusPlateau).toBe(104);
    expect(result.derived.revenuePlateau).toBe(109200);
  });

  it('records the constant-parameter inception assumptions', () => {
    expect(result.assumptions).toEqual({
      constantAdmissions: true,
      constantAttrition: true,
      uniformServiceIntensity: true,
      unlimitedCaregiverSupply: true,
      inceptionCensus: 0,
    });
  });
});

describe('projectRevenueRunRate paper admissions sensitivity', () => {
  const intensity = { L: 52, h: 30, p: 35, horizonWeeks: 0 };

  it('matches published plateaus for n = 1, 2, and 3', () => {
    const n1 = projectRevenueRunRate({ ...intensity, n: 1 });
    const n2 = projectRevenueRunRate({ ...intensity, n: 2 });
    const n3 = projectRevenueRunRate({ ...intensity, n: 3 });

    expect(n1.derived.censusPlateau).toBe(52);
    expect(n1.derived.revenuePlateau).toBe(54600);
    expect(n2.derived.censusPlateau).toBe(104);
    expect(n2.derived.revenuePlateau).toBe(109200);
    expect(n3.derived.censusPlateau).toBe(156);
    expect(n3.derived.revenuePlateau).toBe(163800);
  });
});

describe('projectRevenueRunRate timing', () => {
  const result = projectRevenueRunRate(paperInput({ horizonWeeks: 12 }));
  const { n } = PAPER_BASELINE;
  const v = result.derived.revenuePerClientWeek;
  const delta = result.derived.weeklyAttritionFraction;

  it('starts at C(0) = 0 and R(0) = 0', () => {
    expect(atWeek(result, 0)).toEqual({ t: 0, census: 0, revenue: 0 });
  });

  it('reaches C(1) = n and R(1) = n * v', () => {
    expect(atWeek(result, 1).census).toBe(n);
    expect(atWeek(result, 1).revenue).toBe(n * v);
  });

  it('obeys the census recurrence and R(t) = C(t) * v on sampled weeks', () => {
    for (const t of [0, 1, 2, 5, 11]) {
      const current = atWeek(result, t);
      const next = atWeek(result, t + 1);
      expect(current.revenue).toBeCloseTo(current.census * v, 10);
      expect(next.census).toBeCloseTo(current.census * (1 - delta) + n, 10);
    }
  });
});

describe('projectRevenueRunRate closed-form check', () => {
  const result = projectRevenueRunRate(paperInput({ horizonWeeks: 80 }));
  const { revenuePlateau, weeklyAttritionFraction } = result.derived;

  it('matches R(t) = R* * [1 - (1 - delta)^t] for sampled weeks', () => {
    for (const t of [0, 1, 2, 10, 26, 52, 80]) {
      expect(atWeek(result, t).revenue).toBeCloseTo(
        closedFormRevenue(t, revenuePlateau, weeklyAttritionFraction),
        8,
      );
    }
  });
});

describe('projectRevenueRunRate plateau behavior', () => {
  const result = projectRevenueRunRate(paperInput({ horizonWeeks: 400 }));
  const { censusPlateau, revenuePlateau } = result.derived;

  it('approaches C* and R* without overshooting, monotonically', () => {
    let previousCensus = -1;
    let previousRevenue = -1;
    for (const week of result.trajectory) {
      expect(week.census).toBeGreaterThanOrEqual(previousCensus);
      expect(week.revenue).toBeGreaterThanOrEqual(previousRevenue);
      expect(week.census).toBeLessThanOrEqual(censusPlateau);
      expect(week.revenue).toBeLessThanOrEqual(revenuePlateau);
      previousCensus = week.census;
      previousRevenue = week.revenue;
    }
    const last = result.trajectory[result.trajectory.length - 1];
    expect(last.census).toBeGreaterThan(censusPlateau * 0.99);
    expect(last.revenue).toBeGreaterThan(revenuePlateau * 0.99);
  });

  it('does not treat week L as the plateau', () => {
    const week52 = atWeek(result, 52);
    expect(week52.census).not.toBe(censusPlateau);
    expect(week52.census).toBeLessThan(104);
    expect(week52.census).toBeCloseTo(104 * (1 - (51 / 52) ** 52), 8);
  });
});

describe('projectRevenueRunRate edge cases', () => {
  it('keeps census and revenue at zero when n = 0', () => {
    const result = projectRevenueRunRate(paperInput({ n: 0, horizonWeeks: 8 }));
    expect(result.derived.censusPlateau).toBe(0);
    expect(result.derived.revenuePlateau).toBe(0);
    for (const week of result.trajectory) {
      expect(week.census).toBe(0);
      expect(week.revenue).toBe(0);
    }
  });

  it('lets census grow but keeps revenue at zero when h = 0', () => {
    const result = projectRevenueRunRate(paperInput({ h: 0, horizonWeeks: 4 }));
    expect(result.derived.revenuePerClientWeek).toBe(0);
    expect(atWeek(result, 1).census).toBe(2);
    expect(atWeek(result, 1).revenue).toBe(0);
    expect(atWeek(result, 4).census).toBeGreaterThan(0);
    expect(atWeek(result, 4).revenue).toBe(0);
  });

  it('lets census grow but keeps revenue at zero when p = 0', () => {
    const result = projectRevenueRunRate(paperInput({ p: 0, horizonWeeks: 4 }));
    expect(result.derived.revenuePerClientWeek).toBe(0);
    expect(atWeek(result, 1).census).toBe(2);
    expect(atWeek(result, 4).revenue).toBe(0);
  });

  it('returns only t = 0 when horizonWeeks = 0', () => {
    const result = projectRevenueRunRate(paperInput({ horizonWeeks: 0 }));
    expect(result.trajectory).toEqual([{ t: 0, census: 0, revenue: 0 }]);
  });

  it('returns trajectory length horizonWeeks + 1 with t = 0 ... horizonWeeks', () => {
    const result = projectRevenueRunRate(paperInput({ horizonWeeks: 7 }));
    expect(result.trajectory).toHaveLength(8);
    expect(result.trajectory.map((week) => week.t)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('allows non-integer n and L', () => {
    const result = projectRevenueRunRate({
      n: 1.5,
      L: 26.5,
      h: 10,
      p: 20,
      horizonWeeks: 2,
    });
    expect(result.derived.weeklyAttritionFraction).toBeCloseTo(1 / 26.5, 12);
    expect(result.derived.censusPlateau).toBeCloseTo(1.5 * 26.5, 12);
    expect(atWeek(result, 1).census).toBe(1.5);
  });
});

describe('projectRevenueRunRate invalid inputs', () => {
  it('rejects negative n', () => {
    expect(() => projectRevenueRunRate(paperInput({ n: -1 }))).toThrow(/n/);
  });

  it('rejects L = 0 and negative L', () => {
    expect(() => projectRevenueRunRate(paperInput({ L: 0 }))).toThrow(/L/);
    expect(() => projectRevenueRunRate(paperInput({ L: -52 }))).toThrow(/L/);
  });

  it('rejects negative h and p', () => {
    expect(() => projectRevenueRunRate(paperInput({ h: -1 }))).toThrow(/h/);
    expect(() => projectRevenueRunRate(paperInput({ p: -1 }))).toThrow(/p/);
  });

  it('rejects negative and fractional horizonWeeks', () => {
    expect(() => projectRevenueRunRate(paperInput({ horizonWeeks: -1 }))).toThrow(/horizonWeeks/);
    expect(() => projectRevenueRunRate(paperInput({ horizonWeeks: 1.5 }))).toThrow(/horizonWeeks/);
  });

  it('rejects NaN and Infinity inputs', () => {
    expect(() => projectRevenueRunRate(paperInput({ n: Number.NaN }))).toThrow(/n/);
    expect(() => projectRevenueRunRate(paperInput({ L: Number.POSITIVE_INFINITY }))).toThrow(/L/);
    expect(() => projectRevenueRunRate(paperInput({ h: Number.NEGATIVE_INFINITY }))).toThrow(/h/);
    expect(() => projectRevenueRunRate(paperInput({ p: Number.NaN }))).toThrow(/p/);
    expect(() => projectRevenueRunRate(paperInput({ horizonWeeks: Number.POSITIVE_INFINITY }))).toThrow(/horizonWeeks/);
  });
});
