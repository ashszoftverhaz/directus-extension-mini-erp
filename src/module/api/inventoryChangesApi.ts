import { useApi, useStores } from '@directus/extensions-sdk';
import type {
  InventoryChangeListItem,
  GetInventoryChangesOptions,
  GetInventoryChangesResult,
} from '../types/inventoryChanges';
import type { DirectusItemsResponse } from '../types/apiTypes';

type ApiClient = ReturnType<typeof useApi>;

export async function getInventoryChanges(
  api: ApiClient,
  options: GetInventoryChangesOptions = {},
): Promise<GetInventoryChangesResult> {
  const response = await api.get<DirectusItemsResponse<InventoryChangeListItem[]>>(
    '/items/inventory_changes',
    {
      params: {
        fields: [
          'id',
          'time_of_change',
          'inventory_change_type',
          'source_location.name',
          'target_location.name',
          'fallback_location.name',
          'made_by.first_name',
          'made_by.last_name',
          'partner.name',
          'washing_unit.name',
          'added_materials.*',
          'removed_materials.*',
        ],
        sort: options.sort ?? ['time_of_change'],
        limit: options.limit ?? -1,
        offset: options.offset ?? 0,
        ...(options.search ? { search: options.search } : {}),
        ...(options.filter ? { filter: options.filter } : {}),
        meta: ['total_count', 'filter_count'],
      },
    },
  );

  return {
    data: response.data?.data ?? [],
    total: response.data?.meta?.total_count ?? 0,
  };
}

export async function getWashingLocations(): Promise<Array<{ id: string; name: string }>> {
  try {
    const stores = useStores();
    const collectionsStore = stores.useCollectionsStore();
    const hasWashingLocationCollection = collectionsStore.collections.some(
      (collection: any) => collection.collection === 'washing_location',
    );
    if (!hasWashingLocationCollection) {
      console.log(
        'Washing location collection does not exist. Skipping loading washing locations.',
      );
      return [];
    }

    const directusApi = useApi();
    const response = await directusApi.get<
      DirectusItemsResponse<Array<{ id: string; name: string }>>
    >('/items/washing_location?fields=id,name');
    return response.data?.data ?? [];
  } catch (error: any) {
    console.error('Failed to load washing locations', error);
    return [];
  }
}

export async function getCollectionInfo(api: ApiClient): Promise<string> {
  try {
    const response = await api.get(`/collections/inventory_changes`, {
      params: {
        fields: ['meta.note'],
      },
    });

    return response?.data?.data?.meta?.note ?? '';
  } catch (error) {
    console.warn(`Failed to load note for collection "inventory_changes"`, error);
    return '';
  }
}
