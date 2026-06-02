export type IncomeStatementFrequency = 'monthly' | 'quarterly' | 'yearly';

export type IncomeStatementPeriod = {
  index: number;
  startDate: Date;
  endDate: Date;
  label: string;
};

export type IncomeStatementFilters = {
  startingDate: Date;
  frequency: IncomeStatementFrequency;
};

export type IncomeStatementRowKey =
  | 'revenue'
  | 'revenue_service'
  | 'revenue_asset'
  | 'revenue_other'
  | 'cost_of_goods_sold'
  | 'employee_salary'
  | 'employee_commission'
  | 'materials'
  | 'gross_profit'
  | 'gross_margin'
  | 'depreciation_amortization'
  | 'operational_ga'
  | 'interest'
  | 'operating_income'
  | 'total_taxes'
  | 'net_income'
  | 'ebitda'
  | 'ebitda_margin';

export type IncomeStatementRow = {
  key: IncomeStatementRowKey;
  label: string;
  section?: 'revenue' | 'costs' | 'gross_profit' | 'operating_income' | 'net_income' | 'ebitda';
  emphasized?: boolean;
  values: Array<number | null>;
};

export type IncomeStatementResult = {
  periods: IncomeStatementPeriod[];
  rows: IncomeStatementRow[];
  baseCurrencyCode: string | null;
};
