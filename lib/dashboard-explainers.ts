/**
 * Dashboard ExplainerCard builders — display-only, values from existing libs.
 * Reuses GovernedExplainer / ExplainerCard; does not invent metrics or numbers.
 */
import { buildAccountsReceivable, syntheticFinanceDataset } from './synthetic-finance';
import { buildDashboard } from './dashboard-catalog';
import { answerFinancialQuestion } from './financial-metrics';
import { answerQuestion } from './metric-engine';
import type { GovernedExplainer } from './visualization-explainer';

function usd(n: number): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
}

/** Computed finance questions that are answerable today — safe for Ask-next chips. */
export const FINANCE_DASHBOARD_ASK_NEXT = [
  'Do we have a genuine cash-flow problem?',
  'Have we reached break-even, and when do we get there?',
  'Is our debt growing?',
] as const;

/** Governed recruitment questions that are answerable today. */
export const RECRUITMENT_DASHBOARD_ASK_NEXT = [
  'Where is the biggest drop-off in the recruitment funnel for engineering roles?',
  'How are applications trending month over month?',
  'Which departments have the healthiest active recruiting pipeline?',
] as const;

function cardSummaryLine(agentId: 'financial' | 'recruitment'): string {
  return buildDashboard(agentId)
    .cards.map((card) => `${card.title} (${card.value})`)
    .join(' · ');
}

export function explainFinanceDashboard(): GovernedExplainer {
  const ar = buildAccountsReceivable(syntheticFinanceDataset);
  const over60 = ar.aging['61_90'] + ar.aging['90_plus'];
  const cashGap = answerFinancialQuestion(FINANCE_DASHBOARD_ASK_NEXT[0]);
  const [drillDown, drillUp, drillAcross] = FINANCE_DASHBOARD_ASK_NEXT;
  for (const prompt of FINANCE_DASHBOARD_ASK_NEXT) {
    const answer = answerFinancialQuestion(prompt);
    if (!answer.supported) {
      throw new Error(`Finance dashboard Ask-next chip is not answerable: ${prompt}`);
    }
  }

  return {
    id: 'finance-dashboard',
    title: 'How to read this finance dashboard',
    mode: 'visualization',
    whatYouAreLookingAt:
      'This dashboard answers one question: can cash cover what the business owes next, starting with payroll?',
    whatItShows: cardSummaryLine('financial'),
    whyItMatters:
      'Profit and cash are not the same — money can be earned and still arrive late. The cards above show what was collected, what is still owed to the business, and whether the business is profitable.',
    boundedConclusion: cashGap.supported
      ? `${cashGap.title}. Open A/R older than 60 days is ${usd(over60)} as of ${ar.asOfDate} (synthetic dataset — computed, not governed).`
      : `Open A/R older than 60 days is ${usd(over60)} as of ${ar.asOfDate} (synthetic dataset — computed, not governed).`,
    comparativeInsight: cashGap.comparativeInsight ?? cashGap.summary,
    nextAction: `Open Reports → Accounts Receivable and work the ${usd(over60)} older than 60 days (as of ${ar.asOfDate}).`,
    followUps: { drillDown, drillUp, drillAcross },
    limitations: [
      'Synthetic dataset — computed, not governed',
      'Dashboard display only — not a governed finance catalog',
      'Templates and growth-model scenarios stay on their own surfaces',
    ],
  };
}

export function explainRecruitmentDashboard(): GovernedExplainer {
  const [drillDown, drillUp, drillAcross] = RECRUITMENT_DASHBOARD_ASK_NEXT;
  // Prove chips are answerable before exposing them.
  for (const prompt of RECRUITMENT_DASHBOARD_ASK_NEXT) {
    const answer = answerQuestion(prompt);
    if (!answer.supported) {
      throw new Error(`Recruitment dashboard Ask-next chip is not answerable: ${prompt}`);
    }
  }

  return {
    id: 'recruitment-dashboard',
    title: 'How to read this recruitment dashboard',
    mode: 'visualization',
    whatYouAreLookingAt:
      'This dashboard shows whether hiring is moving or stalling, using only the governed recruitment metrics.',
    whatItShows: cardSummaryLine('recruitment'),
    whyItMatters:
      'A requisition that ages quietly becomes a coverage problem later — these cards surface where candidates drop off and which requisitions need attention this week.',
    boundedConclusion:
      'These headline cards reuse the first four governed recruitment answers in registry order. They are not forecasts and do not invent metrics outside the semantic layer.',
    comparativeInsight:
      'Each card is a governed answer already available in Ask — application volume by role, hiring duration by department, engineering funnel drop-off, and application trend.',
    nextAction: 'Open the oldest requisitions in Ask and check which stage they are stuck in.',
    followUps: { drillDown, drillUp, drillAcross },
    limitations: [
      'Governed recruitment metrics only',
      'Synthetic POC data',
      'Only registry-approved, currently answerable questions appear as Ask next',
    ],
  };
}
