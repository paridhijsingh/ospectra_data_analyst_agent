/**
 * Isolated scenario prototype. Not a forecast and not used by Financial routing.
 * Dates are calendar dates in YYYY-MM-DD, interpreted as UTC dates so the
 * local timezone cannot move a date across a day boundary.
 */

export type Reimbursement = {
  id: string;
  amount: number;
  expectedDate: string;
  delayedByDays: number;
};

export type CashTimingScenarioInput = {
  openingCash: number;
  reimbursements: Reimbursement[];
  obligationAmount: number;
  obligationDate: string;
};

export type CashTimingScenarioResult = {
  baselineCashBeforeObligation: number;
  scenarioCashBeforeObligation: number;
  baselineShortfall: number;
  scenarioShortfall: number;
  timingDifference: number;
};

const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

function assertNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative finite number.`);
  }
}

function parseCalendarDate(value: string, label: string): number {
  const match = datePattern.exec(value);
  if (!match) throw new Error(`${label} must be a YYYY-MM-DD calendar date.`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = Date.UTC(year, month - 1, day);
  const check = new Date(utc);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    throw new Error(`${label} must be a real calendar date.`);
  }
  return utc;
}

function addCalendarDays(utcDate: number, days: number): number {
  const date = new Date(utcDate);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days);
}

function cashBeforeObligation(openingCash: number, includedAmounts: number[]): number {
  return openingCash + includedAmounts.reduce((sum, amount) => sum + amount, 0);
}

function shortfall(obligationAmount: number, cashBeforeObligation: number): number {
  return Math.max(0, obligationAmount - cashBeforeObligation);
}

export function compareCashTimingScenario(input: CashTimingScenarioInput): CashTimingScenarioResult {
  assertNonNegative(input.openingCash, 'openingCash');
  assertNonNegative(input.obligationAmount, 'obligationAmount');
  const obligationDate = parseCalendarDate(input.obligationDate, 'obligationDate');

  const receipts = input.reimbursements.map((receipt) => {
    assertNonNegative(receipt.amount, `reimbursement ${receipt.id} amount`);
    if (!Number.isInteger(receipt.delayedByDays)) {
      throw new Error(`reimbursement ${receipt.id} delayedByDays must be a whole number of calendar days.`);
    }
    assertNonNegative(receipt.delayedByDays, `reimbursement ${receipt.id} delayedByDays`);
    const expectedDate = parseCalendarDate(receipt.expectedDate, `reimbursement ${receipt.id} expectedDate`);
    return { amount: receipt.amount, expectedDate, scenarioDate: addCalendarDays(expectedDate, receipt.delayedByDays) };
  });

  const baselineCashBeforeObligation = cashBeforeObligation(
    input.openingCash,
    receipts.filter((receipt) => receipt.expectedDate <= obligationDate).map((receipt) => receipt.amount),
  );
  const scenarioCashBeforeObligation = cashBeforeObligation(
    input.openingCash,
    receipts.filter((receipt) => receipt.scenarioDate <= obligationDate).map((receipt) => receipt.amount),
  );

  return {
    baselineCashBeforeObligation,
    scenarioCashBeforeObligation,
    baselineShortfall: shortfall(input.obligationAmount, baselineCashBeforeObligation),
    scenarioShortfall: shortfall(input.obligationAmount, scenarioCashBeforeObligation),
    timingDifference: scenarioCashBeforeObligation - baselineCashBeforeObligation,
  };
}
