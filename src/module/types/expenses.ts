export interface ExpenseListItem {
  id: string;
  name: string;
  amount: number | string;
  currency?: {
    symbol?: string | null;
  } | null;
  expense_type?: 'operational_cost' | 'asset' | 'inventory_change' | 'employee' | string | null;
  payment_due_date?: string | null;
  payment_date?: string | null;
  transaction_category?: {
    id: string;
    name?: string | null;
  } | null;
  location?: {
    id: string;
    name?: string | null;
  } | null;
}

export interface GetExpensesOptions {
  limit?: number;
  offset?: number;
  sort?: string[];
  search?: string;
  filter?: Record<string, any>;
}

export interface GetExpensesResult {
  data: ExpenseListItem[];
  total: number;
}

export enum ExpenseType {
  OperationalCost = 'operational_cost',
  InventoryChange = 'inventory_change',
  Asset = 'asset',
  Employee = 'employee',
}

export const ExpenseTypeLabels: Record<ExpenseType, string> = {
  [ExpenseType.OperationalCost]: 'Operational cost',
  [ExpenseType.InventoryChange]: 'Inventory change',
  [ExpenseType.Asset]: 'Asset',
  [ExpenseType.Employee]: 'Employee',
};

