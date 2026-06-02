<template>
  <ErpLayout title="ERP - Assets" :getInfo="() => getCollectionInfo(api)">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>

    <template #title-icon>
      <VButton class="header-icon" rounded icon secondary disabled>
        <VIcon name="service_toolbox" />
      </VButton>
    </template>

    <template #actions>
      <div class="header-items-indicator" aria-live="polite">
        {{ isLoading ? 'Loading...' : rangeText }}
      </div>

      <TableActions
        v-if="canRead"
        v-model="search"
        search-placeholder="Search assets..."
        :selected-count="0"
        :disabled="isLoading"
        :show-add="false" />
    </template>

    <div class="assets-page">
      <VProgressLinear
        indeterminate
        class="assets-loading"
        :style="{ visibility: isLoading ? 'visible' : 'hidden' }" />

      <VNotice v-if="!canRead" type="danger" class="assets-error">
        You do not have permissions to view assets.
      </VNotice>

      <template v-else>
        <VNotice v-if="isError" type="danger" class="assets-error">
          Failed to load assets.
          <VButton @click="refresh">Retry</VButton>
        </VNotice>

        <div class="assets-header">
          <div class="location-section">
            <div class="location-row">
              <div class="location-field-wrapper">
                <label class="location-label">Location</label>
                <div
                  class="location-input"
                  :class="{ disabled: !hasLocations }"
                  role="button"
                  tabindex="0"
                  @click="openLocationDrawer"
                  @keydown.enter="openLocationDrawer"
                  @keydown.space.prevent="openLocationDrawer">
                  <span class="location-value">
                    {{
                      selectedLocation?.name ??
                      (hasLocations ? 'Select location...' : 'No locations available')
                    }}
                  </span>
                  <VIcon v-if="hasLocations" name="arrow_drop_down" class="dropdown-icon" />
                </div>
                <div class="location-note">
                  Assets are listed per location. Please choose the one you need.
                </div>
              </div>
            </div>

            <div class="buttons-row">
              <div class="action-buttons">
                <VButton
                  class="action-btn primary"
                  :disabled="!hasSelectedLocation"
                  @click="onProcurement">
                  <span>Procurement</span>
                  <VIcon name="input_circle" class="action-btn-icon" />
                </VButton>
                <VButton
                  class="action-btn primary"
                  :disabled="!hasSelectedLocation"
                  @click="onSale">
                  <span>Sale</span>
                  <VIcon name="output_circle" class="action-btn-icon" />
                </VButton>
              </div>
            </div>
          </div>
        </div>
        
        <TableComponent
          summary="Assets"
          :is-loading="isLoading"
          :items="assetsForTable"
          row-key="id"
          :fields="assetFields"
          :column-overrides="assetColumnOverrides"
          :selectable="false"
          :disabled="isLoading"
          :sort="sortModel"
          @sort-change="onSortChange"
          @row-click="(item) => item?.id && router.push('/erp/assets/' + item.id)"
          :show-empty="!isLoading && assetsForTable.length === 0"
          empty-text="There are no assets for the selected location yet or no locations available."
          empty-action-label=""
          :empty-action-disabled="true"
          empty-icon="service_toolbox">
          <template #cell-name="{ value }">
            <span class="value">{{ value ?? '-' }}</span>
          </template>

          <template #cell-code="{ value }">
            <span class="value">{{ value ?? '-' }}</span>
          </template>

          <template #cell-asset_category="{ value }">
            <span class="value">{{ value || '-' }}</span>
          </template>

          <template #cell-assignment="{ value }">
            <span class="value">
              {{
                value === 'washing_unit'
                  ? 'Washing Unit'
                  : value === 'washing_location'
                    ? 'Washing Location'
                    : value === 'employee'
                      ? 'Employee'
                      : value || '—'
              }}
            </span>
          </template>

          <template #cell-assignee="{ value }">
            <span class="value">{{ value || '-' }}</span>
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
      v-model="selectedLocation"
      :locations="washingLocations"
      @confirm="onLocationSelected" />
  </ErpLayout>
</template>

<script lang="ts" setup>
import ErpLayout from '../../layouts/ErpLayout.vue';
import { computed, onActivated, onMounted, ref, watch } from 'vue';
import { useStores, useApi } from '@directus/extensions-sdk';
import { useRouter } from 'vue-router';
import TableActions from '../../components/table/TableActions.vue';
import TableComponent from '../../components/table/TableComponent.vue';
import TableFooter from '../../components/table/TableFooter.vue';
import WashingLocationDrawer from '../../components/WashingLocationDrawer.vue';
import { DEFAULT_ROWS_PER_PAGE_OPTIONS } from '../../constants';
import { useAssets } from '../../composables/useAssets';
import type { AssetListItem } from '../../types/assets';
import type { WashingLocationItem } from '../../api/inventoryApi';
import { initBaseLocationSelection } from '../../utils/locationSelection';
import { getCollectionInfo } from '../../api/assetsApi';

const api = useApi();
const router = useRouter();

const {
  assets,
  totalCount,
  isLoading,
  isError,
  refresh,
  page,
  itemsPerPage,
  sortBy,
  searchText,
  filter,
} = useAssets();

const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();

const canRead = computed(() => permissionsStore.hasPermission('assets', 'read'));

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Assets', to: '/erp/assets', disabled: 'false' },
];

const search = computed<string>({
  get: () => searchText.value,
  set: (v) => {
    searchText.value = v;
  },
});

const washingLocations = ref<WashingLocationItem[]>([]);
const hasLocations = computed(() => washingLocations.value.length > 0);
const selectedLocation = ref<WashingLocationItem | null>(null);
const locationDrawerOpen = ref(false);
const hasSelectedLocation = computed(() => selectedLocation.value !== null);

const assetsForTable = computed(() =>
  assets.value.map((asset: AssetListItem) => {
    const categoryName = asset.asset_category?.asset_category_name ?? null;

    let assigneeDisplay: string | null = null;
    if (asset.assignment === 'employee' && asset.assignee_employee) {
      const first = asset.assignee_employee.account?.first_name ?? '';
      const last = asset.assignee_employee.account?.last_name ?? '';
      const name = `${first} ${last}`.trim();
      assigneeDisplay = name || null;
    } else if (asset.assignment === 'washing_unit' && asset.assignee_washing_unit) {
      assigneeDisplay = asset.assignee_washing_unit.name ?? null;
    } else if (asset.assignment === 'washing_location' && asset.assignee_washing_location) {
      assigneeDisplay = asset.assignee_washing_location.name ?? null;
    }

    return {
      id: asset.id,
      code: asset.code,
      name: asset.name,
      asset_category: categoryName,
      assignment: asset.assignment ?? null,
      assignee: assigneeDisplay,
    };
  }),
);

function syncLocationFilter(loc: WashingLocationItem | null) {
  if (loc) {
    filter.value = { location: { _eq: loc.id } };
  } else {
    filter.value = {};
  }
}

watch(selectedLocation, (loc) => {
  syncLocationFilter(loc);
});

async function loadWashingLocations(): Promise<void> {
  try {
    await initBaseLocationSelection(api, washingLocations, selectedLocation);
  } catch (error) {
    console.error('Failed to load locations for assets', error);
  }
}

onMounted(loadWashingLocations);

function openLocationDrawer() {
  if (hasLocations.value) locationDrawerOpen.value = true;
}

function onLocationSelected(loc: WashingLocationItem | null) {
  selectedLocation.value = loc;
}

onActivated(() => {
  syncLocationFilter(selectedLocation.value);
});

function onProcurement() {
  if (!selectedLocation.value) return;
  router.push('/erp/assets/add/' + selectedLocation.value.id);
}

function onSale() {
  if (!selectedLocation.value) return;
  router.push('/erp/assets/sale/' + selectedLocation.value.id);
}

const assetFields = ['name', 'code', 'asset_category', 'assignment', 'assignee'] as const;

const assetColumnOverrides = {
  name: { width: 'minmax(240px, 2fr)', label: 'Name' },
  code: { width: 'minmax(140px, 1fr)', label: 'Code' },
  asset_category: { width: 'minmax(200px, 1.5fr)', label: 'Type' },
  assignment: { width: 'minmax(180px, 1fr)', label: 'Assignment Type' },
  assignee: { width: 'minmax(220px, 1.5fr)', label: 'Assignee' },
};

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
.assets-page {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.assets-error {
  flex-shrink: 0;
  margin-bottom: 16px;
}

.assets-loading {
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

.assets-header {
  margin: 0 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.location-section {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-inline-size: calc(var(--form-column-max-width) * 2 + var(--theme--form--column-gap));
  gap: 16px;
}

.location-row {
  display: flex;
  flex-direction: column;
}

.location-field-wrapper {
  flex: 1;
  min-width: 280px;
}

.location-label {
  display: block;
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 600;
  font-family: var(--theme--font-family);
}

.location-input {
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

.location-input:hover:not(.disabled) {
  border-color: var(--theme--form--field--input--border-color-hover);
}

.location-input.disabled {
  cursor: default;
  opacity: 0.7;
}

.location-value {
  color: var(--theme--foreground);
  flex: 1;
}

.dropdown-icon {
  color: var(--theme--foreground-subdued);
}

.location-note {
  margin-top: 8px;
  font-size: 14px;
  font-style: italic;
  color: var(--theme--foreground-subdued);
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.action-btn :deep(.action-btn-icon) {
  margin-left: 10px;
  transform: scale(0.8);
}
</style>
