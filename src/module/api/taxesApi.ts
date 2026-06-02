import type { useApi } from '@directus/extensions-sdk';
import type { DirectusItemsResponse } from '../types/apiTypes';
import type { GetTaxesOptions, GetTaxesResult, TaxListItem } from '../types/taxes';
import { exportCollectionItems } from '../utils/collectionDataExport';

type ApiClient = ReturnType<typeof useApi>;

const exportTaxesFields: Record<string, string> = {
  'name': 'Name',
  'code': 'Code',
   'description': 'Description',
  'tax_type': 'Tax Type',
  'tax_value': 'Tax Value',
  'country.name': 'Country Name',
};
  
export async function getTaxes(
  api: ApiClient,
  options: GetTaxesOptions = {},
): Promise<GetTaxesResult> {
  const response = await api.get<DirectusItemsResponse<TaxListItem[]>>('/items/taxes', {
    params: {
      fields: [
        'id',
        'name',
        'code',
        'tax_type',
        'tax_value',
        'country.id',
        'country.name',
        'country.iso2',
        'country.default_currency.id',
        'country.default_currency.short_name',
        'country.default_currency.name',
      ],
      sort: options.sort ?? ['name'],
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

export async function exportTaxes(api: ApiClient, ids: Array<string | number>): Promise<void> {
  await exportCollectionItems(api, ids, 'taxes', exportTaxesFields);
}

export async function getCollectionInfo(api: ApiClient): Promise<string> {
  try {
    const response = await api.get(`/collections/taxes`, {
      params: {
        fields: ['meta.note'],
      },
    });

    return response?.data?.data?.meta?.note ?? '';
  } catch (error) {
    console.warn(`Failed to load note for collection "taxes"`, error);
    return '';
  }
}
