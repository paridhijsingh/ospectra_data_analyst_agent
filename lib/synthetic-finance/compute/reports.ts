import type { SyntheticFinanceDataset } from '../types';
import { meta, profitOf } from './helpers';
import type { ComputeMeta } from './types';

export type IncomeStatementResult = ComputeMeta & {
  monthly: readonly {
    month: string;
    revenue_billed: number;
    direct_labor_cost: number;
    back_office_cost: number;
    other_opex_ex_labor: number;
    interest_expense: number;
    total_expenses: number;
    profit: number;
  }[];
  trailing12: {
    revenue_billed: number;
    direct_labor_cost: number;
    back_office_cost: number;
    other_opex_ex_labor: number;
    interest_expense: number;
    total_expenses: number;
    profit: number;
  };
};

export function buildIncomeStatement(dataset: SyntheticFinanceDataset): IncomeStatementResult {
  const monthly = dataset.monthly_financials.map((row) => {
    const total_expenses =
      row.direct_labor_cost + row.back_office_cost + row.other_opex_ex_labor + row.interest_expense;
    return {
      month: row.month,
      revenue_billed: row.revenue_billed,
      direct_labor_cost: row.direct_labor_cost,
      back_office_cost: row.back_office_cost,
      other_opex_ex_labor: row.other_opex_ex_labor,
      interest_expense: row.interest_expense,
      total_expenses,
      profit: profitOf(row),
    };
  });
  const last12 = monthly.slice(-12);
  const sum = (key: keyof (typeof last12)[number]) =>
    last12.reduce((s, row) => s + (row[key] as number), 0);

  return {
    ...meta(
      'Income statement from monthly_financials: revenue_billed less direct_labor, back_office, other_opex_ex_labor, and interest_expense. Trailing-12M is the sum of the last 12 months.',
      ['monthly_financials'],
    ),
    monthly,
    trailing12: {
      revenue_billed: sum('revenue_billed'),
      direct_labor_cost: sum('direct_labor_cost'),
      back_office_cost: sum('back_office_cost'),
      other_opex_ex_labor: sum('other_opex_ex_labor'),
      interest_expense: sum('interest_expense'),
      total_expenses: sum('total_expenses'),
      profit: sum('profit'),
    },
  };
}

export type BalanceSheetResult = ComputeMeta & {
  month: string;
  assets: { cash: number; open_ar: number; total: number };
  liabilitiesAndEquity: { debt: number; open_ap: number; equity: number; total: number };
  balances: boolean;
  disclosure: string;
};

export function buildBalanceSheet(dataset: SyntheticFinanceDataset): BalanceSheetResult {
  const row = dataset.monthly_balances[dataset.monthly_balances.length - 1];
  const assetsTotal = row.cash + row.open_ar;
  const lAndETotal = row.debt + row.open_ap + row.equity;
  return {
    ...meta(
      'Balance sheet (latest month): assets = cash + open A/R; liabilities & equity = debt + open A/P + equity. No fixed assets or depreciation exist in this dataset.',
      ['monthly_balances'],
    ),
    month: row.month,
    assets: { cash: row.cash, open_ar: row.open_ar, total: assetsTotal },
    liabilitiesAndEquity: {
      debt: row.debt,
      open_ap: row.open_ap,
      equity: row.equity,
      total: lAndETotal,
    },
    balances: assetsTotal === lAndETotal,
    disclosure: 'no fixed assets / depreciation in this dataset',
  };
}

export type CashFlowStatementResult = ComputeMeta & {
  monthly: readonly {
    month: string;
    operating: {
      cash_collected: number;
      cash_expenses_ex_interest: number;
      interest_paid: number;
      net_operating: number;
    };
    financing: {
      draws: number;
      principal_paid: number;
      net_financing: number;
    };
    net_change_in_cash: number;
    ending_cash: number;
  }[];
};

export function buildCashFlowStatement(dataset: SyntheticFinanceDataset): CashFlowStatementResult {
  const monthly = dataset.months.map((month, i) => {
    const fin = dataset.monthly_financials[i];
    const debt = dataset.debt_schedule[i];
    const interest_paid = debt.interest_paid;
    const cash_expenses_ex_interest = fin.expenses_paid_cash - interest_paid;
    const net_operating = fin.cash_collected - cash_expenses_ex_interest - interest_paid;
    const net_financing = debt.draws - debt.principal_paid;
    const net_change_in_cash = net_operating + net_financing;
    return {
      month,
      operating: {
        cash_collected: fin.cash_collected,
        cash_expenses_ex_interest,
        interest_paid,
        net_operating,
      },
      financing: {
        draws: debt.draws,
        principal_paid: debt.principal_paid,
        net_financing,
      },
      net_change_in_cash,
      ending_cash: dataset.monthly_balances[i].cash,
    };
  });

  return {
    ...meta(
      'Cash flow statement: operating = cash_collected in; cash expenses (expenses_paid_cash − interest_paid) and interest_paid out. ' +
        'Financing = draws in and principal_paid out. Net change = collected + draws − expenses_paid_cash − principal_paid and ties to the cash roll.',
      ['monthly_financials', 'debt_schedule', 'monthly_balances'],
    ),
    monthly,
  };
}

export type AccountsReceivableReport = ComputeMeta & {
  asOfDate: string;
  ledger: SyntheticFinanceDataset['ar_ledger'];
  totalOpen: number;
  aging: {
    '0_30': number;
    '31_60': number;
    '61_90': number;
    '90_plus': number;
  };
};

export function buildAccountsReceivable(dataset: SyntheticFinanceDataset): AccountsReceivableReport {
  const aging = { '0_30': 0, '31_60': 0, '61_90': 0, '90_plus': 0 };
  let totalOpen = 0;
  for (const row of dataset.ar_ledger) {
    const open = row.amount_billed - row.amount_paid;
    totalOpen += open;
    if (row.days_outstanding <= 30) aging['0_30'] += open;
    else if (row.days_outstanding <= 60) aging['31_60'] += open;
    else if (row.days_outstanding <= 90) aging['61_90'] += open;
    else aging['90_plus'] += open;
  }
  return {
    ...meta(
      'Accounts receivable from ar_ledger. Open amount = amount_billed − amount_paid. Aging buckets are computed from days_outstanding (0–30, 31–60, 61–90, 90+), never stored.',
      ['ar_ledger'],
    ),
    asOfDate: dataset.asOfDate,
    ledger: dataset.ar_ledger,
    totalOpen,
    aging,
  };
}

export type AccountsPayableReport = ComputeMeta & {
  asOfDate: string;
  ledger: SyntheticFinanceDataset['ap_ledger'];
  totalOpen: number;
  byPayeeType: readonly { payee_type: string; amount: number; count: number }[];
  byDaysWaiting: {
    '0_30': number;
    '31_60': number;
    '60_plus': number;
  };
};

export function buildAccountsPayable(dataset: SyntheticFinanceDataset): AccountsPayableReport {
  const byType = new Map<string, { amount: number; count: number }>();
  const byDaysWaiting = { '0_30': 0, '31_60': 0, '60_plus': 0 };
  let totalOpen = 0;
  for (const row of dataset.ap_ledger) {
    totalOpen += row.amount;
    const cur = byType.get(row.payee_type) ?? { amount: 0, count: 0 };
    cur.amount += row.amount;
    cur.count += 1;
    byType.set(row.payee_type, cur);
    if (row.days_waiting <= 30) byDaysWaiting['0_30'] += row.amount;
    else if (row.days_waiting <= 60) byDaysWaiting['31_60'] += row.amount;
    else byDaysWaiting['60_plus'] += row.amount;
  }
  return {
    ...meta(
      'Accounts payable from ap_ledger, grouped by payee_type and by days_waiting bands (0–30, 31–60, 60+).',
      ['ap_ledger'],
    ),
    asOfDate: dataset.asOfDate,
    ledger: dataset.ap_ledger,
    totalOpen,
    byPayeeType: [...byType.entries()].map(([payee_type, v]) => ({
      payee_type,
      amount: v.amount,
      count: v.count,
    })),
    byDaysWaiting,
  };
}
