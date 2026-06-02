import type { useApi } from '@directus/extensions-sdk';
import type { DirectusItemsResponse } from '../types/apiTypes';
import { GetTransactionCategoriesOptions, GetTransactionCategoriesResult, TransactionCategoriesListItem } from '../types/transaction_categories';
import { exportCollectionItems } from '../utils/collectionDataExport';

type ApiClient = ReturnType<typeof useApi>;

const exportTransactionCategoriesFields: Record<string, string> = {
  'name': 'Name',
  'description': 'Description',
};

export async function getTransactionCategories(
  api: ApiClient,
  options: GetTransactionCategoriesOptions = {}
): Promise<GetTransactionCategoriesResult> {
  const response = await api.get<DirectusItemsResponse<TransactionCategoriesListItem[]>>(
    '/items/transaction_categories',
    {
      params: {
        fields: ['id', 'name', 'description'],
        sort: options.sort ?? ['name'],
        limit: options.limit ?? -1, 
        offset: options.offset ?? 0,
        ...(options.search ? { search: options.search } : {}),
        meta: ['total_count', 'filter_count'], 
      },
    }
  );

  return {
    data: response.data?.data ?? [],
    total: response.data?.meta?.total_count ?? 0,
  };
}

export async function exportTransactionCategories(api: ApiClient, ids: Array<string | number>): Promise<void> {
  await exportCollectionItems(api, ids, 'transaction_categories', exportTransactionCategoriesFields);
}

export async function getCollectionInfo(api: ApiClient): Promise<string> {
  try {
    const response = await api.get(`/collections/transaction_categories`, {
      params: {
        fields: ['meta.note'],
      },
    });

    return response?.data?.data?.meta?.note ?? '';
  } catch (error) {
    console.warn(`Failed to load note for collection "transaction_categories"`, error);
    return '';
  }
}
