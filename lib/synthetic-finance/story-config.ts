/**
 * Scope A finance-family story parameters.
 * All generated tables come from these flows + seed. Targets are soft; identities win.
 */

export const storyConfig = {
  seed: 20241104,
  scope: 'A' as const,
  asOfDate: '2026-10-31',
  months: {
    start: '2024-11',
    count: 24,
  },

  /** Soft demo anchors from finance templates (Oct 2026). Identities win over these. */
  targets: {
    latestBilled: 1_438_000,
    latestCollected: 1_254_000,
    endingOpenAr: 2_446_000,
    arOlderThan60: 684_000,
    billedTolerancePct: 0.03,
    collectedTolerancePct: 0.03,
    openArTolerancePct: 0.03,
    arOlderThan60TolerancePct: 0.05,
  },

  /**
   * Q4 verdict rule (approved Nov 4):
   * genuine cash-flow problem = net cash flow negative in 3 or more of the last 6 months
   * AND open A/R growing over the same window.
   */
  cashFlowProblemRule: {
    name: 'Q4_GENUINE_CASH_FLOW_PROBLEM' as const,
    lookbackMonths: 6,
    negativeNetCashMonthsRequired: 3,
  },

  opening: {
    cash: 3_250_000,
    open_ar: 2_100_000,
    debt: 2_400_000,
    open_ap: 410_000,
  },

  operations: {
    membersStart: 820,
    memberGrowthPerMonth: 9,
    memberChurnRate: 0.028,
    caregiversStart: 195,
    caregiverGrowthPerMonth: 1.4,
    caregiverChurnRate: 0.022,
    hoursPerMemberMonth: 28.5,
    availableHoursPerCaregiverMonth: 140,
    utilizationTarget: 0.84,
    sessionsPerHour: 0.95,
    waitlistStart: 18,
    waitlistDriftPerMonth: 0.6,
  },

  revenue: {
    /** Month-0 billed; grows toward latest soft target. */
    startBilled: 1_090_000,
    endBilled: 1_438_000,
    /**
     * Collected as a fraction of that month's billed.
     * Values > 1 mean collecting prior open A/R (allowed).
     * Linear lerp unless collectionCurvePower ≠ 1.
     */
    startCollectionRate: 1.12,
    endCollectionRate: 0.8715,
    collectionCurvePower: 1,
    /** Keep month noise tiny so soft targets stay reachable from flows. */
    billedNoise: 0.002,
    collectionNoise: 0.001,
  },

  costs: {
    /** Direct labor as share of billed — high early, eases later (narrowing losses). */
    directLaborStart: 0.86,
    directLaborEnd: 0.79,
    backOfficeStart: 0.18,
    backOfficeEnd: 0.145,
    otherOpexStart: 0.12,
    otherOpexEnd: 0.09,
    /** Share of accrued operating costs paid in cash this month (rest → A/P). */
    cashPayRate: 0.93,
  },

  debt: {
    annualRate: 0.072,
    /** Draws months 0..11; principal always on. */
    earlyDraw: 95_000,
    lateDraw: 0,
    earlyPrincipal: 35_000,
    /** Last 6 months: draws ≈ principal so closing is roughly flat. */
    latePrincipal: 42_000,
    lateDrawMatchPrincipal: true,
  },

  serviceLines: [
    { name: 'Skilled Nursing', revenueShare: 0.42, costRatio: 0.68 },
    { name: 'Personal Care', revenueShare: 0.33, costRatio: 0.72 },
    { name: 'Therapy', revenueShare: 0.17, costRatio: 0.64 },
    { name: 'Respite', revenueShare: 0.08, costRatio: 1.06 },
  ] as const,

  arLedger: {
    payerCount: 28,
    /** Target share of open A/R with days_outstanding > 60 (soft). */
    olderThan60Share: 0.28,
  },

  apLedger: {
    payrollShare: 0.55,
    vendorShare: 0.35,
    otherShare: 0.1,
  },
} as const;

export type StoryConfig = typeof storyConfig;
