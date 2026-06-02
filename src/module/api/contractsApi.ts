import type { useApi } from '@directus/extensions-sdk';
import type { ContractListItem, GetContractsOptions, GetContractsResult } from '../types/contracts';
import type { DirectusItemsResponse } from '../types/apiTypes';
import { exportCollectionItems } from '../utils/collectionDataExport';

type ApiClient = ReturnType<typeof useApi>;

const exportContractsFields: Record<string, string> = {
  'contract_id': 'Contract ID',
  'status': 'Status',
  'signed_at': 'Signed At',
  'expiry_date': 'Expiry Date',
  'contract_type.contract_type': 'Contract Type',
  'other_party_type': 'Other Party Type',
  'employee.account.first_name': 'Employee\'s First Name',
  'employee.account.last_name': 'Employee\'s Last Name',
  'partner.name': 'Partner Name',
  'notes': 'Notes'
};

export async function getContracts(
  api: ApiClient,
  options: GetContractsOptions = {},
): Promise<GetContractsResult> {
  const response = await api.get<DirectusItemsResponse<ContractListItem[]>>('/items/contracts', {
    params: {
      fields: [
        'id',
        'contract_id',
        'status',
        'signed_at',
        'contract_type.contract_type',
        'other_party_type',
        'employee.account.first_name',
        'employee.account.last_name',
        'partner.name ',
      ],
      sort: options.sort ?? ['contract_id'],
      limit: options.limit ?? -1,
      offset: options.offset ?? 0,
      ...(options.search ? { search: options.search } : {}),
      meta: ['total_count', 'filter_count'],
    },
  });

  return {
    data: response.data?.data ?? [],
    total: response.data?.meta?.total_count ?? 0,
  };
}

export async function exportContracts(api: ApiClient, ids: Array<string | number>): Promise<void> {
  await exportCollectionItems(api, ids, 'contracts', exportContractsFields);
}

export async function getCollectionInfo(api: ApiClient): Promise<string> {
  try {
    const response = await api.get(`/collections/contracts`, {
      params: {
        fields: ['meta.note'],
      },
    });

    return response?.data?.data?.meta?.note ?? '';
  } catch (error) {
    console.warn(`Failed to load note for collection "contracts"`, error);
    return '';
  }
}
