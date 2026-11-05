import { describe, expect, it } from 'vitest';
import { answerQuestion } from './metric-engine';
import { answerFinancialQuestion, financialComputeQuestions } from './financial-metrics';
import { runOrchestrator, semanticHonestyLabel } from './orchestrator';
import {
  getBreakEvenStatus,
  getCashFlowAssessment,
  getDebtTrend,
  getServiceLineProfitability,
  syntheticFinanceDataset,
} from './synthetic-finance';

const COMPUTED_LABEL = 'Synthetic dataset — computed, not governed';

const computeRoutes = [
  ['Have we reached break-even, and when do we get there?', 'break-even'],
  ['How much does our debt cost us to service, and what does it do to profit?', 'debt-service'],
  ['Is our debt growing?', 'debt-trend'],
  ['Do we have a genuine cash-flow problem?', 'cash-flow-problem'],
  ['What does service cost per member per month?', 'cost-per-member'],
  ["How well are we using caregivers' available time?", 'caregiver-utilization'],
  ['How much revenue are we leaving unserved on the waitlist?', 'waitlist-revenue'],
  ['What revenue do we make per member and per caregiver each month?', 'revenue-per-member-caregiver'],
  ['Is every service line profitable?', 'service-line-profitability'],
  ['What are our key ratios and churn?', 'ratios-and-churn'],
] as const;

describe('financial compute routing', () => {
  it.each(computeRoutes)('routes "%s" to %s with computed source label', (prompt, questionId) => {
    const answer = answerFinancialQuestion(prompt);
    expect(answer.supported).toBe(true);
    expect(answer.questionId).toBe(questionId);
    expect(answer.answerSource).toBe('synthetic_computed');
    expect(answer.nextAction).toEqual(expect.any(String));
    expect(answer.comparativeInsight).toEqual(expect.any(String));
    expect(answer.followUps?.drillDown).toEqual(expect.any(String));
    expect(answer.limitations?.some((line) => line.includes(COMPUTED_LABEL))).toBe(true);

    const orchestrated = runOrchestrator('financial', prompt);
    expect(semanticHonestyLabel('financial', orchestrated.answer)).toBe(COMPUTED_LABEL);
    expect(orchestrated.trace.find((step) => step.id === 'semantic')?.detail).toBe(COMPUTED_LABEL);
  });

  it('keeps template honesty label on the original 25', () => {
    const orchestrated = runOrchestrator(
      'financial',
      'Why is cash collection lagging behind earned revenue this month?',
    );
    expect(orchestrated.answer.answerSource).toBe('static_template');
    expect(semanticHonestyLabel('financial', orchestrated.answer)).toBe(
      'Static template — not computed, not governed',
    );
  });

  it('refuses LTV and other out-of-catalogue finance questions', () => {
    for (const question of ['What is our LTV?', 'What is customer lifetime value?', 'Tell me about finance']) {
      const answer = answerFinancialQuestion(question);
      expect(answer.supported).toBe(false);
      expect(answer.questionId).toBe('unsupported');
    }
  });

  it('does not let recruitment match finance debt-growing via bare trend', () => {
    const recruitment = answerQuestion('Is our debt growing?');
    expect(recruitment.supported).toBe(false);
    expect(recruitment.questionId).toBe('unsupported');

    const finance = answerFinancialQuestion('Is our debt growing?');
    expect(finance.supported).toBe(true);
    expect(finance.questionId).toBe('debt-trend');
    expect(finance.answerSource).toBe('synthetic_computed');
  });

  it('exposes all ten compute prompts in the catalogue', () => {
    expect(financialComputeQuestions).toHaveLength(10);
    expect(financialComputeQuestions.map((q) => q.id)).toEqual(computeRoutes.map(([, id]) => id));
  });
});

describe('financial compute value spot-checks', () => {
  it('Q1 forecast break-even month is 2027-05', () => {
    const status = getBreakEvenStatus(syntheticFinanceDataset);
    expect(status.firstForecastBreakEven?.month).toBe('2027-05');
    const answer = answerFinancialQuestion('Have we reached break-even, and when do we get there?');
    expect(answer.summary).toContain('2027-05');
  });

  it('Q3 latest debt balance is 2889000', () => {
    const trend = getDebtTrend(syntheticFinanceDataset);
    expect(trend.series.at(-1)?.value).toBe(2889000);
    const answer = answerFinancialQuestion('Is our debt growing?');
    expect(answer.data.at(-1)?.displayValue).toContain('2,889,000');
  });

  it('Q4 hasProblem is true', () => {
    expect(getCashFlowAssessment(syntheticFinanceDataset).verdict).toBe(true);
    const answer = answerFinancialQuestion('Do we have a genuine cash-flow problem?');
    expect(answer.title.toLowerCase()).toContain('genuine cash-flow problem');
  });

  it('Q9 Respite is not profitable', () => {
    const lines = getServiceLineProfitability(syntheticFinanceDataset).lines;
    const respite = lines.find((line) => line.service_line === 'Respite');
    expect(respite?.nonPositive).toBe(true);
    const answer = answerFinancialQuestion('Is every service line profitable?');
    expect(answer.summary).toMatch(/Respite:.*not profitable/i);
  });

  it('Q10 carries inferred caregiver-start caveat in limitations', () => {
    const answer = answerFinancialQuestion('What are our key ratios and churn?');
    expect(answer.limitations?.some((line) => /inferred caregiver start/i.test(line))).toBe(true);
  });
});
