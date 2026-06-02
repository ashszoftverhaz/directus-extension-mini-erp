<template>
  <ErpLayout title="ERP - Edit Employee" :getInfo="getCollectionInfo">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>
    <template #title-icon>
      <div class="erp-title-prepend">
        <VButton class="header-icon" rounded icon secondary @click="goBack">
          <VIcon name="arrow_back" />
        </VButton>
        <VButton class="header-icon" rounded icon secondary disabled>
          <VIcon name="person_play" />
        </VButton>
      </div>
    </template>

    <!-- Page actions: Delete and Save -->
    <template #actions>
      <VButton
        icon
        rounded
        secondary
        class="action-delete"
        :loading="deleting"
        :disabled="deleting || saving || loading || !canDelete"
        @click="openDeleteDialog">
        <VIcon name="delete" />
      </VButton>

      <VButton
        icon
        rounded
        :loading="saving"
        :disabled="saving || loading || !canSubmit || !hasPermission"
        @click="save">
        <VIcon name="check" />
      </VButton>
    </template>

    <div class="erp-upload-form">
      <UserBox :name="userBoxName" :email="userBoxEmail" :role="userBoxRole" />

      <div v-if="!hasPermission || errorMessage || successMessage" class="erp-notices-wrapper" ref="noticeWrapper">
        <VNotice v-if="!hasPermission" type="danger" icon="warning">
          You do not have permissions to update employees.
        </VNotice>
        <VNotice v-else-if="errorMessage" type="danger">
          {{ errorMessage }}
        </VNotice>
        <VNotice v-else-if="successMessage" type="success">
          {{ successMessage }}
        </VNotice>
      </div>

      <VProgressLinear v-if="loading" indeterminate />

      <template v-if="hasPermission && !loading">
        <!-- General section -->
        <div class="erp-form-section-header erp-no-top-margin">
          <VIcon name="person" />
          <h2 class="erp-title-display-md">General</h2>
        </div>
        <VForm v-model="generalFormData" :fields="generalFieldData" />

        <!-- Salary section -->
        <div class="erp-form-section-header">
          <VIcon name="paid" />
          <h2 class="erp-title-display-md">Salary</h2>
        </div>
        <VForm v-model="formData" :fields="salaryFieldData" :primary-key="(formData as any)?.id" />

        <!-- Commission section -->
        <div class="erp-form-section-header">
          <VIcon name="percent" />
          <h2 class="erp-title-display-md">Commission</h2>
        </div>
        <VForm
          v-model="formData"
          :fields="commissionFieldData"
          :primary-key="(formData as any)?.id" />

        <!-- Driving Licenses section -->
        <div class="erp-form-section-header" style="margin-top: 24px">
          <VIcon name="card_membership" />
          <h2 class="erp-title-display-md">Driving licences</h2>
        </div>
        <VList v-if="licenses.length" style="margin-top: 16px">
          <VListItem
            v-for="(license, idx) in licenses"
            :key="license.id || idx"
            type="button"
            data-draggable="true"
            @click="openUpdateLicense(license)"
            class="license-item">
            <div class="license-row">
              <div class="license-info">
                {{ license.category }} --
                {{
                  license.validity
                    ? new Date(license.validity).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : ''
                }}
              </div>
              <div class="item-actions">
                <VIcon name="delete" @click="deleteLicense(idx)" data-tooltip="Delete" />
              </div>
            </div>
          </VListItem>
        </VList>
        <div style="flex-direction: row; gap: 12px; display: flex; margin-top: 8px">
          <VButton @click="openAddLicense"> Create New </VButton>
          <VButton @click="openAddExistingLicenses"> Add Existing </VButton>
        </div>

        <!-- Trainings section -->
        <div class="erp-form-section-header" style="margin-top: 24px">
          <VIcon name="school" />
          <h2 class="erp-title-display-md">Trainings</h2>
        </div>
        <VForm
          v-model="formData"
          :fields="trainingsFieldData"
          :primary-key="(formData as any)?.id" />
      </template>
    </div>

    <ConfirmDeleteDialog
      v-model:open="deleteDialogOpen"
      :busy="deleting"
      :message="deleteDialogMessage"
      @confirm="confirmDelete" />

    <CreateDrivingLicensesDrawer
      v-model:open="createDrivingLicensesDrawerOpen"
      @save="saveLicense" />
    <UpdateDrivingLicensesDrawer
      v-model:open="updateDrivingLicensesDrawerOpen"
      @save="updateLicense"
      :drivingLicense="selectedLicense ?? null" />
    <SelectDrivingLicensesDrawer
      v-model:open="selectDrivingLicensesDrawerOpen"
      @save="addExistingLicenses"
      :accountId="(formData['account'] as Record<string, any>)?.id ?? undefined" />
  </ErpLayout>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useApi, useCollection, useStores } from '@directus/extensions-sdk';
import { useRoute, useRouter } from 'vue-router';
import ErpLayout from '../../layouts/ErpLayout.vue';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog.vue';
import UserBox from '../../components/UserBox.vue';
import { useEmployee } from '../../composables/useEmployee';
import { useEmployeeFormFields } from '../../composables/useEmployeeFormFields';
import CreateDrivingLicensesDrawer from '../../components/CreateDrivingLicensesDrawer.vue';
import UpdateDrivingLicensesDrawer from '../../components/UpdateDrivingLicensesDrawer.vue';
import SelectDrivingLicensesDrawer from '../../components/SelectDrivingLicensesDrawer.vue';
import {
  calculateGrossSalaryFromNetAndTaxes,
  extractTaxIdsFromRelationValue,
  normalizeTaxesFromRelationValue,
  type TaxInput,
} from '../../../services/taxComputation';

const api = useApi();
const router = useRouter();
const route = useRoute();
const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();
const collection = 'employees';
const { fields: employeeFields } = useCollection(collection);
const { fields: userFields } = useCollection('directus_users');
const taxById = ref<Record<string, TaxInput>>({});

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Employees', to: '/erp/employees', disabled: 'false' },
  { name: 'Edit', to: route.fullPath, disabled: 'true' },
];

const noticeWrapper = ref<HTMLElement | null>(null);

const {
  formData,
  initialFormData,
  accountPreview,
  isLoading: loading,
  errorMessage,
  licenses,
} = useEmployee();

const userFormData = ref<Record<string, unknown>>({});
const initialUserFormData = ref<Record<string, unknown> | null>(null);
watch(
  () => accountPreview.value,
  (next: any) => {
    if (!next) return;
    if (initialUserFormData.value) return;

    userFormData.value = {
      first_name: next.first_name ?? '',
      last_name: next.last_name ?? '',
      email: next.email ?? '',
      role: (next as any).role ?? undefined,
    };

    initialUserFormData.value = JSON.parse(JSON.stringify(userFormData.value));
  },
);

const employeeFieldsFiltered = computed(() => {
  const raw = employeeFields.value ?? [];
  return raw.filter((f: any) => {
    const key = String(f?.field ?? '');
    return key && key !== 'id';
  });
});

const userFieldsPicked = computed(() => {
  const raw = userFields.value ?? [];
  return raw.filter((f: any) => {
    const key = String(f?.field ?? '');
    return ['first_name', 'last_name', 'email', 'password', 'role'].includes(key);
  });
});

const { generalFieldData, salaryFieldData, commissionFieldData, trainingsFieldData } =
  useEmployeeFormFields({
    userFields: userFieldsPicked,
    employeeFields: employeeFieldsFiltered,
    includeUserAccountFields: false,
  });

// Maps general form keys to their source (user vs employee) for merge/sync
const GENERAL_FIELD_SOURCES: Record<string, 'user' | 'employee'> = {
  first_name: 'user',
  last_name: 'user',
  email: 'user',
  password: 'user',
  role: 'user',
  seniority: 'employee',
  employment_start_date: 'employee',
};

const generalFormData = ref<Record<string, unknown>>({});

watch(
  [userFormData, formData],
  () => {
    const merged: Record<string, unknown> = {};
    const user = userFormData.value;
    const emp = formData.value;
    for (const [key, src] of Object.entries(GENERAL_FIELD_SOURCES)) {
      const source = src === 'user' ? user : emp;
      if (key in source) merged[key] = source[key];
    }
    generalFormData.value = merged;
  },
  { deep: true, immediate: true },
);

watch(
  generalFormData,
  (g) => {
    for (const [key, src] of Object.entries(GENERAL_FIELD_SOURCES)) {
      if (key in g) {
        if (src === 'user') userFormData.value[key] = g[key];
        else formData.value[key] = g[key];
      }
    }
  },
  { deep: true },
);

const saving = ref(false);
const successMessage = ref('');
const deleteDialogOpen = ref(false);
const deleting = ref(false);

const hasPermission = computed(() => permissionsStore.hasPermission(collection, 'update'));
const canDelete = computed(() => permissionsStore.hasPermission(collection, 'delete'));
const drivingLicensesChanged = ref(false);
const requiredFieldsFilled = computed(
  () =>
    formData.value['account'] !== undefined &&
    formData.value['compensation_amount'] !== undefined &&
    formData.value['compensation_type'] !== undefined,
);
const canSubmit = computed(
  () =>
    requiredFieldsFilled.value &&
    (isDirty.value || isUserDirty.value || drivingLicensesChanged.value),
);

const userBoxName = computed(() => {
  const account = accountPreview.value;
  if (!account) return '—';

  const first = String(account?.first_name ?? '').trim();
  const last = String(account?.last_name ?? '').trim();
  const full = `${first} ${last}`.trim();
  const email = String(account?.email ?? '').trim();

  return full || email || '—';
});

const userBoxEmail = computed(() => {
  const account = accountPreview.value;
  if (!account) return '—';
  const email = String(account?.email ?? '').trim();
  return email || '—';
});

const userBoxRole = computed(() => {
  const account = accountPreview.value;
  if (!account) return undefined;
  const roleName = account?.roleName;
  return roleName ? String(roleName).trim() : undefined;
});

function stable(value: any): any {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const key of Object.keys(value).sort()) out[key] = stable(value[key]);
    return out;
  }
  return value;
}

function normalizeForCompare(input: Record<string, unknown> | null) {
  const payload = { ...(input ?? {}) } as Record<string, unknown>;
  delete payload.id;
  return stable(payload);
}

const isDirty = computed(() => {
  if (!initialFormData.value) return false;
  const a = JSON.stringify(normalizeForCompare(initialFormData.value));
  const b = JSON.stringify(normalizeForCompare(formData.value));
  return a !== b;
});

function normalizeUserForCompare(input: Record<string, unknown> | null) {
  const payload = { ...(input ?? {}) } as Record<string, unknown>;
  delete payload.id;
  return stable(payload);
}

const isUserDirty = computed(() => {
  if (!initialUserFormData.value) return false;
  const a = JSON.stringify(normalizeUserForCompare(initialUserFormData.value));
  const b = JSON.stringify(normalizeUserForCompare(userFormData.value));
  return a !== b;
});

const EMPLOYEE_SCHEMA_FIELDS = [
  'account',
  'compensation_amount',
  'salary_taxes_applied',
  'gross_salary_per_month',
  'compensation_type',
  'commission_taxes_applied',
  'employment_start_date',
  'position',
  'seniority',
  'currency',
  'commission_amount',
  'participated_in',
];

watch(
  () => [formData.value?.compensation_amount, formData.value?.salary_taxes_applied],
  () => {
    const netSalary = formData.value?.compensation_amount;
    const taxes = normalizeTaxesFromRelationValue(formData.value?.salary_taxes_applied, {
      taxById: taxById.value,
    });
    formData.value.gross_salary_per_month = calculateGrossSalaryFromNetAndTaxes(
      netSalary as any,
      taxes,
    );
  },
  { deep: true, immediate: true },
);

async function loadTaxLookup() {
  const response = await api.get('/items/taxes', {
    params: {
      fields: ['id', 'tax_type', 'tax_value'],
      limit: -1,
    },
  });
  const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
  const next: Record<string, TaxInput> = {};
  for (const row of rows) {
    if (!row?.id) continue;
    const taxType =
      row.tax_type === 'percentage_based' || row.tax_type === 'fixed_amount' ? row.tax_type : null;
    next[String(row.id)] = {
      id: String(row.id),
      tax_type: taxType,
      tax_value: row.tax_value ?? null,
    };
  }
  taxById.value = next;
}

async function ensureSelectedSalaryTaxesLoaded() {
  const selectedTaxIds = extractTaxIdsFromRelationValue(formData.value?.salary_taxes_applied);
  const missingIds = selectedTaxIds.filter((id) => !taxById.value[id]);
  if (missingIds.length === 0) {
    const netSalary = formData.value?.compensation_amount;
    const taxes = normalizeTaxesFromRelationValue(formData.value?.salary_taxes_applied, {
      taxById: taxById.value,
    });
    formData.value.gross_salary_per_month = calculateGrossSalaryFromNetAndTaxes(
      netSalary as any,
      taxes,
    );
    return;
  }

  const response = await api.get('/items/taxes', {
    params: {
      fields: ['id', 'tax_type', 'tax_value'],
      filter: { id: { _in: missingIds } },
      limit: -1,
    },
  });

  const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
  for (const row of rows) {
    if (!row?.id) continue;
    const taxType =
      row.tax_type === 'percentage_based' || row.tax_type === 'fixed_amount' ? row.tax_type : null;
    taxById.value[String(row.id)] = {
      id: String(row.id),
      tax_type: taxType,
      tax_value: row.tax_value ?? null,
    };
  }

  const netSalary = formData.value?.compensation_amount;
  const taxes = normalizeTaxesFromRelationValue(formData.value?.salary_taxes_applied, {
    taxById: taxById.value,
  });
  formData.value.gross_salary_per_month = calculateGrossSalaryFromNetAndTaxes(
    netSalary as any,
    taxes,
  );
}

onMounted(async () => {
  try {
    await loadTaxLookup();
  } catch (error) {
    console.error('Failed to load taxes lookup', error);
  }
});

watch(
  () => extractTaxIdsFromRelationValue(formData.value?.salary_taxes_applied).join(','),
  async () => {
    await ensureSelectedSalaryTaxesLoaded();
  },
  { immediate: true },
);

function filterPayloadForApi(payload: Record<string, unknown>) {
  const filtered = { ...payload };
  for (const key of Object.keys(filtered)) {
    if (!EMPLOYEE_SCHEMA_FIELDS.includes(key) && key !== 'id') {
      delete filtered[key];
    }
  }
  return filtered;
}

const createDrivingLicensesDrawerOpen = ref(false);
const updateDrivingLicensesDrawerOpen = ref(false);
const selectDrivingLicensesDrawerOpen = ref(false);
const drivingLicenseIdsToDelete = ref<number[]>([]);
const selectedLicense = ref<any | null>(null);

const openAddLicense = () => {
  createDrivingLicensesDrawerOpen.value = true;
};

const openAddExistingLicenses = () => {
  selectDrivingLicensesDrawerOpen.value = true;
};

const saveLicense = (license: any) => {
  licenses.value.push(license);
  drivingLicensesChanged.value = true;
  createDrivingLicensesDrawerOpen.value = false;
};

const updateLicense = (license: any) => {
  const idx = licenses.value.findIndex((l: any) => l.id === license.id);
  if (idx !== -1) {
    licenses.value[idx] = { ...license };
  }
  updateDrivingLicensesDrawerOpen.value = false;
  drivingLicensesChanged.value = true;
};

const addExistingLicenses = (selectedLicenses: any[]) => {
  for (const license of selectedLicenses) {
    if (!licenses.value.find((l: any) => l.id === license.id)) {
      licenses.value.push(license);
    }
  }
  selectDrivingLicensesDrawerOpen.value = false;
  drivingLicensesChanged.value = true;
};

const deleteLicense = async (index: number) => {
  const license = licenses.value[index];
  if (license.id != null) {
    drivingLicenseIdsToDelete.value.push(license.id);
  }
  licenses.value.splice(index, 1);
  drivingLicensesChanged.value = true;
};

const accountId = computed(() => {
  const acc = formData.value?.account;
  if (!acc) return null;
  if (typeof acc === 'string' || typeof acc === 'number') return String(acc);
  const maybe = (acc as any)?.id;
  if (typeof maybe === 'string' || typeof maybe === 'number') return String(maybe);
  return null;
});

const save = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (!hasPermission.value) {
    errorMessage.value = 'You do not have permissions to update employees.';
    return;
  }

  if (!canSubmit.value) {
    errorMessage.value = 'Please fill in the required fields.';
    errorMessage.value += ' or no changes to save.';
    return;
  }

  const id = route.params.id as string | undefined;
  if (!id) {
    errorMessage.value = 'Missing employee id.';
    return;
  }

  saving.value = true;

  try {
    await ensureSelectedSalaryTaxesLoaded();

    const userId = accountId.value;
    if (userId && isUserDirty.value) {
      const userPayload = { ...userFormData.value } as Record<string, unknown>;
      delete userPayload.id;
      if (!userPayload.password || String(userPayload.password).trim() === '') {
        delete userPayload.password;
      }
      await api.patch(`/users/${userId}`, userPayload);
    }

    const payload = filterPayloadForApi({ ...formData.value } as Record<string, unknown>);
    delete payload.id;
    await api.patch(`/items/${collection}/${id}`, payload);

    for (const licenseId of drivingLicenseIdsToDelete.value) {
      await api.delete(`/items/driverslicences/${licenseId}`);
    }
    drivingLicenseIdsToDelete.value = [];

    const employeeAccount = formData.value?.account;
    for (const license of licenses.value) {
      if (license.id == null) {
        await api.post('/items/driverslicences', {
          ...license,
          employee: employeeAccount,
        });
      } else {
        const update = { ...license, employee: employeeAccount };
        delete update.id;
        await api.patch(`/items/driverslicences/${license.id}`, update);
      }
    }

    successMessage.value = 'Employee updated.';
    router.push('/erp/employees');
  } catch (saveError: any) {
    console.error('Failed to update employee', saveError);
    errorMessage.value = saveError?.response?.data?.errors?.[0]?.message ?? 'Update failed.';
  } finally {
    saving.value = false;
  }
};

function openUpdateLicense(license: any) {
  selectedLicense.value = license;
  updateDrivingLicensesDrawerOpen.value = true;
}

watch(
  () => errorMessage.value || successMessage.value,
  async (message) => {
    if (!message) return;

    await nextTick();
    noticeWrapper.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
);

function goBack() {
  router.push('/erp/employees');
}

const deleteDialogMessage = computed(() => {
  return 'Are you sure you want to delete this employee? This action can not be undone.';
});

function openDeleteDialog() {
  if (!canDelete.value) return;
  deleteDialogOpen.value = true;
}

async function confirmDelete() {
  const id = route.params.id as string | undefined;
  if (!id) return;
  if (!canDelete.value) return;

  deleteDialogOpen.value = false;
  deleting.value = true;
  errorMessage.value = '';

  try {
    await api.delete(`/items/${collection}/${id}`);
    router.push('/erp/employees');
  } catch (deleteError: any) {
    console.error('Failed to delete employee', deleteError);
    errorMessage.value = deleteError?.response?.data?.errors?.[0]?.message ?? 'Delete failed.';
  } finally {
    deleting.value = false;
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
</script>

<style scoped>
.erp-upload-form {
  background: var(--theme--background);
  padding: 20px;
  padding-top: 0;
}

.erp-upload-form :deep(.field[data-field='role'] + .field[data-field='$system_divider']) {
  /* Hide only the automatic divider that directly follows the Position (role) field */
  display: none;
}

.action-delete:hover :deep(.button),
.action-delete:focus-within :deep(.button) {
  background-color: var(--theme--danger);
  color: #fff;
  border: none;
}

.license-item {
  margin-bottom: 8px;
  padding: 0;
  cursor: pointer;
}

.license-row {
  position: relative;
  display: flex;
  flex-grow: 1;
  align-items: center;
  block-size: var(--theme--form--field--input--height);
  padding: var(--theme--form--field--input--padding);
  padding-block: 0;
  color: var(--v-input-color, var(--theme--form--field--input--foreground));
  font-family: var(--v-input-font-family, var(--theme--fonts--sans--font-family));
  background-color: var(--v-input-background-color, var(--theme--form--field--input--background));
  border: var(--theme--border-width) solid
    var(--v-input-border-color, var(--theme--form--field--input--border-color));
  border-radius: var(--v-input-border-radius, var(--theme--border-radius));
  transition: var(--fast) var(--transition);
  transition-property: border-color, box-shadow;
  box-shadow: var(--theme--form--field--input--box-shadow);
}

.license-row:hover {
  background-color: var(
    --v-list-item-background-color-hover,
    var(--v-list-background-color-hover, var(--theme--form--field--input--background))
  );
  border: var(--theme--border-width) solid
    var(--v-list-item-border-color-hover, var(--theme--form--field--input--border-color-hover));
}

.license-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-actions {
  display: flex;
  align-items: center;
}

.divider {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  overflow: visible;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 24px;
  font-weight: var(--theme--fonts--display--font-weight);
  font-family: var(--theme--fonts--display--font-family);
}

.driving-licenses {
  margin-top: 48px;
  margin-bottom: 48px;
  max-width: 800px;
  padding-inline: 20px;
}
</style>
