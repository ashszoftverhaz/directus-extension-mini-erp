import { ExpenseType } from './expenses';
import { IncomeType } from './incomes';

export interface TransactionListItem {
  id: string;
  source: 'incomes' | 'expenses';
  payment_due_date: string;
  paid_at: string | null;
  name: string;
  amount: number | string;
  short_name?: string | null;
  type?: ExpenseType | IncomeType | null;
  account_name?: string | null;
}

export interface GetTransactionsOptions {
  limit?: number;
  offset?: number;
  sort?: string[];
  search?: string;
  filter?: Record<string, any>;
}

export interface GetTransactionsResult {
  data: TransactionListItem[];
  total: number;
}

export const TransactionTypeLabels: Record<ExpenseType | IncomeType, string> = {
  [ExpenseType.OperationalCost]: 'Operational cost',
  [ExpenseType.InventoryChange]: 'Inventory change',
  [ExpenseType.Asset]: 'Asset',
  [ExpenseType.Employee]: 'Employee',
  [IncomeType.Service]: 'Service',
  [IncomeType.Other]: 'Other',
};
