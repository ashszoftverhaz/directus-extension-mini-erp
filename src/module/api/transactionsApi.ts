import type { useApi } from '@directus/extensions-sdk';
import type { DirectusItemsResponse } from '../types/apiTypes';
import { GetTransactionsOptions, GetTransactionsResult, TransactionListItem } from '../types/transactions';

type ApiClient = ReturnType<typeof useApi>;

export async function getTransactions(
  api: ApiClient,
  options: GetTransactionsOptions = {},
): Promise<GetTransactionsResult> {
  
  const response = await api.get<DirectusItemsResponse<TransactionListItem[]>>('/erp/transactions', {
    params: {
      sort: options.sort ?? ['payment_due_date'],
      limit: options.limit ?? -1,
      offset: options.offset ?? 0,
      ...(options.search ? { search: options.search } : {}),
      ...(options.filter ? { filter: options.filter } : {})
    },
  });

  return {
    data: response.data?.data ?? [],
    total: response.data?.meta?.total_count ?? 0,
  };
}

export async function getCollectionInfo(): Promise<string> {
  return 'In Transactions, you can view and manage all financial transactions made by the business.'
}