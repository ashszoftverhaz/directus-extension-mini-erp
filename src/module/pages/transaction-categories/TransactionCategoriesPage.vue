<template>
  <ErpLayout title="ERP - Transaction Categories"
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
        <VIcon name="category" />
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
        search-placeholder="Search transaction categories..."
        :selected-count="selectedIds.length"
        :disabled="isLoading || !canCreate"
        :bulk-delete-loading="isDeleting"
        @bulk-edit="bulkEditOpen = true"
        @bulk-delete="openBulkDeleteDialog"
        @add="openCreate" />
    </template>
    <div class="transaction-categories-page">
      <VProgressLinear
        indeterminate
        class="transaction-categories-loading"
        :style="{ visibility: isLoading ? 'visible' : 'hidden' }" />

      <VNotice v-if="!canRead" type="danger" class="transaction-categories-error">
        You do not have permissions to view transaction categories.
      </VNotice>

      <template v-else>
        <VNotice v-if="isError" type="danger" class="transaction-categories-error">
          Failed to load transaction categories.
          <VButton @click="refresh">Retry</VButton>
        </VNotice>
        <VNotice v-if="deleteErrorMessage" type="danger" class="transaction-categories-error">
          {{ deleteErrorMessage }}
        </VNotice>

        <TableComponent
          summary="Transaction Categories"
          :is-loading="isLoading"
          :items="transactionCategories"
          row-key="id"
          :fields="transactionCategoryFields"
          :column-overrides="transactionCategoryColumnOverrides"
          selectable
          v-model:selected-ids="selectedIds"
          :disabled="isLoading"
          :sort="sortModel"
          @sort-change="onSortChange"
          @row-click="(row) => openEdit(row.id)"
          :show-empty="!isLoading && transactionCategories.length === 0"
          empty-text="There are no transaction categories in this collection yet."
          empty-action-label="Create Transaction Category"
          @empty-action="openCreate">
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

    <BulkEditDrawer
      v-if="canUpdate"
      v-model:open="bulkEditOpen"
      collection="transaction_categories"
      :keys="selectedIds"
      :exclude-fields="['id']"
      @saved="onBulkEditSaved" />

    <ConfirmDeleteDialog
      v-if="canDelete"
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
import { useApi, useStores } from '@directus/extensions-sdk';
import BulkEditDrawer from '../../components/bulk-edit/BulkEditDrawer.vue';
import { useRouter } from 'vue-router';
import { useBulkDelete } from '../../composables/useBulkDelete';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog.vue';
import TableComponent from '../../components/table/TableComponent.vue';
import TableFooter from '../../components/table/TableFooter.vue';
import TableActions from '../../components/table/TableActions.vue';
import { DEFAULT_ROWS_PER_PAGE_OPTIONS } from '../../constants';
import { useTransactionCategories } from '../../composables/useTransactionCategories';
import ErrorDialog from '../../components/ErrorDialog.vue';
import { exportTransactionCategories, getCollectionInfo } from '../../api/transactionCategoriesApi';

const {
  transactionCategories,
  totalCount,
  isLoading,
  isError,
  refresh,
  page,
  itemsPerPage,
  sortBy,
  searchText,
} = useTransactionCategories();

const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Transaction Categories', to: '/erp/transaction-categories', disabled: 'false' },
];

const canRead = computed(() => permissionsStore.hasPermission('transaction_categories', 'read'));
const canCreate = computed(() => permissionsStore.hasPermission('transaction_categories', 'create'));
const canUpdate = computed(() => permissionsStore.hasPermission('transaction_categories', 'update'));
const canDelete = computed(() => permissionsStore.hasPermission('transaction_categories', 'delete'));

type TransactionCategoryId = string | number;

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
  if (!canCreate.value) return;
  router.push('/erp/transaction-categories/add');
}

function openEdit(id: string | number) {
  if (!canUpdate.value) return;
  router.push(`/erp/transaction-categories/${id}`);
}

const api = useApi();
const isExporting = ref(false);
const exportErrorDialogOpen = ref(false);
const exportErrorMessage = 'Failed to export selected transaction categories.';

async function exportSelectedItems() {
  if (selectedIds.value.length === 0) return;

  isExporting.value = true;
  try {
    await exportTransactionCategories(api, selectedIds.value);
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
const selectedIds = ref<TransactionCategoryId[]>([]);

const transactionCategoryFields = ['name', 'description'] as const;
const transactionCategoryColumnOverrides = {
  transaction_category: { width: 'minmax(180px, 1fr)' },
  description: { width: 'minmax(400px, 3fr)' },
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
  const noun = count === 1 ? 'transaction category' : 'transaction categories';
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
    await bulkDeleteItems('transaction_categories', selectedIds.value);
    await refresh();
    selectedIds.value = [];
  } catch {
    // error handled by composable
  }
}
</script>

<style scoped>
.transaction-categories-page {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.transaction-categories-error {
  flex-shrink: 0;
  margin-bottom: 16px;
}

.transaction-categories-loading {
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
