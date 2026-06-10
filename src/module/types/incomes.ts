export interface IncomeListItem {
  id: string;
  name?: string | null;
  amount: number | string;
  income_type: 'service' | 'asset' | 'other' | string | null;
  payment_due_date?: string | null;
  payment_date?: string | null;
  currency?: {
    id: string;
    symbol?: string | null;
  } | null;
  transaction_category?: {
    id: string;
    name?: string | null;
  } | null;
  location?: {
    id: string;
    name?: string | null;
  } | null;
}

export interface GetIncomesOptions {
  limit?: number;
  offset?: number;
  sort?: string[];
  search?: string;
  filter?: Record<string, any>;
}

export interface GetIncomesResult {
  data: IncomeListItem[];
  total: number;
}

export enum IncomeType {
  Service = 'service',
  Asset = 'asset',
  Other = 'other',
}

export const IncomeTypeLabels: Record<IncomeType, string> = {
  [IncomeType.Service]: 'Service',
  [IncomeType.Asset]: 'Asset',
  [IncomeType.Other]: 'Other',
};
