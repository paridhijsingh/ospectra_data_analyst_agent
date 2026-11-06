import { describe, expect, it } from 'vitest';
import { answerFinancialQuestion } from './financial-metrics';
import { answerQuestion } from './metric-engine';
import { runOrchestrator } from './orchestrator';
import {
  answerQualityIndicatorLabel,
  answerSourceChipLabel,
  toggleAnswerFeedback,
} from './answer-card-ui';

const COMPUTED_LABEL = 'Synthetic dataset — computed, not governed';
const TEMPLATE_LABEL = 'Static template — not computed, not governed';

describe('answerSourceChipLabel', () => {
  it('uses the governed recruitment honesty label', () => {
    const answer = answerQuestion(
      'Where is the biggest drop-off in the recruitment funnel for engineering roles?',
    );
    expect(answer.supported).toBe(true);
    expect(answerSourceChipLabel('recruitment', answer)).toBe(
      `Matched approved metric(s): ${answer.metricIds.join(', ')}.`,
    );
  });

  it('uses the finance computed honesty label', () => {
    const answer = answerFinancialQuestion('Do we have a genuine cash-flow problem?');
    expect(answer.supported).toBe(true);
    expect(answer.answerSource).toBe('synthetic_computed');
    expect(answerSourceChipLabel('financial', answer)).toBe(COMPUTED_LABEL);
  });

  it('uses the finance static-template honesty label', () => {
    const answer = answerFinancialQuestion(
      'Why is cash collection lagging behind earned revenue this month?',
    );
    expect(answer.supported).toBe(true);
    expect(answer.answerSource).toBe('static_template');
    expect(answerSourceChipLabel('financial', answer)).toBe(TEMPLATE_LABEL);
  });

  it('returns no chip for a refused / unsupported answer', () => {
    const financeRefusal = answerFinancialQuestion('What is our LTV?');
    const recruitmentRefusal = answerQuestion('Is our debt growing?');
    expect(financeRefusal.supported).toBe(false);
    expect(recruitmentRefusal.supported).toBe(false);
    expect(answerSourceChipLabel('financial', financeRefusal)).toBeNull();
    expect(answerSourceChipLabel('recruitment', recruitmentRefusal)).toBeNull();
  });
});

describe('answerQualityIndicatorLabel', () => {
  it('surfaces Quality checks passed when the quality-guard trace completed', () => {
    const result = runOrchestrator(
      'financial',
      'Do we have a genuine cash-flow problem?',
    );
    const quality = result.trace.find((step) => step.id === 'quality');
    expect(quality?.status).toBe('complete');
    expect(answerQualityIndicatorLabel(result.answer, result.trace)).toBe('Quality checks passed');
  });

  it('returns null for a refusal even though a quality step exists', () => {
    const result = runOrchestrator('financial', 'What is our LTV?');
    expect(result.answer.supported).toBe(false);
    expect(result.trace.some((step) => step.id === 'quality')).toBe(true);
    expect(answerQualityIndicatorLabel(result.answer, result.trace)).toBeNull();
  });

  it('returns null when no quality step is present', () => {
    const answer = answerFinancialQuestion('Do we have a genuine cash-flow problem?');
    expect(answerQualityIndicatorLabel(answer, [])).toBeNull();
  });
});

describe('toggleAnswerFeedback', () => {
  it('toggles selection on one answer path without inventing cross-answer state', () => {
    let first: ReturnType<typeof toggleAnswerFeedback> = null;
    let second: ReturnType<typeof toggleAnswerFeedback> = null;

    first = toggleAnswerFeedback(first, 'up');
    expect(first).toBe('up');
    expect(second).toBeNull();

    second = toggleAnswerFeedback(second, 'down');
    expect(first).toBe('up');
    expect(second).toBe('down');

    first = toggleAnswerFeedback(first, 'up');
    expect(first).toBeNull();
    expect(second).toBe('down');

    first = toggleAnswerFeedback(first, 'down');
    expect(first).toBe('down');
    expect(second).toBe('down');
  });
});
