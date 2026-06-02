import type { TaxDto } from './taxes';

export type EmployeeDto = {
  id: string;
  compensation_amount: number;
  gross_salary_per_month?: number | null;
  compensation_type: string;
  commission_amount?: number | null;
  employment_start_date: string | Date;
  seniority: string;
  salary_taxes_applied?: Array<{
    id: number | string;
    taxes_id?: Pick<TaxDto, 'id' | 'tax_type' | 'tax_value'> | null;
  }>;
  commission_taxes_applied?: Array<{
    id: number | string;
    taxes_id?: Pick<TaxDto, 'id' | 'tax_type' | 'tax_value'> | null;
  }>;
  account?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar?: {
      id: string;
    } | null;
  };
};

export type EmployeeListItem = EmployeeDto;

import type { ListFetchOptions, ListFetchResult } from './list';

export type GetEmployeesOptions = ListFetchOptions;
export type GetEmployeesResult = ListFetchResult<EmployeeListItem>;

