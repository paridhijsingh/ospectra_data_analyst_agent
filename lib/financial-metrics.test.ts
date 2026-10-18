import { describe, expect, it } from 'vitest';
import { answerFinancialQuestion, financialQuestions } from './financial-metrics';

const expectedById = {
  'collections-gap': { title: 'Collections are $184K below earned revenue', intent: 'variance_analysis', metricIds: ['earned_revenue', 'cash_collections', 'collection_gap'], chart: 'bar' },
  'insurance-bridge': { title: 'Collections are $184K below earned revenue', intent: 'variance_analysis', metricIds: ['earned_revenue', 'cash_collections', 'collection_gap'], chart: 'bar' },
  'cash-forecast': { title: 'Cash is projected to reach $4.42M in 60 days', intent: 'forecast', metricIds: ['available_cash', 'cash_forecast'], chart: 'line' },
  'denial-scenario': { title: 'Cash is projected to reach $4.42M in 60 days', intent: 'forecast', metricIds: ['available_cash', 'cash_forecast'], chart: 'line' },
  'auth-scenario': { title: 'Cash is projected to reach $4.42M in 60 days', intent: 'forecast', metricIds: ['available_cash', 'cash_forecast'], chart: 'line' },
  'payer-delays': { title: 'Two payers exceed the 45-day payment target', intent: 'payer_analysis', metricIds: ['days_to_payment'], chart: 'bar' },
  'reimbursement': { title: 'Two payers exceed the 45-day payment target', intent: 'payer_analysis', metricIds: ['days_to_payment'], chart: 'bar' },
  'denied-exposure': { title: 'Denied claims carry $312K of exposure', intent: 'root_cause_analysis', metricIds: ['denied_claim_value', 'denial_rate'], chart: 'bar' },
  'claim-status': { title: 'Denied claims carry $312K of exposure', intent: 'root_cause_analysis', metricIds: ['denied_claim_value', 'denial_rate'], chart: 'bar' },
  'recovery': { title: 'Denied claims carry $312K of exposure', intent: 'root_cause_analysis', metricIds: ['denied_claim_value', 'denial_rate'], chart: 'bar' },
  'ar-risk': { title: '$684K of AR is older than 60 days', intent: 'aging_analysis', metricIds: ['open_ar', 'ar_age'], chart: 'bar' },
  'ar-lineage': { title: '$684K of AR is older than 60 days', intent: 'aging_analysis', metricIds: ['open_ar', 'ar_age'], chart: 'bar' },
  'unauthorized-care': { title: 'Authorization exposure is concentrated in two service lines', intent: 'exposure_analysis', metricIds: ['authorization_exposure', 'unused_authorized_hours'], chart: 'donut' },
  'unused-auth': { title: 'Authorization exposure is concentrated in two service lines', intent: 'exposure_analysis', metricIds: ['authorization_exposure', 'unused_authorized_hours'], chart: 'donut' },
  'expiring-auth': { title: 'Authorization exposure is concentrated in two service lines', intent: 'exposure_analysis', metricIds: ['authorization_exposure', 'unused_authorized_hours'], chart: 'donut' },
  'unbilled-visits': { title: '$227K of visits are not yet billable', intent: 'root_cause_analysis', metricIds: ['unbilled_visit_value'], chart: 'bar' },
  'evv-delays': { title: '$227K of visits are not yet billable', intent: 'root_cause_analysis', metricIds: ['unbilled_visit_value'], chart: 'bar' },
  'budget': { title: 'Operating expense is 4.7% over budget', intent: 'variance_analysis', metricIds: ['budget_variance'], chart: 'bar' },
  'division-risk': { title: 'Operating expense is 4.7% over budget', intent: 'variance_analysis', metricIds: ['budget_variance'], chart: 'bar' },
  'margin': { title: 'Gross margin fell 2.3 points as overtime increased', intent: 'margin_analysis', metricIds: ['gross_margin', 'payroll_cost', 'overtime_rate'], chart: 'line' },
  'cash-coverage': { title: 'Available cash is $5.18M across six branches', intent: 'cash_analysis', metricIds: ['available_cash'], chart: 'donut' },
  'cash-by-branch': { title: 'Available cash is $5.18M across six branches', intent: 'cash_analysis', metricIds: ['available_cash'], chart: 'donut' },
  'workflow-cost': { title: 'Manual RCM work costs an estimated $286K monthly', intent: 'cost_analysis', metricIds: ['manual_workflow_cost'], chart: 'bar' },
  'rcm-bottleneck': { title: 'Manual RCM work costs an estimated $286K monthly', intent: 'cost_analysis', metricIds: ['manual_workflow_cost'], chart: 'bar' },
  'combined-exposure': { title: '$1.03M of non-overlapping exposure is identified', intent: 'exposure_analysis', metricIds: ['financial_exposure'], chart: 'donut' },
} as const;

describe('exact financial questions', () => {
  it.each(financialQuestions.map((question) => [question.id, question.prompt] as const))(
    'preserves the existing output for %s',
    (id, prompt) => {
      const expected = expectedById[id];
      for (const question of [prompt, id]) {
        const answer = answerFinancialQuestion(question);
        expect(answer.supported).toBe(true);
        expect(answer.questionId).toBe(id);
        expect(answer.title).toBe(expected.title);
        expect(answer.intent).toBe(expected.intent);
        expect(answer.metricIds).toEqual([...expected.metricIds]);
        expect(answer.chart).toBe(expected.chart);
      }
    },
  );
});

describe('financial paraphrases', () => {
  it.each([
    ['What will our cash position look like?', 'cash-forecast', ['available_cash', 'cash_forecast']],
    ['Which payers take the longest to pay?', 'payer-delays', ['days_to_payment']],
    ['How much money is tied up in old receivables?', 'ar-risk', ['open_ar', 'ar_age']],
    ['What care have we delivered but not billed yet?', 'unbilled-visits', ['unbilled_visit_value']],
    ['How are we doing versus budget?', 'budget', ['budget_variance']],
    ['What if reimbursements arrive later than expected?', 'cash-forecast', ['available_cash', 'cash_forecast']],
    ['How much manual work is costing us?', 'workflow-cost', ['manual_workflow_cost']],
  ] as const)('routes "%s" to %s', (question, questionId, metricIds) => {
    const answer = answerFinancialQuestion(question);

    expect(answer.supported).toBe(true);
    expect(answer.questionId).toBe(questionId);
    expect(answer.metricIds).toEqual([...metricIds]);
  });
});

describe('financial guardrails', () => {
  it.each([
    'Which payer is best?',
    'Where are we losing the most money?',
    'Tell me about finance',
    'What should we do next year?',
    'purple hedgehog quarterly folklore',
    'Which branch has the most financial exposure?',
    'payer',
    'cash',
    'AR',
    'bottleneck',
  ])('leaves "%s" unsupported', (question) => {
    const answer = answerFinancialQuestion(question);

    expect(answer.supported).toBe(false);
    expect(answer.questionId).toBe('unsupported');
    expect(answer.intent).toBe('unsupported');
    expect(answer.metricIds).toEqual([]);
    expect(answer.sources).toEqual([]);
    expect(answer.summary).toBe('');
    expect(answer.insight).toBe('');
    expect(answer.title).not.toBe('Collections are $184K below earned revenue');
  });

  it('keeps the exact question id budget on the budget analysis', () => {
    const answer = answerFinancialQuestion('budget');

    expect(answer.supported).toBe(true);
    expect(answer.questionId).toBe('budget');
    expect(answer.metricIds).toEqual(['budget_variance']);
  });
});
