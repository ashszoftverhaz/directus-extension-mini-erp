import type { useApi } from '@directus/extensions-sdk';
import type {
  AccountListItem,
  GetAccountsOptions,
  GetAccountsResult,
} from '../types/accounts';
import type { DirectusItemsResponse } from '../types/apiTypes';
import { exportCollectionItems } from '../utils/collectionDataExport';

type ApiClient = ReturnType<typeof useApi>;

const exportAccountFields: Record<string, string> = {
  'account_name': 'Name',
  'payment_method': 'Payment Method',
  'notes': 'Notes'
};

export async function getAccounts(
  api: ApiClient,
  options: GetAccountsOptions = {}
): Promise<GetAccountsResult> {
  const response = await api.get<DirectusItemsResponse<AccountListItem[]>>(
    '/items/accounts',
    {
      params: {
        fields: ['id', 'account_name', 'payment_method', 'notes'],
        sort: options.sort ?? ['account_name'],
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

export async function exportAccounts(api: ApiClient, ids: Array<string | number>): Promise<void> {
  await exportCollectionItems(api, ids, 'accounts', exportAccountFields);
}

export async function getCollectionInfo(api: ApiClient): Promise<string> {
  try {
    const response = await api.get(`/collections/accounts`, {
      params: {
        fields: ['meta.note'],
      },
    });

    return response?.data?.data?.meta?.note ?? '';
  } catch (error) {
    console.warn(`Failed to load note for collection "accounts"`, error);
    return '';
  }
}
