<template>
  <ErpLayout
    title="ERP - Asset Categories"
    :exportAvailable="true"
    :exportButtonEnable="selectedIds.length > 0" 
    :isExporting="isExporting" 
    @export="exportSelectedItems"
    :getInfo="() => getCollectionInfo(api)"
  >
<template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>

    <template #title-icon>
      <VButton class="header-icon" rounded icon secondary disabled>
        <VIcon name="category" />
      </VButton>
    </template>

    <template #actions>
      <div class="header-items-indicator" aria-live="polite">
        {{ isLoading ? 'Loading...' : rangeText }}
      </div>

      <TableActions
        v-if="canRead"
        v-model="search"
        search-placeholder="Search asset categories..."
        :selected-count="selectedIds.length"
        :disabled="isLoading || !canCreate"
        :bulk-delete-loading="isDeleting"
        @bulk-edit="bulkEditOpen = true"
        @bulk-delete="openBulkDeleteDialog"
        @add="openCreate" />
    </template>

    <div class="asset-categories-page">
      <VProgressLinear
        indeterminate
        class="asset-categories-loading"
        :style="{ visibility: isLoading ? 'visible' : 'hidden' }" />

      <VNotice v-if="!canRead" type="danger" class="asset-categories-error">
        You do not have permissions to view asset categories.
      </VNotice>

      <template v-else>
        <VNotice v-if="isError" type="danger" class="asset-categories-error">
          Failed to load asset categories.
          <VButton @click="refresh">Retry</VButton>
        </VNotice>
        <VNotice v-if="effectiveDeleteErrorMessage" type="danger" class="asset-categories-error">
          {{ effectiveDeleteErrorMessage }}
        </VNotice>

        <TableComponent
          summary="Asset Category, Notes"
          :is-loading="isLoading"
          :items="assetCategories"
          row-key="id"
          :fields="assetCategoryFields"
          :column-overrides="assetCategoryColumnOverrides"
          selectable
          v-model:selected-ids="selectedIds"
          :disabled="isLoading"
          :sort="sortModel"
          @sort-change="onSortChange"
          @row-click="(row) => openEdit(row.id)"
          :show-empty="!isLoading && assetCategories.length === 0"
          empty-text="There are no asset categories in this collection yet."
          empty-action-label="Create Asset Category"
          @empty-action="openCreate">
          <template #cell-asset_category_name="{ value }">
            <span class="value">{{ value }}</span>
          </template>

          <template #cell-notes="{ value }">
            <span class="value">
              {{ value && String(value).trim().length > 0 ? value : '-' }}
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

    <BulkEditDrawer
      v-if="canUpdate"
      v-model:open="bulkEditOpen"
      collection="asset_categories"
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
import BulkEditDrawer from '../../components/bulk-edit/BulkEditDrawer.vue';
import { useRouter } from 'vue-router';
import { useBulkDelete } from '../../composables/useBulkDelete';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog.vue';
import TableComponent from '../../components/table/TableComponent.vue';
import TableFooter from '../../components/table/TableFooter.vue';
import TableActions from '../../components/table/TableActions.vue';
import { DEFAULT_ROWS_PER_PAGE_OPTIONS } from '../../constants';
import { useAssetCategories } from '../../composables/useAssetCategories';
import { useApi, useStores } from '@directus/extensions-sdk';
import ErrorDialog from '../../components/ErrorDialog.vue';
import { exportAssetCategories, getCollectionInfo } from '../../api/assetCategoriesApi';

const {
  assetCategories,
  totalCount,
  isLoading,
  isError,
  refresh,
  page,
  itemsPerPage,
  sortBy,
  searchText,
} = useAssetCategories();

const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();

const canRead = computed(() => permissionsStore.hasPermission('asset_categories', 'read'));
const canCreate = computed(() => permissionsStore.hasPermission('asset_categories', 'create'));
const canUpdate = computed(() => permissionsStore.hasPermission('asset_categories', 'update'));
const canDelete = computed(() => permissionsStore.hasPermission('asset_categories', 'delete'));

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Asset Categories', to: '/erp/asset-categories', disabled: 'false' },
];

type AssetCategoryId = string | number;

const bulkEditOpen = ref(false);
const router = useRouter();
const {
  bulkDeleteItems,
  isDeleting,
  errorMessage: deleteErrorMessage,
  resetError: resetDeleteError,
} = useBulkDelete();
const deleteDialogOpen = ref(false);

const localDeleteErrorMessage = ref('');
const effectiveDeleteErrorMessage = computed(() => {
  if (localDeleteErrorMessage.value) return localDeleteErrorMessage.value;

  const raw = deleteErrorMessage.value;
  if (!raw) return '';

  const normalized = String(raw).toLowerCase();

  if (
    normalized.includes('violates foreign key constraint') &&
    normalized.includes('assets_asset_category_foreign')
  ) {
    return 'One or more selected asset categories are still used by existing assets and cannot be deleted. Please reassign or delete those assets first.';
  }

  return raw;
});

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
  router.push('/erp/asset-categories/add');
}

function openEdit(id: string | number) {
  if (!canUpdate.value) return;
  router.push(`/erp/asset-categories/${id}`);
}

const api = useApi();
const isExporting = ref(false);
const exportErrorDialogOpen = ref(false);
const exportErrorMessage = 'Failed to export selected asset categories.';

async function exportSelectedItems() {
  if (selectedIds.value.length === 0) return;

  isExporting.value = true;
  try {
    await exportAssetCategories(api, selectedIds.value);
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

const selectedIds = ref<AssetCategoryId[]>([]);

const BASE_VEHICLE_CATEGORY_SHORT_NAME = 'VEH';

const isBaseVehicleCategorySelected = computed(() => {
  if (!selectedIds.value.length) return false;

  return assetCategories.value.some((category) => {
    const isSelected = selectedIds.value.some((id) => String(id) === String((category as any)?.id));
    if (!isSelected) return false;

    const shortName = String((category as any)?.short_name ?? '')
      .toUpperCase()
      .trim();
    const type = String((category as any)?.category_type ?? '')
      .toLowerCase()
      .trim();
    const name = String((category as any)?.asset_category_name ?? '')
      .toLowerCase()
      .trim();

    if (type !== 'vehicle') return false;
    if (name !== 'vehicle') return false;

    return shortName === BASE_VEHICLE_CATEGORY_SHORT_NAME;
  });
});

const assetCategoryFields = ['asset_category_name', 'notes'] as const;
const assetCategoryColumnOverrides = {
  asset_category_name: { width: 'minmax(240px, 2fr)', label: 'Asset Category' },
  notes: { width: 'minmax(320px, 3fr)', label: 'Notes' },
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
  localDeleteErrorMessage.value = '';
  resetDeleteError();
}

const deleteDialogMessage = computed(() => {
  const count = selectedIds.value.length;
  const noun = count === 1 ? 'asset category' : 'asset categories';
  return `Are you sure you want to delete ${count} ${noun}? This action can not be undone.`;
});

function openBulkDeleteDialog() {
  if (selectedIds.value.length === 0) return;

  if (isBaseVehicleCategorySelected.value) {
    localDeleteErrorMessage.value =
      'The default "Vehicle" asset category cannot be deleted because it is required for vehicle-specific asset fields.';
    return;
  }

  localDeleteErrorMessage.value = '';
  resetDeleteError();
  deleteDialogOpen.value = true;
}

async function confirmBulkDelete() {
  if (selectedIds.value.length === 0) return;
  deleteDialogOpen.value = false;

  try {
    await bulkDeleteItems('asset_categories', selectedIds.value);
    await refresh();
    selectedIds.value = [];
  } catch {
    // error handled by composable
  }
}
</script>

<style scoped>
.asset-categories-page {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.asset-categories-error {
  flex-shrink: 0;
  margin-bottom: 16px;
}

.asset-categories-loading {
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
