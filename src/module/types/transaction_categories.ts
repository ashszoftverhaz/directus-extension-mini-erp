export type TransactionCategoriesDto = {
  id: string;
  name: string;
  description: string | null;
};

export type TransactionCategoriesListItem = Pick<
  TransactionCategoriesDto,
  'id' | 'name' | 'description'
>;

import type { ListFetchOptions, ListFetchResult } from './list';

export type GetTransactionCategoriesOptions = ListFetchOptions;
export type GetTransactionCategoriesResult = ListFetchResult<TransactionCategoriesListItem>;