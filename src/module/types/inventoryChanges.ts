export type InventoryChangesDto = {
  id: string;
  time_of_change: Date;
  inventory_change_type: string;
  source_location?: { name: string } | null;
  target_location?: { name: string } | null;
  fallback_location?: { name: string } | null;
  made_by: { first_name: string; last_name: string };
  partner?: { name: string } | null;
  washing_unit?: { name: string } | null;
  added_materials?: Array<{ materials_id: { name_of_product: string }; quantity: number }>;
  removed_materials?: Array<{ materials_id: { name_of_product: string }; quantity: number }>;
};

export type InventoryChangeListItem = InventoryChangesDto;

import type { ListFetchOptions, ListFetchResult } from './list';

export type GetInventoryChangesOptions = ListFetchOptions;
export type GetInventoryChangesResult = ListFetchResult<InventoryChangeListItem>;
