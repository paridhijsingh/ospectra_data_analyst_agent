import { describe, expect, it } from 'vitest';
import { compareCashTimingScenario, type CashTimingScenarioInput, type Reimbursement } from './cash-timing-scenario';

const receipt = (id: string, amount: number, expectedDate: string, delayedByDays = 0): Reimbursement => ({
  id,
  amount,
  expectedDate,
  delayedByDays,
});

const input = (overrides: Partial<CashTimingScenarioInput> = {}): CashTimingScenarioInput => ({
  openingCash: 50_000,
  reimbursements: [receipt('A', 15_000, '2026-10-02'), receipt('B', 40_000, '2026-10-05', 14)],
  obligationAmount: 70_000,
  obligationDate: '2026-10-06',
  ...overrides,
});

describe('compareCashTimingScenario', () => {
  it('keeps baseline and scenario cash identical when every delay is zero', () => {
    const result = compareCashTimingScenario(input({
      reimbursements: [receipt('A', 15_000, '2026-10-02'), receipt('B', 40_000, '2026-10-05')],
    }));

    expect(result.baselineCashBeforeObligation).toBe(105_000);
    expect(result.scenarioCashBeforeObligation).toBe(105_000);
    expect(result.timingDifference).toBe(0);
  });

  it('does not change cash when a delayed receipt is still on or before the obligation', () => {
    const result = compareCashTimingScenario(input({
      reimbursements: [receipt('A', 15_000, '2026-10-02', 3)],
      obligationDate: '2026-10-06',
    }));

    expect(result.baselineCashBeforeObligation).toBe(65_000);
    expect(result.scenarioCashBeforeObligation).toBe(65_000);
    expect(result.timingDifference).toBe(0);
  });

  it('reduces scenario cash by a receipt pushed past the obligation', () => {
    const result = compareCashTimingScenario(input());

    expect(result.baselineCashBeforeObligation).toBe(105_000);
    expect(result.scenarioCashBeforeObligation).toBe(65_000);
    expect(result.timingDifference).toBe(-40_000);
  });

  it('ignores a receipt that is already after the obligation', () => {
    const result = compareCashTimingScenario(input({
      reimbursements: [receipt('late', 40_000, '2026-10-07', 10)],
      obligationDate: '2026-10-06',
    }));

    expect(result.baselineCashBeforeObligation).toBe(50_000);
    expect(result.scenarioCashBeforeObligation).toBe(50_000);
    expect(result.timingDifference).toBe(0);
  });

  it('changes cash only for the receipt that crosses the obligation', () => {
    const result = compareCashTimingScenario(input({
      reimbursements: [
        receipt('stays', 15_000, '2026-10-02', 1),
        receipt('crosses', 40_000, '2026-10-05', 14),
        receipt('already-late', 9_000, '2026-10-20', 3),
      ],
    }));

    expect(result.baselineCashBeforeObligation).toBe(105_000);
    expect(result.scenarioCashBeforeObligation).toBe(65_000);
    expect(result.timingDifference).toBe(-40_000);
  });

  it('includes a receipt that arrives on the obligation date', () => {
    const result = compareCashTimingScenario(input({
      reimbursements: [receipt('same-day', 15_000, '2026-10-06')],
      obligationDate: '2026-10-06',
    }));

    expect(result.baselineCashBeforeObligation).toBe(65_000);
    expect(result.scenarioCashBeforeObligation).toBe(65_000);
  });

  it('includes a receipt shifted exactly onto the obligation date', () => {
    const result = compareCashTimingScenario(input({
      reimbursements: [receipt('shifted', 15_000, '2026-10-04', 2)],
      obligationDate: '2026-10-06',
    }));

    expect(result.baselineCashBeforeObligation).toBe(65_000);
    expect(result.scenarioCashBeforeObligation).toBe(65_000);
    expect(result.timingDifference).toBe(0);
  });

  it('creates a scenario shortfall when the baseline covered the obligation', () => {
    const result = compareCashTimingScenario(input());

    expect(result.baselineShortfall).toBe(0);
    expect(result.scenarioShortfall).toBe(5_000);
  });

  it('reports zero shortfall on both sides when cash still covers the obligation', () => {
    const result = compareCashTimingScenario(input({ obligationAmount: 60_000 }));

    expect(result.baselineCashBeforeObligation).toBe(105_000);
    expect(result.scenarioCashBeforeObligation).toBe(65_000);
    expect(result.baselineShortfall).toBe(0);
    expect(result.scenarioShortfall).toBe(0);
  });

  it('does not change opening cash, the obligation, or subtract the obligation from cash', () => {
    const scenario = input();
    const result = compareCashTimingScenario(scenario);

    expect(scenario.openingCash).toBe(50_000);
    expect(scenario.obligationAmount).toBe(70_000);
    expect(scenario.obligationDate).toBe('2026-10-06');
    expect(result.baselineCashBeforeObligation).toBe(105_000);
    expect(result.scenarioCashBeforeObligation).toBe(65_000);
  });

  it('includes a receipt shifted across a month boundary onto the obligation date', () => {
    const result = compareCashTimingScenario(input({
      reimbursements: [receipt('month-end', 15_000, '2026-01-31', 1)],
      obligationDate: '2026-02-01',
      obligationAmount: 10_000,
    }));

    expect(result.scenarioCashBeforeObligation).toBe(65_000);
    expect(result.timingDifference).toBe(0);
  });

  it('rejects an impossible calendar date', () => {
    expect(() => compareCashTimingScenario(input({ obligationDate: '2026-02-31' }))).toThrow(/obligationDate/);
    expect(() => compareCashTimingScenario(input({
      reimbursements: [receipt('bad', 15_000, '10/02/2026')],
    }))).toThrow(/expectedDate/);
  });

  it('rejects negative amounts and delays', () => {
    expect(() => compareCashTimingScenario(input({ openingCash: -1 }))).toThrow(/openingCash/);
    expect(() => compareCashTimingScenario(input({ obligationAmount: -1 }))).toThrow(/obligationAmount/);
    expect(() => compareCashTimingScenario(input({
      reimbursements: [receipt('neg', -15_000, '2026-10-02')],
    }))).toThrow(/amount/);
    expect(() => compareCashTimingScenario(input({
      reimbursements: [receipt('early', 15_000, '2026-10-02', -1)],
    }))).toThrow(/delayedByDays/);
  });
});
