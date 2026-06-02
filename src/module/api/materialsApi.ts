import type { useApi } from '@directus/extensions-sdk';
import type { MaterialListItem, GetMaterialsOptions, GetMaterialsResult } from '../types/materials';
import type { DirectusItemsResponse } from '../types/apiTypes';
import { exportCollectionItems } from '../utils/collectionDataExport';

type ApiClient = ReturnType<typeof useApi>;

const exportMaterialsFields: Record<string, string> = {
  'name_of_product': 'Name of Product',
  'sku': 'SKU',
  'package_size': 'Package Size',
  'brand': 'Brand',
  'material_category.material_category_name': 'Material Category',
};

export async function getMaterials(
  api: ApiClient,
  options: GetMaterialsOptions = {},
): Promise<GetMaterialsResult> {
  const response = await api.get<DirectusItemsResponse<MaterialListItem[]>>('/items/materials', {
    params: {
      fields: [
        'id',
        'name_of_product',
        'sku',
        'package_size',
        'brand',
        'material_category.id',
        'material_category.material_category_name',
        'material_category.short_name',
        'material_category.minimum_value',
      ],
      sort: options.sort ?? ['name_of_product'],
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

export async function exportMaterials(api: ApiClient, ids: Array<string | number>): Promise<void> {
  await exportCollectionItems(api, ids, 'materials', exportMaterialsFields);
}

export async function getCollectionInfo(api: ApiClient): Promise<string> {
  try {
    const response = await api.get(`/collections/materials`, {
      params: {
        fields: ['meta.note'],
      },
    });

    return response?.data?.data?.meta?.note ?? '';
  } catch (error) {
    console.warn(`Failed to load note for collection "materials"`, error);
    return '';
  }
}
