import type { useApi } from '@directus/extensions-sdk';
import type {
  MaterialCategoryListItem,
  GetMaterialCategoriesOptions,
  GetMaterialCategoriesResult,
} from '../types/materialCategories';
import type { DirectusItemsResponse } from '../types/apiTypes';
import { exportCollectionItems } from '../utils/collectionDataExport';

type ApiClient = ReturnType<typeof useApi>;

const exportMaterialCategoriesFields: Record<string, string> = {
  'material_category_name': 'Material Category Name',
  'short_name': 'Short Name',
  'minimum_value': 'Minimum Value',
  'unit': 'Unit',
};

export async function getMaterialCategories(
  api: ApiClient,
  options: GetMaterialCategoriesOptions = {},
): Promise<GetMaterialCategoriesResult> {
  const response = await api.get<DirectusItemsResponse<MaterialCategoryListItem[]>>(
    '/items/material_categories',
    {
      params: {
        fields: ['id', 'material_category_name', 'short_name', 'minimum_value', 'unit'],
        sort: options.sort ?? ['material_category_name'],
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

export async function exportMaterialCategories(api: ApiClient, ids: Array<string | number>): Promise<void> {
  await exportCollectionItems(api, ids, 'material_categories', exportMaterialCategoriesFields);
}

export async function getCollectionInfo(api: ApiClient): Promise<string> {
  try {
    const response = await api.get(`/collections/material_categories`, {
      params: {
        fields: ['meta.note'],
      },
    });

    return response?.data?.data?.meta?.note ?? '';
  } catch (error) {
    console.warn(`Failed to load note for collection "material_categories"`, error);
    return '';
  }
}
