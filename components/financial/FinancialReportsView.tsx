'use client';

import { useMemo, useState } from 'react';
import {
  buildAccountsPayable,
  buildAccountsReceivable,
  buildBalanceSheet,
  buildCashFlowStatement,
  buildForecast12,
  buildIncomeStatement,
  firstForecastBreakEvenMonth,
  syntheticFinanceDataset,
} from '@/lib/synthetic-finance';

const COMPUTED_LABEL = 'Synthetic dataset — computed, not governed';

type ReportId =
  | 'income-statement'
  | 'balance-sheet'
  | 'cash-flow'
  | 'accounts-receivable'
  | 'accounts-payable'
  | 'forecast-12';

const REPORTS: readonly { id: ReportId; title: string }[] = [
  { id: 'income-statement', title: 'Income Statement' },
  { id: 'balance-sheet', title: 'Balance Sheet' },
  { id: 'cash-flow', title: 'Cash Flow Statement' },
  { id: 'accounts-receivable', title: 'Accounts Receivable' },
  { id: 'accounts-payable', title: 'Accounts Payable' },
  { id: 'forecast-12', title: '12-month Forecast' },
];

function usd(n: number): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
}

function ReportTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<Array<string | number>>;
}) {
  return (
    <div className="os-report-table-wrap">
      <table className="os-report-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IncomeStatementReport() {
  const report = useMemo(() => buildIncomeStatement(syntheticFinanceDataset), []);
  return (
    <>
      <p className="os-report-note">{report.definition}</p>
      <ReportTable
        headers={['Month', 'Revenue', 'Direct labour', 'Back office', 'Other opex', 'Interest', 'Total exp.', 'Profit']}
        rows={report.monthly.map((m) => [
          m.month,
          usd(m.revenue_billed),
          usd(m.direct_labor_cost),
          usd(m.back_office_cost),
          usd(m.other_opex_ex_labor),
          usd(m.interest_expense),
          usd(m.total_expenses),
          usd(m.profit),
        ])}
      />
      <h4>Trailing 12 months</h4>
      <ReportTable
        headers={['Revenue', 'Direct labour', 'Back office', 'Other opex', 'Interest', 'Total exp.', 'Profit']}
        rows={[
          [
            usd(report.trailing12.revenue_billed),
            usd(report.trailing12.direct_labor_cost),
            usd(report.trailing12.back_office_cost),
            usd(report.trailing12.other_opex_ex_labor),
            usd(report.trailing12.interest_expense),
            usd(report.trailing12.total_expenses),
            usd(report.trailing12.profit),
          ],
        ]}
      />
    </>
  );
}

function BalanceSheetReport() {
  const report = useMemo(() => buildBalanceSheet(syntheticFinanceDataset), []);
  return (
    <>
      <p className="os-report-note">
        As of {report.month}. {report.disclosure}. Balances: {report.balances ? 'yes' : 'no'}.
      </p>
      <ReportTable
        headers={['Line', 'Amount']}
        rows={[
          ['Cash', usd(report.assets.cash)],
          ['Open A/R', usd(report.assets.open_ar)],
          ['Total assets', usd(report.assets.total)],
          ['Debt', usd(report.liabilitiesAndEquity.debt)],
          ['Open A/P', usd(report.liabilitiesAndEquity.open_ap)],
          ['Equity', usd(report.liabilitiesAndEquity.equity)],
          ['Total L&E', usd(report.liabilitiesAndEquity.total)],
        ]}
      />
    </>
  );
}

function CashFlowReport() {
  const report = useMemo(() => buildCashFlowStatement(syntheticFinanceDataset), []);
  return (
    <>
      <p className="os-report-note">{report.definition}</p>
      <ReportTable
        headers={[
          'Month',
          'Collected',
          'Cash exp. ex-int.',
          'Interest paid',
          'Net operating',
          'Draws',
          'Principal',
          'Net financing',
          'Net Δ cash',
          'Ending cash',
        ]}
        rows={report.monthly.map((m) => [
          m.month,
          usd(m.operating.cash_collected),
          usd(m.operating.cash_expenses_ex_interest),
          usd(m.operating.interest_paid),
          usd(m.operating.net_operating),
          usd(m.financing.draws),
          usd(m.financing.principal_paid),
          usd(m.financing.net_financing),
          usd(m.net_change_in_cash),
          usd(m.ending_cash),
        ])}
      />
    </>
  );
}

function AccountsReceivableReportView() {
  const report = useMemo(() => buildAccountsReceivable(syntheticFinanceDataset), []);
  return (
    <>
      <p className="os-report-note">
        As of {report.asOfDate}. Total open A/R {usd(report.totalOpen)}.
      </p>
      <h4>Aging</h4>
      <ReportTable
        headers={['0–30', '31–60', '61–90', '90+']}
        rows={[
          [
            usd(report.aging['0_30']),
            usd(report.aging['31_60']),
            usd(report.aging['61_90']),
            usd(report.aging['90_plus']),
          ],
        ]}
      />
      <h4>Ledger detail</h4>
      <ReportTable
        headers={['Payer', 'Service month', 'Status', 'Billed', 'Paid', 'Open', 'Days outstanding']}
        rows={report.ledger.map((row) => [
          row.payer_id,
          row.service_month,
          row.status,
          usd(row.amount_billed),
          usd(row.amount_paid),
          usd(row.amount_billed - row.amount_paid),
          String(row.days_outstanding),
        ])}
      />
    </>
  );
}

function AccountsPayableReportView() {
  const report = useMemo(() => buildAccountsPayable(syntheticFinanceDataset), []);
  return (
    <>
      <p className="os-report-note">
        As of {report.asOfDate}. Total open A/P {usd(report.totalOpen)}.
      </p>
      <h4>By payee type</h4>
      <ReportTable
        headers={['Payee type', 'Amount', 'Count']}
        rows={report.byPayeeType.map((row) => [row.payee_type, usd(row.amount), String(row.count)])}
      />
      <h4>By days waiting</h4>
      <ReportTable
        headers={['0–30', '31–60', '60+']}
        rows={[
          [usd(report.byDaysWaiting['0_30']), usd(report.byDaysWaiting['31_60']), usd(report.byDaysWaiting['60_plus'])],
        ]}
      />
      <h4>Ledger detail</h4>
      <ReportTable
        headers={['Payee type', 'Due date', 'Amount', 'Days waiting']}
        rows={report.ledger.map((row) => [row.payee_type, row.due_date, usd(row.amount), String(row.days_waiting)])}
      />
    </>
  );
}

function Forecast12Report() {
  const forecast = useMemo(() => buildForecast12(syntheticFinanceDataset), []);
  const breakEven = useMemo(() => firstForecastBreakEvenMonth(forecast), [forecast]);
  return (
    <>
      <p className="os-report-note">
        {forecast.definition} Forecast break-even month:{' '}
        {breakEven ? `${breakEven.month} (${usd(breakEven.profit)})` : 'none in the 12-month horizon'}.
      </p>
      <ReportTable
        headers={['Month', 'Revenue billed', 'Cash collected', 'Direct labour', 'Back office', 'Other opex', 'Interest', 'Profit', 'Cash', 'Debt']}
        rows={forecast.months.map((m) => [
          m.month,
          usd(m.revenue_billed),
          usd(m.cash_collected),
          usd(m.direct_labor_cost),
          usd(m.back_office_cost),
          usd(m.other_opex_ex_labor),
          usd(m.interest_expense),
          usd(m.profit),
          usd(m.cash),
          usd(m.debt),
        ])}
      />
    </>
  );
}

function ReportBody({ id }: { id: ReportId }) {
  switch (id) {
    case 'income-statement':
      return <IncomeStatementReport />;
    case 'balance-sheet':
      return <BalanceSheetReport />;
    case 'cash-flow':
      return <CashFlowReport />;
    case 'accounts-receivable':
      return <AccountsReceivableReportView />;
    case 'accounts-payable':
      return <AccountsPayableReportView />;
    case 'forecast-12':
      return <Forecast12Report />;
  }
}

export function FinancialReportsView() {
  const [selected, setSelected] = useState<ReportId>('income-statement');
  const active = REPORTS.find((r) => r.id === selected)!;

  return (
    <div className="os-reports">
      <div className="os-reports-head">
        <div>
          <strong>Financial reports</strong>
          <p>{COMPUTED_LABEL}</p>
        </div>
        <span className="os-reports-badge">{COMPUTED_LABEL}</span>
      </div>
      <div className="os-reports-list">
        {REPORTS.map((report) => (
          <button
            key={report.id}
            type="button"
            className={report.id === selected ? 'selected' : ''}
            onClick={() => setSelected(report.id)}
          >
            {report.title}
          </button>
        ))}
      </div>
      <section className="os-report-panel" aria-labelledby="os-report-title">
        <header>
          <h3 id="os-report-title">{active.title}</h3>
          <small>{COMPUTED_LABEL}</small>
        </header>
        <ReportBody id={selected} />
      </section>
    </div>
  );
}
