<template>
  <ErpLayout title="ERP - Incomes" :getInfo="() => getCollectionInfo(api)">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>

    <template #title-icon>
      <VButton class="header-icon" rounded icon secondary disabled>
        <VIcon name="input_circle" />
      </VButton>
    </template>

    <template #actions>
      <div class="header-items-indicator" aria-live="polite">
        {{ isLoading ? 'Loading...' : rangeText }}
      </div>

      <TableActions
        v-if="canRead"
        v-model="search"
        search-placeholder="Search incomes..."
        :selected-count="0"
        :disabled="isLoading || !hasLocations"
        @add="openCreate" />
    </template>

    <div class="incomes-page">
      <VProgressLinear
        indeterminate
        class="incomes-loading"
        :style="{ visibility: isLoading ? 'visible' : 'hidden' }" />

      <VNotice v-if="!canRead" type="danger" class="incomes-error">
        You do not have permissions to view incomes.
      </VNotice>

      <template v-else>
        <VNotice v-if="isError" type="danger" class="incomes-error">
          Failed to load incomes.
          <VButton @click="refresh">Retry</VButton>
        </VNotice>

        <div class="incomes-header">
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
                  Incomes are listed per location. Please choose the one you need.
                </div>
              </div>
            </div>
          </div>
        </div>

        <TableComponent
          summary="Incomes"
          :is-loading="isLoading"
          :items="incomesForTable"
          row-key="id"
          :fields="incomeFields"
          :column-overrides="incomeColumnOverrides"
          :selectable="false"
          :disabled="isLoading"
          :sort="sortModel"
          @sort-change="onSortChange"
          @row-click="(item) => item?.id && router.push('/erp/incomes/' + item.id)"
          :show-empty="!isLoading && incomesForTable.length === 0"
          empty-text="There are no incomes for the selected location yet or no locations available."
          empty-action-label="Create Income"
          :empty-action-disabled="!hasLocations"
          @empty-action="openCreate"
          empty-icon="input_circle">
          <template #cell-amount="{ value, item }">
            <span class="value">
              <template v-if="item.currencyShortName">
                {{ value }} {{ item.currencyShortName }}
              </template>
              <template v-else>
                {{ value }}
              </template>
            </span>
          </template>

          <template #cell-status="{ item }">
            <IncomeStatusPill
              :payment-due-date="item.payment_due_date"
              :payment-date="item.payment_date" />
          </template>

          <template #cell-type="{ value }">
            <span class="value">
              {{
                value === 'service'
                  ? 'Service'
                  : value === 'asset'
                    ? 'Asset'
                    : value === 'other'
                      ? 'Other'
                      : value || '—'
              }}
            </span>
          </template>

          <template #cell-category="{ value }">
            <span class="value">
              {{ value || '—' }}
            </span>
          </template>

          <template #cell-payment_due_date="{ value }">
            <span class="value">
              {{ value ? new Date(value).toLocaleDateString() : '—' }}
            </span>
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
import { useIncomes } from '../../composables/useIncomes';
import type { IncomeListItem } from '../../types/incomes';
import type { WashingLocationItem } from '../../api/inventoryApi';
import { initBaseLocationSelection } from '../../utils/locationSelection';
import IncomeStatusPill from '../../components/IncomeStatusPill.vue';
import { getCollectionInfo } from '../../api/incomesApi';

const api = useApi();
const router = useRouter();

const {
  incomes,
  totalCount,
  isLoading,
  isError,
  refresh,
  page,
  itemsPerPage,
  sortBy,
  searchText,
  filter,
} = useIncomes();

const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();

const canRead = computed(() => permissionsStore.hasPermission('incomes', 'read'));

const search = computed<string>({
  get: () => searchText.value,
  set: (v) => {
    searchText.value = v;
  },
});

const washingLocations = ref<WashingLocationItem[]>([]);
const hasLocations = computed(() => washingLocations.value.length > 0);
const selectedLocation = ref<WashingLocationItem | null>(null);

  const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Incomes', to: '/erp/incomes', disabled: 'false' },
];
const locationDrawerOpen = ref(false);

const showSelectLocationEmptyState = computed(
  () => hasLocations.value && selectedLocation.value === null,
);

const incomesForTable = computed(() =>
  incomes.value.map((income: IncomeListItem & { currencyShortName?: string | null }) => {
    const currencyShortName = income.currency?.short_name ?? null;
    const categoryName = income.transaction_category?.name ?? null;

    return {
      id: income.id,
      amount: income.amount,
      type: income.income_type ?? null,
      category: categoryName,
      payment_due_date: income.payment_due_date ?? null,
      payment_date: income.payment_date ?? null,
      currencyShortName,
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
    console.error('Failed to load locations for incomes', error);
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

function openCreate() {
  if (selectedLocation.value) {
    router.push({
      path: '/erp/incomes/add',
      query: { location: selectedLocation.value.id },
    });
  } else {
    router.push('/erp/incomes/add');
  }
}

const incomeFields = ['amount', 'status', 'type', 'category', 'payment_due_date'] as const;

const incomeColumnOverrides = {
  amount: { width: 'minmax(160px, 1.5fr)', label: 'Amount' },
  status: { width: 'minmax(140px, 1fr)', label: 'Status' },
  type: { width: 'minmax(140px, 1fr)', label: 'Type' },
  category: { width: 'minmax(200px, 1.5fr)', label: 'Category' },
  payment_due_date: { width: 'minmax(180px, 1.5fr)', label: 'Payment due date' },
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
.incomes-page {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.incomes-error {
  flex-shrink: 0;
  margin-bottom: 16px;
}

.incomes-loading {
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

.incomes-header {
  margin: 0 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.location-section {
  width: 100%;
  max-inline-size: calc(var(--form-column-max-width) * 2 + var(--theme--form--column-gap));
}

.location-row {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
</style>
