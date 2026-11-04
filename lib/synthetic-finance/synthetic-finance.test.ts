import { describe, expect, it } from 'vitest';
import { syntheticFinanceDataset } from './data';
import {
  arOlderThanDays,
  evaluateCashFlowProblem,
  generateSyntheticFinance,
  monthlyProfit,
  openArAmount,
} from './generate';
import { storyConfig } from './story-config';

const dataset = syntheticFinanceDataset;
const months = dataset.months;
const latestIdx = months.length - 1;

function withinPct(actual: number, target: number, pct: number): boolean {
  return Math.abs(actual - target) <= target * pct;
}

describe('synthetic finance Scope A — shape', () => {
  it('covers 24 months from 2024-11 through 2026-10', () => {
    expect(months).toHaveLength(24);
    expect(months[0]).toBe('2024-11');
    expect(months[latestIdx]).toBe('2026-10');
    expect(dataset.scope).toBe('A');
  });

  it('regenerates byte-identical tables for the fixed seed', () => {
    const again = generateSyntheticFinance(storyConfig);
    expect(again).toEqual(dataset);
  });
});

describe('synthetic finance Scope A — story properties', () => {
  it('grows revenue billed over the 24 months', () => {
    const first = dataset.monthly_financials[0].revenue_billed;
    const last = dataset.monthly_financials[latestIdx].revenue_billed;
    expect(last).toBeGreaterThan(first);
  });

  it('lands near latest-month billed / collected / open A/R / A/R>60 targets (report if missed)', () => {
    const fin = dataset.monthly_financials[latestIdx];
    const bal = dataset.monthly_balances[latestIdx];
    const older = arOlderThanDays(dataset.ar_ledger, 60);
    const t = storyConfig.targets;

    const checks = [
      { name: 'billed', actual: fin.revenue_billed, target: t.latestBilled, pct: t.billedTolerancePct },
      { name: 'collected', actual: fin.cash_collected, target: t.latestCollected, pct: t.collectedTolerancePct },
      { name: 'open_ar', actual: bal.open_ar, target: t.endingOpenAr, pct: t.openArTolerancePct },
      { name: 'ar_gt_60', actual: older, target: t.arOlderThan60, pct: t.arOlderThan60TolerancePct },
    ];

    const missed = checks.filter((c) => !withinPct(c.actual, c.target, c.pct));
    if (missed.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        'Soft targets missed:',
        missed.map((c) => `${c.name} actual=${c.actual} target=${c.target} (±${c.pct * 100}%)`),
      );
    }
    for (const c of checks) {
      expect(withinPct(c.actual, c.target, c.pct), `${c.name}: actual ${c.actual} vs target ${c.target}`).toBe(true);
    }
  });

  it('keeps monthly profit negative through history but narrowing (last-6 loss < first-6 loss)', () => {
    const profits = dataset.monthly_financials.map(monthlyProfit);
    for (const profit of profits) {
      expect(profit).toBeLessThan(0);
    }
    const first6 = profits.slice(0, 6).reduce((a, b) => a + b, 0);
    const last6 = profits.slice(-6).reduce((a, b) => a + b, 0);
    // Both negative; last-6 total closer to zero ⇒ larger algebraically.
    expect(last6).toBeGreaterThan(first6);
  });

  it('grows debt over the first 12 months and stays roughly flat over the last 6 (±3%)', () => {
    const debt = dataset.debt_schedule;
    expect(debt[11].closing_balance).toBeGreaterThan(debt[0].opening_balance);
    const startLast6 = debt[debt.length - 6].opening_balance;
    const endLast6 = debt[debt.length - 1].closing_balance;
    const change = Math.abs(endLast6 - startLast6);
    expect(change).toBeLessThanOrEqual(startLast6 * 0.03);
  });

  it('keeps caregiver utilization in 70–95%, churn in 1–5%, and recent waitlist > 0', () => {
    for (const row of dataset.monthly_operations) {
      const util = row.caregiver_delivered_hours / row.caregiver_available_hours;
      expect(util).toBeGreaterThanOrEqual(0.7);
      expect(util).toBeLessThanOrEqual(0.95);

      const memberChurn = row.lost_members / Math.max(1, row.members_avg);
      const caregiverChurn = row.caregivers_left / Math.max(1, row.caregivers_avg);
      expect(memberChurn).toBeGreaterThanOrEqual(0.01);
      expect(memberChurn).toBeLessThanOrEqual(0.05);
      expect(caregiverChurn).toBeGreaterThanOrEqual(0.01);
      expect(caregiverChurn).toBeLessThanOrEqual(0.05);
    }
    const recent = dataset.monthly_operations.slice(-6);
    for (const row of recent) {
      expect(row.waitlist_end).toBeGreaterThan(0);
    }
  });

  it('has at most one service line with negative direct margin in the most recent month', () => {
    const latest = dataset.service_lines.filter((row) => row.month === months[latestIdx]);
    const negative = latest.filter((row) => row.revenue - row.direct_cost < 0);
    expect(negative.length).toBeLessThanOrEqual(1);
  });

  it('never lets cash go negative', () => {
    for (const row of dataset.monthly_balances) {
      expect(row.cash).toBeGreaterThanOrEqual(0);
    }
  });

  it('exposes the Q4 cash-flow problem rule as named config', () => {
    expect(storyConfig.cashFlowProblemRule.name).toBe('Q4_GENUINE_CASH_FLOW_PROBLEM');
    expect(storyConfig.cashFlowProblemRule.lookbackMonths).toBe(6);
    expect(storyConfig.cashFlowProblemRule.negativeNetCashMonthsRequired).toBe(3);
    const verdict = evaluateCashFlowProblem(dataset);
    expect(typeof verdict.isGenuineCashFlowProblem).toBe('boolean');
  });
});

describe('synthetic finance Scope A — identities (to the dollar)', () => {
  it('I1 A/R roll: prior A/R + billed − collected = A/R every month', () => {
    let prior = dataset.opening.open_ar;
    for (let i = 0; i < months.length; i += 1) {
      const fin = dataset.monthly_financials[i];
      const expected = prior + fin.revenue_billed - fin.cash_collected;
      expect(dataset.monthly_balances[i].open_ar).toBe(expected);
      prior = expected;
    }
  });

  it('I2 Debt roll + interest match', () => {
    for (let i = 0; i < months.length; i += 1) {
      const d = dataset.debt_schedule[i];
      expect(d.opening_balance + d.draws - d.principal_paid).toBe(d.closing_balance);
      expect(d.debt_service).toBe(d.principal_paid + d.interest_paid);
      expect(d.interest_paid).toBe(dataset.monthly_financials[i].interest_expense);
      if (i > 0) {
        expect(d.opening_balance).toBe(dataset.debt_schedule[i - 1].closing_balance);
      } else {
        expect(d.opening_balance).toBe(dataset.opening.debt);
      }
    }
  });

  it('I3 Cash roll with draws + A/P accrued-vs-paid bridge', () => {
    let priorCash = dataset.opening.cash;
    let priorAp = dataset.opening.open_ap;
    for (let i = 0; i < months.length; i += 1) {
      const fin = dataset.monthly_financials[i];
      const d = dataset.debt_schedule[i];
      const bal = dataset.monthly_balances[i];
      const expectedCash =
        priorCash + fin.cash_collected + d.draws - fin.expenses_paid_cash - d.principal_paid;
      expect(bal.cash).toBe(expectedCash);

      const accrued =
        fin.direct_labor_cost + fin.back_office_cost + fin.other_opex_ex_labor + fin.interest_expense;
      const expectedAp = priorAp + accrued - fin.expenses_paid_cash;
      expect(bal.open_ap).toBe(expectedAp);

      priorCash = bal.cash;
      priorAp = bal.open_ap;
    }
  });

  it('I4 Balance sheet balances every month', () => {
    for (const bal of dataset.monthly_balances) {
      expect(bal.cash + bal.open_ar).toBe(bal.debt + bal.open_ap + bal.equity);
    }
    const o = dataset.opening;
    expect(o.cash + o.open_ar).toBe(o.debt + o.open_ap + o.equity);
  });

  it('I5 A/R ledger total = ending open A/R; P&L series = monthly_financials', () => {
    const ledgerOpen = dataset.ar_ledger.reduce((sum, row) => sum + openArAmount(row), 0);
    expect(ledgerOpen).toBe(dataset.monthly_balances[latestIdx].open_ar);
    expect(dataset.monthly_financials).toHaveLength(24);
    for (let i = 0; i < 24; i += 1) {
      expect(dataset.monthly_financials[i].month).toBe(months[i]);
    }
  });

  it('I6 service_lines revenue and hours roll up to monthly totals', () => {
    for (let i = 0; i < months.length; i += 1) {
      const month = months[i];
      const lines = dataset.service_lines.filter((row) => row.month === month);
      const rev = lines.reduce((sum, row) => sum + row.revenue, 0);
      const hours = lines.reduce((sum, row) => sum + row.hours, 0);
      expect(rev).toBe(dataset.monthly_financials[i].revenue_billed);
      expect(hours).toBe(dataset.monthly_operations[i].service_hours);
    }
  });
});
