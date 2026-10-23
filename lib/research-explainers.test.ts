import { describe, expect, it } from 'vitest';
import { compareCashTimingScenario } from './cash-timing-scenario';
import { delayedReimbursementFixture, formatUsd } from './cash-timing-scenario-demo';
import { buildInvestigationPlan } from './finance-ontology-investigation';
import { getPaperRunRateScenarios } from './revenue-run-rate-scenario-demo';
import { formatUsdMillions, getGrowthTargetScenarios, growthTargetReference } from './revenue-run-rate-target-demo';
import {
  explainCashTimingComparison,
  explainCensusChart,
  explainGrowthTargetChart,
  explainInvestigationPlan,
  explainOntologyGraph,
  explainRevenueRunRateChart,
} from './research-explainers';
import { explainerSlotLabels } from './visualization-explainer';

describe('explainer slot labels', () => {
  it('uses visualization and investigation labels', () => {
    expect(explainerSlotLabels.visualization.whatYouAreLookingAt).toBe('What you are looking at');
    expect(explainerSlotLabels.investigation.whatYouAreLookingAt).toBe('How to read this');
    expect(explainerSlotLabels.investigation.whyItMatters).toBe('Evidence status');
  });
});

describe('research explainers interpolate deterministic results', () => {
  it('cash timing comparison uses engine shortfall and timing difference', () => {
    const result = compareCashTimingScenario(delayedReimbursementFixture);
    const explainer = explainCashTimingComparison(result);
    expect(explainer.whatItShows).toContain(formatUsd(result.timingDifference));
    expect(explainer.whatItShows).toContain(formatUsd(result.scenarioShortfall));
    expect(explainer.boundedConclusion).not.toMatch(/loss of/i);
  });

  it('run-rate explainers use engine plateaus', () => {
    const scenarios = getPaperRunRateScenarios();
    const revenue = explainRevenueRunRateChart(scenarios);
    const census = explainCensusChart(scenarios);
    expect(revenue.whatItShows).toContain('$109,200/week');
    expect(census.whatItShows).toContain('104 clients');
  });

  it('growth target explainer uses analysis first-hit weeks and states', () => {
    const scenarios = getGrowthTargetScenarios();
    const explainer = explainGrowthTargetChart(
      scenarios,
      growthTargetReference.targetAnnualizedRunRate,
      growthTargetReference.weeksPerYear,
    );
    const n2 = scenarios[1].analysis;
    const n3 = scenarios[2].analysis;
    expect(explainer.whatItShows).toMatch(/Unreachable under assumptions/i);
    expect(explainer.whatItShows).toContain(`week ${n2.firstReachedWeek}`);
    expect(explainer.whatItShows).toContain(`week ${n3.firstReachedWeek}`);
    expect(explainer.whatItShows).toContain(formatUsdMillions(growthTargetReference.targetAnnualizedRunRate));
    expect(explainer.boundedConclusion).toMatch(/not a recommendation/i);
  });

  it('ontology explainers preserve insufficient evidence', () => {
    const plan = buildInvestigationPlan('cash-collections-decline');
    const graph = explainOntologyGraph(plan);
    const steps = explainInvestigationPlan(plan);
    expect(graph.boundedConclusion).toBe(plan.conclusionMessage);
    expect(graph.boundedConclusion).toMatch(/Insufficient evidence to assign a cause/i);
    expect(steps.whyItMatters).toMatch(/not attached/i);
    expect(steps.boundedConclusion).toMatch(/does not establish that denials/i);
  });
});
