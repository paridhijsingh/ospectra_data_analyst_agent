/**
 * Derived explainer builders for research visuals.
 * Numbers come from deterministic helpers; this file does not recalculate models.
 */
import type { CashTimingScenarioInput, CashTimingScenarioResult } from './cash-timing-scenario';
import type { InvestigationPlan } from './finance-ontology-investigation';
import type { PaperRunRateScenario } from './revenue-run-rate-scenario-demo';
import { formatCensus, formatUsd as formatRunRateUsd } from './revenue-run-rate-scenario-demo';
import {
  formatTargetState,
  formatUsd as formatTargetUsd,
  formatUsdMillions,
  formatYearsFromWeeks,
  type GrowthTargetScenario,
} from './revenue-run-rate-target-demo';
import { formatUsd as formatCashUsd } from './cash-timing-scenario-demo';
import type { GovernedExplainer } from './visualization-explainer';

function scenarioShowLine(scenario: GrowthTargetScenario, weeksPerYear: number, targetLabel: string): string {
  const plateau = formatTargetUsd(scenario.analysis.annualizedPlateau);
  if (scenario.analysis.state === 'UNREACHABLE_UNDER_ASSUMPTIONS') {
    return `${scenario.label}: ${formatTargetState(scenario.analysis.state)}. Annualized plateau ${plateau} is below ${targetLabel}, so extending time alone cannot reach the target.`;
  }
  if (scenario.analysis.state === 'NOT_REACHED_WITHIN_HORIZON') {
    return `${scenario.label}: ${formatTargetState(scenario.analysis.state)}. The plateau ${plateau} supports ${targetLabel}, but the returned trajectory does not reach it in this horizon.`;
  }
  const week = scenario.analysis.firstReachedWeek;
  const years =
    week != null ? ` (~${formatYearsFromWeeks(week, weeksPerYear)} years)` : '';
  return `${scenario.label}: ${formatTargetState(scenario.analysis.state)} at week ${week}${years}. Annualized plateau ${plateau}.`;
}

export function explainCashTimingComparison(
  result: CashTimingScenarioResult,
): GovernedExplainer {
  return {
    id: 'cash-timing-comparison',
    title: 'Cash available before the obligation',
    mode: 'visualization',
    whatYouAreLookingAt:
      'The same opening cash, reimbursement amounts, and obligation are compared under two receipt-timing assumptions.',
    whatItShows:
      `Baseline cash before the obligation is ${formatCashUsd(result.baselineCashBeforeObligation)}; the delayed scenario is ${formatCashUsd(result.scenarioCashBeforeObligation)}. Timing difference is ${formatCashUsd(result.timingDifference)}. Baseline shortfall is ${formatCashUsd(result.baselineShortfall)}; scenario shortfall is ${formatCashUsd(result.scenarioShortfall)}.`,
    whyItMatters:
      'A reimbursement that moves past the obligation cutoff is no longer available before that obligation date. The reimbursement amount itself did not change.',
    boundedConclusion:
      `Under this synthetic timing scenario, reimbursement timing changes cash available before the obligation${result.scenarioShortfall > 0 ? ` and creates a scenario shortfall of ${formatCashUsd(result.scenarioShortfall)}` : ''}. The timing difference is not a financial loss.`,
    limitations: [
      'Synthetic data',
      'Scenario, not prediction',
      'Timing difference ≠ financial loss',
      'Not OSpectra actual cash',
    ],
  };
}

export function explainCashTimingTimeline(
  result: CashTimingScenarioResult,
  input: CashTimingScenarioInput,
): GovernedExplainer {
  const delayed = input.reimbursements.find((receipt) => receipt.delayedByDays > 0);
  const delayedAmount = delayed ? formatCashUsd(delayed.amount) : formatCashUsd(Math.abs(result.timingDifference));
  return {
    id: 'cash-timing-timeline',
    title: 'Reimbursement timing relative to the obligation',
    mode: 'visualization',
    whatYouAreLookingAt:
      'A calendar timeline showing receipt dates relative to the obligation cutoff.',
    whatItShows:
      `Receipts on or before the obligation date count in cash before the obligation. Receipts after the cutoff do not. In this scenario, ${delayedAmount} moves past the cutoff, matching the timing difference of ${formatCashUsd(result.timingDifference)}.`,
    whyItMatters:
      'The model includes a reimbursement in cash-before-obligation based only on its arrival date relative to the cutoff.',
    boundedConclusion:
      `Under these synthetic dates, cash available before the obligation falls by ${formatCashUsd(Math.abs(result.timingDifference))}. That amount is delayed, not lost revenue, and is not actual OSpectra cash.`,
    limitations: [
      'Synthetic data',
      'Scenario, not prediction',
      'Late reimbursement ≠ lost revenue',
      'Not actual payer behavior',
    ],
  };
}

export function explainRevenueRunRateChart(scenarios: readonly PaperRunRateScenario[]): GovernedExplainer {
  const plateaus = scenarios
    .map((scenario) => `${scenario.label} ${formatRunRateUsd(scenario.result.derived.revenuePlateau)}/week`)
    .join('; ');
  return {
    id: 'revenue-run-rate-chart',
    title: 'Revenue run-rate over time',
    mode: 'visualization',
    whatYouAreLookingAt:
      'Elapsed time on the x-axis and weekly billed run-rate on the y-axis. One line per weekly admissions assumption, with L, h, and p held fixed.',
    whatItShows:
      `Trajectories rise as active census builds, then flatten toward the long-run weekly billed plateau. With L, h, and p fixed, higher n produces a higher plateau (${plateaus}).`,
    whyItMatters:
      'A constant admissions rate combined with client attrition creates a long-run operating scale. This chart shows modeled billed run-rate, not collected cash.',
    boundedConclusion:
      'Under the model assumptions, changing weekly admissions changes the modeled billed run-rate trajectory and plateau. This does not establish actual company growth, demand, caregiver availability, or that billed amounts will be collected.',
    limitations: [
      'Reference parameters',
      'Scenario, not prediction',
      'Billed run-rate ≠ cash',
      'Unlimited caregiver supply',
    ],
  };
}

export function explainCensusChart(scenarios: readonly PaperRunRateScenario[]): GovernedExplainer {
  const plateaus = scenarios
    .map((scenario) => `${scenario.label} ${formatCensus(scenario.result.derived.censusPlateau)} clients`)
    .join('; ');
  return {
    id: 'census-chart',
    title: 'Active client census over time',
    mode: 'visualization',
    whatYouAreLookingAt:
      'Time versus modeled active clients under the same weekly admissions scenarios.',
    whatItShows:
      `Weekly admissions add clients. A constant fraction exits each week (δ = 1 / L). Census approaches C* = n × L (${plateaus}).`,
    whyItMatters:
      'Weekly billed run-rate is this client stock converted with R(t) = C(t) × h × p. The revenue chart is the census path in billed dollars.',
    boundedConclusion:
      'With L fixed, increasing n raises the modeled active-client plateau. That does not imply caregiver staffing, client demand, or unconstrained capacity in operations.',
    limitations: [
      'Constant admissions',
      'Constant attrition',
      'Uniform service intensity',
      'Inception census = 0',
      'Unlimited caregiver supply',
    ],
  };
}

export function explainGrowthTargetChart(
  scenarios: readonly GrowthTargetScenario[],
  targetAnnualizedRunRate: number,
  weeksPerYear: number,
): GovernedExplainer {
  const targetLabel = formatUsdMillions(targetAnnualizedRunRate);
  const lines = scenarios.map((scenario) => scenarioShowLine(scenario, weeksPerYear, targetLabel));
  return {
    id: 'growth-target-chart',
    title: 'Annualized billed run-rate vs target',
    mode: 'visualization',
    whatYouAreLookingAt:
      `Annualized billed run-rate (weekly billed run-rate × ${weeksPerYear}) compared with a horizontal ${targetLabel} target line. Trajectory is the path over time; plateau is the long-run level; target is the caller-defined threshold.`,
    whatItShows: lines.join(' '),
    whyItMatters:
      'More time only lets the trajectory move toward its plateau. If the plateau is below the target, extending time alone cannot make the scenario reach the target.',
    boundedConclusion:
      `These are deterministic scenario results against ${targetLabel} annualized billed run-rate. They are not a recommendation of an admissions rate and not a business plan.`,
    limitations: [
      'Billed run-rate ≠ cash',
      'Target analysis ≠ recommendation',
      'Admissions feasibility not modeled',
      'Reference parameters',
      'Scenario, not prediction',
    ],
  };
}

export function explainOntologyGraph(plan: InvestigationPlan): GovernedExplainer {
  const metricCount = new Set(plan.steps.flatMap((step) => step.metricIds)).size;
  const evidenceAttached = plan.steps.some((step) => step.actualEvidenceState !== 'MISSING_EVIDENCE');
  return {
    id: 'ontology-graph',
    title: 'Financial ontology investigation path',
    mode: 'investigation',
    whatYouAreLookingAt:
      `Investigation starts at the observed outcome (${plan.observedConcept}) and works upstream. Map arrows are defined ontology relationship direction, which may differ from investigation direction.`,
    whatItShows:
      'Cash Collections, Payment, Claim, Payer, Denial, Visit, Authorization, and Service identify valid areas to inspect. Those relationships do not identify causes.',
    whyItMatters: evidenceAttached
      ? `The path maps to ${metricCount} governed measurements, and some instance evidence is attached.`
      : `Governed measurements exist on this path (${metricCount} metric IDs). Actual evidence availability is separate and is not attached in v0.2. Metric availability is not evidence.`,
    boundedConclusion: plan.conclusionMessage,
    limitations: [
      'Relationship ≠ causation',
      'Metric available ≠ evidence',
      'Research use case',
      'Not an approved Financial Agent answer',
    ],
  };
}

export function explainInvestigationPlan(plan: InvestigationPlan): GovernedExplainer {
  const stepSummary = plan.steps
    .map((step) => `Step ${step.step} ${step.title} (${step.conceptIds.join(', ')}; ${step.suggestedVisual})`)
    .join('. ');
  const allMetricsAvailable = plan.steps.every((step) =>
    step.metrics.every((metric) => metric.measurementAvailability === 'AVAILABLE'),
  );
  const evidenceAttached = plan.steps.some((step) => step.actualEvidenceState !== 'MISSING_EVIDENCE');
  return {
    id: 'investigation-plan',
    title: 'Deterministic investigation plan',
    mode: 'investigation',
    whatYouAreLookingAt:
      'The steps form an ordered investigation plan. They are not a causal chain.',
    whatItShows:
      `${stepSummary}. Each step names relevant concepts, governed metrics, and visualization intent.`,
    whyItMatters: evidenceAttached
      ? 'Governed measurements and some instance evidence are attached to these steps.'
      : `${allMetricsAvailable ? 'Governed measurements are available' : 'Some governed measurements are unsupported'} for these steps. Actual evidence is not attached in v0.2.`,
    boundedConclusion:
      `${plan.conclusionMessage} The plan does not establish that denials, payment timing, or authorization exposure caused the decline.`,
    limitations: [
      'Relationship ≠ causation',
      'Metric available ≠ evidence',
      'Not a causal chain',
      'Research use case',
    ],
  };
}
