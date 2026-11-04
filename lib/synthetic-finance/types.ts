/** Scope A synthetic finance tables. Generated from flows; not live systems. */

export type MonthKey = string; // YYYY-MM

export type MonthlyOperations = {
  month: MonthKey;
  members_avg: number;
  members_end: number;
  new_members: number;
  lost_members: number;
  caregivers_avg: number;
  caregivers_hired: number;
  caregivers_left: number;
  caregiver_available_hours: number;
  caregiver_delivered_hours: number;
  service_hours: number;
  sessions: number;
  waitlist_end: number;
  admissions: number;
};

export type MonthlyFinancials = {
  month: MonthKey;
  revenue_billed: number;
  cash_collected: number;
  direct_labor_cost: number;
  back_office_cost: number;
  other_opex_ex_labor: number;
  interest_expense: number;
  expenses_paid_cash: number;
};

export type DebtScheduleRow = {
  month: MonthKey;
  opening_balance: number;
  draws: number;
  principal_paid: number;
  interest_paid: number;
  closing_balance: number;
  debt_service: number;
};

export type ArLedgerRow = {
  payer_id: string;
  service_month: MonthKey;
  amount_billed: number;
  amount_paid: number;
  status: 'open' | 'partial' | 'paid' | 'denied';
  days_outstanding: number;
};

export type ApLedgerRow = {
  payee_type: 'payroll_obligation' | 'vendor' | 'other';
  amount: number;
  due_date: string; // YYYY-MM-DD
  days_waiting: number;
};

export type ServiceLineRow = {
  month: MonthKey;
  service_line: string;
  hours: number;
  sessions: number;
  revenue: number;
  direct_cost: number;
};

export type MonthlyBalances = {
  month: MonthKey;
  cash: number;
  open_ar: number;
  debt: number;
  open_ap: number;
  equity: number;
};

export type SyntheticFinanceDataset = {
  scope: 'A';
  asOfDate: string;
  months: readonly MonthKey[];
  monthly_operations: readonly MonthlyOperations[];
  monthly_financials: readonly MonthlyFinancials[];
  debt_schedule: readonly DebtScheduleRow[];
  ar_ledger: readonly ArLedgerRow[];
  ap_ledger: readonly ApLedgerRow[];
  service_lines: readonly ServiceLineRow[];
  monthly_balances: readonly MonthlyBalances[];
  opening: {
    cash: number;
    open_ar: number;
    debt: number;
    open_ap: number;
    equity: number;
  };
};
