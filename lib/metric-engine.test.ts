import { describe, expect, it } from 'vitest';
import { answerQuestion } from './metric-engine';

describe('answerQuestion routing baseline', () => {
  it('answers the approved engineering funnel question', () => {
    const answer = answerQuestion(
      'Where is the biggest drop-off in the recruitment funnel for engineering roles?',
    );

    expect(answer.supported).toBe(true);
    expect(answer.questionId).toBe('engineering-funnel');
    expect(answer.intent).toBe('funnel_analysis');
  });

  it('routes a natural paraphrase about losing engineering candidates', () => {
    const answer = answerQuestion('Where are we losing the most engineering candidates?');

    expect(answer.supported).toBe(true);
    expect(answer.questionId).toBe('engineering-funnel');
  });

  it('routes a natural paraphrase about how long hiring takes', () => {
    const answer = answerQuestion('How long does it take us to hire people?');

    expect(answer.supported).toBe(true);
    expect(answer.questionId).toBe('time-to-hire');
  });

  it('routes a natural paraphrase about applicant channels', () => {
    const answer = answerQuestion('Which channels give us the most applicants?');

    expect(answer.supported).toBe(true);
    expect(answer.questionId).toBe('candidates-by-source');
  });

  it('rejects an unsupported question', () => {
    const answer = answerQuestion('What will the weather be tomorrow?');

    expect(answer.supported).toBe(false);
    expect(answer.questionId).toBe('unsupported');
    expect(answer.intent).toBe('unsupported');
  });

  it('does not treat a sales revenue channel as a recruiting source', () => {
    const answer = answerQuestion('Which sales channel generated the most revenue?');

    expect(answer.supported).toBe(false);
    expect(answer.questionId).toBe('unsupported');
  });

  it('does not treat generic duration as time to hire', () => {
    const answer = answerQuestion('How long does onboarding take?');

    expect(answer.supported).toBe(false);
    expect(answer.questionId).toBe('unsupported');
  });

  it('does not treat generic revenue loss as the engineering funnel', () => {
    const answer = answerQuestion('Where are we losing the most revenue?');

    expect(answer.supported).toBe(false);
    expect(answer.questionId).toBe('unsupported');
  });
});

describe('approved recruitment paraphrases', () => {
  it.each([
    ['Which roles are getting the most applications?', 'applications-by-job'],
    ['Which departments are hiring the most people?', 'hires-by-department'],
    ['What is our offer acceptance by team?', 'offer-acceptance'],
    ['Where do we have the most active candidates?', 'pipeline-by-location'],
    ['How many active candidates do we have by location?', 'pipeline-by-location'],
    ['Which recruiting sources are performing best?', 'source-hire-rate'],
    ['Are applications increasing or decreasing over time?', 'applications-trend'],
    ['How are hires trending?', 'hiring-trend'],
    ['Are hires increasing over time?', 'hiring-trend'],
    ['Which departments have the strongest recruiting pipeline?', 'pipeline-health'],
    ['Which departments get the largest share of applications?', 'department-demand'],
  ])('routes "%s" to %s', (question, questionId) => {
    const answer = answerQuestion(question);

    expect(answer.supported).toBe(true);
    expect(answer.questionId).toBe(questionId);
  });
});

describe('recruitment paraphrase guardrails', () => {
  it.each([
    'Are sales increasing or decreasing over time?',
    'Which sales pipeline is the strongest?',
    'Which departments get the largest share of revenue?',
    'Where do we have the most active customers?',
    'Which departments contribute the most revenue?',
    'Is revenue increasing over time?',
  ])('leaves "%s" unsupported', (question) => {
    const answer = answerQuestion(question);

    expect(answer.supported).toBe(false);
    expect(answer.questionId).toBe('unsupported');
  });
});
