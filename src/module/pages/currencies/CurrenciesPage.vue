<template>
  <ErpLayout title="ERP - Currencies" :getInfo="() => getCollectionInfo(api)">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>

    <template #title-icon>
      <VButton class="header-icon" rounded icon secondary disabled>
        <VIcon name="currency_exchange" />
      </VButton>
    </template>
    <template #title-actions> </template>
    <template #actions>
      <div class="header-items-indicator" aria-live="polite">
        {{ isLoading ? 'Loading...' : rangeText }}
      </div>

      <TableActions
        v-model="search"
        search-placeholder="Search currencies..."
        :selected-count="selectedIds.length"
        :disabled="isLoading"
        :bulk-delete-loading="isDeleting"
        @bulk-edit="bulkEditOpen = true"
        @bulk-delete="openBulkDeleteDialog"
        @add="openCreate" />
    </template>
    <div class="currencies-page">
      <VProgressLinear
        indeterminate
        class="currencies-loading"
        :style="{ visibility: isLoading ? 'visible' : 'hidden' }" />

      <VNotice v-if="isError" type="danger" class="currencies-error">
        Failed to load currencies.
        <VButton @click="refresh">Retry</VButton>
      </VNotice>
      <VNotice v-if="deleteErrorMessage" type="danger" class="currencies-error">
        {{ deleteErrorMessage }}
      </VNotice>

      <TableComponent
        summary="Name, Symbol, Short name"
        :is-loading="isLoading"
        :items="currencies"
        row-key="id"
        :fields="currencyFields"
        :column-overrides="currencyColumnOverrides"
        selectable
        v-model:selected-ids="selectedIds"
        :disabled="isLoading"
        :sort="sortModel"
        @sort-change="onSortChange"
        @row-click="(row) => openEdit(row.id)"
        :show-empty="!isLoading && currencies.length === 0"
        empty-text="There are no currencies in this collection yet."
        empty-action-label="Create Currency"
        @empty-action="openCreate">
        <template #cell-name="{ value }">
          <span class="value">{{ value }}</span>
        </template>

        <template #cell-symbol="{ value }">
          <span class="value">{{ value || '—' }}</span>
        </template>

        <template #cell-short_name="{ value }">
          <span class="value">{{ value }}</span>
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
    </div>

    <BulkEditDrawer
      v-model:open="bulkEditOpen"
      collection="currencies"
      :keys="selectedIds"
      :exclude-fields="['id']"
      @saved="onBulkEditSaved" />

    <ConfirmDeleteDialog
      v-model:open="deleteDialogOpen"
      :busy="isDeleting"
      :message="deleteDialogMessage"
      @confirm="confirmBulkDelete" />
  </ErpLayout>
</template>

<script lang="ts" setup>
import ErpLayout from '../../layouts/ErpLayout.vue';
import { computed, ref } from 'vue';
import { useCurrencies } from '../../composables/useCurrencies';
import BulkEditDrawer from '../../components/bulk-edit/BulkEditDrawer.vue';
import { useRouter } from 'vue-router';
import { useBulkDelete } from '../../composables/useBulkDelete';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog.vue';
import TableComponent from '../../components/table/TableComponent.vue';
import TableFooter from '../../components/table/TableFooter.vue';
import TableActions from '../../components/table/TableActions.vue';
import { DEFAULT_ROWS_PER_PAGE_OPTIONS } from '../../constants';
import { getCollectionInfo } from '../../api/currenciesApi';
import { useApi } from '@directus/extensions-sdk';

const api = useApi();

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Currencies', to: '/erp/currencies', disabled: 'false' },
];

const {
  currencies,
  totalCount,
  isLoading,
  isError,
  refresh,
  page,
  itemsPerPage,
  sortBy,
  searchText,
} = useCurrencies();

type CurrencyId = string | number;

const bulkEditOpen = ref(false);
const router = useRouter();
const {
  bulkDeleteItems,
  isDeleting,
  errorMessage: deleteErrorMessage,
  resetError: resetDeleteError,
} = useBulkDelete();
const deleteDialogOpen = ref(false);

const search = computed<string>({
  get() {
    return searchText.value;
  },
  set(value: string) {
    searchText.value = value;
  },
});

function openCreate() {
  router.push('/erp/currencies/add');
}

function openEdit(id: string | number) {
  router.push(`/erp/currencies/${id}`);
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
const selectedIds = ref<CurrencyId[]>([]);

const currencyFields = ['name', 'symbol', 'short_name'] as const;
const currencyColumnOverrides = {
  name: { width: 'minmax(280px, 2fr)' },
  symbol: { width: 'minmax(160px, 1fr)' },
  short_name: { width: 'minmax(160px, 1fr)', label: 'Short name' },
};

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

function onBulkEditSaved() {
  refresh();
  selectedIds.value = [];
  bulkEditOpen.value = false;
}

const deleteDialogMessage = computed(() => {
  const count = selectedIds.value.length;
  const noun = count === 1 ? 'currency' : 'currencies';
  return `Are you sure you want to delete ${count} ${noun}? This action can not be undone.`;
});

function openBulkDeleteDialog() {
  if (selectedIds.value.length === 0) return;
  resetDeleteError();
  deleteDialogOpen.value = true;
}

async function confirmBulkDelete() {
  if (selectedIds.value.length === 0) return;
  deleteDialogOpen.value = false;

  try {
    await bulkDeleteItems('currencies', selectedIds.value);
    await refresh();
    selectedIds.value = [];
  } catch {
    // error handled by composable
  }
}
</script>

<style scoped>
.currencies-page {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.currencies-error {
  flex-shrink: 0;
  margin-bottom: 16px;
}

.currencies-loading {
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

.action-delete:hover :deep(.button),
.action-delete:focus-within :deep(.button) {
  background-color: var(--theme--danger);
  color: #fff;
}
</style>
