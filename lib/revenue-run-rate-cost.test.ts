import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  applyRunRateCosts,
  calculateWeeklyEconomics,
  costAssumptionDisclaimer,
  defaultRunRateCostAssumptions,
  directAndVariableExceedRevenue,
  interpretModeledContribution,
} from './revenue-run-rate-cost';
import { projectRevenueRunRate } from './revenue-run-rate-scenario';

const PAPER = { n: 2, L: 52, h: 30, p: 35, horizonWeeks: 208 } as const;
const WEEKLY_PLATEAU = 109_200;
const BASELINE = defaultRunRateCostAssumptions;

describe('calculateWeeklyEconomics paper plateau', () => {
  const economics = calculateWeeklyEconomics(WEEKLY_PLATEAU, BASELINE);

  it('computes direct service cost as revenue times the direct ratio', () => {
    expect(economics.directServiceCost).toBe(WEEKLY_PLATEAU * 0.65);
    expect(economics.directServiceCost).toBe(70_980);
  });

  it('computes variable operating cost as revenue times the variable ratio', () => {
    expect(economics.variableOperatingCost).toBe(WEEKLY_PLATEAU * 0.08);
    expect(economics.variableOperatingCost).toBe(8_736);
  });

  it('includes the unchanged weekly fixed operating cost', () => {
    expect(economics.fixedOperatingCost).toBe(25_000);
  });

  it('sums direct, variable, and fixed into total modeled cost', () => {
    expect(economics.totalModeledCost).toBe(70_980 + 8_736 + 25_000);
    expect(economics.totalModeledCost).toBe(104_716);
  });

  it('computes modeled contribution as revenue minus total modeled cost', () => {
    expect(economics.modeledContribution).toBe(109_200 - 104_716);
    expect(economics.modeledContribution).toBe(4_484);
  });

  it('computes contribution margin as contribution divided by revenue', () => {
    expect(economics.contributionMargin).toBeCloseTo(4_484 / 109_200, 12);
    expect(economics.contributionMargin).toBeCloseTo(0.04106, 5);
  });
});

describe('applyRunRateCosts uses the existing revenue trajectory', () => {
  const result = projectRevenueRunRate(PAPER);
  const costs = applyRunRateCosts(result, BASELINE);

  it('leaves census and billed plateaus unchanged', () => {
    expect(result.derived.censusPlateau).toBe(104);
    expect(result.derived.revenuePlateau).toBe(109_200);
  });

  it('applies plateau economics to the engine revenue plateau, not a hard-coded dollar amount', () => {
    expect(costs.atPlateau.weeklyRevenue).toBe(result.derived.revenuePlateau);
    expect(costs.atPlateau).toEqual(calculateWeeklyEconomics(result.derived.revenuePlateau, BASELINE));
    expect(costs.atPlateau.modeledContribution).toBe(4_484);
  });

  it('maps each trajectory week from that week’s billed revenue', () => {
    const week = result.trajectory[110];
    const costWeek = costs.trajectory[110];
    expect(costWeek.t).toBe(week.t);
    expect(costWeek.weeklyRevenue).toBe(week.revenue);
    expect(costWeek.directServiceCost).toBe(week.revenue * BASELINE.directServiceCostRatio);
    expect(costWeek.variableOperatingCost).toBe(week.revenue * BASELINE.variableOperatingCostRatio);
    expect(costWeek.fixedOperatingCost).toBe(BASELINE.fixedOperatingCostPerWeek);
  });

  it('reports end-of-horizon economics from the last trajectory week', () => {
    const last = result.trajectory[result.trajectory.length - 1];
    expect(costs.atHorizon.t).toBe(last.t);
    expect(costs.atHorizon.weeklyRevenue).toBe(last.revenue);
    expect(costs.atHorizon.modeledContribution).toBe(
      last.revenue - (last.revenue * 0.65 + last.revenue * 0.08 + 25_000),
    );
  });
});

describe('zero-revenue divide-by-zero behavior', () => {
  it('returns a null contribution margin when weekly revenue is 0', () => {
    const economics = calculateWeeklyEconomics(0, BASELINE);
    expect(economics.weeklyRevenue).toBe(0);
    expect(economics.directServiceCost).toBe(0);
    expect(economics.variableOperatingCost).toBe(0);
    expect(economics.fixedOperatingCost).toBe(25_000);
    expect(economics.totalModeledCost).toBe(25_000);
    expect(economics.modeledContribution).toBe(-25_000);
    expect(economics.contributionMargin).toBeNull();
  });

  it('uses the inception week of the run-rate trajectory as a zero-revenue case', () => {
    const result = projectRevenueRunRate(PAPER);
    const costs = applyRunRateCosts(result, BASELINE);
    expect(result.trajectory[0].revenue).toBe(0);
    expect(costs.trajectory[0].contributionMargin).toBeNull();
    expect(costs.trajectory[0].modeledContribution).toBe(-25_000);
  });
});

describe('negative and invalid cost inputs', () => {
  it('rejects negative or non-finite ratios and fixed cost', () => {
    expect(() => calculateWeeklyEconomics(109_200, { ...BASELINE, directServiceCostRatio: -0.1 })).toThrow(
      /directServiceCostRatio/,
    );
    expect(() => calculateWeeklyEconomics(109_200, { ...BASELINE, variableOperatingCostRatio: -0.01 })).toThrow(
      /variableOperatingCostRatio/,
    );
    expect(() => calculateWeeklyEconomics(109_200, { ...BASELINE, fixedOperatingCostPerWeek: -1 })).toThrow(
      /fixedOperatingCostPerWeek/,
    );
    expect(() => calculateWeeklyEconomics(109_200, { ...BASELINE, directServiceCostRatio: Number.NaN })).toThrow(
      /directServiceCostRatio/,
    );
    expect(() => calculateWeeklyEconomics(Number.NEGATIVE_INFINITY, BASELINE)).toThrow(/weeklyRevenue/);
  });

  it('rejects a direct service ratio above 1', () => {
    expect(() => calculateWeeklyEconomics(109_200, { ...BASELINE, directServiceCostRatio: 1.01 })).toThrow(
      /directServiceCostRatio/,
    );
  });

  it('allows a direct ratio of 1 and a variable ratio that makes the sum exceed 100%', () => {
    const economics = calculateWeeklyEconomics(100, {
      directServiceCostRatio: 1,
      variableOperatingCostRatio: 0.1,
      fixedOperatingCostPerWeek: 0,
    });
    expect(economics.directServiceCost).toBe(100);
    expect(economics.variableOperatingCost).toBe(10);
    expect(economics.modeledContribution).toBe(-10);
  });
});

describe('direct and variable costs exceeding revenue', () => {
  it('flags when direct plus variable ratios are greater than 100%', () => {
    expect(directAndVariableExceedRevenue({ directServiceCostRatio: 0.65, variableOperatingCostRatio: 0.08 })).toBe(
      false,
    );
    expect(directAndVariableExceedRevenue({ directServiceCostRatio: 0.95, variableOperatingCostRatio: 0.1 })).toBe(
      true,
    );
    expect(
      applyRunRateCosts(projectRevenueRunRate(PAPER), {
        ...BASELINE,
        directServiceCostRatio: 0.9,
        variableOperatingCostRatio: 0.2,
      }).directAndVariableExceedRevenue,
    ).toBe(true);
  });
});

describe('unfavorable contribution scenario', () => {
  it('produces negative modeled contribution when fixed cost is high enough', () => {
    const economics = calculateWeeklyEconomics(WEEKLY_PLATEAU, {
      ...BASELINE,
      fixedOperatingCostPerWeek: 80_000,
    });
    expect(economics.totalModeledCost).toBe(70_980 + 8_736 + 80_000);
    expect(economics.modeledContribution).toBe(109_200 - 159_716);
    expect(economics.modeledContribution).toBe(-50_516);
    expect(economics.contributionMargin).toBeLessThan(0);
  });
});

describe('interpretModeledContribution', () => {
  it('uses only the calculated contribution and target-reached flag', () => {
    expect(interpretModeledContribution({ modeledContribution: 4_484, targetReached: true })).toBe(
      'The selected assumptions produce positive modeled contribution at the end of the horizon.',
    );
    expect(interpretModeledContribution({ modeledContribution: -50_516, targetReached: false })).toBe(
      'The selected assumptions produce negative modeled contribution at the end of the horizon.',
    );
    expect(interpretModeledContribution({ modeledContribution: -1, targetReached: true })).toBe(
      'The modeled revenue target is reached, but the selected cost assumptions do not produce positive modeled contribution.',
    );
    expect(interpretModeledContribution({ modeledContribution: 0, targetReached: false })).toBe(
      'The selected assumptions produce zero modeled contribution at the end of the horizon.',
    );
  });
});

describe('cost overlay governance', () => {
  const source = readFileSync(new URL('./revenue-run-rate-cost.ts', import.meta.url), 'utf8');

  it('stays a billed-run-rate overlay and does not restate the census recurrence', () => {
    expect(source).not.toMatch(/C\(t\s*\+\s*1\)/);
    expect(source).not.toMatch(/1\s*-\s*1\s*\/\s*L/);
    expect(source).not.toMatch(/cash-timing-scenario/);
    expect(source).not.toMatch(/financial-metrics|financial-intent-registry|orchestrator|finance-ontology/);
    expect(costAssumptionDisclaimer).toBe('Scenario assumptions — not OSpectra actuals.');
    const economics = calculateWeeklyEconomics(WEEKLY_PLATEAU, BASELINE);
    expect(economics).not.toHaveProperty('profit');
    expect(economics).not.toHaveProperty('cash');
    expect(economics).not.toHaveProperty('recommendation');
  });
});
