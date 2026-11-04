export { storyConfig } from './story-config';
export { syntheticFinanceDataset } from './data';
export {
  generateSyntheticFinance,
  buildMonthKeys,
  openArAmount,
  arOlderThanDays,
  monthlyProfit,
  netCashFlow,
  evaluateCashFlowProblem,
} from './generate';
export type {
  SyntheticFinanceDataset,
  MonthlyOperations,
  MonthlyFinancials,
  DebtScheduleRow,
  ArLedgerRow,
  ApLedgerRow,
  ServiceLineRow,
  MonthlyBalances,
  MonthKey,
} from './types';
