import { storyConfig } from '../story-config';
import type { SyntheticFinanceDataset } from '../types';
import { buildForecast12, firstForecastBreakEvenMonth } from './forecast';
import {
  average,
  caregiversAtMonthStart,
  directionWord,
  membersAtMonthStart,
  meta,
  netCashFlowI3,
  pctChange,
  profitMargin,
  profitOf,
  profitSeries,
} from './helpers';
import type { ComputeMeta, SeriesPoint } from './types';

export type BreakEvenStatusResult = ComputeMeta & {
  historyProfitSeries: readonly SeriesPoint[];
  forecastProfitSeries: readonly SeriesPoint[];
  current: {
    profitable: boolean;
    latestMonth: string;
    profit: number;
    marginPct: number;
  };
  firstForecastBreakEven: { month: string; profit: number } | null;
  noBreakEvenReason: string | null;
};

export function getBreakEvenStatus(dataset: SyntheticFinanceDataset): BreakEvenStatusResult {
  const history = profitSeries(dataset);
  const latest = dataset.monthly_financials[dataset.monthly_financials.length - 1];
  const profit = profitOf(latest);
  const forecast = buildForecast12(dataset);
  const forecastProfitSeries = forecast.months.map((row) => ({ month: row.month, value: row.profit }));
  const first = firstForecastBreakEvenMonth(forecast);

  return {
    ...meta(
      'Monthly profit = revenue_billed − direct_labor_cost − back_office_cost − other_opex_ex_labor − interest_expense. ' +
        'Current status uses the latest history month. Break-even month is the first of the 12-month forecast where projected profit ≥ 0.',
      ['monthly_financials', 'debt_schedule', 'monthly_balances'],
    ),
    historyProfitSeries: history,
    forecastProfitSeries,
    current: {
      profitable: profit >= 0,
      latestMonth: latest.month,
      profit,
      marginPct: profitMargin(latest) * 100,
    },
    firstForecastBreakEven: first,
    noBreakEvenReason: first
      ? null
      : 'No forecast month in the next 12 reaches projected profit ≥ 0 under the approved forecast method.',
  };
}

export type DebtServiceResult = ComputeMeta & {
  trailing12DebtService: number;
  latestMonthDebtService: number;
  latestMonth: string;
  cashImpact: {
    label: 'cash impact (debt_service ÷ revenue_billed)';
    trailing12: number;
    latestMonth: number;
  };
  pnlImpact: {
    label: 'P&L impact (interest only)';
    interestDollarsTrailing12: number;
    interestDollarsLatestMonth: number;
    interestToRevenueTrailing12: number;
    interestToRevenueLatestMonth: number;
  };
};

export function getDebtService(dataset: SyntheticFinanceDataset): DebtServiceResult {
  const debt = dataset.debt_schedule;
  const fin = dataset.monthly_financials;
  const last12Debt = debt.slice(-12);
  const last12Fin = fin.slice(-12);
  const latestDebt = debt[debt.length - 1];
  const latestFin = fin[fin.length - 1];
  const trailing12DebtService = last12Debt.reduce((s, r) => s + r.debt_service, 0);
  const trailing12Revenue = last12Fin.reduce((s, r) => s + r.revenue_billed, 0);
  const trailing12Interest = last12Debt.reduce((s, r) => s + r.interest_paid, 0);

  return {
    ...meta(
      'Debt service = principal_paid + interest_paid from debt_schedule. ' +
        'Cash impact = debt_service ÷ revenue_billed. P&L impact uses interest only: interest_paid (and interest ÷ revenue_billed).',
      ['debt_schedule', 'monthly_financials'],
    ),
    trailing12DebtService,
    latestMonthDebtService: latestDebt.debt_service,
    latestMonth: latestDebt.month,
    cashImpact: {
      label: 'cash impact (debt_service ÷ revenue_billed)',
      trailing12: trailing12Revenue === 0 ? 0 : trailing12DebtService / trailing12Revenue,
      latestMonth: latestFin.revenue_billed === 0 ? 0 : latestDebt.debt_service / latestFin.revenue_billed,
    },
    pnlImpact: {
      label: 'P&L impact (interest only)',
      interestDollarsTrailing12: trailing12Interest,
      interestDollarsLatestMonth: latestDebt.interest_paid,
      interestToRevenueTrailing12: trailing12Revenue === 0 ? 0 : trailing12Interest / trailing12Revenue,
      interestToRevenueLatestMonth:
        latestFin.revenue_billed === 0 ? 0 : latestDebt.interest_paid / latestFin.revenue_billed,
    },
  };
}

export type DebtTrendResult = ComputeMeta & {
  series: readonly SeriesPoint[];
  first12: { start: number; end: number; changeDollars: number; changePct: number; direction: string };
  last12: { start: number; end: number; changeDollars: number; changePct: number; direction: string };
  last6: { start: number; end: number; changeDollars: number; changePct: number; direction: string };
};

function windowChange(
  series: readonly number[],
  startIdx: number,
  endIdx: number,
): { start: number; end: number; changeDollars: number; changePct: number; direction: string } {
  const start = series[startIdx];
  const end = series[endIdx];
  const changeDollars = end - start;
  const changePct = pctChange(start, end);
  return {
    start,
    end,
    changeDollars,
    changePct,
    direction: directionWord(Number.isFinite(changePct) ? changePct : 0),
  };
}

export function getDebtTrend(dataset: SyntheticFinanceDataset): DebtTrendResult {
  const closing = dataset.debt_schedule.map((row) => row.closing_balance);
  const series = dataset.debt_schedule.map((row) => ({ month: row.month, value: row.closing_balance }));
  const n = closing.length;
  const first12EndIdx = Math.min(11, n - 1);
  const first12Start = dataset.debt_schedule[0].opening_balance;
  const first12End = closing[first12EndIdx];
  const first12Pct = pctChange(first12Start, first12End);
  const last12StartIdx = Math.max(0, n - 12);
  const last6StartIdx = Math.max(0, n - 6);

  return {
    ...meta(
      'Debt trend uses debt_schedule.closing_balance. Windows: first 12 months (opening of month 1 through closing of month 12), ' +
        'last 12 months (closing 12 months ago through latest closing), last 6 months (closing 6 months ago through latest). ' +
        'Direction words: growing / declining / flat (±3% band).',
      ['debt_schedule'],
    ),
    series,
    first12: {
      start: first12Start,
      end: first12End,
      changeDollars: first12End - first12Start,
      changePct: first12Pct,
      direction: directionWord(Number.isFinite(first12Pct) ? first12Pct : 0),
    },
    last12: windowChange(closing, last12StartIdx, n - 1),
    last6: windowChange(closing, last6StartIdx, n - 1),
  };
}

export type CashFlowAssessmentResult = ComputeMeta & {
  ruleName: string;
  verdict: boolean;
  gapEndingOpenAr: number;
  negativeNetCashMonthsInLookback: number;
  lookbackMonths: number;
  negativeNetCashMonthsRequired: number;
  arTrend: {
    startMonth: string;
    endMonth: string;
    startOpenAr: number;
    endOpenAr: number;
    changeDollars: number;
    growing: boolean;
  };
  netCashFlowSeries: readonly SeriesPoint[];
};

export function getCashFlowAssessment(dataset: SyntheticFinanceDataset): CashFlowAssessmentResult {
  const rule = storyConfig.cashFlowProblemRule;
  const fin = dataset.monthly_financials;
  const debt = dataset.debt_schedule;
  const bal = dataset.monthly_balances;
  const lookback = Math.min(rule.lookbackMonths, bal.length);
  const startIdx = bal.length - lookback;

  const netSeries: SeriesPoint[] = [];
  let negative = 0;
  for (let i = 0; i < fin.length; i += 1) {
    const value = netCashFlowI3(
      fin[i].cash_collected,
      debt[i].draws,
      fin[i].expenses_paid_cash,
      debt[i].principal_paid,
    );
    netSeries.push({ month: fin[i].month, value });
    if (i >= startIdx && value < 0) negative += 1;
  }

  const arStart = bal[startIdx].open_ar;
  const arEnd = bal[bal.length - 1].open_ar;
  const growing = arEnd > arStart;
  const verdict = negative >= rule.negativeNetCashMonthsRequired && growing;

  return {
    ...meta(
      `Applies ${rule.name}: genuine cash-flow problem when net cash flow is negative in at least ` +
        `${rule.negativeNetCashMonthsRequired} of the last ${rule.lookbackMonths} months AND open A/R grows over that window. ` +
        'Net cash flow per month = cash_collected + draws − expenses_paid_cash − principal_paid. Gap reported as ending open A/R.',
      ['monthly_financials', 'debt_schedule', 'monthly_balances', 'storyConfig.cashFlowProblemRule'],
    ),
    ruleName: rule.name,
    verdict,
    gapEndingOpenAr: arEnd,
    negativeNetCashMonthsInLookback: negative,
    lookbackMonths: lookback,
    negativeNetCashMonthsRequired: rule.negativeNetCashMonthsRequired,
    arTrend: {
      startMonth: bal[startIdx].month,
      endMonth: bal[bal.length - 1].month,
      startOpenAr: arStart,
      endOpenAr: arEnd,
      changeDollars: arEnd - arStart,
      growing,
    },
    netCashFlowSeries: netSeries,
  };
}

export type CostPerMemberMonthResult = ComputeMeta & {
  latestMonth: string;
  latest: number;
  trailingAverage: number;
  trailingMonths: number;
  series: readonly SeriesPoint[];
};

export function getCostPerMemberMonth(dataset: SyntheticFinanceDataset): CostPerMemberMonthResult {
  // Ambiguity resolution: no service-delivery share of other_opex is defined on the tables → direct_labor only.
  const series = dataset.months.map((month, i) => {
    const fin = dataset.monthly_financials[i];
    const ops = dataset.monthly_operations[i];
    const value = ops.members_avg === 0 ? 0 : fin.direct_labor_cost / ops.members_avg;
    return { month, value };
  });
  const trailing = series.slice(-12);
  return {
    ...meta(
      'Cost per member per month = direct_labor_cost ÷ members_avg. ' +
        'Only direct labor is included: the dataset has no defined service-delivery allocation of other_opex_ex_labor, ' +
        'so no share of other opex is added. Back-office cost and interest are excluded.',
      ['monthly_financials', 'monthly_operations'],
    ),
    latestMonth: series[series.length - 1].month,
    latest: series[series.length - 1].value,
    trailingAverage: average(trailing.map((p) => p.value)),
    trailingMonths: trailing.length,
    series,
  };
}

export type CaregiverUtilizationResult = ComputeMeta & {
  latestMonth: string;
  latest: number;
  series: readonly SeriesPoint[];
};

export function getCaregiverUtilization(dataset: SyntheticFinanceDataset): CaregiverUtilizationResult {
  const series = dataset.monthly_operations.map((row) => ({
    month: row.month,
    value: row.caregiver_available_hours === 0 ? 0 : row.caregiver_delivered_hours / row.caregiver_available_hours,
  }));
  return {
    ...meta(
      'Caregiver utilization = caregiver_delivered_hours ÷ caregiver_available_hours.',
      ['monthly_operations'],
    ),
    latestMonth: series[series.length - 1].month,
    latest: series[series.length - 1].value,
    series,
  };
}

export type UnrealizedWaitlistRevenueResult = ComputeMeta & {
  latestMonth: string;
  unrealizedRevenue: number;
  factors: {
    waitlist_end: number;
    hoursPerMember: number;
    revenuePerHour: number;
  };
};

export function getUnrealizedWaitlistRevenue(dataset: SyntheticFinanceDataset): UnrealizedWaitlistRevenueResult {
  const i = dataset.months.length - 1;
  const ops = dataset.monthly_operations[i];
  const fin = dataset.monthly_financials[i];
  const hoursPerMember = ops.members_avg === 0 ? 0 : ops.service_hours / ops.members_avg;
  const revenuePerHour = ops.service_hours === 0 ? 0 : fin.revenue_billed / ops.service_hours;
  const unrealizedRevenue = ops.waitlist_end * hoursPerMember * revenuePerHour;
  return {
    ...meta(
      'Unrealized waitlist revenue = waitlist_end × (service_hours ÷ members_avg) × (revenue_billed ÷ service_hours) for the latest month.',
      ['monthly_operations', 'monthly_financials'],
    ),
    latestMonth: ops.month,
    unrealizedRevenue,
    factors: {
      waitlist_end: ops.waitlist_end,
      hoursPerMember,
      revenuePerHour,
    },
  };
}

export type RevenuePerMemberAndCaregiverResult = ComputeMeta & {
  latestMonth: string;
  latest: { perMember: number; perCaregiver: number };
  trailingAverage: { perMember: number; perCaregiver: number; months: number };
  series: readonly { month: string; perMember: number; perCaregiver: number }[];
};

export function getRevenuePerMemberAndCaregiver(
  dataset: SyntheticFinanceDataset,
): RevenuePerMemberAndCaregiverResult {
  const series = dataset.months.map((month, i) => {
    const fin = dataset.monthly_financials[i];
    const ops = dataset.monthly_operations[i];
    return {
      month,
      perMember: ops.members_avg === 0 ? 0 : fin.revenue_billed / ops.members_avg,
      perCaregiver: ops.caregivers_avg === 0 ? 0 : fin.revenue_billed / ops.caregivers_avg,
    };
  });
  const trailing = series.slice(-12);
  const latest = series[series.length - 1];
  return {
    ...meta(
      'Revenue per member = revenue_billed ÷ members_avg. Revenue per caregiver = revenue_billed ÷ caregivers_avg.',
      ['monthly_financials', 'monthly_operations'],
    ),
    latestMonth: latest.month,
    latest: { perMember: latest.perMember, perCaregiver: latest.perCaregiver },
    trailingAverage: {
      perMember: average(trailing.map((r) => r.perMember)),
      perCaregiver: average(trailing.map((r) => r.perCaregiver)),
      months: trailing.length,
    },
    series,
  };
}

export type ServiceLineProfitabilityResult = ComputeMeta & {
  latestMonth: string;
  lines: readonly {
    service_line: string;
    revenue: number;
    direct_cost: number;
    hours: number;
    marginPerHour: number;
    nonPositive: boolean;
  }[];
};

export function getServiceLineProfitability(dataset: SyntheticFinanceDataset): ServiceLineProfitabilityResult {
  const latestMonth = dataset.months[dataset.months.length - 1];
  const lines = dataset.service_lines
    .filter((row) => row.month === latestMonth)
    .map((row) => {
      const marginPerHour = row.hours === 0 ? 0 : (row.revenue - row.direct_cost) / row.hours;
      return {
        service_line: row.service_line,
        revenue: row.revenue,
        direct_cost: row.direct_cost,
        hours: row.hours,
        marginPerHour,
        nonPositive: marginPerHour <= 0,
      };
    })
    .sort((a, b) => b.marginPerHour - a.marginPerHour);

  return {
    ...meta(
      'Per service line for the latest month: margin per hour = (revenue − direct_cost) ÷ hours. Lines with margin ≤ 0 are flagged.',
      ['service_lines'],
    ),
    latestMonth,
    lines,
  };
}

export type RatiosAndChurnResult = ComputeMeta & {
  latestMonth: string;
  latest: {
    revenueToExpensesExLabor: number;
    revenueToBackOffice: number;
    debtToAnnualisedRevenue: number;
    debtServiceToRevenue: number;
    memberChurn: number;
    caregiverChurn: number;
  };
  trailingAverage: {
    revenueToExpensesExLabor: number;
    revenueToBackOffice: number;
    debtServiceToRevenue: number;
    memberChurn: number;
    caregiverChurn: number;
    months: number;
  };
};

export function getRatiosAndChurn(dataset: SyntheticFinanceDataset): RatiosAndChurnResult {
  const rows = dataset.months.map((month, i) => {
    const fin = dataset.monthly_financials[i];
    const debt = dataset.debt_schedule[i];
    const ops = dataset.monthly_operations[i];
    const expensesExLabor = fin.back_office_cost + fin.other_opex_ex_labor + fin.interest_expense;
    const memberStart = membersAtMonthStart(ops);
    const caregiverStart = caregiversAtMonthStart(ops);
    return {
      month,
      revenueToExpensesExLabor: expensesExLabor === 0 ? 0 : fin.revenue_billed / expensesExLabor,
      revenueToBackOffice: fin.back_office_cost === 0 ? 0 : fin.revenue_billed / fin.back_office_cost,
      debtServiceToRevenue: fin.revenue_billed === 0 ? 0 : debt.debt_service / fin.revenue_billed,
      memberChurn: memberStart === 0 ? 0 : ops.lost_members / memberStart,
      caregiverChurn: caregiverStart === 0 ? 0 : ops.caregivers_left / caregiverStart,
      revenue: fin.revenue_billed,
      debtClosing: debt.closing_balance,
    };
  });
  const latest = rows[rows.length - 1];
  const trailing = rows.slice(-12);
  const annualisedRevenue = latest.revenue * 12;

  return {
    ...meta(
      'Revenue ÷ Expenses-ex-Labor, where expenses ex-labor = back_office_cost + other_opex_ex_labor + interest_expense. ' +
        'Revenue ÷ Back-Office = revenue_billed ÷ back_office_cost. ' +
        'Debt ÷ annualised revenue = closing_balance ÷ (latest revenue_billed × 12). ' +
        'Debt service ÷ revenue = debt_service ÷ revenue_billed. ' +
        'Member churn = lost_members ÷ members at month start (members_end − new_members + lost_members). ' +
        'Caregiver churn = caregivers_left ÷ caregivers at month start. When caregivers_end is present, start = end − hired + left; ' +
        'Phase 1 rows omit caregivers_end, so start is inferred as round(caregivers_avg − (hired − left) / 2).',
      ['monthly_financials', 'debt_schedule', 'monthly_operations'],
    ),
    latestMonth: latest.month,
    latest: {
      revenueToExpensesExLabor: latest.revenueToExpensesExLabor,
      revenueToBackOffice: latest.revenueToBackOffice,
      debtToAnnualisedRevenue: annualisedRevenue === 0 ? 0 : latest.debtClosing / annualisedRevenue,
      debtServiceToRevenue: latest.debtServiceToRevenue,
      memberChurn: latest.memberChurn,
      caregiverChurn: latest.caregiverChurn,
    },
    trailingAverage: {
      revenueToExpensesExLabor: average(trailing.map((r) => r.revenueToExpensesExLabor)),
      revenueToBackOffice: average(trailing.map((r) => r.revenueToBackOffice)),
      debtServiceToRevenue: average(trailing.map((r) => r.debtServiceToRevenue)),
      memberChurn: average(trailing.map((r) => r.memberChurn)),
      caregiverChurn: average(trailing.map((r) => r.caregiverChurn)),
      months: trailing.length,
    },
  };
}
