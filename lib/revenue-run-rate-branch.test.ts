import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { defaultRunRateCostAssumptions } from './revenue-run-rate-cost';
import {
  analyzeBranchCompanyTarget,
  applyCompanyRevenueCosts,
  branchScenarioDisclaimer,
  branchSteadyStateCensus,
  defaultBranchScenarios,
  interpretBranchExpansion,
  projectBranchScenario,
  projectCompanyBranches,
  type BranchScenarioInput,
} from './revenue-run-rate-branch';

const SHARED = { h: 30, p: 35, horizonWeeks: 208, weeksPerYear: 52 } as const;

const branch1: BranchScenarioInput = {
  id: 'branch-1',
  name: 'Branch 1',
  openingWeek: 0,
  weeklyAdmissions: 2,
  clientLifetimeWeeks: 52,
  maxActiveClients: 100,
};

const branch2: BranchScenarioInput = {
  id: 'branch-2',
  name: 'Branch 2',
  openingWeek: 52,
  weeklyAdmissions: 2,
  clientLifetimeWeeks: 52,
  maxActiveClients: 100,
};

const atWeek = <T extends { t: number }>(trajectory: readonly T[], t: number): T => {
  const week = trajectory.find((item) => item.t === t);
  if (!week) throw new Error(`Missing week ${t}`);
  return week;
};

describe('Case A — single branch capacity', () => {
  const result = projectBranchScenario(branch1, SHARED);

  it('caps the census plateau below the uncapped n × L value', () => {
    expect(2 * 52).toBe(104);
    expect(result.derived.uncappedCensusPlateau).toBe(104);
    expect(result.derived.censusPlateau).toBe(100);
    expect(branchSteadyStateCensus(branch1)).toBe(100);
  });

  it('derives weekly and annualized plateaus from the capped census', () => {
    expect(result.derived.weeklyRevenuePlateau).toBe(100 * 30 * 35);
    expect(result.derived.weeklyRevenuePlateau).toBe(105_000);
    expect(result.derived.annualizedPlateau).toBe(105_000 * 52);
    expect(result.derived.annualizedPlateau).toBe(5_460_000);
  });

  it('never exceeds maxActiveClients on the trajectory', () => {
    expect(result.trajectory.every((week) => week.census <= 100)).toBe(true);
    expect(result.trajectory.every((week) => week.census >= 0)).toBe(true);
  });
});

describe('Case B — second branch opens', () => {
  const company = projectCompanyBranches([branch1, branch2], SHARED);

  it('aggregates capped branch plateaus into the company plateau', () => {
    expect(company.derived.companyCensusPlateau).toBe(200);
    expect(company.derived.companyWeeklyRevenuePlateau).toBe(200 * 30 * 35);
    expect(company.derived.companyWeeklyRevenuePlateau).toBe(210_000);
    expect(company.derived.companyAnnualizedPlateau).toBe(210_000 * 52);
    expect(company.derived.companyAnnualizedPlateau).toBe(10_920_000);
  });

  it('sums branch census and revenue each week', () => {
    const week = atWeek(company.trajectory, 80);
    const b1 = atWeek(company.branches[0].trajectory, 80);
    const b2 = atWeek(company.branches[1].trajectory, 80);
    expect(week.totalCensus).toBe(b1.census + b2.census);
    expect(week.totalWeeklyRevenue).toBe(b1.weeklyRevenue + b2.weeklyRevenue);
    expect(week.annualizedRunRate).toBe(week.totalWeeklyRevenue * 52);
  });
});

describe('Case C — no revenue before branch opening', () => {
  const result = projectBranchScenario(branch2, SHARED);

  it('keeps census and revenue at 0 for weeks 0–51', () => {
    for (let t = 0; t <= 51; t += 1) {
      const week = atWeek(result.trajectory, t);
      expect(week.census).toBe(0);
      expect(week.weeklyRevenue).toBe(0);
    }
  });

  it('records opening-week census as 0, matching inception timing', () => {
    expect(atWeek(result.trajectory, 52).census).toBe(0);
    expect(atWeek(result.trajectory, 53).census).toBe(2);
    expect(atWeek(result.trajectory, 53).weeklyRevenue).toBe(2 * 30 * 35);
  });
});

describe('Case D — capacity enforcement', () => {
  it('clamps a high-admissions branch to maxActiveClients', () => {
    const result = projectBranchScenario(
      {
        id: 'hot',
        name: 'Hot',
        openingWeek: 0,
        weeklyAdmissions: 50,
        clientLifetimeWeeks: 52,
        maxActiveClients: 10,
      },
      { ...SHARED, horizonWeeks: 20 },
    );
    expect(result.derived.uncappedCensusPlateau).toBe(50 * 52);
    expect(result.derived.censusPlateau).toBe(10);
    expect(Math.max(...result.trajectory.map((week) => week.census))).toBe(10);
    expect(result.trajectory.every((week) => week.census <= 10)).toBe(true);
  });
});

describe('branch recurrence after opening', () => {
  it('adds admissions and applies attrition after the opening week', () => {
    const result = projectBranchScenario(branch1, { ...SHARED, horizonWeeks: 3 });
    expect(atWeek(result.trajectory, 0).census).toBe(0);
    expect(atWeek(result.trajectory, 1).census).toBe(2);
    const week2 = 2 * (1 - 1 / 52) + 2;
    expect(atWeek(result.trajectory, 2).census).toBeCloseTo(week2, 12);
    expect(atWeek(result.trajectory, 2).weeklyRevenue).toBeCloseTo(week2 * 30 * 35, 8);
  });
});

describe('Case E — expansion changes target reachability', () => {
  const company = projectCompanyBranches([branch1, branch2], SHARED);
  const branch1Only = projectCompanyBranches([branch1], SHARED);
  const target = 10_000_000;

  it('marks Branch 1 alone as unreachable for a $10M target', () => {
    const analysis = analyzeBranchCompanyTarget({
      company: branch1Only,
      targetAnnualizedRunRate: target,
      weeksPerYear: 52,
    });
    expect(branch1Only.derived.companyAnnualizedPlateau).toBe(5_460_000);
    expect(analysis.state).toBe('UNREACHABLE_UNDER_ASSUMPTIONS');
    expect(analysis.firstReachedWeek).toBeNull();
  });

  it('uses the company trajectory against $10M rather than forcing REACHED', () => {
    const analysis = analyzeBranchCompanyTarget({
      company,
      targetAnnualizedRunRate: target,
      weeksPerYear: 52,
    });
    expect(company.derived.companyAnnualizedPlateau).toBe(10_920_000);
    const firstHit = company.trajectory.find((week) => week.annualizedRunRate >= target);
    if (firstHit) {
      expect(analysis.state).toBe('REACHED');
      expect(analysis.firstReachedWeek).toBe(firstHit.t);
      expect(firstHit.t).toBeGreaterThanOrEqual(52);
    } else {
      expect(analysis.state).toBe('NOT_REACHED_WITHIN_HORIZON');
      expect(analysis.firstReachedWeek).toBeNull();
    }
  });

  it('classifies a short horizon with a sufficient plateau as not reached within horizon', () => {
    const short = projectCompanyBranches([branch1, branch2], { ...SHARED, horizonWeeks: 60 });
    const analysis = analyzeBranchCompanyTarget({
      company: short,
      targetAnnualizedRunRate: target,
      weeksPerYear: 52,
    });
    expect(short.derived.companyAnnualizedPlateau).toBe(10_920_000);
    expect(analysis.state).toBe('NOT_REACHED_WITHIN_HORIZON');
  });
});

describe('invalid input rejection', () => {
  it('rejects negative, non-finite, and non-integer opening inputs', () => {
    expect(() => projectBranchScenario({ ...branch1, openingWeek: -1 }, SHARED)).toThrow(/openingWeek/);
    expect(() => projectBranchScenario({ ...branch1, openingWeek: 1.5 }, SHARED)).toThrow(/openingWeek/);
    expect(() => projectBranchScenario({ ...branch1, weeklyAdmissions: -1 }, SHARED)).toThrow(/weeklyAdmissions/);
    expect(() => projectBranchScenario({ ...branch1, clientLifetimeWeeks: 0 }, SHARED)).toThrow(/clientLifetimeWeeks/);
    expect(() => projectBranchScenario({ ...branch1, maxActiveClients: -1 }, SHARED)).toThrow(/maxActiveClients/);
    expect(() => projectBranchScenario(branch1, { ...SHARED, h: Number.NaN })).toThrow(/h/);
    expect(() => projectBranchScenario(branch1, { ...SHARED, p: Number.NEGATIVE_INFINITY })).toThrow(/p/);
    expect(() => projectBranchScenario(branch1, { ...SHARED, horizonWeeks: -1 })).toThrow(/horizonWeeks/);
  });
});

describe('cost overlay on total company revenue', () => {
  const company = projectCompanyBranches([branch1, branch2], SHARED);
  const costs = applyCompanyRevenueCosts(company, defaultRunRateCostAssumptions);

  it('applies existing cost ratios to company weekly billed revenue', () => {
    const week = atWeek(company.trajectory, 80);
    const costWeek = costs.trajectory.find((item) => item.t === 80);
    expect(costWeek?.weeklyRevenue).toBe(week.totalWeeklyRevenue);
    expect(costWeek?.directServiceCost).toBe(week.totalWeeklyRevenue * 0.65);
    expect(costWeek?.variableOperatingCost).toBe(week.totalWeeklyRevenue * 0.08);
    expect(costWeek?.fixedOperatingCost).toBe(25_000);
  });

  it('uses the company plateau, not a single-branch plateau, for long-run economics', () => {
    expect(costs.atPlateau.weeklyRevenue).toBe(210_000);
    expect(costs.atPlateau.directServiceCost).toBe(210_000 * 0.65);
    expect(costs.atPlateau.modeledContribution).toBe(210_000 - (210_000 * 0.65 + 210_000 * 0.08 + 25_000));
  });
});

describe('interpretBranchExpansion', () => {
  it('uses only calculated states', () => {
    expect(
      interpretBranchExpansion({
        companyState: 'REACHED',
        branch1State: 'UNREACHABLE_UNDER_ASSUMPTIONS',
        firstReachedWeek: 170,
        branch2OpeningWeek: 52,
        modeledContribution: 1,
      }),
    ).toBe(
      'The target is not supported by the first operating configuration alone, but the modeled branch expansion raises company capacity enough to support it.',
    );
    expect(
      interpretBranchExpansion({
        companyState: 'UNREACHABLE_UNDER_ASSUMPTIONS',
        branch1State: 'UNREACHABLE_UNDER_ASSUMPTIONS',
        firstReachedWeek: null,
        branch2OpeningWeek: 52,
        modeledContribution: 1,
      }),
    ).toBe('The selected branch configuration remains below the target under the current assumptions.');
    expect(
      interpretBranchExpansion({
        companyState: 'REACHED',
        branch1State: 'NOT_REACHED_WITHIN_HORIZON',
        firstReachedWeek: 80,
        branch2OpeningWeek: 52,
        modeledContribution: 1,
      }),
    ).toBe('The modeled target is first reached after the second branch becomes active.');
    expect(
      interpretBranchExpansion({
        companyState: 'REACHED',
        branch1State: 'UNREACHABLE_UNDER_ASSUMPTIONS',
        firstReachedWeek: 170,
        branch2OpeningWeek: 52,
        modeledContribution: -1,
      }),
    ).toBe(
      'The expanded revenue scenario reaches the target, but the selected cost assumptions produce negative modeled contribution.',
    );
  });
});

describe('branch expansion governance', () => {
  const source = readFileSync(new URL('./revenue-run-rate-branch.ts', import.meta.url), 'utf8');

  it('stays isolated from routing and does not rewrite the uncapped recurrence module', () => {
    expect(source).not.toMatch(/cash-timing-scenario/);
    expect(source).not.toMatch(/financial-metrics|financial-intent-registry|orchestrator|finance-ontology/);
    expect(source).not.toMatch(/projectRevenueRunRate/);
    expect(branchScenarioDisclaimer).toBe('Reference scenario assumptions — not OSpectra actual branch capacity.');
    expect(defaultBranchScenarios).toHaveLength(2);
  });
});
