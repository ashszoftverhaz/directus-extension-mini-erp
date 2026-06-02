import type { useApi } from '@directus/extensions-sdk';
import type { AssetListItem, GetAssetsOptions, GetAssetsResult } from '../types/assets';
import type { DirectusItemsResponse } from '../types/apiTypes';

type ApiClient = ReturnType<typeof useApi>;

export async function getAssets(
  api: ApiClient,
  options: GetAssetsOptions = {},
): Promise<GetAssetsResult> {
  const fields: string[] = [
    'id',
    'name',
    'code',
    'asset_category.id',
    'asset_category.asset_category_name',
    'asset_category.short_name',
    'asset_category.category_type',
    'assignee_employee.id',
    'assignee_employee.account.id',
    'assignee_employee.account.first_name',
    'assignee_employee.account.last_name',
  ];

  if (options.includeWashingUnitFields) {
    fields.push('assignee_washing_unit.id', 'assignee_washing_unit.name');
  }

  if (options.includeWashingLocationFields) {
    fields.push('assignee_washing_location.id', 'assignee_washing_location.name');
  }

  if (options.includeWashingUnitFields && options.includeWashingLocationFields) {
    fields.push('assignment');
  }

  const response = await api.get<DirectusItemsResponse<AssetListItem[]>>('/items/assets', {
    params: {
      fields,
      sort: options.sort ?? ['code'],
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
    const response = await api.get(`/collections/assets`, {
      params: {
        fields: ['meta.note'],
      },
    });

    return response?.data?.data?.meta?.note ?? '';
  } catch (error) {
    console.warn(`Failed to load note for collection "assets"`, error);
    return '';
  }
}