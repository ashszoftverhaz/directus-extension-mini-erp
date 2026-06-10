<template>
  <ErpLayout title="ERP - Inventory" :getInfo="() => getCollectionInfo()">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>

    <template #title-icon>
      <VButton class="header-icon" rounded icon secondary disabled>
        <VIcon name="inventory" />
      </VButton>
    </template>
    <template #title-actions />
    <template #actions>
      <div class="header-items-indicator" aria-live="polite">
        {{ isLoading ? 'Loading...' : rangeText }}
      </div>

      <TableActions
        v-if="canRead"
        v-model="search"
        search-placeholder="Search inventory..."
        :selected-count="0"
        :disabled="isLoading || !hasLocations"
        :show-add="false" />
    </template>

    <div class="inventory-page">
      <VProgressLinear
        indeterminate
        class="inventory-loading"
        :style="{ visibility: isLoading ? 'visible' : 'hidden' }" />

      <VNotice v-if="!canRead" type="danger" class="inventory-error">
        You do not have permissions to view inventory.
      </VNotice>

      <template v-else>
        <VNotice v-if="isError" type="danger" class="inventory-error">
          Failed to load inventory.
          <VButton @click="refresh">Retry</VButton>
        </VNotice>

        <div class="inventory-header">
          <div class="washing-location-section">
            <div class="washing-location-row">
              <div class="washing-location-field-wrapper">
                <label class="washing-location-label">Washing location</label>
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
                  Only fixed washing locations can manage inventories. Please choose the one you
                  need.
                </div>
              </div>

              <VNotice v-if="showRunOutNotice" type="info" class="running-low-notice">
                <VIcon name="info" small />
                Some of your materials have completely run out.
                <button type="button" class="running-low-link" @click="onRunningLowClick">
                  Click here to see which ones.
                </button>
              </VNotice>

              <VNotice v-else-if="showRunningLowNotice" type="info" class="running-low-notice">
                <VIcon name="info" small />
                You are running low on some of your materials.
                <button type="button" class="running-low-link" @click="onRunningLowClick">
                  Click here to see which ones.
                </button>
              </VNotice>
            </div>
          </div>

          <div class="action-buttons">
            <VButton
              class="action-btn primary"
              :disabled="!hasSelectedLocation"
              @click="onProcurement">
              <span>Procurement</span>
              <VIcon name="input_circle" class="action-btn-icon" />
            </VButton>
            <VButton class="action-btn primary" :disabled="!hasSelectedLocation" @click="onUsage">
              <span>Usage</span>
              <VIcon name="output_circle" class="action-btn-icon" />
            </VButton>
            <VButton
              class="action-btn secondary"
              :disabled="!hasSelectedLocation"
              @click="onCorrection">
              <span>Correction</span>
            </VButton>
            <VButton
              class="action-btn secondary"
              :disabled="!hasSelectedLocation"
              @click="onHandover">
              <span>Handover</span>
            </VButton>
          </div>
        </div>

        <EmptyState
          v-if="showSelectLocationEmptyState"
          title="No items"
          description="Please select a location on the top of the screen."
          icon="inventory"
          action-label="Choose a location"
          wrapper-class="erp-empty-state"
          @action="openLocationDrawer" />

        <TableComponent
          v-else
          summary="Inventory"
          :is-loading="isLoading"
          :items="inventoryItemsWithUnit"
          row-key="id"
          :fields="inventoryFields"
          :column-overrides="inventoryColumnOverrides"
          :selectable="false"
          :disabled="isLoading"
          :sort="sortModel"
          @sort-change="onSortChange"
          :show-empty="!isLoading && inventoryItems.length === 0"
          empty-text="There are no available materials to show."
          empty-action-label="Create a location first"
          :empty-action-disabled="hasLocations"
          @empty-action="openWizard"
          empty-icon="inventory">
          <template #cell-name_of_product="{ value }">
            <span class="value">{{ value ?? '—' }}</span>
          </template>
          <template #cell-material_category="{ value }">
            <span class="value">{{ value?.material_category_name ?? '—' }}</span>
          </template>
          <template #cell-sku="{ value }">
            <span class="value">{{ value ?? '—' }}</span>
          </template>
          <template #cell-package_size="{ value }">
            <span class="value">{{ formatPackageSize(value) }}</span>
          </template>
          <template #cell-measurement_unit="{ value }">
            <span class="value">{{ value ?? '—' }}</span>
          </template>
          <template #cell-quantity="{ value }">
            <span class="value">{{ value != null ? value : '—' }}</span>
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
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useInventory } from '../../composables/useInventory';
import WashingLocationDrawer from '../../components/WashingLocationDrawer.vue';
import EmptyState from '../../components/EmptyState.vue';
import TableComponent from '../../components/table/TableComponent.vue';
import TableFooter from '../../components/table/TableFooter.vue';
import TableActions from '../../components/table/TableActions.vue';
import { DEFAULT_ROWS_PER_PAGE_OPTIONS } from '../../constants';
import { useStores, useApi } from '@directus/extensions-sdk';
import { getCollectionInfo, type WashingLocationItem } from '../../api/inventoryApi';
import { getBaseLocationId } from '../../utils/baseLocationPreference';

const api = useApi();

const breadcrumbs = computed(() => [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Inventory', to: '/erp/inventories', disabled: 'false' },
]);

const {
  inventoryItems,
  washingLocations,
  hasLocations,
  isRunningLow,
  hasRunOut,
  totalCount,
  isLoading,
  isError,
  refresh,
  page,
  itemsPerPage,
  sortBy,
  searchText,
  filter,
} = useInventory();

const router = useRouter();
const route = useRoute();
const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();

const canRead = computed(() => permissionsStore.hasPermission('materials', 'read'));

const selectedWashingLocation = ref<WashingLocationItem | null>(null);
const locationDrawerOpen = ref(false);

const search = computed<string>({
  get: () => searchText.value,
  set: (v) => {
    searchText.value = v;
  },
});

const showSelectLocationEmptyState = computed(
  () => hasLocations.value && selectedWashingLocation.value === null,
);

const hasSelectedLocation = computed(() => selectedWashingLocation.value !== null);

const showRunOutNotice = computed(() => !!selectedWashingLocation.value && hasRunOut.value);

const showRunningLowNotice = computed(
  () => !!selectedWashingLocation.value && isRunningLow.value && !hasRunOut.value,
);

watch(
  selectedWashingLocation,
  (loc) => {
    if (loc) {
      filter.value = { source_location: { _eq: loc.id } };
    } else {
      filter.value = {};
    }
  },
  { immediate: true },
);

watch(
  washingLocations,
  async (locs) => {
    const queryLocationId =
      typeof route.query.locationId === 'string' ? route.query.locationId : null;

    if (queryLocationId && locs && locs.length > 0) {
      const match = locs.find((loc) => loc.id === queryLocationId);
      if (match) {
        selectedWashingLocation.value = match as WashingLocationItem;
        return;
      }
    }

    if (!selectedWashingLocation.value && locs && locs.length > 0) {
      const baseLocationId = await getBaseLocationId(api);

      if (baseLocationId) {
        const match = locs.find((loc) => String(loc.id) === String(baseLocationId));
        selectedWashingLocation.value =
          (match as WashingLocationItem) ?? (locs[0] as WashingLocationItem);
      } else {
        selectedWashingLocation.value = locs[0] as WashingLocationItem;
      }
    }
  },
  { immediate: true },
);

function onLocationSelected(loc: WashingLocationItem | null) {
  selectedWashingLocation.value = loc;
}

function onProcurement() {
  if (!selectedWashingLocation.value) return;

  router.push({
    path: '/erp/inventories/procurement',
    query: {
      locationId: selectedWashingLocation.value.id,
      locationName: selectedWashingLocation.value.name,
    },
  });
}

function onUsage() {
  if (!selectedWashingLocation.value) return;

  router.push({
    path: '/erp/inventories/usage',
    query: {
      locationId: selectedWashingLocation.value.id,
      locationName: selectedWashingLocation.value.name,
    },
  });
}

function onCorrection() {
  if (!selectedWashingLocation.value) return;

  router.push({
    path: '/erp/inventories/correction',
    query: {
      locationId: selectedWashingLocation.value.id,
      locationName: selectedWashingLocation.value.name,
    },
  });
}

function openLocationDrawer() {
  if (hasLocations.value) locationDrawerOpen.value = true;
}

function onHandover() {
  if (!selectedWashingLocation.value) return;

  router.push({
    path: '/erp/inventories/handover',
    query: {
      locationId: selectedWashingLocation.value.id,
      locationName: selectedWashingLocation.value.name,
    },
  });
}

function onRunningLowClick() {
  if (!selectedWashingLocation.value) {
    router.push('/erp/inventory/statistics');
    return;
  }

  router.push({
    path: '/erp/inventory/statistics',
    query: {
      locationId: selectedWashingLocation.value.id,
      locationName: selectedWashingLocation.value.name,
    },
  });
}

const inventoryItemsWithUnit = computed(() =>
  inventoryItems.value.map((item) => ({
    ...item,
    measurement_unit: item.material_category?.unit ?? item.measurement_unit ?? '—',
  })),
);

function formatPackageSize(value: unknown): string {
  if (value == null || value === '') return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

const inventoryFields = [
  'name_of_product',
  'material_category',
  'sku',
  'package_size',
  'measurement_unit',
  'quantity',
] as const;

const inventoryColumnOverrides = {
  name_of_product: { label: 'Name of product' },
  material_category: { label: 'Material category' },
  sku: { label: 'SKU' },
  package_size: { label: 'Package size' },
  measurement_unit: { label: 'Measurement Unit' },
  quantity: { label: 'Quantity' },
};

const itemsPerPageModel = computed<number>({
  get: () => itemsPerPage.value,
  set: (v) => {
    const parsed = typeof v === 'number' ? v : Number(v);
    if (Number.isFinite(parsed) && parsed > 0) {
      itemsPerPage.value = parsed;
      page.value = 1;
    }
  },
});

function onPageChange(nextPage: number) {
  if (Number.isFinite(nextPage) && nextPage > 0) page.value = nextPage;
}

function onItemsPerPageChange(v: number) {
  itemsPerPageModel.value = v;
}

const totalPages = computed(() => Math.ceil(totalCount.value / itemsPerPage.value));

const rangeText = computed(() => {
  if (totalCount.value === 0) return '0 items';
  const start = (page.value - 1) * itemsPerPage.value + 1;
  const end = Math.min(page.value * itemsPerPage.value, totalCount.value);
  return `${start}-${end} of ${totalCount.value} items`;
});

const sortModel = computed<{ key: string; order: 'asc' | 'desc' } | null>(() => {
  const current = sortBy.value?.[0];
  if (!current?.key) return null;
  return { key: current.key, order: current.order === 'desc' ? 'desc' : 'asc' };
});

function onSortChange(next: { key: string; order: 'asc' | 'desc' }) {
  sortBy.value = [{ key: next.key, order: next.order }];
}

function openWizard() {
  router.push({
    path: '/erp',
    query: { wizard: 'open' },
  });  
}
</script>

<style scoped>
.inventory-page {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.inventory-error {
  flex-shrink: 0;
  margin-bottom: 16px;
}

.inventory-loading {
  flex-shrink: 0;
  margin-bottom: 8px;
}

.header-items-indicator {
  font-size: 15px;
  color: var(--theme--foreground-subdued);
  margin-inline-end: 8px;
  white-space: nowrap;
  align-items: center;
}

.inventory-header {
  margin: 0 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
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
  display: block;
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

.washing-location-value:empty::before {
  content: 'Select location...';
  color: var(--theme--foreground-subdued);
}

.dropdown-icon {
  color: var(--theme--foreground-subdued);
}

.washing-location-note {
  margin-top: 8px;
  font-size: 14px;
  font-style: italic;
  color: var(--theme--foreground-subdued);
}

.running-low-notice {
  flex: 0 0 auto;
  max-width: 320px;
  min-width: 200px;
}

.running-low-link {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: var(--theme--primary);
  text-decoration: underline;
  cursor: pointer;
}

.running-low-link:hover {
  text-decoration: none;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.action-btn :deep(.action-btn-icon) {
  margin-left: 10px;
  transform: scale(0.8);
}
</style>
