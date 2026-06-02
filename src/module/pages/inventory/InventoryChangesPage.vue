<template>
  <ErpLayout title="ERP - Inventory changes" :getInfo="() => getCollectionInfo(api)">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>

    <template #title-icon>
      <VButton class="header-icon" rounded icon secondary disabled>
        <VIcon name="inventory" />
      </VButton>
    </template>
    <template #title-actions> </template>
    <template #actions>
      <div class="header-items-indicator" aria-live="polite">
        {{ isLoading ? 'Loading...' : rangeText }}
      </div>

      <TableActions
        v-if="canRead"
        v-model="search"
        search-placeholder="Search inventory changes..."
        :selected-count="0"
        :disabled="isLoading"
        :show-add="false" />
    </template>
    <div class="inventory-changes-page">
      <VProgressLinear
        indeterminate
        class="inventory-changes-loading"
        :style="{ visibility: isLoading ? 'visible' : 'hidden' }" />

      <VNotice v-if="!canRead" type="danger" class="inventory-changes-error">
        You do not have permissions to view inventory changes.
      </VNotice>

      <template v-else>
        <VNotice v-if="isError" type="danger" class="inventory-changes-error">
          Failed to load inventory changes.
          <VButton @click="refresh">Retry</VButton>
        </VNotice>
        <div class="inventory-changes-header">
          <div class="washing-location-row">
            <div class="washing-location-field-wrapper">
              <label class="washing-location-label">From (location)</label>
              <div
                class="washing-location-input"
                :class="{ disabled: !hasLocations }"
                role="button"
                tabindex="0"
                @click="openLocationDrawer"
                @keydown.enter="openLocationDrawer"
                @keydown.space.prevent="openLocationDrawer">
                <span class="washing-location-value">
                  {{
                    selectedWashingLocation?.name ??
                    (hasLocations ? 'Select location...' : 'No locations available')
                  }}
                </span>
                <VIcon v-if="hasLocations" name="arrow_drop_down" class="dropdown-icon" />
              </div>
              <div class="washing-location-note">
                Only fixed washing locations can manage inventories. Please choose the one you need.
              </div>
            </div>

            <VNotice type="info" class="view-only-notice">
              You can only manage changes from Inventory
              <button type="button" class="inventory-link" @click="goToInventoryWithLocation">
                Click here
              </button>
              to go to Inventory.
            </VNotice>
          </div>
        </div>

        <TableComponent
          summary="Inventory Changes"
          :is-loading="isLoading"
          :items="inventoryChangesWithOtherParty"
          row-key="id"
          :fields="inventoryChangeFields"
          :column-overrides="inventoryChangeColumnOverrides"
          :selectable="false"
          :disabled="isLoading"
          :sort="sortModel"
          @sort-change="onSortChange"
          @row-click="(row) => openEdit(row.id)"
          :show-empty="!isLoading && inventoryChanges.length === 0"
          empty-text="There are no inventory changes in this collection yet."
          empty-action-label=""
          :empty-action-disabled="true">
          <template #cell-time_of_change="{ value }">
            <span class="value">{{ formatInventoryChangeTime(value) }}</span>
          </template>
          <template #cell-inventory_change_type="{ value }">
            <span class="value">{{ formatInventoryChangeType(value) }}</span>
          </template>
          <template #cell-other_party="{ value }">
            <span class="value">{{ value || '---' }}</span>
          </template>
          <template #cell-source_location="{ value }">
            <span class="value">{{ value?.name ?? 'No location' }}</span>
          </template>
          <template #cell-made_by="{ value }">
            <span class="value">{{ `${value.first_name ?? ''} ${value.last_name ?? ''}` }}</span>
          </template>

          <template #footer>
            <TableFooter
              :page="page"
              :total-pages="totalPages"
              :items-per-page="itemsPerPageModel"
              :rows-per-page-options="DEFAULT_ROWS_PER_PAGE_OPTIONS"
              rows-per-page-label="Per Page"
              :disabled="isLoading"
              @update:page="onPageChange"
              @update:itemsPerPage="onItemsPerPageChange" />
          </template>
        </TableComponent>
      </template>
    </div>

    <WashingLocationDrawer
      v-model:open="locationDrawerOpen"
      v-model="selectedWashingLocation"
      :locations="washingLocations"
      @confirm="onLocationSelected" />
  </ErpLayout>
</template>

<script lang="ts" setup>
import ErpLayout from '../../layouts/ErpLayout.vue';
import { computed, onActivated, ref, watch } from 'vue';
import { useInventoryChanges } from '../../composables/useInventoryChanges';
import { useRouter } from 'vue-router';
import TableComponent from '../../components/table/TableComponent.vue';
import TableFooter from '../../components/table/TableFooter.vue';
import TableActions from '../../components/table/TableActions.vue';
import { DEFAULT_ROWS_PER_PAGE_OPTIONS } from '../../constants';
import { InventoryChangeListItem } from '../../types/inventoryChanges';
import { useStores, useApi } from '@directus/extensions-sdk';
import WashingLocationDrawer from '../../components/WashingLocationDrawer.vue';
import type { WashingLocationItem } from '../../api/inventoryApi';
import {
  formatInventoryChangeTime,
  formatInventoryChangeType,
} from '../../../services/inventoryService';
import { getBaseLocationId } from '../../utils/baseLocationPreference';
import { getCollectionInfo } from '../../api/inventoryChangesApi';

const api = useApi();

const breadcrumbs = computed(() => [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Inventory', to: '/erp/inventories', disabled: 'false' },
  { name: 'Changes', to: '/erp/inventory-changes', disabled: 'false' },
]);

const {
  inventoryChanges,
  washingLocations,
  totalCount,
  isLoading,
  isError,
  refresh,
  page,
  itemsPerPage,
  sortBy,
  searchText,
  filter,
} = useInventoryChanges();

const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();

const canRead = computed(() => permissionsStore.hasPermission('inventory_changes', 'read'));
const router = useRouter();

const search = computed<string>({
  get() {
    return searchText.value;
  },
  set(value: string) {
    searchText.value = value;
  },
});

sortBy.value = [{ key: 'time_of_change', order: 'desc' }];

const selectedWashingLocation = ref<WashingLocationItem | null>(null);
const hasLocations = computed(() => washingLocations.value.length > 0);
const locationDrawerOpen = ref(false);

function syncLocationFilter(loc: WashingLocationItem | null) {
  if (loc) {
    filter.value = {
      _or: [
        { source_location: { _eq: loc.id } },
        { target_location: { _eq: loc.id } },
        { fallback_location: { _eq: loc.id } },
      ],
    };
  } else {
    filter.value = {};
  }
}

watch(selectedWashingLocation, (loc) => {
  syncLocationFilter(loc);
});

watch(
  washingLocations,
  async (locations) => {
    if (!selectedWashingLocation.value && locations && locations.length > 0) {
      const baseLocationId = await getBaseLocationId(api);

      if (baseLocationId) {
        const match = locations.find((loc) => String(loc.id) === String(baseLocationId));
        selectedWashingLocation.value =
          (match as WashingLocationItem) ?? (locations[0] as WashingLocationItem);
      } else {
        selectedWashingLocation.value = locations[0] as WashingLocationItem;
      }
    }
  },
  { immediate: true },
);

function openLocationDrawer() {
  if (hasLocations.value) locationDrawerOpen.value = true;
}

function onLocationSelected(loc: WashingLocationItem | null) {
  selectedWashingLocation.value = loc;
}

onActivated(() => {
  syncLocationFilter(selectedWashingLocation.value);
});

function goToInventoryWithLocation() {
  if (!selectedWashingLocation.value) {
    router.push('/erp/inventories');
    return;
  }

  router.push({
    path: '/erp/inventories',
    query: {
      locationId: selectedWashingLocation.value.id,
      locationName: selectedWashingLocation.value.name,
    },
  });
}

function openEdit(id: string | number) {
  router.push(`/erp/inventory-changes/${id}`);
}

const itemsPerPageModel = computed<number>({
  get() {
    return itemsPerPage.value;
  },
  set(nextItemsPerPageValue: any) {
    const parsedItemsPerPage =
      typeof nextItemsPerPageValue === 'number'
        ? nextItemsPerPageValue
        : typeof nextItemsPerPageValue === 'string'
          ? Number(nextItemsPerPageValue)
          : Number(nextItemsPerPageValue?.value ?? nextItemsPerPageValue);

    if (!Number.isFinite(parsedItemsPerPage) || parsedItemsPerPage <= 0) return;
    itemsPerPage.value = parsedItemsPerPage;
    page.value = 1;
  },
});

function onPageChange(nextPage: number) {
  if (!Number.isFinite(nextPage) || nextPage <= 0) return;
  page.value = nextPage;
}

function onItemsPerPageChange(nextItemsPerPageValue: number) {
  itemsPerPageModel.value = nextItemsPerPageValue;
}

const inventoryChangeFields = [
  'time_of_change',
  'inventory_change_type',
  'other_party',
  'source_location',
  'made_by',
] as const;
const inventoryChangeColumnOverrides = {
  other_party: { label: 'Other party / To' },
  source_location: { label: 'From (location)' },
} as const;

const inventoryChangesWithOtherParty = computed<
  (InventoryChangeListItem & { other_party: string })[]
>(() =>
  inventoryChanges.value.map((change) => {
    let fromLocation = change.source_location ?? change.fallback_location ?? null;
    let other_party = '';
    if (change.inventory_change_type === 'handover') {
      if (change.target_location && change.target_location !== null) {
        other_party = `Handover to ${change.target_location.name}`;
      } else if (change.washing_unit && change.washing_unit !== null) {
        other_party = `Handover to unit ${change.washing_unit.name}`;
      } else {
        other_party = 'Handover';
      }
    } else if (change.partner && change.partner !== null) {
      other_party = change.partner.name;
    } else if (change.washing_unit && change.washing_unit !== null) {
      other_party = change.washing_unit.name;
    } else {
      other_party = '';
    }

    if (!fromLocation) {
      fromLocation = { name: 'No location' };
    }

    const result: InventoryChangeListItem & { other_party: string } = {
      ...change,
      source_location: fromLocation,
      other_party,
    };

    return result;
  }),
);

const totalPages = computed(() => {
  return Math.ceil(totalCount.value / itemsPerPage.value);
});
const rangeText = computed(() => {
  if (totalCount.value === 0) return '0 items';

  const start = (page.value - 1) * itemsPerPage.value + 1;
  const rangeEnd = Math.min(page.value * itemsPerPage.value, totalCount.value);

  return `${start}-${rangeEnd} of ${totalCount.value} items`;
});

const sortModel = computed<{ key: string; order: 'asc' | 'desc' } | null>(() => {
  const current = sortBy.value?.[0];
  if (!current?.key) return null;
  const order = current.order === 'desc' ? 'desc' : 'asc';
  return { key: current.key, order };
});

function onSortChange(nextSort: { key: string; order: 'asc' | 'desc' }) {
  sortBy.value = [{ key: nextSort.key, order: nextSort.order }];
}
</script>

<style scoped>
.inventory-changes-page {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.inventory-changes-error {
  flex-shrink: 0;
  margin-bottom: 16px;
}

.inventory-changes-loading {
  flex-shrink: 0;
  margin-bottom: 8px;
}

.inventory-changes-header {
  margin: 0 32px 24px;
}

.washing-location-row {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
}

.washing-location-field-wrapper {
  flex: 1;
  min-width: 280px;
}

.washing-location-label {
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 600;
  font-family: var(--theme--font-family);
}

.washing-location-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
  border-radius: var(--theme--border-radius);
  background-color: var(--theme--background-input);
  cursor: pointer;
  transition: border-color 160ms ease;
}

.washing-location-input:hover:not(.disabled) {
  border-color: var(--theme--form--field--input--border-color-hover);
}

.washing-location-input.disabled {
  cursor: default;
  opacity: 0.7;
}

.washing-location-value {
  color: var(--theme--foreground);
  flex: 1;
}

.dropdown-icon {
  color: var(--theme--foreground-subdued);
}

.washing-location-note {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 400;
  font-style: italic;
  font-family: var(--theme--font-family);
  color: var(--theme--foreground-subdued);
}

.inventory-link {
  background: none;
  border: none;
  padding: 0 4px 0 0;
  font: inherit;
  color: var(--theme--primary);
  text-decoration: underline;
  cursor: pointer;
}

.inventory-link:disabled {
  opacity: 0.5;
  cursor: default;
}

.inventory-link:not(:disabled):hover {
  text-decoration: none;
}

.view-only-notice {
  flex: 0 0 auto;
  max-width: 320px;
  min-width: 200px;
}

.header-items-indicator {
  font-size: 15px;
  color: var(--theme--foreground-subdued);
  margin-inline-end: 8px;
  white-space: nowrap;
  align-items: center;
}

.action-delete:hover :deep(.button),
.action-delete:focus-within :deep(.button) {
  background-color: var(--theme--danger);
  color: #fff;
}
</style>
