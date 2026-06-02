import type { useApi } from '@directus/extensions-sdk';
import type { GetSettingsOptions, GetSettingsResult, SettingListItem } from '../types/settings';
import type { DirectusItemsResponse } from '../types/apiTypes';

type ApiClient = ReturnType<typeof useApi>;

export async function getSettings(
  api: ApiClient,
  options: GetSettingsOptions = {},
): Promise<GetSettingsResult> {
  const response = await api.get<DirectusItemsResponse<SettingListItem[]>>('/items/erp_settings', {
    params: {
      fields: ['id', 'key', 'settings_name', 'value', 'notes'],
      sort: options.sort ?? ['settings_name'],
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

export async function getBaseCurrency(api: ApiClient,): Promise<string> {
  const response = await api.get<DirectusItemsResponse<SettingListItem[]>>('/items/erp_settings', {
    params: {
      fields: ['value'],
      filter: {
        key: {
          _eq: 'base_currency',
        },
      },
      limit: 1,
    },
  });

  if (!response.data?.data || response.data.data.length === 0 || !response.data.data[0] || !response.data.data[0].value) {
    throw new Error('Base currency setting not found');
  }

  return response.data?.data?.[0]?.value as string;
}

export async function getCollectionInfo(): Promise<string> {
  return 'In ERP Settings, you can manage general ERP module settings, such as your company’s base country, default currency, and business location.';
}
