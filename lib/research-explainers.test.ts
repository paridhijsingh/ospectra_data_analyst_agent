import { describe, expect, it } from 'vitest';
import { compareCashTimingScenario } from './cash-timing-scenario';
import { delayedReimbursementFixture, formatUsd } from './cash-timing-scenario-demo';
import { buildInvestigationPlan } from './finance-ontology-investigation';
import { getPaperRunRateScenarios } from './revenue-run-rate-scenario-demo';
import { formatUsdMillions, getGrowthTargetScenarios, growthTargetReference } from './revenue-run-rate-target-demo';
import {
  explainCashTimingComparison,
  explainCashTimingTimeline,
  explainCensusChart,
  explainGrowthTargetChart,
  explainInvestigationPlan,
  explainOntologyGraph,
  explainRevenueRunRateChart,
} from './research-explainers';
import { explainerActionSlotLabels, explainerSlotLabels, type GovernedExplainer } from './visualization-explainer';

function assertActionSlotsBackfilled(explainer: GovernedExplainer) {
  expect(explainer.comparativeInsight).toEqual(expect.any(String));
  expect(explainer.comparativeInsight!.length).toBeGreaterThan(0);
  expect(explainer.nextAction).toEqual(expect.any(String));
  const nextAction = explainer.nextAction!.trim();
  expect(nextAction.endsWith('.')).toBe(true);
  // Single sentence: no sentence break after a period (decimals like 1.76 are allowed).
  expect(nextAction.slice(0, -1)).not.toMatch(/\.\s+[A-Z]/);
  expect(explainer.followUps).toEqual(
    expect.objectContaining({
      drillDown: expect.any(String),
      drillUp: expect.any(String),
      drillAcross: expect.any(String),
    }),
  );
  expect(Object.keys(explainer.followUps!)).toEqual(['drillDown', 'drillUp', 'drillAcross']);
}

function assertActionSlotsAbsent(explainer: GovernedExplainer) {
  expect(explainer.comparativeInsight).toBeUndefined();
  expect(explainer.nextAction).toBeUndefined();
  expect(explainer.followUps).toBeUndefined();
}

describe('explainer slot labels', () => {
  it('uses visualization and investigation labels', () => {
    expect(explainerSlotLabels.visualization.whatYouAreLookingAt).toBe('What you are looking at');
    expect(explainerSlotLabels.investigation.whatYouAreLookingAt).toBe('How to read this');
    expect(explainerSlotLabels.investigation.whyItMatters).toBe('Evidence status');
    expect(explainerActionSlotLabels.comparativeInsight).toBe('Compared to baseline');
    expect(explainerActionSlotLabels.nextAction).toBe('Next action');
    expect(explainerActionSlotLabels.followUps).toBe('Ask next');
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

describe('explainer schema v2 action slots', () => {
  it('backfills comparativeInsight, nextAction, and followUps for cash timing, growth target, and ontology graph', () => {
    const cash = explainCashTimingComparison(compareCashTimingScenario(delayedReimbursementFixture));
    const growth = explainGrowthTargetChart(
      getGrowthTargetScenarios(),
      growthTargetReference.targetAnnualizedRunRate,
      growthTargetReference.weeksPerYear,
    );
    const graph = explainOntologyGraph(buildInvestigationPlan('cash-collections-decline'));

    assertActionSlotsBackfilled(cash);
    assertActionSlotsBackfilled(growth);
    assertActionSlotsBackfilled(graph);

    expect(cash.comparativeInsight).toBe(
      'Baseline: $105K available before the Oct 6 obligation. Delayed: $65K. The $40K timing difference is the entire risk — the amounts never change.',
    );
    expect(cash.nextAction).toBe(
      "Chase Receipt B's payer before Oct 5; every day it slips past the cutoff leaves the $70K obligation uncovered.",
    );
    expect(growth.nextAction).toBe(
      'Hold admissions at or above about 1.76/week — below that pace the $5M run-rate is unreachable at the current lifetime, hours, and rate.',
    );
    expect(graph.followUps?.drillAcross).toBe(
      'Where does CashCollections connect back to the cash-timing scenario?',
    );
  });

  it('leaves the other explainers without the new optional slots', () => {
    const scenarios = getPaperRunRateScenarios();
    const plan = buildInvestigationPlan('cash-collections-decline');
    assertActionSlotsAbsent(explainCashTimingTimeline(compareCashTimingScenario(delayedReimbursementFixture), delayedReimbursementFixture));
    assertActionSlotsAbsent(explainRevenueRunRateChart(scenarios));
    assertActionSlotsAbsent(explainCensusChart(scenarios));
    assertActionSlotsAbsent(explainInvestigationPlan(plan));
  });
});
