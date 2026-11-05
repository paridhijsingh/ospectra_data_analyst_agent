/**
 * Static scorecard board for the Financial Agent (the questions Murali gave).
 * Statuses are data only — this module does not call compute.
 */

export const SEP24_SCORECARD_HEADER = 'Synthetic dataset — computed, not governed';

export const QUESTION_STATUS = 'Answered — computed (synthetic)' as const;
export const REPORT_STATUS = 'Available — computed (synthetic)' as const;

export type ScorecardQuestionItem = {
  id: string;
  code: `Q${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}`;
  kind: 'question';
  prompt: string;
  status: typeof QUESTION_STATUS;
  destination: 'chat';
};

export type ScorecardReportItem = {
  id: string;
  code: `R${1 | 2 | 3 | 4 | 5 | 6}`;
  kind: 'report';
  title: string;
  status: typeof REPORT_STATUS;
  destination: 'reports';
};

export type ScorecardOpenItem = {
  id: string;
  title: string;
  detail: string;
};

export const sep24ScorecardQuestions: readonly ScorecardQuestionItem[] = [
  {
    id: 'break-even',
    code: 'Q1',
    kind: 'question',
    prompt: 'Have we reached break-even, and when do we get there?',
    status: QUESTION_STATUS,
    destination: 'chat',
  },
  {
    id: 'debt-service',
    code: 'Q2',
    kind: 'question',
    prompt: 'How much does our debt cost us to service, and what does it do to profit?',
    status: QUESTION_STATUS,
    destination: 'chat',
  },
  {
    id: 'debt-trend',
    code: 'Q3',
    kind: 'question',
    prompt: 'Is our debt growing?',
    status: QUESTION_STATUS,
    destination: 'chat',
  },
  {
    id: 'cash-flow-problem',
    code: 'Q4',
    kind: 'question',
    prompt: 'Do we have a genuine cash-flow problem?',
    status: QUESTION_STATUS,
    destination: 'chat',
  },
  {
    id: 'cost-per-member',
    code: 'Q5',
    kind: 'question',
    prompt: 'What does service cost per member per month?',
    status: QUESTION_STATUS,
    destination: 'chat',
  },
  {
    id: 'caregiver-utilization',
    code: 'Q6',
    kind: 'question',
    prompt: "How well are we using caregivers' available time?",
    status: QUESTION_STATUS,
    destination: 'chat',
  },
  {
    id: 'waitlist-revenue',
    code: 'Q7',
    kind: 'question',
    prompt: 'How much revenue are we leaving unserved on the waitlist?',
    status: QUESTION_STATUS,
    destination: 'chat',
  },
  {
    id: 'revenue-per-member-caregiver',
    code: 'Q8',
    kind: 'question',
    prompt: 'What revenue do we make per member and per caregiver each month?',
    status: QUESTION_STATUS,
    destination: 'chat',
  },
  {
    id: 'service-line-profitability',
    code: 'Q9',
    kind: 'question',
    prompt: 'Is every service line profitable?',
    status: QUESTION_STATUS,
    destination: 'chat',
  },
  {
    id: 'ratios-and-churn',
    code: 'Q10',
    kind: 'question',
    prompt: 'What are our key ratios and churn?',
    status: QUESTION_STATUS,
    destination: 'chat',
  },
];

export const sep24ScorecardReports: readonly ScorecardReportItem[] = [
  {
    id: 'income-statement',
    code: 'R1',
    kind: 'report',
    title: 'Income Statement',
    status: REPORT_STATUS,
    destination: 'reports',
  },
  {
    id: 'balance-sheet',
    code: 'R2',
    kind: 'report',
    title: 'Balance Sheet',
    status: REPORT_STATUS,
    destination: 'reports',
  },
  {
    id: 'cash-flow',
    code: 'R3',
    kind: 'report',
    title: 'Cash Flow Statement',
    status: REPORT_STATUS,
    destination: 'reports',
  },
  {
    id: 'accounts-receivable',
    code: 'R4',
    kind: 'report',
    title: 'Accounts Receivable',
    status: REPORT_STATUS,
    destination: 'reports',
  },
  {
    id: 'accounts-payable',
    code: 'R5',
    kind: 'report',
    title: 'Accounts Payable',
    status: REPORT_STATUS,
    destination: 'reports',
  },
  {
    id: 'forecast-12',
    code: 'R6',
    kind: 'report',
    title: '12-month Forecast',
    status: REPORT_STATUS,
    destination: 'reports',
  },
];

export const sep24ScorecardOpenItems: readonly ScorecardOpenItem[] = [
  {
    id: 'governed-catalogue',
    title: 'Finance governed catalogue',
    detail:
      'Not built; these answers are computed from a synthetic dataset, not governed metrics.',
  },
  {
    id: 'churn-precision',
    title: 'Churn precision',
    detail: 'Caregiver churn uses an inferred start; treat as indicative.',
  },
  {
    id: 'utilisation',
    title: 'Utilisation',
    detail: 'Actual-hours basis only; scheduled-hours basis not yet available.',
  },
  {
    id: 'debt-service-forward',
    title: 'Debt service',
    detail: 'Trailing-12 actuals; a forward 12-month schedule view is not built.',
  },
  {
    id: 'metric-owner-workflow',
    title: 'Metric owner workflow',
    detail:
      'Planned, 2–3 weeks: when no metric exists, the agent says it has no answer and the request is captured for definition with the metric owner.',
  },
];

export const sep24ScorecardBoardItems = [
  ...sep24ScorecardQuestions,
  ...sep24ScorecardReports,
] as const;

/** Plain-text document used by the scorecard view and content tests (no React, no compute). */
export function renderSep24ScorecardContent(): string {
  const lines: string[] = [
    'Scorecard — the questions Murali gave',
    SEP24_SCORECARD_HEADER,
    '',
    'Questions',
    ...sep24ScorecardQuestions.map(
      (item) => `${item.code} ${item.prompt} · ${item.status} · Ask in Financial chat`,
    ),
    '',
    'Reports',
    ...sep24ScorecardReports.map(
      (item) => `${item.code} ${item.title} · ${item.status} · Open Reports view`,
    ),
    '',
    'Still open',
    ...sep24ScorecardOpenItems.map((item, index) => `${index + 1}. ${item.title} — ${item.detail}`),
  ];
  return lines.join('\n');
}
