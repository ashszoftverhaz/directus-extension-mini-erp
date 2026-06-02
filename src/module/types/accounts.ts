export type AccountsDto = {
  id: string;
  account_name: string;
  payment_method: string;
  notes: string | null;
};

export type AccountListItem = Pick<
  AccountsDto,
  'id' | 'account_name' | 'payment_method' | 'notes'
>;

import type { ListFetchOptions, ListFetchResult } from './list';

export type GetAccountsOptions = ListFetchOptions;
export type GetAccountsResult = ListFetchResult<AccountListItem>;