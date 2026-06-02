export type PeriodGrouping = 'monthly' | 'quarterly' | 'yearly';

export type IncomeStatementPeriodDto = {
  index: number;
  startDate: string;
  endDate: string;
  label: string;
};

export type IncomeStatementRowDto = {
  key: string;
  label: string;
  emphasized?: boolean;
  values: Array<number | null>;
};

export type IncomeStatementResponseDto = {
  baseCurrencyCode: string | null;
  periods: IncomeStatementPeriodDto[];
  rows: IncomeStatementRowDto[];
};
