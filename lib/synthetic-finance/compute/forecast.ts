import { storyConfig } from '../story-config';
import type { SyntheticFinanceDataset } from '../types';
import { average, linearSlope, meta, nextMonthKey } from './helpers';
import type { ComputeMeta } from './types';

export type ForecastMonthRow = {
  month: string;
  revenue_billed: number;
  cash_collected: number;
  direct_labor_cost: number;
  back_office_cost: number;
  other_opex_ex_labor: number;
  interest_expense: number;
  profit: number;
  cash: number;
  debt: number;
  draws: number;
  principal_paid: number;
  collection_rate: number;
  direct_labor_ratio: number;
  back_office_ratio: number;
  other_opex_ratio: number;
};

export type ForecastAssumptions = {
  billedMonthlyGrowthRate: number;
  collectionRateTrailing6Avg: number;
  directLaborRatio: { latest: number; slope: number; appliedSlope: number; floor: number; mode: 'improving' | 'held_flat' };
  backOfficeRatio: { latest: number; slope: number; appliedSlope: number; floor: number; mode: 'improving' | 'held_flat' };
  otherOpexRatio: { latest: number; slope: number; appliedSlope: number; floor: number; mode: 'improving' | 'held_flat' };
  principalPaidPerMonth: number;
  drawsPerMonth: number;
  annualDebtApr: number;
  monthlyDebtRate: number;
  startingCash: number;
  startingDebt: number;
};

export type Forecast12Result = ComputeMeta & {
  months: readonly ForecastMonthRow[];
  assumptions: ForecastAssumptions;
};

type RatioPlan = {
  latest: number;
  slope: number;
  appliedSlope: number;
  floor: number;
  mode: 'improving' | 'held_flat';
};

/**
 * Expense-ratio rule (approved):
 * Continue the trailing-12M linear improvement. If the trailing trend is worsening, hold flat.
 * Floor: a cost ratio may not improve below 0 (cannot turn negative). Using min(trailing-12)
 * as a floor is a no-op when the series is already monotonically improving (min === latest),
 * so that reading is rejected in favor of a 0 floor.
 */
function planExpenseRatio(ratios: readonly number[]): RatioPlan {
  const latest = ratios[ratios.length - 1];
  const slope = linearSlope(ratios);
  const floor = 0;
  // Cost ratios: negative slope = improving (lower cost share).
  if (slope >= 0) {
    return { latest, slope, appliedSlope: 0, floor, mode: 'held_flat' };
  }
  return { latest, slope, appliedSlope: slope, floor, mode: 'improving' };
}

function projectRatio(plan: RatioPlan, step: number): number {
  if (plan.mode === 'held_flat') return plan.latest;
  return Math.max(plan.floor, plan.latest + plan.appliedSlope * step);
}

export function buildForecast12(dataset: SyntheticFinanceDataset): Forecast12Result {
  const financials = dataset.monthly_financials;
  const debt = dataset.debt_schedule;
  const balances = dataset.monthly_balances;
  const n = financials.length;
  if (n < 2) {
    throw new Error('buildForecast12 requires at least 2 months of history.');
  }

  // Trailing-12-month average monthly growth (use up to 12 MoM rates ending at latest month).
  const growthStart = Math.max(1, n - 12);
  const growthRates: number[] = [];
  for (let i = growthStart; i < n; i += 1) {
    const prev = financials[i - 1].revenue_billed;
    const cur = financials[i].revenue_billed;
    growthRates.push(prev === 0 ? 0 : cur / prev - 1);
  }
  const billedMonthlyGrowthRate = average(growthRates);

  const last12 = financials.slice(-Math.min(12, n));
  const directRatios = last12.map((row) => row.direct_labor_cost / row.revenue_billed);
  const backRatios = last12.map((row) => row.back_office_cost / row.revenue_billed);
  const otherRatios = last12.map((row) => row.other_opex_ex_labor / row.revenue_billed);
  const directPlan = planExpenseRatio(directRatios);
  const backPlan = planExpenseRatio(backRatios);
  const otherPlan = planExpenseRatio(otherRatios);

  const last6 = financials.slice(-6);
  const collectionRateTrailing6Avg = average(
    last6.map((row) => (row.revenue_billed === 0 ? 0 : row.cash_collected / row.revenue_billed)),
  );

  const principalPaidPerMonth = debt[n - 1].principal_paid;
  const drawsPerMonth = 0;
  const annualDebtApr = storyConfig.debt.annualRate;
  const monthlyDebtRate = annualDebtApr / 12;

  let cash = balances[n - 1].cash;
  let debtBal = debt[n - 1].closing_balance;
  let billed = financials[n - 1].revenue_billed;
  let month = financials[n - 1].month;

  const months: ForecastMonthRow[] = [];
  for (let step = 1; step <= 12; step += 1) {
    month = nextMonthKey(month);
    billed = Math.round(billed * (1 + billedMonthlyGrowthRate));
    const directRatio = projectRatio(directPlan, step);
    const backRatio = projectRatio(backPlan, step);
    const otherRatio = projectRatio(otherPlan, step);
    const direct = Math.round(billed * directRatio);
    const back = Math.round(billed * backRatio);
    const other = Math.round(billed * otherRatio);
    const interest = Math.round(debtBal * monthlyDebtRate);
    const collected = Math.round(billed * collectionRateTrailing6Avg);
    const principal = principalPaidPerMonth;
    const draws = drawsPerMonth;
    // Cash expenses approx: pay accrued costs at history cash-pay discipline — use full accrued for forecast simplicity
    // Spec rows ask for costs + interest + profit + cash + debt; cash roll uses I3 terms with expenses_paid_cash.
    // Forecast treats expenses_paid_cash as sum of operating accrued costs + interest (fully paid) for projection clarity.
    const expensesPaidCash = direct + back + other + interest;
    const profit = billed - direct - back - other - interest;
    cash = cash + collected + draws - expensesPaidCash - principal;
    debtBal = debtBal + draws - principal;

    months.push({
      month,
      revenue_billed: billed,
      cash_collected: collected,
      direct_labor_cost: direct,
      back_office_cost: back,
      other_opex_ex_labor: other,
      interest_expense: interest,
      profit,
      cash,
      debt: debtBal,
      draws,
      principal_paid: principal,
      collection_rate: collectionRateTrailing6Avg,
      direct_labor_ratio: directRatio,
      back_office_ratio: backRatio,
      other_opex_ratio: otherRatio,
    });
  }

  return {
    ...meta(
      '12-month forward projection: billed grows at the trailing-12-month average month-over-month growth rate; ' +
        'each expense-to-revenue ratio continues its trailing-12-month linear improvement (held flat if the trend is worsening; ' +
        'floored at 0 so a ratio never turns negative); collection rate equals the trailing-6-month average; ' +
        'debt pays the most recent scheduled principal with draws = 0 and interest at the story-config APR on the projected balance.',
      ['monthly_financials', 'debt_schedule', 'monthly_balances', 'storyConfig.debt.annualRate'],
    ),
    months,
    assumptions: {
      billedMonthlyGrowthRate,
      collectionRateTrailing6Avg,
      directLaborRatio: directPlan,
      backOfficeRatio: backPlan,
      otherOpexRatio: otherPlan,
      principalPaidPerMonth,
      drawsPerMonth,
      annualDebtApr,
      monthlyDebtRate,
      startingCash: balances[n - 1].cash,
      startingDebt: debt[n - 1].closing_balance,
    },
  };
}

/** First forecast month with profit ≥ 0, or null. */
export function firstForecastBreakEvenMonth(
  forecast: Forecast12Result,
): { month: string; profit: number } | null {
  for (const row of forecast.months) {
    if (row.profit >= 0) return { month: row.month, profit: row.profit };
  }
  return null;
}
