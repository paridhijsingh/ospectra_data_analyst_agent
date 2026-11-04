/**
 * Scope A synthetic finance generator.
 * Builds tables from storyConfig flow parameters. Seed makes regeneration byte-identical.
 * Accounting identities are authoritative; soft targets are not force-fit per cell.
 */
import { createRng, randBetween, randInt } from './rng';
import { storyConfig, type StoryConfig } from './story-config';
import type {
  ApLedgerRow,
  ArLedgerRow,
  DebtScheduleRow,
  MonthKey,
  MonthlyBalances,
  MonthlyFinancials,
  MonthlyOperations,
  ServiceLineRow,
  SyntheticFinanceDataset,
} from './types';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function roundDollar(value: number): number {
  return Math.round(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Build YYYY-MM keys starting at config.months.start for count months. */
export function buildMonthKeys(config: StoryConfig = storyConfig): MonthKey[] {
  const [yearStr, monthStr] = config.months.start.split('-');
  let year = Number(yearStr);
  let month = Number(monthStr);
  const keys: MonthKey[] = [];
  for (let i = 0; i < config.months.count; i += 1) {
    keys.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return keys;
}

function allocateByShares(total: number, shares: readonly number[]): number[] {
  const sum = shares.reduce((a, b) => a + b, 0);
  const raw = shares.map((share) => (total * share) / sum);
  const floored = raw.map((value) => Math.floor(value));
  let remainder = total - floored.reduce((a, b) => a + b, 0);
  const order = raw
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac);
  const out = [...floored];
  for (let i = 0; i < order.length && remainder > 0; i += 1) {
    out[order[i].index] += 1;
    remainder -= 1;
  }
  return out;
}

function buildOperations(
  months: readonly MonthKey[],
  config: StoryConfig,
  rng: () => number,
): MonthlyOperations[] {
  const ops: MonthlyOperations[] = [];
  let membersEnd = config.operations.membersStart;
  let caregiversEnd = config.operations.caregiversStart;
  let waitlist = config.operations.waitlistStart;

  for (let i = 0; i < months.length; i += 1) {
    const t = i / (months.length - 1);
    const membersStart = membersEnd;
    const lost = roundDollar(membersStart * config.operations.memberChurnRate * randBetween(rng, 0.92, 1.08));
    const admissions = roundDollar(
      config.operations.memberGrowthPerMonth + lost + randBetween(rng, -1.5, 2.5) + t * 2,
    );
    const newMembers = Math.max(0, admissions);
    membersEnd = Math.max(1, membersStart + newMembers - lost);
    const membersAvg = roundDollar((membersStart + membersEnd) / 2);

    const caregiversStart = caregiversEnd;
    const caregiversLeft = roundDollar(
      caregiversStart * config.operations.caregiverChurnRate * randBetween(rng, 0.9, 1.1),
    );
    const caregiversHired = Math.max(
      0,
      roundDollar(config.operations.caregiverGrowthPerMonth + caregiversLeft + randBetween(rng, -0.5, 1.2)),
    );
    caregiversEnd = Math.max(1, caregiversStart + caregiversHired - caregiversLeft);
    const caregiversAvg = roundDollar((caregiversStart + caregiversEnd) / 2);

    const available = roundDollar(caregiversAvg * config.operations.availableHoursPerCaregiverMonth);
    const util = clamp(
      config.operations.utilizationTarget + randBetween(rng, -0.06, 0.06),
      0.7,
      0.95,
    );
    const delivered = roundDollar(available * util);
    const serviceHours = delivered;
    const sessions = roundDollar(serviceHours * config.operations.sessionsPerHour);

    waitlist = Math.max(
      0,
      roundDollar(waitlist + config.operations.waitlistDriftPerMonth + randBetween(rng, -1.2, 2.0) + (t > 0.5 ? 0.4 : 0)),
    );

    ops.push({
      month: months[i],
      members_avg: membersAvg,
      members_end: membersEnd,
      new_members: newMembers,
      lost_members: lost,
      caregivers_avg: caregiversAvg,
      caregivers_hired: caregiversHired,
      caregivers_left: caregiversLeft,
      caregiver_available_hours: available,
      caregiver_delivered_hours: delivered,
      service_hours: serviceHours,
      sessions,
      waitlist_end: waitlist,
      admissions: newMembers,
    });
  }
  return ops;
}

function buildFinancialsAndDebt(
  months: readonly MonthKey[],
  config: StoryConfig,
  rng: () => number,
): { financials: MonthlyFinancials[]; debt: DebtScheduleRow[] } {
  const financials: MonthlyFinancials[] = [];
  const debt: DebtScheduleRow[] = [];
  let debtOpen = config.opening.debt;
  const monthlyRate = config.debt.annualRate / 12;

  for (let i = 0; i < months.length; i += 1) {
    const t = Math.pow(i / (months.length - 1), config.revenue.collectionCurvePower);
    const tLinear = i / (months.length - 1);
    const billedNoise = config.revenue.billedNoise;
    const collectionNoise = config.revenue.collectionNoise;
    const billed = roundDollar(
      lerp(config.revenue.startBilled, config.revenue.endBilled, tLinear) *
        randBetween(rng, 1 - billedNoise, 1 + billedNoise),
    );
    const collectionRate = lerp(
      config.revenue.startCollectionRate,
      config.revenue.endCollectionRate,
      t,
    );
    const collected = roundDollar(
      billed * collectionRate * randBetween(rng, 1 - collectionNoise, 1 + collectionNoise),
    );

    const directRate = lerp(config.costs.directLaborStart, config.costs.directLaborEnd, tLinear);
    const backRate = lerp(config.costs.backOfficeStart, config.costs.backOfficeEnd, tLinear);
    const otherRate = lerp(config.costs.otherOpexStart, config.costs.otherOpexEnd, tLinear);
    const direct = roundDollar(billed * directRate);
    const backOffice = roundDollar(billed * backRate);
    const other = roundDollar(billed * otherRate);

    const inLastSix = i >= months.length - 6;
    const inFirstTwelve = i < 12;
    let draws: number;
    let principal: number;
    if (inLastSix && config.debt.lateDrawMatchPrincipal) {
      principal = config.debt.latePrincipal;
      draws = config.debt.latePrincipal;
    } else if (inFirstTwelve) {
      draws = config.debt.earlyDraw;
      principal = config.debt.earlyPrincipal;
    } else {
      draws = config.debt.lateDraw;
      principal = roundDollar(lerp(config.debt.earlyPrincipal, config.debt.latePrincipal, (i - 12) / 5));
    }

    const interest = roundDollar(debtOpen * monthlyRate);
    const closing = debtOpen + draws - principal;
    debt.push({
      month: months[i],
      opening_balance: debtOpen,
      draws,
      principal_paid: principal,
      interest_paid: interest,
      closing_balance: closing,
      debt_service: principal + interest,
    });
    debtOpen = closing;

    const accrued = direct + backOffice + other + interest;
    const expensesPaidCash = roundDollar(accrued * config.costs.cashPayRate);

    financials.push({
      month: months[i],
      revenue_billed: billed,
      cash_collected: collected,
      direct_labor_cost: direct,
      back_office_cost: backOffice,
      other_opex_ex_labor: other,
      interest_expense: interest,
      expenses_paid_cash: expensesPaidCash,
    });
  }

  return { financials, debt };
}

function buildBalances(
  months: readonly MonthKey[],
  financials: readonly MonthlyFinancials[],
  debt: readonly DebtScheduleRow[],
  config: StoryConfig,
): { balances: MonthlyBalances[]; openingEquity: number } {
  let cash = config.opening.cash;
  let openAr = config.opening.open_ar;
  let openAp = config.opening.open_ap;
  const openingEquity =
    config.opening.cash + config.opening.open_ar - config.opening.debt - config.opening.open_ap;
  let equity = openingEquity;
  const balances: MonthlyBalances[] = [];

  for (let i = 0; i < months.length; i += 1) {
    const fin = financials[i];
    const d = debt[i];
    const accrued =
      fin.direct_labor_cost + fin.back_office_cost + fin.other_opex_ex_labor + fin.interest_expense;
    const profit = fin.revenue_billed - accrued;

    openAr = openAr + fin.revenue_billed - fin.cash_collected;
    openAp = openAp + accrued - fin.expenses_paid_cash;
    cash = cash + fin.cash_collected + d.draws - fin.expenses_paid_cash - d.principal_paid;
    equity = equity + profit;

    balances.push({
      month: months[i],
      cash,
      open_ar: openAr,
      debt: d.closing_balance,
      open_ap: openAp,
      equity,
    });
  }
  return { balances, openingEquity };
}

function buildServiceLines(
  months: readonly MonthKey[],
  financials: readonly MonthlyFinancials[],
  operations: readonly MonthlyOperations[],
  config: StoryConfig,
): ServiceLineRow[] {
  const rows: ServiceLineRow[] = [];
  const shares = config.serviceLines.map((line) => line.revenueShare);

  for (let i = 0; i < months.length; i += 1) {
    const fin = financials[i];
    const ops = operations[i];
    const revenues = allocateByShares(fin.revenue_billed, shares);
    const hours = allocateByShares(ops.service_hours, shares);
    const sessions = allocateByShares(ops.sessions, shares);
    const directCosts = allocateByShares(fin.direct_labor_cost, config.serviceLines.map((line) => line.revenueShare * line.costRatio));

    for (let s = 0; s < config.serviceLines.length; s += 1) {
      rows.push({
        month: months[i],
        service_line: config.serviceLines[s].name,
        hours: hours[s],
        sessions: sessions[s],
        revenue: revenues[s],
        direct_cost: directCosts[s],
      });
    }
  }
  return rows;
}

function buildArLedger(
  endingOpenAr: number,
  months: readonly MonthKey[],
  config: StoryConfig,
  rng: () => number,
): ArLedgerRow[] {
  const rows: ArLedgerRow[] = [];
  const olderTarget = roundDollar(endingOpenAr * config.arLedger.olderThan60Share);
  let olderAssigned = 0;
  let assigned = 0;
  const payerCount = config.arLedger.payerCount;

  // Distribute open balance across synthetic payer claims with controlled aging.
  const claimCount = 72;
  const weights: number[] = [];
  for (let i = 0; i < claimCount; i += 1) {
    weights.push(randBetween(rng, 0.4, 1.6));
  }
  const amounts = allocateByShares(endingOpenAr, weights);

  for (let i = 0; i < claimCount; i += 1) {
    const amount = amounts[i];
    if (amount <= 0) continue;
    const preferOld = olderAssigned < olderTarget && (i % 3 === 0 || olderAssigned / Math.max(1, assigned) < 0.28);
    const days = preferOld ? randInt(rng, 61, 150) : randInt(rng, 5, 60);
    if (days > 60) olderAssigned += amount;
    assigned += amount;

    const ageMonths = Math.min(months.length - 1, Math.floor(days / 30));
    const serviceMonth = months[months.length - 1 - ageMonths];
    const billed = amount + (rng() < 0.15 ? randInt(rng, 0, Math.max(0, roundDollar(amount * 0.05))) : 0);
    const paid = billed - amount;
    rows.push({
      payer_id: `PAY-${String((i % payerCount) + 1).padStart(3, '0')}`,
      service_month: serviceMonth,
      amount_billed: billed,
      amount_paid: paid,
      status: paid > 0 ? 'partial' : 'open',
      days_outstanding: days,
    });
  }

  // Residual fix: ensure ledger open total equals ending open A/R exactly.
  const openTotal = rows.reduce((sum, row) => sum + (row.amount_billed - row.amount_paid), 0);
  const delta = endingOpenAr - openTotal;
  if (delta !== 0 && rows.length > 0) {
    const last = rows[rows.length - 1];
    last.amount_billed += delta;
  }
  return rows;
}

function buildApLedger(
  endingOpenAp: number,
  config: StoryConfig,
  rng: () => number,
): ApLedgerRow[] {
  const shares = [config.apLedger.payrollShare, config.apLedger.vendorShare, config.apLedger.otherShare];
  const amounts = allocateByShares(endingOpenAp, shares);
  const types: ApLedgerRow['payee_type'][] = ['payroll_obligation', 'vendor', 'other'];
  const rows: ApLedgerRow[] = [];

  for (let t = 0; t < types.length; t += 1) {
    const typeTotal = amounts[t];
    const pieces = Math.max(3, 4 + (t === 0 ? 2 : 0));
    const pieceWeights = Array.from({ length: pieces }, () => randBetween(rng, 0.5, 1.5));
    const pieceAmounts = allocateByShares(typeTotal, pieceWeights);
    for (let i = 0; i < pieces; i += 1) {
      const daysWaiting = randInt(rng, 0, 45);
      const due = new Date(Date.UTC(2026, 9, 31)); // as-of
      due.setUTCDate(due.getUTCDate() + (15 - daysWaiting));
      const dueDate = due.toISOString().slice(0, 10);
      rows.push({
        payee_type: types[t],
        amount: pieceAmounts[i],
        due_date: dueDate,
        days_waiting: daysWaiting,
      });
    }
  }

  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  const delta = endingOpenAp - total;
  if (delta !== 0 && rows.length > 0) {
    rows[0].amount += delta;
  }
  return rows;
}

export function generateSyntheticFinance(config: StoryConfig = storyConfig): SyntheticFinanceDataset {
  const rng = createRng(config.seed);
  const months = buildMonthKeys(config);
  const monthly_operations = buildOperations(months, config, rng);
  const { financials: monthly_financials, debt: debt_schedule } = buildFinancialsAndDebt(months, config, rng);
  const { balances: monthly_balances, openingEquity } = buildBalances(
    months,
    monthly_financials,
    debt_schedule,
    config,
  );
  const service_lines = buildServiceLines(months, monthly_financials, monthly_operations, config);
  const latest = monthly_balances[monthly_balances.length - 1];
  const ar_ledger = buildArLedger(latest.open_ar, months, config, rng);
  const ap_ledger = buildApLedger(latest.open_ap, config, rng);

  return {
    scope: 'A',
    asOfDate: config.asOfDate,
    months,
    monthly_operations,
    monthly_financials,
    debt_schedule,
    ar_ledger,
    ap_ledger,
    service_lines,
    monthly_balances,
    opening: {
      cash: config.opening.cash,
      open_ar: config.opening.open_ar,
      debt: config.opening.debt,
      open_ap: config.opening.open_ap,
      equity: openingEquity,
    },
  };
}

/** Derived helpers used by tests / later phases — aging never stored on tables. */
export function openArAmount(row: ArLedgerRow): number {
  return row.amount_billed - row.amount_paid;
}

export function arOlderThanDays(ledger: readonly ArLedgerRow[], days: number): number {
  return ledger.reduce((sum, row) => (row.days_outstanding > days ? sum + openArAmount(row) : sum), 0);
}

export function monthlyProfit(row: MonthlyFinancials): number {
  return (
    row.revenue_billed -
    row.direct_labor_cost -
    row.back_office_cost -
    row.other_opex_ex_labor -
    row.interest_expense
  );
}

export function netCashFlow(priorCash: number, cash: number): number {
  return cash - priorCash;
}

export function evaluateCashFlowProblem(
  dataset: SyntheticFinanceDataset,
  config: StoryConfig = storyConfig,
): { isGenuineCashFlowProblem: boolean; negativeNetCashMonths: number; arGrew: boolean } {
  const rule = config.cashFlowProblemRule;
  const balances = dataset.monthly_balances;
  const lookback = rule.lookbackMonths;
  const slice = balances.slice(-lookback);
  let negative = 0;
  for (let i = 0; i < slice.length; i += 1) {
    const idx = balances.length - lookback + i;
    const prior = idx === 0 ? dataset.opening.cash : balances[idx - 1].cash;
    if (netCashFlow(prior, slice[i].cash) < 0) negative += 1;
  }
  const arGrew = slice[slice.length - 1].open_ar > slice[0].open_ar;
  return {
    isGenuineCashFlowProblem: negative >= rule.negativeNetCashMonthsRequired && arGrew,
    negativeNetCashMonths: negative,
    arGrew,
  };
}
