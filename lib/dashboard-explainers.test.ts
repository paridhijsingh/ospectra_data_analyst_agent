import { describe, expect, it } from 'vitest';
import { answerFinancialQuestion } from './financial-metrics';
import { answerQuestion } from './metric-engine';
import {
  explainFinanceDashboard,
  explainRecruitmentDashboard,
  FINANCE_DASHBOARD_ASK_NEXT,
  RECRUITMENT_DASHBOARD_ASK_NEXT,
} from './dashboard-explainers';
import { explainerActionSlotLabels } from './visualization-explainer';

describe('dashboard explainers', () => {
  it('renders finance and recruitment dashboard explainers with v2 action slots', () => {
    const finance = explainFinanceDashboard();
    const recruitment = explainRecruitmentDashboard();

    expect(finance.id).toBe('finance-dashboard');
    expect(recruitment.id).toBe('recruitment-dashboard');
    expect(finance.whatYouAreLookingAt).toContain('can cash cover what the business owes next');
    expect(recruitment.whatYouAreLookingAt).toContain('governed recruitment metrics');
    expect(finance.nextAction).toMatch(/Accounts Receivable/);
    expect(finance.nextAction).toMatch(/older than 60 days/);
    expect(recruitment.nextAction).toBe(
      'Open the oldest requisitions in Ask and check which stage they are stuck in.',
    );
    expect(explainerActionSlotLabels.followUps).toBe('Ask next');
    expect(finance.followUps).toBeDefined();
    expect(recruitment.followUps).toBeDefined();
  });

  it('Ask-next chips are only answerable questions and never Time to Fill', () => {
    const finance = explainFinanceDashboard();
    const recruitment = explainRecruitmentDashboard();
    const financeChips = [
      finance.followUps!.drillDown,
      finance.followUps!.drillUp,
      finance.followUps!.drillAcross,
    ];
    const recruitmentChips = [
      recruitment.followUps!.drillDown,
      recruitment.followUps!.drillUp,
      recruitment.followUps!.drillAcross,
    ];

    expect(financeChips).toEqual([...FINANCE_DASHBOARD_ASK_NEXT]);
    expect(recruitmentChips).toEqual([...RECRUITMENT_DASHBOARD_ASK_NEXT]);

    for (const prompt of financeChips) {
      expect(answerFinancialQuestion(prompt).supported).toBe(true);
    }
    for (const prompt of recruitmentChips) {
      expect(answerQuestion(prompt).supported).toBe(true);
    }

    const blob = JSON.stringify({ finance, recruitment });
    expect(blob).not.toMatch(/Time to Fill/i);
    expect(blob).not.toMatch(/Sep 24/i);
    expect(blob).not.toMatch(/break-even pace/i);
    expect(finance.limitations.join(' ')).toMatch(/not governed/i);
  });

  it('finance dashboard next action interpolates over-60 A/R from lib, not a hardcoded dollar', () => {
    const finance = explainFinanceDashboard();
    expect(finance.nextAction).toMatch(/\$[\d,]+ older than 60 days/);
    expect(finance.whatItShows.length).toBeGreaterThan(0);
    expect(finance.comparativeInsight).toEqual(expect.any(String));
  });
});
