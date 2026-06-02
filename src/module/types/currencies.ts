export type CurrencyDto = {
  id: string | number;
  name: string;
  symbol: string | null;
  short_name: string;
  numeric_code?: number | null;
  minor_units?: number | null;
  is_active?: boolean | null;
};

export type CurrencyListItem = Pick<
  CurrencyDto,
  'id' | 'name' | 'symbol' | 'short_name' | 'is_active'
>;

import type { ListFetchOptions, ListFetchResult } from './list';

export type GetCurrenciesOptions = ListFetchOptions;
export type GetCurrenciesResult = ListFetchResult<CurrencyListItem>;
