import { describe, expect, it } from 'vitest';
import { answerQuestion } from './metric-engine';
import { runOrchestrator, semanticHonestyLabel } from './orchestrator';
import { applications } from './recruitment-data';
import {
  applicationsForPeriod,
  PERIOD_AWARE_QUESTION_ID,
  RECRUITMENT_PERIOD_MONTHS,
  recruitmentPeriodLabel,
} from './recruitment-period';

const SOURCE_PROMPT = 'Which recruiting sources bring in the most candidates?';

describe('recruitment period filter (candidates-by-source pattern)', () => {
  it('maps Q2/Q3 to existing appliedAt month prefixes without inventing rows', () => {
    expect(RECRUITMENT_PERIOD_MONTHS.Q2).toEqual(['2026-04', '2026-05', '2026-06']);
    expect(RECRUITMENT_PERIOD_MONTHS.Q3).toEqual(['2026-07', '2026-08', '2026-09']);
    const q2 = applicationsForPeriod('Q2');
    const q3 = applicationsForPeriod('Q3');
    const all = applicationsForPeriod('all');
    expect(q2.length + q3.length).toBe(applications.length);
    expect(all.length).toBe(applications.length);
    expect(q2.every((row) => RECRUITMENT_PERIOD_MONTHS.Q2.some((m) => row.appliedAt.startsWith(m)))).toBe(
      true,
    );
    expect(q3.every((row) => RECRUITMENT_PERIOD_MONTHS.Q3.some((m) => row.appliedAt.startsWith(m)))).toBe(
      true,
    );
    expect(q2.some((row) => RECRUITMENT_PERIOD_MONTHS.Q3.some((m) => row.appliedAt.startsWith(m)))).toBe(
      false,
    );
  });

  it('All reproduces today\'s candidates-by-source answer exactly for content fields', () => {
    const today = answerQuestion(SOURCE_PROMPT);
    const all = answerQuestion(SOURCE_PROMPT, 'all');
    expect(all.questionId).toBe(PERIOD_AWARE_QUESTION_ID);
    expect(all.title).toBe(today.title);
    expect(all.summary).toBe(today.summary);
    expect(all.insight).toBe(today.insight);
    expect(all.data).toEqual(today.data);
    expect(all.queryPlan).toBe('candidate_count · group by source · six months');
    expect(all.metricIds).toEqual(['candidate_count']);
    expect(semanticHonestyLabel('recruitment', all)).toBe(
      'Matched approved metric(s): candidate_count.',
    );
  });

  it('Q2 and Q3 differ from the whole-window answer and from each other', () => {
    const all = answerQuestion(SOURCE_PROMPT, 'all');
    const q2 = answerQuestion(SOURCE_PROMPT, 'Q2');
    const q3 = answerQuestion(SOURCE_PROMPT, 'Q3');
    expect(q2.periodApplied).toBe(true);
    expect(q3.periodApplied).toBe(true);
    expect(q2.data).not.toEqual(all.data);
    expect(q3.data).not.toEqual(all.data);
    expect(q2.data).not.toEqual(q3.data);
    expect(q2.data.reduce((sum, row) => sum + row.value, 0)).toBe(applicationsForPeriod('Q2').length);
    expect(q3.data.reduce((sum, row) => sum + row.value, 0)).toBe(applicationsForPeriod('Q3').length);
    expect(q2.queryPlan).toContain(recruitmentPeriodLabel('Q2'));
    expect(q3.queryPlan).toContain(recruitmentPeriodLabel('Q3'));
  });

  it('lineage / orchestrator trace surfaces the selected period', () => {
    const result = runOrchestrator('recruitment', SOURCE_PROMPT, 'Q2');
    expect(result.answer.period).toBe('Q2');
    expect(result.answer.periodLabel).toBe(recruitmentPeriodLabel('Q2'));
    expect(result.answer.periodApplied).toBe(true);
    const executor = result.trace.find((step) => step.id === 'executor');
    expect(executor?.detail).toContain(recruitmentPeriodLabel('Q2'));
    expect(executor?.detail).toContain('filter applied');
  });

  it('does not change governed honesty labels or finance routing', () => {
    const recruitment = runOrchestrator('recruitment', SOURCE_PROMPT, 'Q3');
    expect(semanticHonestyLabel('recruitment', recruitment.answer)).toBe(
      'Matched approved metric(s): candidate_count.',
    );
    const finance = runOrchestrator('financial', 'Do we have a genuine cash-flow problem?', 'Q2');
    expect(finance.answer.period).toBeUndefined();
    expect(finance.trace.find((step) => step.id === 'executor')?.detail).not.toMatch(/Period/);
  });

  it('leaves refusals unchanged when a period is selected', () => {
    const refusal = answerQuestion('What is our candidate NPS score?', 'Q2');
    expect(refusal.supported).toBe(false);
    expect(refusal.questionId).toBe('unsupported');
    expect(refusal.nearestConcept).toBe('Candidate');
  });
});
