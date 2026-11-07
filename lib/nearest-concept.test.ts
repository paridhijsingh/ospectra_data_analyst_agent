import { describe, expect, it } from 'vitest';
import { answerFinancialQuestion } from './financial-metrics';
import { answerQuestion } from './metric-engine';
import {
  findNearestFinanceConcept,
  findNearestRecruitmentConcept,
  NEAREST_CONCEPT_REFUSAL_PREFIX,
} from './nearest-concept';

describe('nearest-concept refusals (finance)', () => {
  it('LTV refuses with nearestConcept Client (first touched defined concept)', () => {
    const answer = answerFinancialQuestion('What is our LTV?');
    expect(answer.supported).toBe(false);
    expect(answer.nearestConcept).toBe('Client');
    expect(answer.data).toEqual([]);
    expect(answer.metricIds).toEqual([]);
    expect(answer.summary).toBe('');
    expect(NEAREST_CONCEPT_REFUSAL_PREFIX(answer.nearestConcept!)).toContain('Client');
  });

  it('returns the same nearest concept for the same blocked question (determinism)', () => {
    const a = findNearestFinanceConcept('What is our LTV?');
    const b = findNearestFinanceConcept('What is our LTV?');
    const answerA = answerFinancialQuestion('What is customer lifetime value?');
    const answerB = answerFinancialQuestion('What is customer lifetime value?');
    expect(a).toEqual(b);
    expect(answerA.nearestConcept).toBe(answerB.nearestConcept);
    expect(answerA.nearestConcept).toBe('Client');
  });

  it('leaves nearestConcept undefined when a blocked question touches no defined concept', () => {
    const answer = answerFinancialQuestion('Tell me about finance');
    expect(answer.supported).toBe(false);
    expect(findNearestFinanceConcept('Tell me about finance')).toBeNull();
    expect(answer.nearestConcept).toBeUndefined();
  });

  it('does not attach nearestConcept to a computed finance answer', () => {
    const answer = answerFinancialQuestion('Do we have a genuine cash-flow problem?');
    expect(answer.supported).toBe(true);
    expect(answer.answerSource).toBe('synthetic_computed');
    expect(answer.nearestConcept).toBeUndefined();
  });
});

describe('nearest-concept refusals (recruitment)', () => {
  it('does not attach nearestConcept to a governed recruitment answer', () => {
    const answer = answerQuestion(
      'Where is the biggest drop-off in the recruitment funnel for engineering roles?',
    );
    expect(answer.supported).toBe(true);
    expect(answer.nearestConcept).toBeUndefined();
    expect(answer.title).toMatch(/Biggest drop-off/i);
  });

  it('names the first touched recruitment entity on a blocked question', () => {
    const answer = answerQuestion('What is our candidate NPS score?');
    expect(answer.supported).toBe(false);
    expect(answer.nearestConcept).toBe('Candidate');
    expect(findNearestRecruitmentConcept('What is our candidate NPS score?')?.label).toBe('Candidate');
  });
});
