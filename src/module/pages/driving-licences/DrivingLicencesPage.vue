<template>
  <ErpLayout title="ERP - Driving Licences"
    :exportAvailable="true"
    :exportButtonEnable="selectedIds.length > 0" 
    :isExporting="isExporting" 
    @export="exportSelectedItems"
    :getInfo="() => getCollectionInfo(api)">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>
    <template #title-icon>
      <v-button class="header-icon" rounded icon secondary disabled>
        <v-icon name="group" />
      </v-button>
    </template>
    <template #title-actions> </template>
    <template #actions>
      <TableActions
        v-model="search"
        search-placeholder="Search licences..."
        :selected-count="selectedIds.length"
        :disabled="isLoading"
        :bulk-delete-loading="isDeleting"
        @bulk-edit="bulkEditOpen = true"
        @bulk-delete="openBulkDeleteDialog"
        @add="openCreate" />
    </template>
    <div class="driving-licences-page">
      <VProgressLinear
        indeterminate
        class="driving-licences-loading"
        :style="{ visibility: isLoading ? 'visible' : 'hidden' }" />
      <VNotice class="driving-licences-error" v-if="deleteErrorMessage" type="danger">{{
        deleteErrorMessage
      }}</VNotice>
      <VNotice class="driving-licences-error" v-else-if="isError" type="danger"
        >Failed to load driving licences.</VNotice
      >

      <TableComponent
        summary="Category, Validity, Issuer Country, International, Employee"
        :is-loading="isLoading"
        :items="drivingLicences"
        row-key="id"
        :fields="tableFields"
        :column-overrides="columnOverrides"
        selectable
        v-model:selected-ids="selectedIds"
        :disabled="isLoading"
        :sort="sortModel"
        @sort-change="onSortChange"
        @row-click="(row) => openEdit(row.id)"
        :show-empty="!isLoading && drivingLicences.length === 0"
        empty-text="There are no driving licences in this collection yet."
        empty-action-label="Create Driving Licence"
        @empty-action="openCreate"
        empty-icon="group">
        <template #cell-validity="{ value }">
          <span class="value">{{ value || '—' }}</span>
        </template>

        <template #cell-international="{ value }">
          <VIcon v-if="value" name="check" />
          <span v-else ></span>
        </template>

        <template #cell-issuerCountry="{ value }">
          <span class="value">{{ value?.name || '—' }}</span>
        </template>

        <template #footer>
          <TableFooter
            :page="page"
            :total-pages="totalPages"
            :items-per-page="itemsPerPage"
            :rows-per-page-options="rowsPerPageOptions"
            rows-per-page-label="Per Page"
            :disabled="isLoading"
            @update:page="onPageChange"
            @update:itemsPerPage="onItemsPerPageChange" />
        </template>
      </TableComponent>
    </div>

    <BulkEditDrawer
      v-model:open="bulkEditOpen"
      collection="driverslicences"
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
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import ErpLayout from '../../layouts/ErpLayout.vue';
import BulkEditDrawer from '../../components/bulk-edit/BulkEditDrawer.vue';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog.vue';
import TableComponent from '../../components/table/TableComponent.vue';
import TableFooter from '../../components/table/TableFooter.vue';
import TableActions from '../../components/table/TableActions.vue';
import { DEFAULT_ROWS_PER_PAGE_OPTIONS } from '../../constants';
import { useBulkDelete } from '../../composables/useBulkDelete';
import { useDrivingLicences, exportDrivingLicences, getCollectionInfo } from '../../composables/useDrivingLicences';
import { useApi } from '@directus/extensions-sdk';
import ErrorDialog from '../../components/ErrorDialog.vue';

const router = useRouter();

const {
  drivingLicences,
  totalCount,
  isLoading,
  isError,
  refresh,
  page,
  itemsPerPage,
  sortBy,
  searchText,
} = useDrivingLicences();

const rowsPerPageOptions = DEFAULT_ROWS_PER_PAGE_OPTIONS;

const tableFields = ['category', 'validity', 'issuerCountry', 'international', 'employee'] as const;
type SortKey = (typeof tableFields)[number];

const columnOverrides = {
  category: { width: 'minmax(220px, 2fr)' },
  validity: { width: 'minmax(180px, 1fr)', label: 'Valid until' },
  issuerCountry: { width: 'minmax(220px, 1fr)', label: 'Issuer Country' },
  international: {
    width: 'minmax(140px, 0.6fr)',
    label: 'International?',
    align: 'center',
    resizable: false,
  },
  employee: { width: 'minmax(220px, 1.4fr)' },
} as const;

const selectedIds = ref<Array<string | number>>([]);

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / itemsPerPage.value)));

const search = computed<string>({
  get() {
    return searchText.value;
  },
  set(value: string) {
    searchText.value = value;
  },
});

function openCreate() {
  router.push('/erp/driving-licences/add');
}

function openEdit(id: string) {
  router.push(`/erp/driving-licences/${id}`);
}

const api = useApi();
const isExporting = ref(false);
const exportErrorDialogOpen = ref(false);
const exportErrorMessage = 'Failed to export selected driving licences.';

async function exportSelectedItems() {
  if (selectedIds.value.length === 0) return;

  isExporting.value = true;
  try {
    await exportDrivingLicences(api, selectedIds.value);
  } catch {
    exportErrorDialogOpen.value = true;
  } finally {
    isExporting.value = false;
  }
}

const sortModel = computed<{ key: string; order: 'asc' | 'desc' } | null>(() => {
  const current = sortBy.value?.[0];
  if (!current?.key) return null;
  const order = current.order === 'desc' ? 'desc' : 'asc';
  return { key: current.key as SortKey, order };
});

function onSortChange(nextSort: { key: string; order: 'asc' | 'desc' }) {
  sortBy.value = [{ key: nextSort.key, order: nextSort.order }];
  page.value = 1;
}

function onPageChange(nextPage: number) {
  if (!Number.isFinite(nextPage) || nextPage <= 0) return;
  page.value = nextPage;
}

function onItemsPerPageChange(nextItemsPerPage: number) {
  if (!Number.isFinite(nextItemsPerPage) || nextItemsPerPage <= 0) return;
  itemsPerPage.value = nextItemsPerPage;
  page.value = 1;
}

const bulkEditOpen = ref(false);
const {
  bulkDeleteItems,
  isDeleting,
  errorMessage: deleteErrorMessage,
  resetError: resetDeleteError,
} = useBulkDelete();
const deleteDialogOpen = ref(false);

const deleteDialogMessage = computed(() => {
  const count = selectedIds.value?.length ?? 0;
  const noun = count === 1 ? 'driving licence' : 'driving licences';
  return `Are you sure you want to delete ${count} ${noun}? This action can not be undone.`;
});

async function onBulkEditSaved() {
  bulkEditOpen.value = false;
  selectedIds.value = [];
  await refresh();
}

function openBulkDeleteDialog() {
  if ((selectedIds.value?.length ?? 0) === 0) return;
  resetDeleteError();
  deleteDialogOpen.value = true;
}

async function confirmBulkDelete() {
  const keys = selectedIds.value.map(String);
  if (keys.length === 0) return;
  deleteDialogOpen.value = false;

  try {
    await bulkDeleteItems('driverslicences', keys);
    selectedIds.value = [];
    await refresh();
  } catch {
    // error handled by composable
  }
}

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Driving Licences', to: '/erp/driving-licences', disabled: 'false' },
];
</script>

<style scoped>
.driving-licences-page {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.driving-licences-error {
  flex-shrink: 0;
  margin-bottom: 16px;
}

.licence-row {
  cursor: pointer;
}

.action-delete:hover :deep(.button),
.action-delete:focus-within :deep(.button) {
  background-color: var(--theme--danger);
  color: #fff;
}

.driving-licences-loading {
  flex-shrink: 0;
  margin-bottom: 8px;
}
</style>
