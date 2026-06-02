<template>
  <ErpLayout title="ERP - Taxes"
    :exportAvailable="true"
    :exportButtonEnable="selectedIds.length > 0" 
    :isExporting="isExporting" 
    @export="exportSelectedItems"
    :getInfo="() => getCollectionInfo(api)">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>

    <template #title-icon>
      <VButton class="header-icon" rounded icon secondary disabled>
        <VIcon name="request_quote" />
      </VButton>
    </template>

    <template #title-actions> </template>

    <template #actions>
      <div class="header-items-indicator" aria-live="polite">
        {{ isLoading ? 'Loading...' : rangeText }}
      </div>

      <TableActions
        v-model="search"
        search-placeholder="Search taxes..."
        :selected-count="selectedIds.length"
        :disabled="isLoading"
        :bulk-delete-loading="isDeleting"
        @bulk-edit="bulkEditOpen = true"
        @bulk-delete="openBulkDeleteDialog"
        @add="openCreate" />
    </template>

    <div class="taxes-page">
      <VProgressLinear
        indeterminate
        class="taxes-loading"
        :style="{ visibility: isLoading ? 'visible' : 'hidden' }" />

      <VNotice v-if="isError" type="danger" class="taxes-error">
        Failed to load taxes.
        <VButton @click="refresh">Retry</VButton>
      </VNotice>

      <VNotice v-if="deleteErrorMessage" type="danger" class="taxes-error">
        {{ deleteErrorMessage }}
      </VNotice>

      <TableComponent
        summary="Name, Code, Country, Type, Value"
        :is-loading="isLoading"
        :items="taxes"
        row-key="id"
        :fields="taxFields"
        :column-overrides="taxColumnOverrides"
        selectable
        v-model:selected-ids="selectedIds"
        :disabled="isLoading"
        :sort="sortModel"
        @sort-change="onSortChange"
        @row-click="(row) => openEdit(row.id)"
        :show-empty="!isLoading && taxes.length === 0"
        empty-text="There are no taxes in this collection yet."
        empty-action-label="Create Tax"
        @empty-action="openCreate"
        empty-icon="request_quote">
        <template #cell-name="{ value }">
          <span class="value">{{ value }}</span>
        </template>

        <template #cell-code="{ value }">
          <span class="value">{{ value }}</span>
        </template>

        <template #cell-country="{ value }">
          <span class="value">
            {{ value?.name ? `${value.name}${value.iso2 ? ` (${value.iso2})` : ''}` : '—' }}
          </span>
        </template>

        <template #cell-tax_type="{ value }">
          <span class="value">
            {{ value === 'fixed_amount' ? 'Fixed amount' : 'Percentage based' }}
          </span>
        </template>

        <template #cell-tax_value="{ value, item }">
          <span class="value">{{ value }}{{ ` ${getTaxValuePostfix(item)}` }}</span>
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
      collection="taxes"
      :keys="selectedIds"
      :exclude-fields="['id']"
      @saved="onBulkEditSaved" />

    <ConfirmDeleteDialog
      v-model:open="deleteDialogOpen"
      :busy="isDeleting"
      :message="deleteDialogMessage"
      @confirm="confirmBulkDelete" />

    <ErrorDialog v-model:open="exportErrorDialogOpen" :message="exportErrorMessage" />
  </ErpLayout>
</template>

<script lang="ts" setup>
import ErpLayout from '../../layouts/ErpLayout.vue';
import { computed, ref } from 'vue';
import { useTaxes } from '../../composables/useTaxes';
import BulkEditDrawer from '../../components/bulk-edit/BulkEditDrawer.vue';
import { useRouter } from 'vue-router';
import { useBulkDelete } from '../../composables/useBulkDelete';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog.vue';
import TableComponent from '../../components/table/TableComponent.vue';
import TableFooter from '../../components/table/TableFooter.vue';
import TableActions from '../../components/table/TableActions.vue';
import { DEFAULT_ROWS_PER_PAGE_OPTIONS } from '../../constants';
import ErrorDialog from '../../components/ErrorDialog.vue';
import { useApi } from '@directus/extensions-sdk';
import { exportTaxes, getCollectionInfo } from '../../api/taxesApi';

const { taxes, totalCount, isLoading, isError, refresh, page, itemsPerPage, sortBy, searchText } =
  useTaxes();

type TaxId = string | number;

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Taxes', to: '/erp/taxes', disabled: 'false' },
];

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
  router.push('/erp/taxes/add');
}

function openEdit(id: string | number) {
  router.push(`/erp/taxes/${id}`);
}

const api = useApi();
const isExporting = ref(false);
const exportErrorDialogOpen = ref(false);
const exportErrorMessage = 'Failed to export selected taxes.';

async function exportSelectedItems() {
  if (selectedIds.value.length === 0) return;

  isExporting.value = true;
  try {
    await exportTaxes(api, selectedIds.value);
  } catch {
    exportErrorDialogOpen.value = true;
  } finally {
    isExporting.value = false;
  }
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

const selectedIds = ref<TaxId[]>([]);

const taxFields = ['name', 'code', 'country', 'tax_type', 'tax_value'] as const;
const taxColumnOverrides = {
  name: { width: 'minmax(240px, 2fr)' },
  code: { width: 'minmax(140px, 1fr)', label: 'Code' },
  country: { width: 'minmax(220px, 2fr)', label: 'Country' },
  tax_type: { width: 'minmax(160px, 1fr)', label: 'Type' },
  tax_value: { width: 'minmax(160px, 1fr)', label: 'Value' },
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

function getTaxValuePostfix(item: any): string {
  if (item?.tax_type === 'fixed_amount') return item?.country?.default_currency?.short_name ?? '';
  if (item?.tax_type === 'percentage_based') return '%';
  return '';
}

function onBulkEditSaved() {
  refresh();
  selectedIds.value = [];
  bulkEditOpen.value = false;
}

const deleteDialogMessage = computed(() => {
  const count = selectedIds.value.length;
  const noun = count === 1 ? 'tax' : 'taxes';
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
    await bulkDeleteItems('taxes', selectedIds.value);
    await refresh();
    selectedIds.value = [];
  } catch {
    // error handled by composable
  }
}
</script>

<style scoped>
.taxes-page {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.taxes-error {
  flex-shrink: 0;
  margin-bottom: 16px;
}

.taxes-loading {
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
</style>
