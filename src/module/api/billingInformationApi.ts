import type { useApi } from '@directus/extensions-sdk';
import type { DirectusItemsResponse } from '../types/apiTypes';
import { BillingInformationListItem, GetBillingInformationsOptions, GetBillingInformationsResult } from '../types/billingInformations';
import { exportCollectionItems } from '../utils/collectionDataExport';

type ApiClient = ReturnType<typeof useApi>;

const exportBillingInformationsFields: Record<string, string> = {
  'country.name': 'Country',
  'postal_code': 'Postal Code',
  'city': 'City',
  'address': 'Address',
  'other': 'Other',
};

export async function getBillingInformations(
  api: ApiClient,
  options: GetBillingInformationsOptions = {}
): Promise<GetBillingInformationsResult> {
  const response = await api.get<DirectusItemsResponse<BillingInformationListItem[]>>(
    '/items/partner_billing_information',
    {
      params: {
        fields: ['id', 'country.name', 'country.iso2', 'postal_code', 'city', 'address', 'other'],
        sort: options.sort ?? ['id'],
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

export async function exportBillingInformations(api: ApiClient, ids: Array<string | number>): Promise<void> {
  await exportCollectionItems(api, ids, 'partner_billing_information', exportBillingInformationsFields);
}

export async function getCollectionInfo(api: ApiClient): Promise<string> {
  try {
    const response = await api.get(`/collections/partner_billing_information`, {
      params: {
        fields: ['meta.note'],
      },
    });

    return response?.data?.data?.meta?.note ?? '';
  } catch (error) {
    console.warn(`Failed to load note for collection "partner_billing_information"`, error);
    return '';
  }
}
