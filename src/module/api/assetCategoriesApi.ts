import type { useApi } from '@directus/extensions-sdk';
import type {
  AssetCategoryListItem,
  GetAssetCategoriesOptions,
  GetAssetCategoriesResult,
} from '../types/assetCategories';
import type { DirectusItemsResponse } from '../types/apiTypes';
import { exportCollectionItems } from '../utils/collectionDataExport';

type ApiClient = ReturnType<typeof useApi>;

const exportAssetCategoriesFields: Record<string, string> = {
  'asset_category_name': 'Asset Category Name',
  'notes': 'Notes',
  'short_name': 'Short Name',
  'category_type': 'Category Type',
};

export async function getAssetCategories(
  api: ApiClient,
  options: GetAssetCategoriesOptions = {},
): Promise<GetAssetCategoriesResult> {
  const response = await api.get<DirectusItemsResponse<AssetCategoryListItem[]>>(
    '/items/asset_categories',
    {
      params: {
        fields: ['id', 'asset_category_name', 'notes', 'short_name', 'category_type'],
        sort: options.sort ?? ['asset_category_name'],
        limit: options.limit ?? -1,
        offset: options.offset ?? 0,
        ...(options.search ? { search: options.search } : {}),
        meta: ['total_count', 'filter_count'],
      },
    },
  );

  const data = response.data?.data ?? [];
  const total = response.data?.meta?.total_count ?? 0;

  return {
    data,
    total,
  };
}

export async function exportAssetCategories(api: ApiClient, ids: Array<string | number>): Promise<void> {
  await exportCollectionItems(api, ids, 'asset_categories', exportAssetCategoriesFields);
}

export async function getCollectionInfo(api: ApiClient): Promise<string> {
  try {
    const response = await api.get(`/collections/asset_categories`, {
      params: {
        fields: ['meta.note'],
      },
    });

    return response?.data?.data?.meta?.note ?? '';
  } catch (error) {
    console.warn(`Failed to load note for collection "asset_categories"`, error);
    return '';
  }
}
