import type { useApi } from '@directus/extensions-sdk';
import type { DirectusItemsResponse } from '../types/apiTypes';
import type { GetIncomesOptions, GetIncomesResult, IncomeListItem } from '../types/incomes';

type ApiClient = ReturnType<typeof useApi>;

export async function getIncomes(
  api: ApiClient,
  options: GetIncomesOptions = {},
): Promise<GetIncomesResult> {
  const fields: string[] = [
    'id',
    'name',
    'amount',
    'income_type',
    'payment_due_date',
    'payment_date',
    'currency.id',
    'currency.short_name',
    'transaction_category.id',
    'transaction_category.name',
    'location.id',
    'location.name',
  ];

  const response = await api.get<DirectusItemsResponse<IncomeListItem[]>>('/items/incomes', {
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
    const response = await api.get(`/collections/incomes`, {
      params: {
        fields: ['meta.note'],
      },
    });

    return response?.data?.data?.meta?.note ?? '';
  } catch (error) {
    console.warn(`Failed to load note for collection "incomes"`, error);
    return '';
  }
}
