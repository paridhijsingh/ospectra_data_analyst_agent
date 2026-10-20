/**
 * Presentation fixture for Scenario Planning v0.1.
 * Synthetic assumptions only. Does not calculate results.
 */
import type { CashTimingScenarioInput } from './cash-timing-scenario';

export const scenarioResearchQuestion =
  'What happens to cash available before an obligation if a reimbursement arrives later than expected?';

export const scenarioResearchNote =
  'This research prototype changes an explicit timing assumption and deterministically recalculates the result.';

export const delayedReimbursementFixture: CashTimingScenarioInput = {
  openingCash: 50_000,
  reimbursements: [
    { id: 'A', amount: 15_000, expectedDate: '2026-10-02', delayedByDays: 0 },
    { id: 'B', amount: 40_000, expectedDate: '2026-10-05', delayedByDays: 14 },
  ],
  obligationAmount: 70_000,
  obligationDate: '2026-10-06',
};

export const scenarioDisplayCopy = {
  receiptA: {
    label: 'Receipt A',
    amountLabel: '$15,000',
    expectedLabel: 'October 2, 2026',
    delayLabel: '0 days',
  },
  receiptB: {
    label: 'Receipt B',
    amountLabel: '$40,000',
    expectedLabel: 'October 5, 2026',
    scenarioArrivalLabel: 'October 19, 2026',
    delayLabel: '+14 calendar days',
  },
  obligation: {
    amountLabel: '$70,000',
    dateLabel: 'October 6, 2026',
  },
  openingCashLabel: '$50,000',
} as const;

export const scenarioTimeline = [
  { dateLabel: 'Oct 2', title: 'Receipt A +$15K', detail: 'Included in baseline and scenario' },
  { dateLabel: 'Oct 5', title: 'Receipt B +$40K', detail: 'Baseline arrival' },
  { dateLabel: 'Oct 6', title: '$70K obligation', detail: 'Cash measured before this obligation' },
  { dateLabel: 'Oct 19', title: 'Receipt B +$40K', detail: 'Scenario arrival — after the obligation' },
] as const;

export function formatUsd(amount: number): string {
  const absolute = Math.abs(amount);
  const formatted = absolute.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  return amount < 0 ? `-${formatted}` : formatted;
}
