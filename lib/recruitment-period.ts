/**
 * Recruitment period filter — derived from existing appliedAt month prefixes.
 * There is no separate quarter column on Application; Q2/Q3 map to calendar months
 * already present in the Apr–Sep 2026 synthetic window (monthKeys).
 */
import { applications, monthKeys, type Application } from './recruitment-data';

export type RecruitmentPeriod = 'Q2' | 'Q3' | 'all';

export const RECRUITMENT_PERIOD_OPTIONS = ['Q2', 'Q3', 'all'] as const;

/** Month prefixes already present on applications.appliedAt for each selectable period. */
export const RECRUITMENT_PERIOD_MONTHS: Record<RecruitmentPeriod, readonly string[]> = {
  Q2: ['2026-04', '2026-05', '2026-06'],
  Q3: ['2026-07', '2026-08', '2026-09'],
  all: monthKeys,
};

export function recruitmentPeriodLabel(period: RecruitmentPeriod): string {
  if (period === 'Q2') return 'Q2 2026 (Apr–Jun)';
  if (period === 'Q3') return 'Q3 2026 (Jul–Sep)';
  return 'All (Apr–Sep 2026)';
}

/** Filter applications by appliedAt month — never mixes quarters. */
export function filterApplicationsByPeriod(
  rows: readonly Application[],
  period: RecruitmentPeriod,
): Application[] {
  if (period === 'all') return [...rows];
  const months = RECRUITMENT_PERIOD_MONTHS[period];
  return rows.filter((row) => months.some((month) => row.appliedAt.startsWith(month)));
}

export function applicationsForPeriod(period: RecruitmentPeriod): Application[] {
  return filterApplicationsByPeriod(applications, period);
}

/** First governed question that accepts the period parameter (pattern proof). */
export const PERIOD_AWARE_QUESTION_ID = 'candidates-by-source' as const;
