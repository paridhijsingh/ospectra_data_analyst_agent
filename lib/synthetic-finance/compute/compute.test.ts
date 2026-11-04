import { describe, expect, it } from 'vitest';
import { syntheticFinanceDataset } from '../data';
import { storyConfig } from '../story-config';
import type { SyntheticFinanceDataset } from '../types';
import {
  buildBalanceSheet,
  buildForecast12,
  getBreakEvenStatus,
  getCashFlowAssessment,
  getCostPerMemberMonth,
  getDebtService,
  getRatiosAndChurn,
  getRevenuePerMemberAndCaregiver,
  getServiceLineProfitability,
} from './index';

/**
 * Tiny 3-month fixture — round dollars chosen so expected values are hand-arithmetic.
 * Identities are not fully closed here; only shapes required by the compute functions under test.
 */
function fixtureDataset(): SyntheticFinanceDataset {
  return {
    scope: 'A',
    asOfDate: '2026-03-31',
    months: ['2026-01', '2026-02', '2026-03'],
    opening: { cash: 500_000, open_ar: 80_000, debt: 200_000, open_ap: 20_000, equity: 360_000 },
    monthly_operations: [
      {
        month: '2026-01',
        members_avg: 100,
        members_end: 102,
        new_members: 5,
        lost_members: 3,
        caregivers_avg: 40,
        caregivers_end: 41,
        caregivers_hired: 2,
        caregivers_left: 1,
        caregiver_available_hours: 2_000,
        caregiver_delivered_hours: 1_600,
        service_hours: 1_000,
        sessions: 950,
        waitlist_end: 10,
        admissions: 5,
      },
      {
        month: '2026-02',
        members_avg: 105,
        members_end: 108,
        new_members: 8,
        lost_members: 2,
        caregivers_avg: 41,
        caregivers_end: 42,
        caregivers_hired: 2,
        caregivers_left: 1,
        caregiver_available_hours: 2_050,
        caregiver_delivered_hours: 1_680,
        service_hours: 1_050,
        sessions: 1_000,
        waitlist_end: 12,
        admissions: 8,
      },
      {
        month: '2026-03',
        members_avg: 100,
        members_end: 104,
        new_members: 6,
        lost_members: 4,
        caregivers_avg: 40,
        caregivers_end: 40,
        caregivers_hired: 1,
        caregivers_left: 2,
        caregiver_available_hours: 2_000,
        caregiver_delivered_hours: 1_700,
        service_hours: 1_100,
        sessions: 1_040,
        waitlist_end: 15,
        admissions: 6,
      },
    ],
    monthly_financials: [
      {
        month: '2026-01',
        revenue_billed: 100_000,
        cash_collected: 90_000,
        direct_labor_cost: 80_000,
        back_office_cost: 15_000,
        other_opex_ex_labor: 10_000,
        interest_expense: 3_000,
        expenses_paid_cash: 100_000,
      },
      {
        month: '2026-02',
        revenue_billed: 110_000,
        cash_collected: 95_000,
        direct_labor_cost: 85_000,
        back_office_cost: 16_000,
        other_opex_ex_labor: 11_000,
        interest_expense: 3_000,
        expenses_paid_cash: 108_000,
      },
      {
        month: '2026-03',
        revenue_billed: 120_000,
        cash_collected: 100_000,
        direct_labor_cost: 90_000,
        back_office_cost: 18_000,
        other_opex_ex_labor: 12_000,
        interest_expense: 2_400,
        expenses_paid_cash: 115_000,
      },
    ],
    debt_schedule: [
      {
        month: '2026-01',
        opening_balance: 200_000,
        draws: 10_000,
        principal_paid: 5_000,
        interest_paid: 3_000,
        closing_balance: 205_000,
        debt_service: 8_000,
      },
      {
        month: '2026-02',
        opening_balance: 205_000,
        draws: 10_000,
        principal_paid: 5_000,
        interest_paid: 3_000,
        closing_balance: 210_000,
        debt_service: 8_000,
      },
      {
        month: '2026-03',
        opening_balance: 210_000,
        draws: 0,
        principal_paid: 5_000,
        interest_paid: 2_400,
        closing_balance: 205_000,
        debt_service: 7_400,
      },
    ],
    ar_ledger: [],
    ap_ledger: [],
    service_lines: [
      { month: '2026-03', service_line: 'Alpha', hours: 600, sessions: 500, revenue: 80_000, direct_cost: 50_000 },
      { month: '2026-03', service_line: 'Beta', hours: 400, sessions: 400, revenue: 30_000, direct_cost: 30_000 },
      { month: '2026-03', service_line: 'Gamma', hours: 100, sessions: 140, revenue: 10_000, direct_cost: 12_000 },
    ],
    monthly_balances: [
      { month: '2026-01', cash: 495_000, open_ar: 90_000, debt: 205_000, open_ap: 28_000, equity: 352_000 },
      { month: '2026-02', cash: 487_000, open_ar: 105_000, debt: 210_000, open_ap: 35_000, equity: 347_000 },
      { month: '2026-03', cash: 467_000, open_ar: 125_000, debt: 205_000, open_ap: 42_400, equity: 344_600 },
    ],
  };
}

describe('compute library — hand-checkable 3-month fixture', () => {
  const fx = fixtureDataset();

  it('1 getBreakEvenStatus: latest month not profitable; profit and margin match hand math', () => {
    // Mar profit = 120000 - 90000 - 18000 - 12000 - 2400 = -2400
    // margin % = -2400 / 120000 * 100 = -2
    const result = getBreakEvenStatus(fx);
    expect(result.current.latestMonth).toBe('2026-03');
    expect(result.current.profitable).toBe(false);
    expect(result.current.profit).toBe(-2400);
    expect(result.current.marginPct).toBe(-2);
    expect(result.historyProfitSeries).toEqual([
      { month: '2026-01', value: -8000 }, // 100000-80000-15000-10000-3000
      { month: '2026-02', value: -5000 }, // 110000-85000-16000-11000-3000
      { month: '2026-03', value: -2400 },
    ]);
    expect(result.definition.length).toBeGreaterThan(0);
    expect(result.scope).toContain('Scope A');
  });

  it('2 getDebtService: trailing and latest cash vs P&L impacts', () => {
    // Latest debt_service = 7400; revenue = 120000
    // cash impact latest = 7400 / 120000 = 0.061666...
    // interest latest = 2400; interest/rev = 2400/120000 = 0.02
    // T12 (all 3): debt_service 8000+8000+7400 = 23400
    // T12 revenue 100000+110000+120000 = 330000
    // T12 cash impact = 23400/330000 = 0.070909...
    // T12 interest 3000+3000+2400 = 8400; 8400/330000 = 0.025454...
    const result = getDebtService(fx);
    expect(result.latestMonthDebtService).toBe(7400);
    expect(result.trailing12DebtService).toBe(23400);
    expect(result.cashImpact.latestMonth).toBe(7400 / 120000);
    expect(result.pnlImpact.interestDollarsLatestMonth).toBe(2400);
    expect(result.pnlImpact.interestToRevenueLatestMonth).toBe(2400 / 120000);
    expect(result.trailing12DebtService / 330000).toBe(result.cashImpact.trailing12);
    expect(result.pnlImpact.interestDollarsTrailing12).toBe(8400);
    expect(result.cashImpact.label).toContain('cash impact');
    expect(result.pnlImpact.label).toContain('P&L impact');
  });

  it('4 getCashFlowAssessment: I3 net cash and AR growth over lookback', () => {
    // Net CF = collected + draws - expenses_paid_cash - principal
    // Jan: 90000 + 10000 - 100000 - 5000 = -5000
    // Feb: 95000 + 10000 - 108000 - 5000 = -8000
    // Mar: 100000 + 0 - 115000 - 5000 = -20000
    // All 3 months negative; AR 90k → 125k growing; verdict true under rule (≥3 negatives).
    const result = getCashFlowAssessment(fx);
    expect(result.netCashFlowSeries.map((p) => p.value)).toEqual([-5000, -8000, -20000]);
    expect(result.negativeNetCashMonthsInLookback).toBe(3);
    expect(result.gapEndingOpenAr).toBe(125000);
    expect(result.arTrend.growing).toBe(true);
    expect(result.verdict).toBe(true);
    expect(result.ruleName).toBe('Q4_GENUINE_CASH_FLOW_PROBLEM');
  });

  it('5 getCostPerMemberMonth: direct labor only', () => {
    // Mar: 90000 / 100 = 900
    // Trailing avg of 80000/100, 85000/105, 90000/100 = 800 + 809.5238... + 900
    // = (800 + 85000/105 + 900) / 3
    const result = getCostPerMemberMonth(fx);
    expect(result.latest).toBe(900);
    expect(result.trailingAverage).toBe((800 + 85000 / 105 + 900) / 3);
    expect(result.definition).toMatch(/direct labor/i);
    expect(result.definition).toMatch(/excluded/i);
  });

  it('8 getRevenuePerMemberAndCaregiver', () => {
    // Mar: 120000/100 = 1200 per member; 120000/40 = 3000 per caregiver
    const result = getRevenuePerMemberAndCaregiver(fx);
    expect(result.latest.perMember).toBe(1200);
    expect(result.latest.perCaregiver).toBe(3000);
    // Trailing: members (1000 + 110000/105 + 1200)/3 ; caregivers (100000/40 + 110000/41 + 3000)/3
    expect(result.trailingAverage.perMember).toBe((1000 + 110000 / 105 + 1200) / 3);
    expect(result.trailingAverage.perCaregiver).toBe((100000 / 40 + 110000 / 41 + 3000) / 3);
  });

  it('9 getServiceLineProfitability: sorted margins with non-positive flags', () => {
    // Alpha: (80000-50000)/600 = 50
    // Beta: (30000-30000)/400 = 0  → nonPositive
    // Gamma: (10000-12000)/100 = -20 → nonPositive
    // Sorted desc: Alpha 50, Beta 0, Gamma -20
    const result = getServiceLineProfitability(fx);
    expect(result.lines.map((l) => l.service_line)).toEqual(['Alpha', 'Beta', 'Gamma']);
    expect(result.lines.map((l) => l.marginPerHour)).toEqual([50, 0, -20]);
    expect(result.lines.map((l) => l.nonPositive)).toEqual([false, true, true]);
  });

  it('10 getRatiosAndChurn: ex-labor expenses and start-of-month churn', () => {
    // Mar expenses ex-labor = 18000 + 12000 + 2400 = 32400
    // rev / ex-labor = 120000 / 32400 = 3.703703...
    // rev / back = 120000 / 18000 = 6.666...
    // debt / annualised rev = 205000 / (120000*12) = 205000/1440000
    // debt_service / rev = 7400 / 120000
    // member start = 104 - 6 + 4 = 102; churn = 4/102
    // caregiver start = 40 - 1 + 2 = 41; churn = 2/41
    const result = getRatiosAndChurn(fx);
    expect(result.latest.revenueToExpensesExLabor).toBe(120000 / 32400);
    expect(result.latest.revenueToBackOffice).toBe(120000 / 18000);
    expect(result.latest.debtToAnnualisedRevenue).toBe(205000 / (120000 * 12));
    expect(result.latest.debtServiceToRevenue).toBe(7400 / 120000);
    expect(result.latest.memberChurn).toBe(4 / 102);
    expect(result.latest.caregiverChurn).toBe(2 / 41);
  });
});

describe('compute library — real Scope A dataset integration', () => {
  const dataset = syntheticFinanceDataset;

  it('Oct 2026 is not profitable; forecast finds a break-even month; Q4 true; BS balances', () => {
    const breakEven = getBreakEvenStatus(dataset);
    expect(breakEven.current.latestMonth).toBe('2026-10');
    expect(breakEven.current.profitable).toBe(false);
    expect(breakEven.firstForecastBreakEven).not.toBeNull();
    // Report which month the test finds (assertion binds the value).
    expect(breakEven.firstForecastBreakEven?.month).toMatch(/^\d{4}-\d{2}$/);

    const cash = getCashFlowAssessment(dataset);
    expect(cash.verdict).toBe(true);
    expect(storyConfig.cashFlowProblemRule.name).toBe('Q4_GENUINE_CASH_FLOW_PROBLEM');

    const bs = buildBalanceSheet(dataset);
    expect(bs.balances).toBe(true);
    expect(bs.assets.total).toBe(bs.liabilitiesAndEquity.total);
    expect(bs.disclosure).toBe('no fixed assets / depreciation in this dataset');

    const forecast = buildForecast12(dataset);
    expect(forecast.months).toHaveLength(12);
    expect(forecast.assumptions.drawsPerMonth).toBe(0);
  });
});
