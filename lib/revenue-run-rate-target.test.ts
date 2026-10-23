import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { projectRevenueRunRate, type RevenueRunRateResult } from './revenue-run-rate-scenario';
import { analyzeRunRateTarget, requiredSteadyStateAdmissions } from './revenue-run-rate-target';

const PAPER = { L: 52, h: 30, p: 35, horizonWeeks: 208 } as const;
const TARGET_ANNUALIZED = 5_000_000;
const WEEKS_PER_YEAR = 52;

const paperResult = (n: number, horizonWeeks: number = PAPER.horizonWeeks): RevenueRunRateResult =>
  projectRevenueRunRate({ n, L: PAPER.L, h: PAPER.h, p: PAPER.p, horizonWeeks });

const firstHitWeek = (result: RevenueRunRateResult, targetWeekly: number): number | undefined =>
  result.trajectory.find((week) => week.revenue >= targetWeekly)?.t;

describe('requiredSteadyStateAdmissions $5M reference', () => {
  const required = requiredSteadyStateAdmissions({
    L: PAPER.L,
    h: PAPER.h,
    p: PAPER.p,
    targetAnnualizedRunRate: TARGET_ANNUALIZED,
    weeksPerYear: WEEKS_PER_YEAR,
  });

  it('uses the 52-week annualized weekly equivalent', () => {
    expect(required.targetWeeklyRunRate).toBeCloseTo(5_000_000 / 52, 10);
    expect(required.targetWeeklyRunRate).toBeCloseTo(96_153.84615384616, 8);
  });

  it('returns nRequired = (5_000_000 / 52) / (30 * 35 * 52)', () => {
    expect(required.nRequired).toBeCloseTo((5_000_000 / 52) / (30 * 35 * 52), 12);
    expect(required.nRequired).toBeCloseTo(1.76106, 5);
  });

  it('implies an annualized plateau equal to the target', () => {
    expect(required.impliedWeeklyPlateau).toBeCloseTo(5_000_000 / 52, 8);
    expect(required.impliedAnnualizedPlateau).toBeCloseTo(5_000_000, 6);
  });
});

describe('analyzeRunRateTarget paper admissions vs $5M', () => {
  const n1 = paperResult(1);
  const n2 = paperResult(2);
  const n3 = paperResult(3);
  const targetWeekly = TARGET_ANNUALIZED / WEEKS_PER_YEAR;

  it('annualizes n=1 as unreachable under the fixed assumptions', () => {
    const analysis = analyzeRunRateTarget({
      result: n1,
      targetAnnualizedRunRate: TARGET_ANNUALIZED,
      weeksPerYear: WEEKS_PER_YEAR,
    });
    expect(n1.derived.revenuePlateau).toBe(54_600);
    expect(analysis.annualizedPlateau).toBe(2_839_200);
    expect(analysis.state).toBe('UNREACHABLE_UNDER_ASSUMPTIONS');
    expect(analysis.firstReachedWeek).toBeNull();
    expect(analysis.firstReachedAnnualized).toBeNull();
  });

  it('marks n=2 as reached at the earliest canonical trajectory week', () => {
    const analysis = analyzeRunRateTarget({
      result: n2,
      targetAnnualizedRunRate: TARGET_ANNUALIZED,
      weeksPerYear: WEEKS_PER_YEAR,
    });
    expect(n2.derived.revenuePlateau).toBe(109_200);
    expect(analysis.annualizedPlateau).toBe(5_678_400);
    expect(analysis.state).toBe('REACHED');
    expect(analysis.firstReachedWeek).toBe(firstHitWeek(n2, targetWeekly));
    const hit = n2.trajectory.find((week) => week.t === analysis.firstReachedWeek);
    expect(hit).toBeDefined();
    expect(analysis.firstReachedAnnualized).toBe(hit!.revenue * WEEKS_PER_YEAR);
  });

  it('marks n=3 as reached at the earliest canonical trajectory week', () => {
    const analysis = analyzeRunRateTarget({
      result: n3,
      targetAnnualizedRunRate: TARGET_ANNUALIZED,
      weeksPerYear: WEEKS_PER_YEAR,
    });
    expect(n3.derived.revenuePlateau).toBe(163_800);
    expect(analysis.annualizedPlateau).toBe(8_517_600);
    expect(analysis.state).toBe('REACHED');
    expect(analysis.firstReachedWeek).toBe(firstHitWeek(n3, targetWeekly));
    const hit = n3.trajectory.find((week) => week.t === analysis.firstReachedWeek);
    expect(hit).toBeDefined();
    expect(analysis.firstReachedAnnualized).toBe(hit!.revenue * WEEKS_PER_YEAR);
  });
});

describe('analyzeRunRateTarget boundary states', () => {
  it('classifies a plateau strictly below target as unreachable', () => {
    const result = paperResult(1, 208);
    const analysis = analyzeRunRateTarget({
      result,
      targetAnnualizedRunRate: TARGET_ANNUALIZED,
      weeksPerYear: WEEKS_PER_YEAR,
    });
    expect(result.derived.revenuePlateau).toBeLessThan(TARGET_ANNUALIZED / WEEKS_PER_YEAR);
    expect(analysis.state).toBe('UNREACHABLE_UNDER_ASSUMPTIONS');
  });

  it('classifies a short horizon with a sufficient plateau as not reached within horizon', () => {
    const result = paperResult(2, 10);
    const analysis = analyzeRunRateTarget({
      result,
      targetAnnualizedRunRate: TARGET_ANNUALIZED,
      weeksPerYear: WEEKS_PER_YEAR,
    });
    expect(result.derived.revenuePlateau).toBeGreaterThan(TARGET_ANNUALIZED / WEEKS_PER_YEAR);
    expect(analysis.state).toBe('NOT_REACHED_WITHIN_HORIZON');
    expect(analysis.firstReachedWeek).toBeNull();
  });

  it('classifies plateau equal to target as not reached within horizon', () => {
    const result = paperResult(1, 400);
    const targetWeekly = result.derived.revenuePlateau;
    const analysis = analyzeRunRateTarget({
      result,
      targetAnnualizedRunRate: targetWeekly * WEEKS_PER_YEAR,
      weeksPerYear: WEEKS_PER_YEAR,
    });
    expect(result.trajectory.every((week) => week.revenue < targetWeekly)).toBe(true);
    expect(analysis.state).toBe('NOT_REACHED_WITHIN_HORIZON');
    expect(analysis.firstReachedWeek).toBeNull();
    expect(analysis.firstReachedAnnualized).toBeNull();
  });

  it('counts equality at a finite trajectory point as reached', () => {
    const result = projectRevenueRunRate({ n: 1, L: 52, h: 10, p: 10, horizonWeeks: 5 });
    const analysis = analyzeRunRateTarget({
      result,
      targetAnnualizedRunRate: 100 * WEEKS_PER_YEAR,
      weeksPerYear: WEEKS_PER_YEAR,
    });
    expect(result.trajectory[1].revenue).toBe(100);
    expect(analysis.state).toBe('REACHED');
    expect(analysis.firstReachedWeek).toBe(1);
    expect(analysis.firstReachedAnnualized).toBe(100 * WEEKS_PER_YEAR);
  });

  it('returns the earliest qualifying week, not a later one', () => {
    const result = projectRevenueRunRate({ n: 2, L: 52, h: 30, p: 35, horizonWeeks: 20 });
    const targetWeekly = result.trajectory[5].revenue;
    const analysis = analyzeRunRateTarget({
      result,
      targetAnnualizedRunRate: targetWeekly * WEEKS_PER_YEAR,
      weeksPerYear: WEEKS_PER_YEAR,
    });
    expect(analysis.firstReachedWeek).toBe(5);
    expect(analysis.firstReachedWeek).toBe(firstHitWeek(result, targetWeekly));
    expect(analysis.firstReachedAnnualized).toBe(result.trajectory[5].revenue * WEEKS_PER_YEAR);
  });
});

describe('target analysis validation', () => {
  const result = paperResult(2, 0);

  it('rejects non-positive or non-finite analyze inputs', () => {
    expect(() => analyzeRunRateTarget({ result, targetAnnualizedRunRate: 0, weeksPerYear: 52 })).toThrow(/targetAnnualizedRunRate/);
    expect(() => analyzeRunRateTarget({ result, targetAnnualizedRunRate: -1, weeksPerYear: 52 })).toThrow(/targetAnnualizedRunRate/);
    expect(() => analyzeRunRateTarget({ result, targetAnnualizedRunRate: Number.NaN, weeksPerYear: 52 })).toThrow(/targetAnnualizedRunRate/);
    expect(() => analyzeRunRateTarget({ result, targetAnnualizedRunRate: 5_000_000, weeksPerYear: 0 })).toThrow(/weeksPerYear/);
    expect(() => analyzeRunRateTarget({ result, targetAnnualizedRunRate: 5_000_000, weeksPerYear: Number.POSITIVE_INFINITY })).toThrow(/weeksPerYear/);
  });

  it('rejects non-positive intensity when inverting admissions', () => {
    const base = { L: 52, h: 30, p: 35, targetAnnualizedRunRate: 5_000_000, weeksPerYear: 52 };
    expect(() => requiredSteadyStateAdmissions({ ...base, L: 0 })).toThrow(/L/);
    expect(() => requiredSteadyStateAdmissions({ ...base, h: 0 })).toThrow(/h/);
    expect(() => requiredSteadyStateAdmissions({ ...base, p: 0 })).toThrow(/p/);
    expect(() => requiredSteadyStateAdmissions({ ...base, h: Number.NEGATIVE_INFINITY })).toThrow(/h/);
    expect(() => requiredSteadyStateAdmissions({ ...base, targetAnnualizedRunRate: Number.NaN })).toThrow(/targetAnnualizedRunRate/);
  });
});

describe('target analysis governance', () => {
  const source = readFileSync(new URL('./revenue-run-rate-target.ts', import.meta.url), 'utf8');

  it('stays a billed-run-rate composition layer', () => {
    expect(source).not.toMatch(/cash-timing-scenario/);
    expect(source).not.toMatch(/financial-metrics|financial-intent-registry|orchestrator|finance-ontology/);
    const analysis = analyzeRunRateTarget({
      result: paperResult(2),
      targetAnnualizedRunRate: TARGET_ANNUALIZED,
      weeksPerYear: WEEKS_PER_YEAR,
    });
    expect(analysis).not.toHaveProperty('cash');
    expect(analysis).not.toHaveProperty('collections');
    expect(analysis).not.toHaveProperty('profit');
    expect(analysis).not.toHaveProperty('margin');
    expect(analysis).not.toHaveProperty('recommendation');
  });
});
