/**
 * Display-only dashboard catalog.
 * Values come from existing answer builders / synthetic-finance report helpers — no new compute.
 */
import { answerSourceChipLabel } from './answer-card-ui';
import { answerFinancialQuestion } from './financial-metrics';
import { answerQuestion, questions, type RecruitmentAnswer } from './metric-engine';
import { semanticHonestyLabel, type AgentId } from './orchestrator';
import { buildAccountsReceivable, syntheticFinanceDataset } from './synthetic-finance';

export const DASHBOARD_TYPE_LABEL = 'Operational dashboard — for the weekly review';

export const DASHBOARD_GOAL_BANNER = {
  financial: 'Decide whether cash covers payroll and obligations in the next 30 days.',
  recruitment: 'Decide which requisitions need intervention this week.',
} as const;

export type DashboardCardLineage = {
  honesty: string;
  sources: readonly string[];
  definition: string;
  queryPlan: string;
  metricIds: readonly string[];
};

export type DashboardCard = {
  id: string;
  title: string;
  value: string;
  period: string;
  honestyChip: string;
  available: boolean;
  lineage: DashboardCardLineage;
};

export type DashboardModel = {
  agentId: AgentId;
  goalBanner: string;
  typeLabel: typeof DASHBOARD_TYPE_LABEL;
  cards: readonly DashboardCard[];
};

const NOT_AVAILABLE = 'Not available';

const FINANCE_COMPUTE_PROMPTS = {
  cashGap: 'Do we have a genuine cash-flow problem?',
  breakEven: 'Have we reached break-even, and when do we get there?',
  debtTrend: 'Is our debt growing?',
} as const;

function usd(n: number): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
}

function periodFromAnswer(answer: RecruitmentAnswer): string {
  const last = answer.data.at(-1)?.label;
  if (last && /^\d{4}-\d{2}/.test(last)) return last;
  const parts = answer.queryPlan
    .split('·')
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.at(-1) || answer.queryPlan || NOT_AVAILABLE;
}

function primaryValue(answer: RecruitmentAnswer): string {
  if (!answer.supported || answer.data.length === 0) return NOT_AVAILABLE;
  return answer.data.at(-1)?.displayValue ?? answer.data[0]?.displayValue ?? NOT_AVAILABLE;
}

function cardFromAnswer(agentId: AgentId, answer: RecruitmentAnswer): DashboardCard {
  const available = answer.supported && answer.data.length > 0;
  const honesty = available
    ? (answerSourceChipLabel(agentId, answer) ?? semanticHonestyLabel(agentId, answer))
    : NOT_AVAILABLE;
  return {
    id: answer.questionId,
    title: available ? answer.title : NOT_AVAILABLE,
    value: available ? primaryValue(answer) : NOT_AVAILABLE,
    period: available ? periodFromAnswer(answer) : NOT_AVAILABLE,
    honestyChip: honesty,
    available,
    lineage: {
      honesty: available ? semanticHonestyLabel(agentId, answer) : NOT_AVAILABLE,
      sources: answer.sources,
      definition: answer.definition || NOT_AVAILABLE,
      queryPlan: answer.queryPlan || NOT_AVAILABLE,
      metricIds: answer.metricIds,
    },
  };
}

/**
 * Open A/R + aging over 60 days — no Ask compute answer exposes A/R>60.
 * Reuses the same `buildAccountsReceivable` helper already used by Reports.
 */
function financeArAgingCard(): DashboardCard {
  const report = buildAccountsReceivable(syntheticFinanceDataset);
  const over60 = report.aging['61_90'] + report.aging['90_plus'];
  const honesty = 'Synthetic dataset — computed, not governed';
  return {
    id: 'open-ar-aging',
    title: `${usd(report.totalOpen)} open A/R; ${usd(over60)} older than 60 days`,
    value: usd(over60),
    period: report.asOfDate,
    honestyChip: honesty,
    available: true,
    lineage: {
      honesty,
      sources: report.sources,
      definition: report.definition,
      queryPlan: 'buildAccountsReceivable · ar_ledger aging buckets',
      metricIds: ['open_ar', 'ar_age'],
    },
  };
}

export function buildFinanceDashboard(): DashboardModel {
  return {
    agentId: 'financial',
    goalBanner: DASHBOARD_GOAL_BANNER.financial,
    typeLabel: DASHBOARD_TYPE_LABEL,
    cards: [
      cardFromAnswer('financial', answerFinancialQuestion(FINANCE_COMPUTE_PROMPTS.cashGap)),
      financeArAgingCard(),
      cardFromAnswer('financial', answerFinancialQuestion(FINANCE_COMPUTE_PROMPTS.breakEven)),
      cardFromAnswer('financial', answerFinancialQuestion(FINANCE_COMPUTE_PROMPTS.debtTrend)),
    ],
  };
}

/** First four governed recruitment questions in registry / `questions` order. */
export function buildRecruitmentDashboard(): DashboardModel {
  const firstFour = questions.slice(0, 4);
  return {
    agentId: 'recruitment',
    goalBanner: DASHBOARD_GOAL_BANNER.recruitment,
    typeLabel: DASHBOARD_TYPE_LABEL,
    cards: firstFour.map((item) => cardFromAnswer('recruitment', answerQuestion(item.prompt))),
  };
}

export function buildDashboard(agentId: AgentId): DashboardModel {
  return agentId === 'financial' ? buildFinanceDashboard() : buildRecruitmentDashboard();
}
