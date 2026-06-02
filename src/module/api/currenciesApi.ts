import type { useApi } from '@directus/extensions-sdk';
import type {
  CurrencyListItem,
  GetCurrenciesOptions,
  GetCurrenciesResult,
} from '../types/currencies';
import type { DirectusItemsResponse } from '../types/apiTypes';

type ApiClient = ReturnType<typeof useApi>;

export async function getCurrencies(
  api: ApiClient,
  options: GetCurrenciesOptions = {}
): Promise<GetCurrenciesResult> {
  const response = await api.get<DirectusItemsResponse<CurrencyListItem[]>>(
    '/items/currencies',
    {
      params: {
        fields: ['id', 'name', 'symbol', 'short_name', 'is_active'],
        sort: options.sort ?? ['name'], // Use provided sort or default to name
        limit: options.limit ?? -1, // -1 = no limit
        offset: options.offset ?? 0,
        ...(options.search ? { search: options.search } : {}),
        meta: ['total_count', 'filter_count'], // Request pagination metadata
      },
    }
  );

  return {
    data: response.data?.data ?? [],
    total: response.data?.meta?.total_count ?? 0,
  };
}

export async function getCurrencyCode(
  api: ApiClient,
  currencyId: string
): Promise<string> {
  const response = await api.get<DirectusItemsResponse<CurrencyListItem[]>>(
    '/items/currencies',
    {
      params: {
        fields: ['short_name'],
        filter: {
          id: {
            _eq: currencyId,
          },
        },
        limit: 1,
      },
    }
  );

  if (!response.data?.data || response.data.data.length === 0 || !response.data.data[0] || !response.data.data[0].short_name) {
    throw new Error(`Currency with ID ${currencyId} not found`);
  }

  return response.data.data[0].short_name;
}

export async function getCollectionInfo(api: ApiClient): Promise<string> {
  try {
    const response = await api.get(`/collections/currencies`, {
      params: {
        fields: ['meta.note'],
      },
    });

    return response?.data?.data?.meta?.note ?? '';
  } catch (error) {
    console.warn(`Failed to load note for collection "currencies"`, error);
    return '';
  }
}
