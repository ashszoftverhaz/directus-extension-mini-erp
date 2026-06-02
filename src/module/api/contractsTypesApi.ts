import type { useApi } from '@directus/extensions-sdk';
import type {
  ContractTypeListItem,
  GetContractTypesOptions,
  GetContractTypesResult,
} from '../types/contractTypes';
import type { DirectusItemsResponse } from '../types/apiTypes';
import { exportCollectionItems } from '../utils/collectionDataExport';

type ApiClient = ReturnType<typeof useApi>;

const exportContractTypesFields: Record<string, string> = {
  'contract_type': 'Contract Type',
  'description': 'Description',
};

export async function getContractTypes(
  api: ApiClient,
  options: GetContractTypesOptions = {}
): Promise<GetContractTypesResult> {
  const response = await api.get<DirectusItemsResponse<ContractTypeListItem[]>>(
    '/items/contract_types',
    {
      params: {
        fields: ['id', 'contract_type', 'description'],
        sort: options.sort ?? ['contract_type'],
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

export async function exportContractTypes(api: ApiClient, ids: Array<string | number>): Promise<void> {
  await exportCollectionItems(api, ids, 'contract_types', exportContractTypesFields);
}

export async function getCollectionInfo(api: ApiClient): Promise<string> {
  try {
    const response = await api.get(`/collections/contract_types`, {
      params: {
        fields: ['meta.note'],
      },
    });

    return response?.data?.data?.meta?.note ?? '';
  } catch (error) {
    console.warn(`Failed to load note for collection "contract_types"`, error);
    return '';
  }
}
