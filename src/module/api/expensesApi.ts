import type { useApi } from '@directus/extensions-sdk';
import type { DirectusItemsResponse } from '../types/apiTypes';
import { ExpenseListItem, GetExpensesOptions, GetExpensesResult } from '../types/expenses';

type ApiClient = ReturnType<typeof useApi>;

export async function getExpenses(
  api: ApiClient,
  options: GetExpensesOptions = {},
): Promise<GetExpensesResult> {
  const fields: string[] = [
    'id',
    'amount',
    'name',
    'expense_type',
    'payment_due_date',
    'payment_date',
    'transaction_category.id',
    'transaction_category.name',
    'location.id',
    'location.name',
    'currency.short_name',
  ];

  const response = await api.get<DirectusItemsResponse<ExpenseListItem[]>>('/items/expenses', {
    params: {
      fields,
      sort: options.sort ?? ['payment_due_date'],
      limit: options.limit ?? -1,
      offset: options.offset ?? 0,
      ...(options.search ? { search: options.search } : {}),
      ...(options.filter ? { filter: options.filter } : {}),
      meta: ['total_count', 'filter_count'],
    },
  });

  return {
    data: response.data?.data ?? [],
    total: response.data?.meta?.total_count ?? 0,
  };
}

export async function getCollectionInfo(api: ApiClient): Promise<string> {
  try {
    const response = await api.get(`/collections/expenses`, {
      params: {
        fields: ['meta.note'],
      },
    });

    return response?.data?.data?.meta?.note ?? '';
  } catch (error) {
    console.warn(`Failed to load note for collection "expenses"`, error);
    return '';
  }
}
