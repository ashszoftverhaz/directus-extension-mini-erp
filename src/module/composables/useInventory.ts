import { computed, onMounted, ref } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import { getInventory, getWashingLocations } from '../api/inventoryApi';
import type { InventoryListItem } from '../types/inventory';
import type { ListFetchOptions } from '../types/list';
import { usePaginatedList } from './usePaginatedList';
import { hasAnyCategoryRunOut, isAnyCategoryRunningLow } from '../../services/inventoryService';

export function useInventory() {
  const api = useApi();
  const allItemsForRunningLow = ref<InventoryListItem[]>([]);

  const fetchInventory = async (
    apiClient: ReturnType<typeof useApi>,
    options: ListFetchOptions,
  ) => {
    const filter = options.filter ?? {};
    const loc = (filter as any).source_location ?? (filter as any).fallback_location;
    const hasLocation = loc && typeof loc === 'object' && typeof (loc as any)._eq === 'string';

    if (!hasLocation) {
      allItemsForRunningLow.value = [];
      return { data: [], total: 0 };
    }

    const result = await getInventory(apiClient, options as Parameters<typeof getInventory>[1]);
    allItemsForRunningLow.value = result.allItemsForRunningLow ?? [];
    return { data: result.data, total: result.total };
  };

  const {
    items: inventoryItems,
    filter,
    ...rest
  } = usePaginatedList<InventoryListItem>(fetchInventory, {
    defaultSort: 'name_of_product',
    label: 'Inventory',
  });

  const washingLocations = ref<{ id: string; name: string }[]>([]);
  const hasLocations = computed(() => washingLocations.value.length > 0);
  const isRunningLow = computed(() => isAnyCategoryRunningLow(allItemsForRunningLow.value));
  const hasRunOut = computed(() => hasAnyCategoryRunOut(allItemsForRunningLow.value));

  async function loadWashingLocations(): Promise<void> {
    try {
      const result = await getWashingLocations(api);
      washingLocations.value = result;
    } catch (error) {
      console.error('Failed to load washing locations', error);
      washingLocations.value = [];
    }
  }

  onMounted(loadWashingLocations);

  return {
    inventoryItems,
    washingLocations,
    hasLocations,
    isRunningLow,
    hasRunOut,
    filter,
    loadWashingLocations,
    ...rest,
  };
}
