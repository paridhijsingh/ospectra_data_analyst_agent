import { describe, expect, it } from 'vitest';
import { answerSourceChipLabel } from './answer-card-ui';
import { answerFinancialQuestion } from './financial-metrics';
import { answerQuestion, questions } from './metric-engine';
import {
  buildDashboard,
  buildFinanceDashboard,
  buildRecruitmentDashboard,
  DASHBOARD_GOAL_BANNER,
  DASHBOARD_TYPE_LABEL,
} from './dashboard-catalog';

const COMPUTED_LABEL = 'Synthetic dataset — computed, not governed';

describe('dashboard catalog', () => {
  it('builds a dashboard for both agents', () => {
    const finance = buildDashboard('financial');
    const recruitment = buildDashboard('recruitment');
    expect(finance.agentId).toBe('financial');
    expect(recruitment.agentId).toBe('recruitment');
    expect(finance.typeLabel).toBe(DASHBOARD_TYPE_LABEL);
    expect(recruitment.typeLabel).toBe(DASHBOARD_TYPE_LABEL);
  });

  it('includes the exact goal banners', () => {
    expect(buildFinanceDashboard().goalBanner).toBe(DASHBOARD_GOAL_BANNER.financial);
    expect(buildRecruitmentDashboard().goalBanner).toBe(DASHBOARD_GOAL_BANNER.recruitment);
    expect(DASHBOARD_GOAL_BANNER.financial).toBe(
      'Decide whether cash covers payroll and obligations in the next 30 days.',
    );
    expect(DASHBOARD_GOAL_BANNER.recruitment).toBe(
      'Decide which requisitions need intervention this week.',
    );
  });

  it('renders four finance cards from existing lib / answer data', () => {
    const { cards } = buildFinanceDashboard();
    expect(cards).toHaveLength(4);

    const cashGap = answerFinancialQuestion('Do we have a genuine cash-flow problem?');
    expect(cards[0].title).toBe(cashGap.title);
    expect(cards[0].value).toBe(cashGap.data.at(-1)?.displayValue);
    expect(cards[0].available).toBe(true);

    expect(cards[1].id).toBe('open-ar-aging');
    expect(cards[1].available).toBe(true);
    expect(cards[1].value).not.toBe('Not available');
    expect(cards[1].title).toMatch(/open A\/R/);
    expect(cards[1].title).toMatch(/older than 60 days/);

    const breakEven = answerFinancialQuestion(
      'Have we reached break-even, and when do we get there?',
    );
    expect(cards[2].title).toBe(breakEven.title);
    expect(cards[2].value).toBe(breakEven.data.at(-1)?.displayValue);

    const debt = answerFinancialQuestion('Is our debt growing?');
    expect(cards[3].title).toBe(debt.title);
    expect(cards[3].value).toBe(debt.data.at(-1)?.displayValue);
  });

  it('renders four recruitment cards from the first four registry questions', () => {
    const { cards } = buildRecruitmentDashboard();
    expect(cards).toHaveLength(4);
    const expected = questions.slice(0, 4).map((item) => answerQuestion(item.prompt));
    for (let index = 0; index < 4; index += 1) {
      expect(cards[index].id).toBe(expected[index].questionId);
      expect(cards[index].title).toBe(expected[index].title);
      expect(cards[index].value).toBe(expected[index].data.at(-1)?.displayValue);
      expect(cards[index].available).toBe(true);
    }
  });

  it('uses exact honesty chips per agent / answer type', () => {
    const finance = buildFinanceDashboard();
    for (const card of finance.cards) {
      expect(card.honestyChip).toBe(COMPUTED_LABEL);
      expect(card.lineage.honesty).toBe(COMPUTED_LABEL);
    }
    // Explicit: finance dashboard never claims governed.
    expect(finance.cards.every((card) => card.honestyChip === COMPUTED_LABEL)).toBe(true);

    const recruitment = buildRecruitmentDashboard();
    for (const card of recruitment.cards) {
      const answer = answerQuestion(
        questions.find((item) => item.id === card.id)?.prompt ?? '',
      );
      expect(card.honestyChip).toBe(answerSourceChipLabel('recruitment', answer));
      expect(card.honestyChip).toMatch(/^Matched approved metric\(s\):/);
    }
  });
});
