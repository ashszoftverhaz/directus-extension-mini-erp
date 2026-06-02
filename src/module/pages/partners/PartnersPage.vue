<template>
  <ErpLayout title="ERP - Partners"
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
        <VIcon name="group" />
      </VButton>
    </template>
    <template #title-actions> </template>
    <template #actions>
      <div class="header-items-indicator" aria-live="polite">
        {{ isLoading ? 'Loading...' : rangeText }}
      </div>

      <TableActions
        v-model="search"
        search-placeholder="Search partners..."
        :selected-count="selectedIds.length"
        :disabled="isLoading"
        :bulk-delete-loading="isDeleting"
        @bulk-edit="bulkEditOpen = true"
        @bulk-delete="openBulkDeleteDialog"
        @add="openCreate" />
    </template>
    <div class="partners-page">
      <VProgressLinear
        indeterminate
        class="partners-loading"
        :style="{ visibility: isLoading ? 'visible' : 'hidden' }" />

      <VNotice v-if="isError" type="danger" class="partners-error">
        Failed to load partners.
        <VButton @click="refresh">Retry</VButton>
      </VNotice>
      <VNotice v-if="deleteErrorMessage" type="danger" class="partners-error">
        {{ deleteErrorMessage }}
      </VNotice>

      <TableComponent
        summary="Name, Symbol, Short name"
        :is-loading="isLoading"
        :items="partners"
        row-key="id"
        :fields="partnerFields"
        :column-overrides="partnerColumnOverrides"
        selectable
        v-model:selected-ids="selectedIds"
        :disabled="isLoading"
        :sort="sortModel"
        @sort-change="onSortChange"
        @row-click="(row) => openEdit(row.id)"
        :show-empty="!isLoading && partners.length === 0"
        empty-text="There are no partners in this collection yet."
        empty-action-label="Create Partner"
        @empty-action="openCreate"
        empty-icon="group">
        <template #cell-name="{ value }">
          <span class="value">{{ value }}</span>
        </template>

        <template #cell-symbol="{ value }">
          <span class="value">{{ value || '—' }}</span>
        </template>

        <template #cell-short_name="{ value }">
          <span class="value">{{ value }}</span>
        </template>

        <template #cell-status="{ value }">
          <PartnerStatusPill :status="value" />
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
      collection="partners"
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
import BulkEditDrawer from '../../components/bulk-edit/BulkEditDrawer.vue';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog.vue';
import { useBulkDelete } from '../../composables/useBulkDelete';
import { usePartners } from '../../composables/usePartners';
import { useRouter } from 'vue-router';
import TableActions from '../../components/table/TableActions.vue';
import TableComponent from '../../components/table/TableComponent.vue';
import TableFooter from '../../components/table/TableFooter.vue';
import PartnerStatusPill from '../../components/PartnerStatusPill.vue';
import { DEFAULT_ROWS_PER_PAGE_OPTIONS } from '../../constants';
import { useApi } from '@directus/extensions-sdk';
import { exportPartners, getCollectionInfo } from '../../api/partnersApi';
import ErrorDialog from '../../components/ErrorDialog.vue';

const {
  partners,
  totalCount,
  isLoading,
  isError,
  refresh,
  page,
  itemsPerPage,
  sortBy,
  searchText,
} = usePartners();

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Partners', to: '/erp/partners', disabled: 'false' },
];

type PartnerId = string;

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
  router.push('/erp/partners/add');
}

function openEdit(id: string | number) {
  router.push(`/erp/partners/${id}`);
}

const api = useApi();
const isExporting = ref(false);
const exportErrorDialogOpen = ref(false);
const exportErrorMessage = 'Failed to export selected partners.';

async function exportSelectedItems() {
  if (selectedIds.value.length === 0) return;

  isExporting.value = true;
  try {
    await exportPartners(api, selectedIds.value);
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

const selectedIds = ref<PartnerId[]>([]);

const partnerFields = ['name', 'status', 'tax_number', 'registration_number'];
const partnerColumnOverrides = {
  name: { width: 'minmax(280px, 2fr)' },
  status: { width: 'minmax(160px, 1fr)' },
  tax_number: { width: 'minmax(280px, 1fr)' },
  registration_number: { width: 'minmax(280px, 1fr)' },
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
  const noun = count === 1 ? 'partner' : 'partners';
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
    await bulkDeleteItems('partners', selectedIds.value);
    await refresh();
    selectedIds.value = [];
  } catch {
    // error handled by composable
  }
}
</script>

<style scoped>
.partners-page {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.partners-error {
  flex-shrink: 0;
  margin-bottom: 16px;
}

.partners-loading {
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
