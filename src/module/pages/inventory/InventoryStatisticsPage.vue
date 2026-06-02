<template>
  <ErpLayout title="ERP - Statistics" :getInfo="() => getStatisticsInfo()">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>

    <template #title-icon>
      <VButton class="header-icon" rounded icon secondary disabled>
        <VIcon name="inventory" />
      </VButton>
    </template>

    <div class="inventory-statistics-page">
      <VProgressLinear
        indeterminate
        class="statistics-loading"
        :style="{ visibility: isLoading ? 'visible' : 'hidden' }" />

      <VNotice v-if="!canReadMaterials" type="danger" class="statistics-error">
        You do not have permissions to view inventory.
      </VNotice>

      <template v-else>
        <VNotice v-if="loadError" type="danger" class="statistics-error">
          Failed to load statistics.
          <VButton @click="reloadCurrentLocation">Retry</VButton>
        </VNotice>

        <div class="statistics-header">
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

            <VNotice type="info" class="statistics-procurement-notice">
              <div class="statistics-procurement-content">
                <div class="statistics-procurement-text">
                  Start procurement for materials that are scarce.
                </div>
                <VButton
                  class="statistics-procurement-button"
                  :disabled="!canStartProcurement"
                  @click="startProcurementForSelectedLocation">
                  <VIcon name="input_circle" />
                  <span>Procurement</span>
                </VButton>
              </div>
            </VNotice>
          </div>
        </div>

        <EmptyState
          v-if="showSelectLocationEmptyState"
          title="No statistics"
          description="Please select a location on the top of the screen."
          icon="inventory"
          action-label="Choose a location"
          wrapper-class="erp-empty-state"
          @action="openLocationDrawer" />

        <section v-else class="material-categories-section">
          <header class="material-categories-header">
            <h2 class="material-categories-title">Material categories</h2>
          </header>

          <VNotice
            v-if="!isLoading && !hasAnyCategoryStatistics"
            type="info"
            class="statistics-info">
            There are no material categories with minimum values for this location.
          </VNotice>

          <div v-else class="material-category-list">
            <article
              v-for="stat in categoryStatistics"
              :key="stat.categoryId"
              class="material-category-row"
              :class="getShortageRowClass(stat)">
              <div class="material-category-main">
                <div class="material-category-text">
                  <div class="material-category-name">{{ stat.categoryName }}</div>
                  <div v-if="stat.hasShortage" class="material-category-shortage">
                    {{ getShortageLabel(stat) }}
                  </div>
                </div>

                <div class="material-category-status">
                  <div class="material-category-status-top">
                    <div class="percentage-bar">
                      <template v-if="hasSurplus(stat)">
                        <div
                          class="percentage-bar-base"
                          :style="{ width: `${getBaseWidthPercent(stat.percentageOfMinimum)}%` }" />
                        <div
                          class="percentage-bar-surplus"
                          :style="{
                            width: `${getSurplusWidthPercent(stat.percentageOfMinimum)}%`,
                            left: `${getBaseWidthPercent(stat.percentageOfMinimum)}%`,
                          }" />
                        <div
                          class="percentage-bar-threshold"
                          :style="{ left: `${getBaseWidthPercent(stat.percentageOfMinimum)}%` }" />
                      </template>
                      <div
                        v-else
                        class="percentage-bar-fill"
                        :class="getShortageBarClass(stat)"
                        :style="{ width: getShortageWidth(stat.percentageOfMinimum) }" />
                      <div
                        class="percentage-bar-label"
                        :class="{ 'percentage-bar-label-out': isOutSeverity(stat) }">
                        {{ formatPercentage(stat.percentageOfMinimum) }}
                      </div>
                    </div>
                  </div>

                  <div class="material-category-summary">
                    {{ formatSummary(stat) }}
                  </div>
                </div>
                <VButton
                  v-if="stat.hasShortage"
                  class="material-category-procurement-btn"
                  icon
                  rounded
                  :disabled="!canStartProcurement"
                  @click="startProcurementForSelectedLocation">
                  <VIcon name="input_circle" />
                </VButton>
              </div>
            </article>
          </div>
        </section>
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
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStores, useApi } from '@directus/extensions-sdk';
import ErpLayout from '../../layouts/ErpLayout.vue';
import EmptyState from '../../components/EmptyState.vue';
import WashingLocationDrawer from '../../components/WashingLocationDrawer.vue';
import type { WashingLocationItem } from '../../api/inventoryApi';
import { getMaterialsInventoryForLocation, getStatisticsInfo, getWashingLocations } from '../../api/inventoryApi';
import { getBaseLocationId } from '../../utils/baseLocationPreference';
import {
  computeMaterialCategoryStatistics,
  formatCategoryStatisticSummary,
  getBaseWidthPercent,
  getShortageSeverity,
  getShortageWidth,
  getSurplusWidthPercent,
  hasSurplus,
  type MaterialCategoryStatistic,
} from '../../../services/inventoryStatisticsHelpers';

const api = useApi();
const route = useRoute();
const router = useRouter();

const breadcrumbs = computed(() => [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Inventory', to: '/erp/inventories', disabled: 'false' },
  { name: 'Statistics', to: '/erp/inventory/statistics', disabled: 'false' },
]);

const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();

const canReadMaterials = computed(() => permissionsStore.hasPermission('materials', 'read'));

const washingLocations = ref<WashingLocationItem[]>([]);
const hasLocations = computed(() => washingLocations.value.length > 0);
const selectedWashingLocation = ref<WashingLocationItem | null>(null);
const locationDrawerOpen = ref(false);

const categoryStatistics = ref<MaterialCategoryStatistic[]>([]);
const isLoading = ref(false);
const loadError = ref(false);

const canStartProcurement = computed(() => !!selectedWashingLocation.value);

const showSelectLocationEmptyState = computed(
  () => hasLocations.value && selectedWashingLocation.value === null,
);

const hasAnyCategoryStatistics = computed(
  () => categoryStatistics.value.length > 0 && !loadError.value,
);

async function loadWashingLocations(): Promise<void> {
  try {
    const locations = await getWashingLocations(api);
    washingLocations.value = locations;
  } catch (error) {
    console.error('Failed to load washing locations for statistics', error);
    washingLocations.value = [];
  }
}

async function loadStatisticsForLocation(locationId: string | null): Promise<void> {
  if (!locationId) {
    categoryStatistics.value = [];
    return;
  }

  isLoading.value = true;
  loadError.value = false;

  try {
    const materials = await getMaterialsInventoryForLocation(api, locationId);
    categoryStatistics.value = computeMaterialCategoryStatistics(materials);
  } catch (error) {
    console.error('Failed to load material statistics', error);
    categoryStatistics.value = [];
    loadError.value = true;
  } finally {
    isLoading.value = false;
  }
}

function openLocationDrawer(): void {
  if (hasLocations.value) locationDrawerOpen.value = true;
}

function onLocationSelected(location: WashingLocationItem | null): void {
  selectedWashingLocation.value = location;
}

function reloadCurrentLocation(): void {
  const currentId = selectedWashingLocation.value?.id ?? null;
  void loadStatisticsForLocation(currentId);
}

function formatPercentage(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0%';
  return `${Math.round(value)}%`;
}

function getShortageRowClass(stat: MaterialCategoryStatistic): string | null {
  const severity = getShortageSeverity(stat);
  return severity ? `shortage-${severity}` : null;
}

function getShortageBarClass(stat: MaterialCategoryStatistic): string | null {
  const severity = getShortageSeverity(stat);
  return severity ? `percentage-bar-shortage-${severity}` : null;
}

function isOutSeverity(stat: MaterialCategoryStatistic): boolean {
  return getShortageSeverity(stat) === 'out';
}

function getShortageLabel(stat: MaterialCategoryStatistic): string {
  const severity = getShortageSeverity(stat);
  if (severity === 'out') return 'OUT OF STOCK';
  return 'SHORTAGE';
}

function formatSummary(stat: MaterialCategoryStatistic): string {
  return formatCategoryStatisticSummary(stat);
}

function startProcurementForSelectedLocation(): void {
  if (!selectedWashingLocation.value) return;

  router.push({
    path: '/erp/inventories/procurement',
    query: {
      locationId: selectedWashingLocation.value.id,
      locationName: selectedWashingLocation.value.name,
      openDrawer: 'true',
    },
  });
}

watch(
  selectedWashingLocation,
  (location) => {
    const id = location?.id ?? null;
    void loadStatisticsForLocation(id);
  },
  { immediate: true },
);

watch(
  washingLocations,
  async (locations) => {
    const queryLocationId =
      typeof route.query.locationId === 'string' ? route.query.locationId : null;

    if (queryLocationId && locations && locations.length > 0) {
      const match = locations.find((loc) => loc.id === queryLocationId);
      if (match) {
        selectedWashingLocation.value = match as WashingLocationItem;
        return;
      }
    }

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

onMounted(() => {
  void loadWashingLocations();
});
</script>

<style scoped>
.inventory-statistics-page {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.statistics-loading {
  flex-shrink: 0;
  margin-bottom: 8px;
}

.statistics-error {
  flex-shrink: 0;
  margin: 16px 32px 0;
}

.statistics-header {
  margin: 0 32px 16px;
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

.dropdown-icon {
  color: var(--theme--foreground-subdued);
}

.washing-location-note {
  margin-top: 8px;
  font-size: 14px;
  font-style: italic;
  color: var(--theme--foreground-subdued);
}

.statistics-procurement-notice {
  flex: 0 0 auto;
  max-width: 320px;
  min-width: 240px;
}

.statistics-procurement-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.statistics-procurement-text {
  font-size: 14px;
}

.statistics-procurement-button {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.material-categories-section {
  margin: 22px 32px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.material-categories-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.material-categories-title {
  font-size: 18px;
  font-weight: 600;
}

.statistics-info {
  margin-top: 8px;
}

.material-category-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.material-category-row {
  border-radius: 12px;
  padding: 16px 20px;
  background: var(--theme--background-subdued);
}

.material-category-row.shortage {
  background: rgba(255, 193, 7, 0.12);
}

.material-category-main {
  display: grid;
  grid-template-columns: minmax(220px, 340px) minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px 24px;
}

.material-category-text {
  min-width: 0;
}

.material-category-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.material-category-shortage {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--theme--danger);
  margin-bottom: 6px;
}

.material-category-status {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  min-width: 0;
}

.material-category-status-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.percentage-bar {
  position: relative;
  width: 100%;
  height: 14px;
  border-radius: 999px;
  background: rgba(111, 66, 193, 0.12);
  overflow: hidden;
}

.percentage-bar-threshold {
  position: absolute;
  height: 100%;
  width: 2px;
  transform: translateX(-1px);
  background: var(--theme--background-subdued);
  pointer-events: none;
}

.percentage-bar-fill {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background: linear-gradient(90deg, #a2b5cd, #d3dae4);
}

.percentage-bar-base {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  border-radius: 999px 0 0 999px;
  background: linear-gradient(90deg, #a2b5cd, #d3dae4);
}

.percentage-bar-shortage {
  background: linear-gradient(90deg, #f9a825, #ffd54f);
}

.shortage-medium {
  background: rgba(255, 213, 79, 0.18);
}

.shortage-high {
  /* background: rgba(255, 167, 38, 0.28); */
  background: rgba(255, 213, 79, 0.18);
}

.shortage-critical {
  background: rgba(244, 67, 54, 0.18);
}

.shortage-out {
  /* background: rgba(255, 0, 0, 0.2); */
  background: rgba(244, 67, 54, 0.18);
}

.percentage-bar-shortage-medium {
  background: linear-gradient(90deg, #f9a825, #ffd54f);
}

.percentage-bar-shortage-high {
  /* background: linear-gradient(90deg, #fb8c00, #ffcc80); */
  background: linear-gradient(90deg, #f9a825, #ffd54f);
}

.percentage-bar-shortage-critical {
  background: linear-gradient(90deg, #e53935, #ff6f60);
}

.percentage-bar-shortage-out {
  /* background: linear-gradient(90deg, #b71c1c, #f44336); */
  background: linear-gradient(90deg, #e53935, #ff6f60);
}

.percentage-bar-surplus {
  position: absolute;
  height: 100%;
  border-radius: 0 999px 999px 0;
  background: linear-gradient(90deg, #81c784, #a5d6a7);
  opacity: 0.85;
  pointer-events: none;
}

.percentage-bar-label {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 8px;
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
}

.percentage-bar-label-out {
  color: var(--theme--danger);
}

.material-category-procurement-btn {
  flex-shrink: 0;
}

.material-category-summary {
  font-size: 14px;
  color: var(--theme--foreground-subdued);
}
</style>
