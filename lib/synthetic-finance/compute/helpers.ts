import type { MonthlyFinancials, SyntheticFinanceDataset } from '../types';
import { COMPUTE_SCOPE, type SeriesPoint } from './types';

export function meta(definition: string, sources: readonly string[]) {
  return { definition, sources, scope: COMPUTE_SCOPE } as const;
}

export function profitOf(row: MonthlyFinancials): number {
  return (
    row.revenue_billed -
    row.direct_labor_cost -
    row.back_office_cost -
    row.other_opex_ex_labor -
    row.interest_expense
  );
}

export function profitMargin(row: MonthlyFinancials): number {
  if (row.revenue_billed === 0) return 0;
  return profitOf(row) / row.revenue_billed;
}

export function profitSeries(dataset: SyntheticFinanceDataset): SeriesPoint[] {
  return dataset.monthly_financials.map((row) => ({ month: row.month, value: profitOf(row) }));
}

/** Net cash flow from I3 financing terms (not Δ cash balance alone). */
export function netCashFlowI3(
  cashCollected: number,
  draws: number,
  expensesPaidCash: number,
  principalPaid: number,
): number {
  return cashCollected + draws - expensesPaidCash - principalPaid;
}

export function membersAtMonthStart(ops: {
  members_end: number;
  new_members: number;
  lost_members: number;
}): number {
  return ops.members_end - ops.new_members + ops.lost_members;
}

/**
 * Caregivers at month start.
 * Prefer end − hired + left when caregivers_end is present.
 * Phase 1 generated rows omit caregivers_end; then invert
 * avg ≈ (start + end) / 2 with end = start + hired − left
 * → start ≈ avg − (hired − left) / 2.
 */
export function caregiversAtMonthStart(ops: {
  caregivers_avg: number;
  caregivers_hired: number;
  caregivers_left: number;
  caregivers_end?: number;
}): number {
  if (typeof ops.caregivers_end === 'number') {
    return ops.caregivers_end - ops.caregivers_hired + ops.caregivers_left;
  }
  return Math.round(ops.caregivers_avg - (ops.caregivers_hired - ops.caregivers_left) / 2);
}

export function nextMonthKey(month: string): string {
  const [y, m] = month.split('-').map(Number);
  if (m === 12) return `${y + 1}-01`;
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}

export function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Ordinary least-squares slope for y over evenly spaced x = 0..n-1. */
export function linearSlope(values: readonly number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i += 1) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

export function directionWord(changePct: number, flatBand = 0.03): 'growing' | 'declining' | 'flat' {
  if (changePct > flatBand) return 'growing';
  if (changePct < -flatBand) return 'declining';
  return 'flat';
}

export function pctChange(from: number, to: number): number {
  if (from === 0) return to === 0 ? 0 : to > 0 ? Infinity : -Infinity;
  return (to - from) / from;
}
