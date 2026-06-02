export type TaxDto = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  tax_type: 'percentage_based' | 'fixed_amount';
  tax_value: number;
  country?: {
    id: string;
    name: string;
    iso2?: string | null;
    default_currency?: {
      id: string;
      short_name?: string;
      name?: string;
    } | null;
  } | null;
};

export type TaxListItem = Pick<
  TaxDto,
  'id' | 'name' | 'code' | 'tax_type' | 'tax_value' | 'country'
>;

import type { ListFetchOptions, ListFetchResult } from './list';

export type GetTaxesOptions = ListFetchOptions;
export type GetTaxesResult = ListFetchResult<TaxListItem>;
