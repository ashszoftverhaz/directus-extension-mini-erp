export type BaseCurrencySettingRow = { value: string | null };

export type IncomeType = 'service' | 'asset' | 'other';

export type ExpenseType =
  | 'asset'
  | 'inventory_change'
  | 'operational_cost'
  | 'employee'
  | 'interest'
  | 'taxes';

export type IncomeRow = {
  id: string;
  payment_date: string | null;
  income_type: IncomeType;
  amount: unknown;
  base_currency_fx_rate: unknown;
};

export type ExpenseRow = {
  id: string;
  payment_date: string | null;
  expense_type: ExpenseType;
  amount: unknown;
  currency_rate: unknown;
};

export type AssetRow = {
  id: string;
  payment_due_date: string | null;
  purchase_amount: unknown;
  useful_life_months: unknown;
};

export type EmployeeRow = {
  id: string;
  employment_start_date: string | null;
  compensation_amount: unknown;
  commission_amount: unknown;
};
