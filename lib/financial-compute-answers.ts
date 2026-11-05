/**
 * Scope A compute → Financial Agent answer builders.
 * Every figure is taken from lib/synthetic-finance compute results at call time.
 */
import {
  getBreakEvenStatus,
  getCashFlowAssessment,
  getCaregiverUtilization,
  getCostPerMemberMonth,
  getDebtService,
  getDebtTrend,
  getRatiosAndChurn,
  getRevenuePerMemberAndCaregiver,
  getServiceLineProfitability,
  getUnrealizedWaitlistRevenue,
  syntheticFinanceDataset,
} from './synthetic-finance';
import type { RecruitmentAnswer } from './metric-engine';

const dataset = syntheticFinanceDataset;

const SOURCES = ['synthetic_finance_dataset'] as const;

function usd(n: number): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
}

function usdPrecise(n: number): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
}

function pct(n: number, digits = 1): string {
  return `${(n * 100).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`;
}

function pctPoints(n: number): string {
  return `${n.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}%`;
}

function shortMonth(month: string): string {
  const [y, m] = month.split('-');
  return `${m}/${y.slice(2)}`;
}

function base(
  partial: Omit<RecruitmentAnswer, 'supported' | 'answerSource' | 'sources'> & {
    sources?: readonly string[];
  },
): RecruitmentAnswer {
  return {
    supported: true,
    answerSource: 'synthetic_computed',
    sources: [...(partial.sources ?? SOURCES)],
    ...partial,
  };
}

export function answerBreakEven(): RecruitmentAnswer {
  const r = getBreakEvenStatus(dataset);
  const be = r.firstForecastBreakEven;
  const title = r.current.profitable
    ? `Operating profit is positive in ${r.current.latestMonth} (${usd(r.current.profit)})`
    : `Not at break-even in ${r.current.latestMonth} (${usd(r.current.profit)}, margin ${pctPoints(r.current.marginPct)})`;
  const summary = be
    ? `Latest month is not profitable. Under the library forecast method, projected operating profit first turns non-negative in ${be.month} (${usd(be.profit)}).`
    : `Latest month is not profitable. ${r.noBreakEvenReason ?? 'No break-even month in the 12-month forecast.'}`;
  const prior = r.historyProfitSeries.at(-2);
  const comparativeInsight = prior
    ? `Latest profit ${usd(r.current.profit)} vs prior month ${usd(prior.value)} (${prior.month}).`
    : `Latest profit ${usd(r.current.profit)}.`;
  return base({
    questionId: 'break-even',
    title,
    summary,
    insight: comparativeInsight,
    data: r.historyProfitSeries.slice(-12).map((p) => ({
      label: p.month,
      shortLabel: shortMonth(p.month),
      value: Math.round(p.value / 1000),
      displayValue: usd(p.value),
    })),
    chart: 'line',
    chartDescription: 'Monthly operating profit (last 12 months).',
    unit: 'count',
    metricLabel: 'Operating profit',
    metricIds: ['operating_profit', 'forecast_break_even'],
    definition:
      'Break-even = first month operating profit ≥ 0; forecast per the library’s stated method (buildForecast12).',
    intent: 'forecast',
    queryPlan: 'getBreakEvenStatus + firstForecastBreakEvenMonth · synthetic dataset',
    comparativeInsight,
    nextAction: be
      ? `Track the path to ${be.month} and pressure-test expense-ratio improvement assumptions before that month.`
      : 'Revisit cost ratios and billed growth — the 12-month forecast does not yet clear break-even.',
    followUps: {
      drillDown: 'Which expense ratio improves the forecast break-even month the most?',
      drillUp: 'What annualized run-rate would make the latest month profitable?',
      drillAcross: 'How does debt service interest affect months to break-even?',
    },
    limitations: [
      'Synthetic dataset — computed, not governed',
      'Forecast is scenario math, not a prediction',
      'Operating profit ≠ cash',
    ],
  });
}

export function answerDebtService(): RecruitmentAnswer {
  const r = getDebtService(dataset);
  const title = `Trailing-12 debt service is ${usd(r.trailing12DebtService)}; latest month ${usd(r.latestMonthDebtService)}`;
  const summary = `Cash impact (principal + interest) is ${pct(r.cashImpact.latestMonth)} of latest billed revenue (${pct(r.cashImpact.trailing12)} trailing-12). Profit impact is interest only: ${usd(r.pnlImpact.interestDollarsLatestMonth)} in ${r.latestMonth} (${pct(r.pnlImpact.interestToRevenueLatestMonth)} of revenue).`;
  return base({
    questionId: 'debt-service',
    title,
    summary,
    insight: `Interest alone accounts for ${usd(r.pnlImpact.interestDollarsTrailing12)} over trailing-12 months (${pct(r.pnlImpact.interestToRevenueTrailing12)} of revenue).`,
    data: [
      { label: 'T12 debt service', shortLabel: 'T12 DS', value: Math.round(r.trailing12DebtService / 1000), displayValue: usd(r.trailing12DebtService) },
      { label: 'Latest debt service', shortLabel: 'Latest DS', value: Math.round(r.latestMonthDebtService / 1000), displayValue: usd(r.latestMonthDebtService) },
      { label: 'T12 interest (P&L)', shortLabel: 'T12 int.', value: Math.round(r.pnlImpact.interestDollarsTrailing12 / 1000), displayValue: usd(r.pnlImpact.interestDollarsTrailing12) },
      { label: 'Latest interest (P&L)', shortLabel: 'Latest int.', value: Math.round(r.pnlImpact.interestDollarsLatestMonth / 1000), displayValue: usd(r.pnlImpact.interestDollarsLatestMonth) },
    ],
    chart: 'bar',
    chartDescription: 'Debt service cash vs interest-only P&L impact.',
    unit: 'count',
    metricLabel: 'Debt service ($)',
    metricIds: ['debt_service', 'interest_expense'],
    definition:
      'Debt service shown on a trailing-12-months actuals basis — cash impact = principal + interest, profit impact = interest only.',
    intent: 'cost_analysis',
    queryPlan: 'getDebtService · trailing-12 + latest · synthetic dataset',
    comparativeInsight: `Latest cash debt-service-to-revenue ${pct(r.cashImpact.latestMonth)} vs trailing-12 ${pct(r.cashImpact.trailing12)}.`,
    nextAction: 'Separate principal refinance options from interest-rate exposure when reviewing the capital stack.',
    followUps: {
      drillDown: 'How much of latest debt service is principal vs interest?',
      drillUp: 'What is debt service as a share of cash collected?',
      drillAcross: 'How does interest expense track against operating losses?',
    },
    limitations: ['Synthetic dataset — computed, not governed', 'Trailing actuals, not a forward amortization schedule'],
  });
}

export function answerDebtTrend(): RecruitmentAnswer {
  const r = getDebtTrend(dataset);
  const last6 = r.last6;
  const title =
    last6.direction === 'growing'
      ? `Debt grew ${usd(last6.changeDollars)} (${pct(last6.changePct)}) over the last 6 months`
      : last6.direction === 'declining'
        ? `Debt declined ${usd(Math.abs(last6.changeDollars))} (${pct(Math.abs(last6.changePct))}) over the last 6 months`
        : `Debt is flat over the last 6 months at ${usd(last6.end)}`;
  return base({
    questionId: 'debt-trend',
    title,
    summary: `Closing balance moved from ${usd(last6.start)} to ${usd(last6.end)} in the last six months (${last6.direction}). First-12 change: ${usd(r.first12.changeDollars)} (${pct(r.first12.changePct)}, ${r.first12.direction}).`,
    insight: `Last-12 window: ${usd(r.last12.start)} → ${usd(r.last12.end)} (${r.last12.direction}).`,
    data: r.series.map((p) => ({
      label: p.month,
      shortLabel: shortMonth(p.month),
      value: Math.round(p.value / 1000),
      displayValue: usd(p.value),
    })),
    chart: 'line',
    chartDescription: 'Monthly debt closing balance.',
    unit: 'count',
    metricLabel: 'Debt closing balance ($K)',
    metricIds: ['debt_closing_balance'],
    definition: 'Six-month balance change in debt_schedule.closing_balance. Direction uses a ±3% flat band.',
    intent: 'time_trend',
    queryPlan: 'getDebtTrend · closing_balance series · synthetic dataset',
    comparativeInsight: `Last-6 direction is ${last6.direction}; first-12 was ${r.first12.direction}.`,
    nextAction:
      last6.direction === 'flat'
        ? 'Confirm draws continue to match principal so the flat balance does not silently resume growth.'
        : 'Review draw vs principal policy that produced the last-6 balance change.',
    followUps: {
      drillDown: 'Which months had the largest draws?',
      drillUp: 'What is debt as a share of annualised revenue?',
      drillAcross: 'How does debt service track while the balance is flat?',
    },
    limitations: ['Synthetic dataset — computed, not governed'],
  });
}

export function answerCashFlowProblem(): RecruitmentAnswer {
  const r = getCashFlowAssessment(dataset);
  const title = r.verdict
    ? `Genuine cash-flow problem under ${r.ruleName}`
    : `No genuine cash-flow problem under ${r.ruleName}`;
  const summary = `${r.negativeNetCashMonthsInLookback} of the last ${r.lookbackMonths} months had negative net cash flow (threshold ≥ ${r.negativeNetCashMonthsRequired}). Open A/R ${r.arTrend.growing ? 'grew' : 'did not grow'} by ${usd(r.arTrend.changeDollars)} (${r.arTrend.startMonth} → ${r.arTrend.endMonth}). Ending open A/R gap: ${usd(r.gapEndingOpenAr)}.`;
  return base({
    questionId: 'cash-flow-problem',
    title,
    summary,
    insight: `Net cash flow = cash_collected + draws − expenses_paid_cash − principal_paid.`,
    data: r.netCashFlowSeries.slice(-12).map((p) => ({
      label: p.month,
      shortLabel: shortMonth(p.month),
      value: Math.round(p.value / 1000),
      displayValue: usd(p.value),
    })),
    chart: 'line',
    chartDescription: 'Monthly net cash flow (I3 terms), last 12 months.',
    unit: 'count',
    metricLabel: 'Net cash flow ($K)',
    metricIds: ['net_cash_flow', 'open_ar'],
    definition:
      'hasProblem = negative net cash flow in ≥3 of the last 6 months AND receivables growing. Net cash flow = cash_collected + draws − expenses_paid_cash − principal_paid.',
    intent: 'cash_analysis',
    queryPlan: 'getCashFlowAssessment · Q4_GENUINE_CASH_FLOW_PROBLEM · synthetic dataset',
    comparativeInsight: `A/R ${usd(r.arTrend.startOpenAr)} → ${usd(r.arTrend.endOpenAr)}; negative net-cash months ${r.negativeNetCashMonthsInLookback}/${r.lookbackMonths}.`,
    nextAction: r.verdict
      ? 'Prioritize collections on aging A/R while reviewing months with the deepest I3 net-cash deficits.'
      : 'Keep monitoring the lookback window — the rule is clear of a genuine problem today.',
    followUps: {
      drillDown: 'Which months had the largest negative net cash flow?',
      drillUp: 'What share of ending open A/R is older than 60 days?',
      drillAcross: 'How does debt service cash impact overlap the negative net-cash months?',
    },
    limitations: ['Synthetic dataset — computed, not governed', 'Rule-based verdict, not a credit opinion'],
  });
}

export function answerCostPerMember(): RecruitmentAnswer {
  const r = getCostPerMemberMonth(dataset);
  return base({
    questionId: 'cost-per-member',
    title: `Cost per member per month is ${usdPrecise(r.latest)} in ${r.latestMonth}`,
    summary: `Direct labour cost ÷ members_avg. Trailing-${r.trailingMonths}-month average is ${usdPrecise(r.trailingAverage)}. Back-office and interest are excluded.`,
    insight: `Latest ${usdPrecise(r.latest)} vs trailing average ${usdPrecise(r.trailingAverage)}.`,
    data: r.series.slice(-12).map((p) => ({
      label: p.month,
      shortLabel: shortMonth(p.month),
      value: Math.round(p.value),
      displayValue: usdPrecise(p.value),
    })),
    chart: 'line',
    chartDescription: 'Cost per member per month (direct labour only).',
    unit: 'count',
    metricLabel: 'Cost / member-month',
    metricIds: ['cost_per_member_month'],
    definition: 'Direct labour cost only (direct_labor_cost ÷ members_avg); back-office and interest excluded.',
    intent: 'cost_analysis',
    queryPlan: 'getCostPerMemberMonth · synthetic dataset',
    comparativeInsight: `Latest ${usdPrecise(r.latest)} vs trailing average ${usdPrecise(r.trailingAverage)}.`,
    nextAction: 'Compare caregiver utilization and hours per member against this unit cost before changing staffing.',
    followUps: {
      drillDown: 'Which service line drives the most direct labour?',
      drillUp: 'What is revenue per member relative to this cost?',
      drillAcross: 'How does utilization move with cost per member?',
    },
    limitations: ['Synthetic dataset — computed, not governed', 'No other-opex allocation into member cost'],
  });
}

export function answerCaregiverUtilization(): RecruitmentAnswer {
  const r = getCaregiverUtilization(dataset);
  return base({
    questionId: 'caregiver-utilization',
    title: `Caregiver utilization is ${pct(r.latest)} in ${r.latestMonth}`,
    summary: `Actual delivered hours ÷ available hours. Series uses the operations table actual-hours basis.`,
    insight: `Latest utilization ${pct(r.latest)} on an actual-hours basis.`,
    data: r.series.slice(-12).map((p) => ({
      label: p.month,
      shortLabel: shortMonth(p.month),
      value: Number((p.value * 100).toFixed(1)),
      displayValue: pct(p.value),
    })),
    chart: 'line',
    chartDescription: 'Caregiver utilization (delivered ÷ available), last 12 months.',
    unit: 'percent',
    metricLabel: 'Utilization',
    metricIds: ['caregiver_utilization'],
    definition: 'Actual-hours basis: caregiver_delivered_hours ÷ caregiver_available_hours.',
    intent: 'rate_breakdown',
    queryPlan: 'getCaregiverUtilization · synthetic dataset',
    comparativeInsight: `Latest ${pct(r.latest)}; prior month ${pct(r.series.at(-2)?.value ?? r.latest)}.`,
    nextAction: 'If utilization is soft, inspect waitlist demand before cutting available hours.',
    followUps: {
      drillDown: 'How do delivered hours compare with service hours billed?',
      drillUp: 'What revenue per caregiver accompanies this utilization?',
      drillAcross: 'Is waitlist unrealized revenue rising while utilization is flat?',
    },
    limitations: ['Synthetic dataset — computed, not governed', 'Actual-hours basis only'],
  });
}

export function answerWaitlistRevenue(): RecruitmentAnswer {
  const r = getUnrealizedWaitlistRevenue(dataset);
  return base({
    questionId: 'waitlist-revenue',
    title: `Unrealized waitlist revenue is ${usdPrecise(r.unrealizedRevenue)} in ${r.latestMonth}`,
    summary: `${r.factors.waitlist_end} waitlisted members × ${r.factors.hoursPerMember.toFixed(2)} hours/member × ${usdPrecise(r.factors.revenuePerHour)}/hour.`,
    insight: `Monthly unrealised revenue from the waitlist at current intensity and rate.`,
    data: [
      { label: 'Waitlisted members', shortLabel: 'Waitlist', value: r.factors.waitlist_end, displayValue: String(r.factors.waitlist_end) },
      { label: 'Hours per member', shortLabel: 'Hrs/mbr', value: Number(r.factors.hoursPerMember.toFixed(2)), displayValue: r.factors.hoursPerMember.toFixed(2) },
      { label: 'Revenue per hour', shortLabel: '$/hr', value: Number(r.factors.revenuePerHour.toFixed(2)), displayValue: usdPrecise(r.factors.revenuePerHour) },
      { label: 'Unrealized revenue', shortLabel: 'Unrealized', value: Math.round(r.unrealizedRevenue), displayValue: usdPrecise(r.unrealizedRevenue) },
    ],
    chart: 'bar',
    chartDescription: 'Waitlist unrealized revenue factors (latest month).',
    unit: 'count',
    metricLabel: 'Waitlist factors',
    metricIds: ['unrealized_waitlist_revenue'],
    definition:
      'Monthly unrealised revenue = waitlist_end × (service_hours ÷ members_avg) × (revenue_billed ÷ service_hours).',
    intent: 'exposure_analysis',
    queryPlan: 'getUnrealizedWaitlistRevenue · synthetic dataset',
    comparativeInsight: `${r.factors.waitlist_end} members on the waitlist imply ${usdPrecise(r.unrealizedRevenue)} at current intensity.`,
    nextAction: 'Convert waitlist demand into scheduled hours only where caregiver utilization has headroom.',
    followUps: {
      drillDown: 'Which service lines could absorb waitlist hours?',
      drillUp: 'What is cost per member for filling those hours?',
      drillAcross: 'How does utilization constrain waitlist conversion?',
    },
    limitations: ['Synthetic dataset — computed, not governed', 'Monthly estimate, not weekly cash'],
  });
}

export function answerRevenuePerMemberCaregiver(): RecruitmentAnswer {
  const r = getRevenuePerMemberAndCaregiver(dataset);
  return base({
    questionId: 'revenue-per-member-caregiver',
    title: `Revenue ${usdPrecise(r.latest.perMember)} per member and ${usdPrecise(r.latest.perCaregiver)} per caregiver in ${r.latestMonth}`,
    summary: `Billed revenue basis. Trailing-${r.trailingAverage.months}-month averages: ${usdPrecise(r.trailingAverage.perMember)} / member and ${usdPrecise(r.trailingAverage.perCaregiver)} / caregiver.`,
    insight: `Latest vs trailing averages on a billed-revenue basis.`,
    data: [
      { label: 'Rev / member (latest)', shortLabel: 'Mbr latest', value: Math.round(r.latest.perMember), displayValue: usdPrecise(r.latest.perMember) },
      { label: 'Rev / member (T avg)', shortLabel: 'Mbr avg', value: Math.round(r.trailingAverage.perMember), displayValue: usdPrecise(r.trailingAverage.perMember) },
      { label: 'Rev / caregiver (latest)', shortLabel: 'Cg latest', value: Math.round(r.latest.perCaregiver), displayValue: usdPrecise(r.latest.perCaregiver) },
      { label: 'Rev / caregiver (T avg)', shortLabel: 'Cg avg', value: Math.round(r.trailingAverage.perCaregiver), displayValue: usdPrecise(r.trailingAverage.perCaregiver) },
    ],
    chart: 'bar',
    chartDescription: 'Revenue per member and per caregiver.',
    unit: 'count',
    metricLabel: 'Revenue density ($)',
    metricIds: ['revenue_per_member', 'revenue_per_caregiver'],
    definition: 'Billed revenue basis: revenue_billed ÷ members_avg and revenue_billed ÷ caregivers_avg.',
    intent: 'rate_breakdown',
    queryPlan: 'getRevenuePerMemberAndCaregiver · synthetic dataset',
    comparativeInsight: `Member density ${usdPrecise(r.latest.perMember)} vs trailing avg ${usdPrecise(r.trailingAverage.perMember)}.`,
    nextAction: 'Use member vs caregiver density together when judging whether growth is census- or productivity-led.',
    followUps: {
      drillDown: 'How does revenue per member vary by service line?',
      drillUp: 'What is cost per member against this revenue density?',
      drillAcross: 'How does caregiver utilization relate to revenue per caregiver?',
    },
    limitations: ['Synthetic dataset — computed, not governed', 'Billed, not collected'],
  });
}

export function answerServiceLineProfitability(): RecruitmentAnswer {
  const r = getServiceLineProfitability(dataset);
  const unprofitable = r.lines.filter((line) => line.nonPositive);
  const title =
    unprofitable.length === 0
      ? `Every service line is profitable in ${r.latestMonth}`
      : `${unprofitable.length} service line${unprofitable.length === 1 ? '' : 's'} not profitable in ${r.latestMonth}`;
  return base({
    questionId: 'service-line-profitability',
    title,
    summary: r.lines
      .map((line) => {
        const marginPct = line.revenue === 0 ? 0 : (line.revenue - line.direct_cost) / line.revenue;
        return `${line.service_line}: ${pct(marginPct)} margin (${line.nonPositive ? 'not profitable' : 'profitable'})`;
      })
      .join('; ') + '.',
    insight: unprofitable.length
      ? `${unprofitable.map((l) => l.service_line).join(', ')} show margin ≤ 0 on direct cost.`
      : 'All lines have positive direct margin.',
    data: r.lines.map((line) => {
      const marginPct = line.revenue === 0 ? 0 : (line.revenue - line.direct_cost) / line.revenue;
      return {
        label: line.service_line,
        shortLabel: line.service_line.slice(0, 12),
        value: Number((marginPct * 100).toFixed(1)),
        displayValue: pct(marginPct),
      };
    }),
    chart: 'bar',
    chartDescription: 'Service-line direct margin % (latest month).',
    unit: 'percent',
    metricLabel: 'Direct margin %',
    metricIds: ['service_line_margin'],
    definition:
      'Margin = (rate − direct cost) / rate per line (implemented as (revenue − direct_cost) ÷ revenue). Flagged when margin ≤ 0.',
    intent: 'margin_analysis',
    queryPlan: 'getServiceLineProfitability · synthetic dataset',
    comparativeInsight: unprofitable.length
      ? `Weakest line: ${r.lines[r.lines.length - 1]?.service_line} at ${pct(
          r.lines[r.lines.length - 1].revenue === 0
            ? 0
            : (r.lines[r.lines.length - 1].revenue - r.lines[r.lines.length - 1].direct_cost) /
                r.lines[r.lines.length - 1].revenue,
        )}.`
      : `Strongest line: ${r.lines[0]?.service_line}.`,
    nextAction: unprofitable.length
      ? `Review pricing and direct cost for ${unprofitable[0].service_line} before adding volume.`
      : 'Keep monitoring Respite-class lines when hours mix shifts.',
    followUps: {
      drillDown: 'What is margin per hour on the weakest line?',
      drillUp: 'How much of billed revenue sits in unprofitable lines?',
      drillAcross: 'Does caregiver utilization differ on unprofitable lines?',
    },
    limitations: ['Synthetic dataset — computed, not governed', 'Direct cost only — no back-office allocation'],
  });
}

export function answerRatiosAndChurn(): RecruitmentAnswer {
  const r = getRatiosAndChurn(dataset);
  return base({
    questionId: 'ratios-and-churn',
    title: `Key ratios and churn for ${r.latestMonth}`,
    summary: `Rev÷ex-labor ${r.latest.revenueToExpensesExLabor.toFixed(2)}; Rev÷back-office ${r.latest.revenueToBackOffice.toFixed(2)}; debt÷ann. revenue ${pct(r.latest.debtToAnnualisedRevenue)}; DS÷revenue ${pct(r.latest.debtServiceToRevenue)}; member churn ${pct(r.latest.memberChurn)}; caregiver churn ${pct(r.latest.caregiverChurn)}.`,
    insight: `Trailing averages — member churn ${pct(r.trailingAverage.memberChurn)}, caregiver churn ${pct(r.trailingAverage.caregiverChurn)}.`,
    data: [
      { label: 'Rev ÷ ex-labor', shortLabel: 'Rev/exL', value: Number(r.latest.revenueToExpensesExLabor.toFixed(2)), displayValue: r.latest.revenueToExpensesExLabor.toFixed(2) },
      { label: 'Rev ÷ back-office', shortLabel: 'Rev/BO', value: Number(r.latest.revenueToBackOffice.toFixed(2)), displayValue: r.latest.revenueToBackOffice.toFixed(2) },
      { label: 'Debt ÷ ann. rev', shortLabel: 'Debt/Rev', value: Number((r.latest.debtToAnnualisedRevenue * 100).toFixed(1)), displayValue: pct(r.latest.debtToAnnualisedRevenue) },
      { label: 'DS ÷ revenue', shortLabel: 'DS/Rev', value: Number((r.latest.debtServiceToRevenue * 100).toFixed(1)), displayValue: pct(r.latest.debtServiceToRevenue) },
      { label: 'Member churn', shortLabel: 'Mbr churn', value: Number((r.latest.memberChurn * 100).toFixed(2)), displayValue: pct(r.latest.memberChurn, 2) },
      { label: 'Caregiver churn', shortLabel: 'Cg churn', value: Number((r.latest.caregiverChurn * 100).toFixed(2)), displayValue: pct(r.latest.caregiverChurn, 2) },
    ],
    chart: 'bar',
    chartDescription: 'Key ratios and churn (latest month).',
    unit: 'count',
    metricLabel: 'Ratio / rate',
    metricIds: ['finance_ratios', 'member_churn', 'caregiver_churn'],
    definition:
      'Key coverage and leverage ratios plus member/caregiver churn. Caregiver churn is computed from inferred caregiver start when caregivers_end is absent.',
    intent: 'rate_breakdown',
    queryPlan: 'getRatiosAndChurn · synthetic dataset',
    comparativeInsight: `Member churn ${pct(r.latest.memberChurn, 2)} vs trailing avg ${pct(r.trailingAverage.memberChurn, 2)}.`,
    nextAction: 'Pair caregiver churn with utilization before changing hiring pace.',
    followUps: {
      drillDown: 'What is the month-start caregiver count behind the churn rate?',
      drillUp: 'How does debt service-to-revenue compare with interest-only P&L impact?',
      drillAcross: 'Does member churn correlate with waitlist size?',
    },
    limitations: [
      'Synthetic dataset — computed, not governed',
      'Caregiver churn is computed from inferred caregiver start (Phase 1 rows omit caregivers_end: start ≈ round(avg − (hired − left) / 2))',
    ],
  });
}

export const financialComputeAnswerBuilders: Record<string, () => RecruitmentAnswer> = {
  'break-even': answerBreakEven,
  'debt-service': answerDebtService,
  'debt-trend': answerDebtTrend,
  'cash-flow-problem': answerCashFlowProblem,
  'cost-per-member': answerCostPerMember,
  'caregiver-utilization': answerCaregiverUtilization,
  'waitlist-revenue': answerWaitlistRevenue,
  'revenue-per-member-caregiver': answerRevenuePerMemberCaregiver,
  'service-line-profitability': answerServiceLineProfitability,
  'ratios-and-churn': answerRatiosAndChurn,
};
