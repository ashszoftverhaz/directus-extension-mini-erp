<template>
  <ErpLayout title="ERP - Transactions" :getInfo="() => getCollectionInfo()">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>

    <template #title-icon>
      <VButton class="header-icon" rounded icon secondary disabled>
        <VIcon name="payments" />
      </VButton>
    </template>

    <template #actions>
      <div class="header-items-indicator" aria-live="polite">
        {{ isLoading ? 'Loading...' : rangeText }}
      </div>

      <TableActions
        v-if="canRead"
        v-model="search"
        search-placeholder="Search transactions..."
        :selected-count="0"
        :disabled="isLoading"
        :show-add="false" />
    </template>

    <div class="transactions-page">
      <VProgressLinear
        indeterminate
        class="transactions-loading"
        :style="{ visibility: isLoading ? 'visible' : 'hidden' }" />

      <VNotice v-if="!canRead" type="danger" class="transactions-error">
        You do not have permissions to view transactions.
      </VNotice>

      <template v-else>
        <VNotice v-if="isError" type="danger" class="transactions-error">
          Failed to load transactions.
          <VButton @click="refresh">Retry</VButton>
        </VNotice>

        <div class="transactions-header">
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
                  Transactions are listed per location. Please choose the one you need.
                </div>
              </div>
            </div>

            <div class="buttons-row">
              <div class="action-buttons">
                <VButton
                  class="action-btn primary"
                  :disabled="!hasSelectedLocation"
                  @click="onCreateIncome">
                  <span>Create income</span>
                  <VIcon name="input_circle" class="action-btn-icon" />
                </VButton>
                <VButton
                  class="action-btn secondary"
                  :disabled="!hasSelectedLocation"
                  @click="onCreateExpense">
                  <span>Create expense</span>
                  <VIcon name="output_circle" class="action-btn-icon" />
                </VButton>
              </div>
            </div>
          </div>
        </div>

        <TableComponent
          summary="Transactions"
          :is-loading="isLoading"
          :items="transactionsForTable"
          row-key="id"
          :fields="transactionFields"
          :column-overrides="transactionColumnOverrides"
          :selectable="false"
          :disabled="isLoading"          
          @row-click="(row) => openEdit(row)"
          :sort="sortModel"
          @sort-change="onSortChange"
          :show-empty="!isLoading && transactionsForTable.length === 0"
          empty-text="There are no transactions for the selected location yet."
          :empty-action-disabled="true">
          <template #cell-direction="{ item }">
              <IncomeExpensePill :direction="item.direction" />
          </template>
          <template #cell-cost="{ value, item }">
            <span class="value">
              <template v-if="item.currencySymbol">
                {{ formatAmount(value) }} {{ item.currencySymbol }}
              </template>
              <template v-else>
                {{ formatAmount(value) }}
              </template>
            </span>
          </template>

          <template #cell-status="{ item }">
            <IncomeStatusPill
              :payment-due-date="item.payment_due_date"
              :payment-date="item.paid_at" />
          </template>          

          <template #cell-type="{ item }">
            {{ formatType(item.type) }}
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
import TableActions from '../../components/table/TableActions.vue';
import TableComponent from '../../components/table/TableComponent.vue';
import TableFooter from '../../components/table/TableFooter.vue';
import WashingLocationDrawer from '../../components/WashingLocationDrawer.vue';
import { DEFAULT_ROWS_PER_PAGE_OPTIONS } from '../../constants';
import type { WashingLocationItem } from '../../api/inventoryApi';
import { initBaseLocationSelection } from '../../utils/locationSelection';
import IncomeStatusPill from '../../components/IncomeStatusPill.vue';
import IncomeExpensePill from '../../components/IncomeExpensePill.vue';
import { useTransactions } from '../../composables/useTransactions';
import { TransactionListItem, TransactionTypeLabels } from '../../types/transactions';
import { useRouter } from 'vue-router';
import { getCollectionInfo } from '../../api/transactionsApi';

const api = useApi();
const router = useRouter();

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Transactions', to: '/erp/transactions', disabled: 'false' },
];

const {
  transactions,
  totalCount,
  isLoading,
  isError,
  refresh,
  page,
  itemsPerPage,
  sortBy,
  searchText,
  filter,
} = useTransactions();

const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();

const canRead = computed(() => permissionsStore.hasPermission('expenses', 'read') || permissionsStore.hasPermission('incomes', 'read'));
const hasSelectedLocation = computed(() => selectedLocation.value !== null);

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

const transactionsForTable = computed(() =>
  transactions.value.map((transaction: TransactionListItem) => {
    const currencySymbol = transaction.symbol ?? null;

    return {
      id: transaction.id,
      direction: transaction.source,
      name: transaction.name ?? '-',
      cost: transaction.amount,
      type: transaction.type ?? null,
      payment_due_date: transaction.payment_due_date ?? null,
      paid_at: transaction.paid_at ?? null,
      currencySymbol,
      account: transaction.account_name ?? null,
    };
  }),
);

const transactionFields = ['direction', 'status', 'name', 'cost', 'type', 'account'] as const;

const transactionColumnOverrides = {
  direction: { width: 'minmax(140px, 1fr)', label: 'Direction' },
  status: { width: 'minmax(140px, 1fr)', label: 'Status' },
  name: { width: 'minmax(160px, 1.5fr)', label: 'Name' },
  cost: { width: 'minmax(140px, 1fr)', label: 'Cost' },  
  type: { width: 'minmax(140px, 1fr)', label: 'Type' },
  account: { width: 'minmax(200px, 1.5fr)', label: 'Account' },  
};

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
    console.error('Failed to load locations for transactions', error);
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

function formatAmount(value: unknown): string {
  const parsedValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsedValue)) return '-';

  return Math.round(parsedValue).toLocaleString('de-AT');
}

function formatType(value: TransactionListItem['type']): string {
  if (!value) return '—';
  return TransactionTypeLabels[value as keyof typeof TransactionTypeLabels] ?? value;
}

function onCreateIncome() {
  if (!selectedLocation.value) return;
  router.push('/erp/incomes/add/?location=' + selectedLocation.value.id);
}

function onCreateExpense() {
  if (!selectedLocation.value) return;
  router.push('/erp/expenses/add/' + selectedLocation.value.id);
}

function openEdit(row: {id: string, direction: 'incomes' | 'expenses'}) {
  if (row.direction === 'incomes') router.push(`/erp/incomes/${row.id}`);
  else if (row.direction === 'expenses') router.push(`/erp/expenses/${row.id}`);
}
</script>

<style scoped>
.transactions-page {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.transactions-error {
  flex-shrink: 0;
  margin-bottom: 16px;
}

.transactions-loading {
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

.transactions-header {
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

.action-buttons {
  display: flex;
  gap: var(--theme--form--column-gap);
  flex-wrap: wrap;
  justify-content: flex-start;
  margin-top: 16px;
}

.action-btn :deep(.button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: calc(var(--form-column-max-width));
}

.action-btn :deep(.action-btn-icon) {
  margin-left: 16px;
  transform: scale(0.8);
}
</style>
