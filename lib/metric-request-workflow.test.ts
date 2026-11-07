import { describe, expect, it } from 'vitest';
import { answerFinancialQuestion } from './financial-metrics';
import { answerQuestion } from './metric-engine';
import {
  appendPendingMetricRequest,
  canRequestMetric,
  createEmptyMetricRequestDraft,
  createPendingMetricRequest,
  METRIC_REQUEST_ACTION_LABEL,
  PENDING_METRIC_REQUEST_STATUS,
  WORKFLOW_PROTOTYPE_LABEL,
} from './metric-request-workflow';

describe('canRequestMetric', () => {
  it('is true for a refused finance answer', () => {
    const answer = answerFinancialQuestion('What is our LTV?');
    expect(answer.supported).toBe(false);
    expect(canRequestMetric(answer)).toBe(true);
  });

  it('is true for a refused recruitment answer', () => {
    const answer = answerQuestion('Is our debt growing?');
    expect(answer.supported).toBe(false);
    expect(canRequestMetric(answer)).toBe(true);
  });

  it('is false for an answered / supported response', () => {
    const finance = answerFinancialQuestion('Do we have a genuine cash-flow problem?');
    const recruitment = answerQuestion(
      'Where is the biggest drop-off in the recruitment funnel for engineering roles?',
    );
    expect(finance.supported).toBe(true);
    expect(recruitment.supported).toBe(true);
    expect(canRequestMetric(finance)).toBe(false);
    expect(canRequestMetric(recruitment)).toBe(false);
  });
});

describe('pending metric request list', () => {
  it('submitting the form draft adds one Pending definition entry with question and owner', () => {
    const draft = {
      ...createEmptyMetricRequestDraft('What is our LTV?'),
      owner: 'Finance Ops',
      sources: 'Claims, Payments',
      purpose: 'Decide whether to expand a branch',
      formula: 'optional draft',
    };

    const request = createPendingMetricRequest(draft, 'req-1');
    const next = appendPendingMetricRequest([], request);

    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({
      id: 'req-1',
      question: 'What is our LTV?',
      owner: 'Finance Ops',
      status: PENDING_METRIC_REQUEST_STATUS,
    });
    expect(PENDING_METRIC_REQUEST_STATUS).toBe('Pending definition');
    expect(METRIC_REQUEST_ACTION_LABEL).toBe('Request this metric');
    expect(WORKFLOW_PROTOTYPE_LABEL).toBe('Workflow prototype');
  });

  it('appends without mutating the prior list', () => {
    const first = createPendingMetricRequest(
      {
        question: 'Q1',
        owner: 'Owner A',
        sources: 'S',
        purpose: 'P',
        formula: '',
      },
      'a',
    );
    const prior = appendPendingMetricRequest([], first);
    const second = createPendingMetricRequest(
      {
        question: 'Q2',
        owner: 'Owner B',
        sources: '',
        purpose: '',
        formula: '',
      },
      'b',
    );
    const next = appendPendingMetricRequest(prior, second);

    expect(prior).toHaveLength(1);
    expect(next).toHaveLength(2);
    expect(next.map((item) => item.owner)).toEqual(['Owner A', 'Owner B']);
  });
});
