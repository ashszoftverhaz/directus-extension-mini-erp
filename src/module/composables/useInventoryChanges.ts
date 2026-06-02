import { onMounted, ref } from 'vue';
import { getInventoryChanges } from '../api/inventoryChangesApi';
import type { InventoryChangeListItem } from '../types/inventoryChanges';
import { usePaginatedList } from './usePaginatedList';
import { useApi } from '@directus/extensions-sdk';
import { getWashingLocations } from '../api/inventoryApi';
import type { WashingLocationItem } from '../api/inventoryApi';

export function useInventoryChanges() {
  const { items: inventoryChanges, ...rest } = usePaginatedList<InventoryChangeListItem>(
    getInventoryChanges,
    {
      defaultSort: 'time_of_change',
      label: 'Inventory Changes',
      autoLoad: false,
    },
  );

  const api = useApi();
  const washingLocations = ref<WashingLocationItem[]>([]);

  async function getLocations(): Promise<void> {
    try {
      const result = await getWashingLocations(api);
      washingLocations.value = result;
    } catch (error: any) {
      console.error('Failed to load washing locations', error);
      washingLocations.value = [];
    }
  }

  onMounted(getLocations);

  return { inventoryChanges, washingLocations, ...rest };
}
