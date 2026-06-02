import type { useApi } from '@directus/extensions-sdk';
import { useStores } from '@directus/extensions-sdk';
import type {
  InventoryListItem,
  GetInventoryOptions,
  GetInventoryResult,
} from '../types/inventory';
import type { DirectusItemsResponse } from '../types/apiTypes';

type ApiClient = ReturnType<typeof useApi>;

const MATERIALS_FIELDS = [
  'id',
  'name_of_product',
  'sku',
  'package_size',
  'material_category.id',
  'material_category.material_category_name',
  'material_category.short_name',
  'material_category.minimum_value',
  'material_category.unit',
] as const;

/**
 * Resolves the selected location id from the filter
 * Prefers `source_location` (washing-based setups) and falls back to `fallback_location`
 * (setups without washing-related collections)
 */
function getLocationIdFromFilter(filter: Record<string, unknown>): string | null {
  const loc = filter['source_location'] ?? filter['fallback_location'];
  if (!loc || typeof loc !== 'object') return null;
  const eq = (loc as Record<string, unknown>)['_eq'];
  return typeof eq === 'string' ? eq : null;
}

/**
 * Fetches inventory as a summary of materials and their current quantity at a location
 * Quantity is computed from inventory_changes: sum(added_materials) - sum(removed_materials)
 * for the selected washing_location
 */
export async function getInventory(
  api: ApiClient,
  options: GetInventoryOptions = {},
): Promise<GetInventoryResult> {
  const filter = (options.filter ?? {}) as Record<string, unknown>;
  const locationId = getLocationIdFromFilter(filter);

  const response = await api.get<DirectusItemsResponse<InventoryListItem[]>>('/items/materials', {
    params: {
      fields: [...MATERIALS_FIELDS],
      sort: options.sort ?? ['name_of_product'],
      limit: -1,
      offset: 0,
      ...(options.search ? { search: options.search } : {}),
      meta: ['total_count', 'filter_count'],
    },
  });

  const materials = response.data?.data ?? [];
  const quantityByMaterialId = await aggregateQuantitiesFromChanges(api, locationId);

  const withQuantity = materials.map((m) => ({
    ...m,
    quantity: quantityByMaterialId.get(m.id) ?? 0,
  }));

  const availableOnly = withQuantity.filter((m) => (m.quantity ?? 0) > 0);
  const total = availableOnly.length;
  const limit = options.limit ?? 25;
  const offset = options.offset ?? 0;
  const data = availableOnly.slice(offset, offset + limit);

  const itemsWithHistory =
    locationId != null ? withQuantity.filter((m) => quantityByMaterialId.has(m.id)) : undefined;

  return {
    data,
    total,
    allItemsForRunningLow: itemsWithHistory,
  };
}

/**
 * Fetches inventory_changes and aggregates added_materials minus removed_materials per material_id
 * When locationId is set, only changes for that location are included
 * When locationId is null, the location filter is skipped (all changes are included);
 */
async function aggregateQuantitiesFromChanges(
  api: ApiClient,
  locationId: string | null,
): Promise<Map<string, number>> {
  const qty = new Map<string, number>();

  const params: Record<string, unknown> = {
    fields: [
      'id',
      'inventory_change_type',
      'source_location',
      'target_location',
      'fallback_location',
      'added_materials.materials_id',
      'added_materials.quantity',
      'removed_materials.materials_id',
      'removed_materials.quantity',
    ],
    limit: -1,
  };

  if (locationId !== null) {
    params.filter = JSON.stringify({
      _or: [
        { source_location: { _eq: locationId } },
        { target_location: { _eq: locationId } },
        { fallback_location: { _eq: locationId } },
      ],
    });
  }

  const response = await api.get<
    DirectusItemsResponse<
      Array<{
        id: string;
        inventory_change_type?: string | null;
        source_location?: string | { id?: string | null } | null;
        target_location?: string | { id?: string | null } | null;
        fallback_location?: string | { id?: string | null } | null;
        added_materials?: Array<{ materials_id: string | { id?: string }; quantity: number }>;
        removed_materials?: Array<{ materials_id: string | { id?: string }; quantity: number }>;
      }>
    >
  >('/items/inventory_changes', {
    params,
  });

  const changes = response.data?.data ?? [];

  for (const change of changes) {
    const type = (change as any).inventory_change_type ?? null;
    const fromId =
      normalizeRelationId((change as any).source_location) ??
      normalizeRelationId((change as any).fallback_location);
    const toId = normalizeRelationId((change as any).target_location);
    const added = change.added_materials ?? [];
    const removed = change.removed_materials ?? [];

    if (locationId === null) {
      if (type === 'handover') {
        continue;
      }

      applyAdded(qty, added);
      applyRemoved(qty, removed);
      continue;
    }

    const isSource = fromId === locationId;
    const isDestination = toId === locationId && type === 'handover';

    if (type !== 'handover' || (!isSource && !isDestination)) {
      applyAdded(qty, added);
      applyRemoved(qty, removed);
      continue;
    }

    if (isSource && isDestination) {
      continue;
    }

    if (isSource) {
      applyAdded(qty, added);
      applyRemoved(qty, removed);
    } else if (isDestination) {
      applyAdded(qty, removed);
      applyAdded(qty, added);
    }
  }

  return qty;
}

function normalizeRelationId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && 'id' in (value as any)) {
    const id = (value as any).id;
    if (typeof id === 'string') return id;
  }
  return null;
}

function applyAdded(
  qty: Map<string, number>,
  items: Array<{ materials_id: string | { id?: string }; quantity: number }>,
): void {
  for (const item of items) {
    const id =
      typeof item.materials_id === 'string'
        ? item.materials_id
        : (item.materials_id as { id?: string })?.id;
    if (!id) continue;
    qty.set(id, (qty.get(id) ?? 0) + (item.quantity ?? 0));
  }
}

function applyRemoved(
  qty: Map<string, number>,
  items: Array<{ materials_id: string | { id?: string }; quantity: number }>,
): void {
  for (const item of items) {
    const id =
      typeof item.materials_id === 'string'
        ? item.materials_id
        : (item.materials_id as { id?: string })?.id;
    if (!id) continue;
    qty.set(id, (qty.get(id) ?? 0) - (item.quantity ?? 0));
  }
}

/**
 * Fetches all materials with their current quantity at a location
 * Unlike getInventory, this does not filter out materials with zero quantity and does not apply pagination
 */
export async function getMaterialsInventoryForLocation(
  api: ApiClient,
  locationId: string | null,
): Promise<InventoryListItem[]> {
  const response = await api.get<DirectusItemsResponse<InventoryListItem[]>>('/items/materials', {
    params: {
      fields: [...MATERIALS_FIELDS],
      sort: ['name_of_product'],
      limit: -1,
      offset: 0,
      meta: ['total_count'],
    },
  });

  const materials = response.data?.data ?? [];
  const quantityByMaterialId = await aggregateQuantitiesFromChanges(api, locationId);

  return materials.map((m) => ({
    ...m,
    quantity: quantityByMaterialId.get(m.id) ?? 0,
  }));
}

export type WashingLocationItem = {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
  country?: string | null;
  postal_code?: string | null;
};

export async function getWashingLocations(api: ApiClient): Promise<WashingLocationItem[]> {
  try {
    const { useCollectionsStore } = useStores();
    const collectionsStore = useCollectionsStore();

    const hasWashingLocationCollection = collectionsStore.collections.some(
      (collection: any) => collection.collection === 'washing_location',
    );

    if (hasWashingLocationCollection) {
      const response = await api.get<{ data: WashingLocationItem[] }>('/items/washing_location', {
        params: {
          fields: ['id', 'name', 'city', 'address', 'country', 'postal_code'],
          limit: -1,
        },
      });

      return response.data?.data ?? [];
    }

    const hasFallbackLocationsCollection = collectionsStore.collections.some(
      (collection: any) => collection.collection === 'erp_locations',
    );

    if (hasFallbackLocationsCollection) {
      const response = await api.get<{ data: Array<{ id: string; name: string }> }>(
        '/items/erp_locations',
        {
          params: {
            fields: ['id', 'name'],
            limit: -1,
          },
        },
      );

      const raw = response.data?.data ?? [];

      return raw.map((loc) => ({
        id: loc.id,
        name: loc.name,
        city: null,
        address: null,
        country: null,
        postal_code: null,
      }));
    }

    console.log(
      '[ERP inventory] Neither "washing_location" nor "erp_locations" collections exist.',
    );
    return [];
  } catch (error) {
    console.error('Failed to load inventory locations', error);
    return [];
  }
}

export async function getCollectionInfo(): Promise<string> {
  return 'In Circulating Assets, you can manage all reusable or circulating assets required to deliver your services.';
}

export async function getStatisticsInfo(): Promise<string> {
  return 'In Inventory Snapshot, you can view a real-time overview of stock levels and receive alerts when materials fall below their defined minimum values.';
}
