import type { useApi } from '@directus/extensions-sdk';
import type { DirectusItemsResponse } from '../types/apiTypes';
import { GetPartnersOptions, GetPartnersResult, PartnerListItem } from '../types/partners';
import { exportCollectionItems } from '../utils/collectionDataExport';

type ApiClient = ReturnType<typeof useApi>;

const exportPartnersFields: Record<string, string> = {
  'name': 'Name',
  'tax_number': 'Tax Number',
  'registration_number': 'Registration Number',
  'status': 'Status',
  'preferred_currency.short_name': 'Preferred Currency',
};

export async function getPartners(
  api: ApiClient,
  options: GetPartnersOptions = {}
): Promise<GetPartnersResult> {
  const response = await api.get<DirectusItemsResponse<PartnerListItem[]>>(
    '/items/partners',
    {
      params: {
        fields: ['id', 'name', 'status', 'tax_number', 'registration_number', 'preferred_currency', 'contacts.directus_users_id'],
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

export async function exportPartners(api: ApiClient, ids: Array<string | number>): Promise<void> {
  await exportCollectionItems(api, ids, 'partners', exportPartnersFields);
}

export async function getCollectionInfo(api: ApiClient): Promise<string> {
  try {
    const response = await api.get(`/collections/partners`, {
      params: {
        fields: ['meta.note'],
      },
    });

    return response?.data?.data?.meta?.note ?? '';
  } catch (error) {
    console.warn(`Failed to load note for collection "partners"`, error);
    return '';
  }
}
