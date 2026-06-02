import type { Ref } from 'vue';
import type { useApi } from '@directus/extensions-sdk';
import type { WashingLocationItem } from '../api/inventoryApi';
import { getWashingLocations } from '../api/inventoryApi';
import { getBaseLocationId } from './baseLocationPreference';

type ApiClient = ReturnType<typeof useApi>;

/**
 * Shared helper to load washing locations and initialize the selected location
 * based on the current Base location setting (with safe fallback to the first
 * available location).
 *
 * Used by simple location-filtered pages (expenses, incomes, assets).
 */
export async function initBaseLocationSelection(
  api: ApiClient,
  washingLocations: Ref<WashingLocationItem[]>,
  selectedLocation: Ref<WashingLocationItem | null>,
): Promise<void> {
  const locations = await getWashingLocations(api);
  washingLocations.value = locations;

  if (!locations.length) {
    return;
  }

  const baseLocationId = await getBaseLocationId(api);

  if (!selectedLocation.value) {
    if (baseLocationId) {
      const match = locations.find((loc) => String(loc.id) === String(baseLocationId));
      selectedLocation.value =
        (match as WashingLocationItem) ?? (locations[0] as WashingLocationItem);
    } else {
      selectedLocation.value = locations[0] as WashingLocationItem;
    }
  }
}
