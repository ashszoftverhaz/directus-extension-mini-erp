<template>
  <ErpLayout title="ERP - Employees"
    :exportAvailable="true"    
    :exportButtonEnable="selectedEmployeeKeys.length > 0" 
    :isExporting="isExporting" 
    @export="exportSelectedItems"
    :getInfo="getCollectionInfo">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>

    <template #title-icon>
      <v-button class="header-icon" rounded icon secondary disabled>
        <v-icon name="person_play" />
      </v-button>
    </template>
    <template #title-actions> </template>
    <template #actions>
      <TableActions
        v-model="search"
        search-placeholder="Search employees..."
        :selected-count="selectedEmployeeKeys.length"
        :disabled="loading"
        :bulk-delete-loading="isDeleting"
        @bulk-edit="bulkEditOpen = true"
        @bulk-delete="openBulkDeleteDialog"
        @add="openCreate" />
    </template>
    <VNotice v-if="deleteErrorMessage" type="danger">{{ deleteErrorMessage }}</VNotice>
    <VProgressLinear v-if="loading" indeterminate />
    <VNotice v-else-if="error" type="danger">Failed to load employees.</VNotice>
    <EmptyState
      v-else-if="employees.length === 0"
      title="No Items"
      description="There are no employees in this collection yet."
      icon="person_play"
      action-label="Create Employee"
      @action="openCreate" 
      empty-icon="person_play"/>
    <div v-else class="employee-page">
      <div class="cards-header-row">
        <div class="cards-header-actions">
          <button
            v-if="Array.from(selectedEmployeeIds.values()).length === 0"
            @click="selectAll()"
            type="button"
            class="no-selection">
            <VIcon name="check_circle"></VIcon>
            <span class="label">Select All</span>
          </button>
          <button v-else @click="deselectAll()" type="button" class="no-selection">
            <VIcon name="cancel"></VIcon>
            <span class="label">Deselect All</span>
          </button>
        </div>
        <div class="cards-header-menu">
          <VMenu>
            <template #activator="{ toggle }">
              <button
                class="sort-activator"
                @click="toggle"
                style="
                  background: none;
                  border: none;
                  cursor: pointer;
                  padding: 0 8px;
                  font: inherit;
                "
                title="Sort field">
                {{ sortMenuItems[selectedSortIndex]?.title }}
              </button>
            </template>
            <VList>
              <VListItem
                v-for="(item, idx) in sortMenuItems"
                :key="idx"
                clickable
                :active="selectedSortIndex === idx"
                @click="onSortItemClick(idx)">
                <VListItemContent>
                  {{ item.title }}
                </VListItemContent>
              </VListItem>
            </VList>
          </VMenu>
          <button type="button" @click="toggleSort">
            <VIcon
              name="sort"
              :style="{ transform: sortAsc ? 'rotate(0deg)' : 'rotate(180deg)' }" />
          </button>
        </div>
      </div>
      <div class="employee-card-grid">
        <div v-for="employee in employees" :key="employee.id" class="employee-card-wrapper">
          <VCard
            class="employee-card"
            :class="{
              'employee-card--selectable': Array.from(selectedEmployeeIds.values()).length > 0,
              'employee-card--selected': selectedEmployeeIds.has(employee.id),
            }"
            @click="goToEmployee(employee.id)"
            style="cursor: pointer">
            <div class="selection-fade" aria-hidden="true"></div>
            <button
              class="employee-card-select-btn"
              :class="{
                'employee-card-select-btn--selectable':
                  Array.from(selectedEmployeeIds.values()).length > 0,
                'employee-card-select-btn--selected': selectedEmployeeIds.has(employee.id),
              }"
              @click.stop="toggleEmployeeSelection(employee.id)"
              title="Toggle selection">
              <VIcon name="check_circle" size="18" />
            </button>
            <VAvatar>
              <template v-if="employee.account && employee.account.avatar">
                <img
                  :src="`/assets/${employee.account.avatar}?key=system-medium-cover`"
                  alt="avatar"
                  style="object-fit: cover; width: 100%; height: 100%" />
              </template>
              <template v-else>
                <VIcon name="account_circle" class="large" />
              </template>
            </VAvatar>
          </VCard>
          <div class="employee-info">
            <div class="employee-name">
              <strong>
                {{
                  employee.account && (employee.account.first_name || employee.account.last_name)
                    ? `${employee.account.first_name || ''} ${employee.account.last_name || ''}`.trim()
                    : `Employee #${employee.id}`
                }}
              </strong>
            </div>
            <div class="employee-email">
              {{ employee.account && employee.account.email ? employee.account.email : `--` }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <VPagination
      v-if="totalPages > 1"
      v-model="currentPage"
      :length="totalPages"
      :totalVisible="4"
      @update:modelValue="
        (val: number) => {
          currentPage = val;
        }
      " />

    <BulkEditDrawer
      v-model:open="bulkEditOpen"
      collection="employees"
      :keys="selectedEmployeeKeys"
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
const MAX_ITEMS_PER_PAGE = 25; // Maximum number of items per page for pagination
import { computed, onMounted, ref, watch } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import { useRouter } from 'vue-router';
import ErpLayout from '../../layouts/ErpLayout.vue';
import { ref as vueRef } from 'vue';
import BulkEditDrawer from '../../components/bulk-edit/BulkEditDrawer.vue';
import { useBulkDelete } from '../../composables/useBulkDelete';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog.vue';
import TableActions from '../../components/table/TableActions.vue';
import EmptyState from '../../components/EmptyState.vue';
import type { EmployeeListItem } from '../../types/employees';
import ErrorDialog from '../../components/ErrorDialog.vue';
import { exportCollectionItems } from '../../utils/collectionDataExport';

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Employees', to: '/erp/employees', disabled: 'false' },
];

const selectedSortIndex = vueRef(0);
const search = ref('');
const searchFocused = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);
const sortAsc = ref(true);
// const selectedIds = ref<string[]>([]);
const bulkEditOpen = ref(false);

function toggleSort() {
  sortAsc.value = !sortAsc.value;
}

function onSortItemClick(idx: number) {
  selectedSortIndex.value = idx;
}

const focusSearch = () => {
  searchInput.value?.focus();
};

const openCreate = () => {
  router.push('/erp/employees/add');
};

function goToEmployee(id: string) {
  router.push(`/erp/employees/${id}`);
}

const sortMenuItems = [
  { title: 'First name', fieldName: 'account.first_name' },
  { title: 'Last name', fieldName: 'account.last_name' },
  { title: 'Email address', fieldName: 'account.email' },
];

const api = useApi();
const router = useRouter();
const employees = ref<EmployeeListItem[]>([]);
const loading = ref(true);
const error = ref(false);
const {
  bulkDeleteItems,
  isDeleting,
  errorMessage: deleteErrorMessage,
  resetError: resetDeleteError,
} = useBulkDelete();
const deleteDialogOpen = ref(false);

const exportEmployeeFields: Record<string, string> = {
  'account.first_name': 'First Name',
  'account.last_name': 'Last Name',
  'account.email': 'Email',
  'seniority': 'Seniority',
  'employment_start_date': 'Employment start',
  'compensation_amount': 'Net salary / month',
  'currency.short_name': 'Currency',
  'gross_salary_per_month': 'Gross salary / month',
  'compensation_type': 'Compensation type',
  'commission_amount': 'Commission amount',
};

const isExporting = ref(false);
const exportErrorDialogOpen = ref(false);
const exportErrorMessage = 'Failed to export selected employees.';

async function exportSelectedItems() {
  if (selectedEmployeeKeys.value.length === 0) return;

  isExporting.value = true;
  try {
    await exportCollectionItems(api, selectedEmployeeKeys.value, 'employees', exportEmployeeFields);
  } catch {
    exportErrorDialogOpen.value = true;
  } finally {
    isExporting.value = false;
  }
}

const getCollectionInfo = async (): Promise<string> => {
  try {
    const response = await api.get(`/collections/employees`, {
      params: {
        fields: ['meta.note'],
      },
    });

    return response?.data?.data?.meta?.note ?? '';
  } catch (error) {
    console.warn(`Failed to load note for collection "employees"`, error);
    return '';
  }
};

// Selection state
const selectedEmployeeIds = ref<Set<string>>(new Set());
const selectedEmployeeKeys = computed(() => Array.from(selectedEmployeeIds.value));

function toggleEmployeeSelection(employeeId: string) {
  if (selectedEmployeeIds.value.has(employeeId)) {
    selectedEmployeeIds.value.delete(employeeId);
  } else {
    selectedEmployeeIds.value.add(employeeId);
  }
  // Force reactivity
  selectedEmployeeIds.value = new Set(selectedEmployeeIds.value);
}

function selectAll() {
  const allIds = employees.value.map((e) => e.id);
  selectedEmployeeIds.value = new Set(allIds);
}

function deselectAll() {
  selectedEmployeeIds.value = new Set();
}

// Pagination state
const currentPage = ref(1);
const totalItems = ref(0);
const totalPages = ref(1);

const fetchEmployees = async (
  sortField: string,
  sortAsc: boolean,
  search?: string,
  page: number = 1,
  limit: number = MAX_ITEMS_PER_PAGE,
) => {
  loading.value = true;
  error.value = false;

  try {
    const params: Record<string, any> = {
      fields: [
        'id',
        'compensation_amount',
        'compensation_type',
        'employment_start_date',
        'seniority',
        'account.*',
      ],
      limit,
      page,
      meta: 'total_count',
    };
    if (sortField) {
      params.sort = [`${sortAsc ? '' : '-'}${sortField}`];
    }
    if (search) {
      params.filter = {
        _or: [
          {
            account: {
              first_name: { _icontains: search },
            },
          },
          {
            account: {
              last_name: { _icontains: search },
            },
          },
          {
            account: {
              email: { _icontains: search },
            },
          },
        ],
      };
    }

    const response = await api.get('/items/employees', { params });

    employees.value = response?.data?.data ?? [];
    totalItems.value = response?.data?.meta?.total_count ?? 0;
    totalPages.value = Math.max(1, Math.ceil(totalItems.value / MAX_ITEMS_PER_PAGE));
  } catch (fetchError) {
    console.error('Failed to load employees', fetchError);
    error.value = true;
  } finally {
    loading.value = false;
  }
};

watch([selectedSortIndex, sortAsc], () => {
  if (loading.value) return;
  currentPage.value = 1;
  fetchEmployees(
    sortMenuItems[selectedSortIndex.value]?.fieldName ?? '',
    sortAsc.value,
    search.value,
    currentPage.value,
  );
});

watch(search, () => {
  if (loading.value) return;
  currentPage.value = 1;
  fetchEmployees(
    sortMenuItems[selectedSortIndex.value]?.fieldName ?? '',
    sortAsc.value,
    search.value,
    currentPage.value,
  );
});

watch(currentPage, () => {
  if (loading.value) return;
  fetchEmployees(
    sortMenuItems[selectedSortIndex.value]?.fieldName ?? '',
    sortAsc.value,
    search.value,
    currentPage.value,
  );
});

onMounted(() => {
  fetchEmployees(
    sortMenuItems[selectedSortIndex.value]?.fieldName ?? '',
    sortAsc.value,
    search.value,
    currentPage.value,
  );
});

function refreshEmployees() {
  return fetchEmployees(
    sortMenuItems[selectedSortIndex.value]?.fieldName ?? '',
    sortAsc.value,
    search.value,
    currentPage.value,
  );
}

async function onBulkEditSaved() {
  bulkEditOpen.value = false;
  selectedEmployeeIds.value = new Set();
  await refreshEmployees();
}

const deleteDialogMessage = computed(() => {
  const count = selectedEmployeeKeys.value.length;
  const noun = count === 1 ? 'employee' : 'employees';
  return `Are you sure you want to delete ${count} ${noun}? This action can not be undone.`;
});

function openBulkDeleteDialog() {
  const keys = selectedEmployeeKeys.value;
  if (keys.length === 0) return;
  resetDeleteError();
  deleteDialogOpen.value = true;
}

async function confirmBulkDelete() {
  const keys = selectedEmployeeKeys.value;
  if (keys.length === 0) return;
  deleteDialogOpen.value = false;

  try {
    await bulkDeleteItems('employees', keys);
    selectedEmployeeIds.value = new Set();
    await refreshEmployees();
  } catch {
    // error handled by composable
  }
}
</script>

<style scoped>
.employee-page {
  padding: 32px;
  padding-top: 0;
}

.employee-card-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
}

.employee-card-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 174.2px;
  height: 238px;
  gap: 4px;
  margin-bottom: 8px;
}

.employee-card {
  width: 174px;
  height: 186px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  inline-size: 100%;
  border-radius: 12px;
  position: relative;
  transition: box-shadow var(--fast) var(--transition);
}

.employee-card::before {
  position: absolute;
  inset-block-start: 7px;
  inset-inline-start: 7px;
  z-index: 2;
  inline-size: 18px;
  block-size: 18px;
  background-color: var(--theme--background);
  border-radius: 24px;
  opacity: 0;
  transition: opacity var(--fast) var(--transition);
  content: '';
}

.employee-card--selected {
  box-shadow: 0 0 0 12px var(--theme--primary-subdued) inset;
}

.employee-card--selected::before {
  opacity: 1;
}

.employee-card .selection-fade {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  z-index: 1;
  inline-size: 100%;
  block-size: 48px;
  opacity: 0;
  transition: opacity 125ms cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.employee-card .selection-fade::before {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  inline-size: 100%;
  block-size: 100%;
  background-image: linear-gradient(-180deg, #2632381a 10%, #26323800);
  content: '';
}

.employee-card--selectable .selection-fade,
.employee-card--selected .selection-fade {
  opacity: 1;
}

.employee-card:hover .selection-fade {
  opacity: 1;
}

.employee-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.employee-name {
  text-align: left;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.employee-email {
  text-align: left;
  color: #888;
  font-size: 0.95em;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-input {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  width: 85px;
  background-color: var(--theme--background-subdued);
  border: 1px solid var(--theme--border-color);
  transition:
    width 160ms ease,
    min-width 160ms ease;
}

.search-input:focus-within {
  width: 260px;
  min-width: 260px;
}

.search-input input {
  border: 0;
  background: transparent;
  outline: none;
  color: var(--theme--foreground);
  width: 100%;
  min-width: 0;
}

.search-input .spacer {
  flex: 1;
}

.icon-search,
.icon-filter {
  color: var(--theme--foreground-subdued);
}

.icon-search {
  cursor: pointer;
}

.action-delete:hover :deep(.button),
.action-delete:focus-within :deep(.button) {
  background-color: var(--theme--danger);
  color: #fff;
}

.employee-card-select-btn {
  position: absolute;
  inset-block-start: 6px;
  inset-inline-start: 6px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  z-index: 2;
  cursor: pointer;
  background: transparent;
  border: 0;
  opacity: 0;
  transition: opacity var(--fast) var(--transition);

  --v-icon-color: var(--theme--primary);
  --v-icon-color-hover: var(--theme--primary);
}

.employee-card-select-btn--selected {
  opacity: 1;
}

.cards-header-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 16px;
}

.cards-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cards-header-menu {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
