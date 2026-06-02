<template>
  <ErpLayout title="ERP - Add Employee" :getInfo="getCollectionInfo">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>
    <template #title-icon>
      <div class="erp-title-prepend">
        <VButton class="header-icon" rounded icon secondary @click="goBack">
          <VIcon name="arrow_back" />
        </VButton>
        <VButton class="header-icon" rounded icon secondary disabled>
          <VIcon name="card_membership" />
        </VButton>
      </div>
    </template>

    <!-- Page actions: Create menu -->
    <template #actions>
      <CreateItemActionsMenu :saving="saving" :can-submit="canSubmit" @save-primary="saveAndClose"
        @save-and-stay="saveStay" @save-and-create-new="saveCreateNew" @discard-all-changes="discardChanges" />
    </template>

    <div class="erp-upload-form">
      <div v-if="!hasPermission || errorMessage || successMessage" class="erp-notices-wrapper" ref="noticeWrapper">
        <VNotice v-if="!hasPermission" type="danger" icon="warning">
          You do not have permissions to create employees and users.
        </VNotice>
        <VNotice v-else-if="errorMessage" type="danger">
          {{ errorMessage }}
        </VNotice>
        <VNotice v-else-if="successMessage" type="success">
          {{ successMessage }}
        </VNotice>
      </div>

      <template v-if="hasPermission">
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
        <VForm
          v-model="employeeFormData"
          :fields="salaryFieldData"
          :primary-key="(employeeFormData as any)?.id" />

        <!-- Commission section -->
        <div class="erp-form-section-header">
          <VIcon name="percent" />
          <h2 class="erp-title-display-md">Commission</h2>
        </div>
        <VForm
          v-model="employeeFormData"
          :fields="commissionFieldData"
          primary-key="+" />

        <!-- Driving Licenses section -->
        <div class="erp-form-section-header" style="margin-top: 24px">
          <VIcon name="card_membership" />
          <h2 class="erp-title-display-md">Driving licences</h2>
        </div>
        <VList style="margin-top: 16px">
          <VListItem v-for="(license, idx) in licenses" :key="license.id || idx" type="button" data-draggable="true"
            @click="openUpdateLicense(license)" class="license-item">
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
        <VForm v-model="employeeFormData" :fields="trainingsFieldData" primary-key="+" />
      </template>
    </div>

    <CreateDrivingLicensesDrawer v-model:open="createDrivingLicensesDrawerOpen" @save="saveLicense" />
    <UpdateDrivingLicensesDrawer v-model:open="updateDrivingLicensesDrawerOpen" @save="updateLicense"
      :drivingLicense="selectedLicense ?? null" />
    <SelectDrivingLicensesDrawer v-model:open="selectDrivingLicensesDrawerOpen" @save="addExistingLicenses"
      :accountId="''" />
  </ErpLayout>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useApi, useCollection } from '@directus/extensions-sdk';
import { useRouter } from 'vue-router';
import ErpLayout from '../../layouts/ErpLayout.vue';
import CreateItemActionsMenu from '../../components/CreateItemActionsMenu.vue';
import CreateDrivingLicensesDrawer from '../../components/CreateDrivingLicensesDrawer.vue';
import UpdateDrivingLicensesDrawer from '../../components/UpdateDrivingLicensesDrawer.vue';
import SelectDrivingLicensesDrawer from '../../components/SelectDrivingLicensesDrawer.vue';
import { useEmployeeAddWithUser } from '../../composables/useEmployeeAddWithUser';
import { useEmployeeFormFields } from '../../composables/useEmployeeFormFields';
import { applyBaseCurrencyToField } from '../../utils/baseCurrencyPreference';
import {
  calculateGrossSalaryFromNetAndTaxes,
  extractTaxIdsFromRelationValue,
  normalizeTaxesFromRelationValue,
  type TaxInput,
} from '../../../services/taxComputation';

const router = useRouter();
const api = useApi();
const { fields: employeeFields } = useCollection('employees');
const { fields: userFields } = useCollection('directus_users');
const licenses = ref<any[]>([]);
const taxById = ref<Record<string, TaxInput>>({});

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Employees', to: '/erp/employees', disabled: 'false' },
  { name: 'Add', to: '/erp/employees/add', disabled: 'true' },
];

const noticeWrapper = ref<HTMLElement | null>(null);

const {
  userFormData,
  employeeFormData,
  saving,
  errorMessage,
  successMessage,
  hasPermission,
  canSubmit,
  save,
  discardAllChanges,
  resetForms,
} = useEmployeeAddWithUser();

const employeeFieldsFiltered = computed(() => {
  const raw = employeeFields.value ?? [];
  return raw.filter((f: any) => {
    const key = String(f?.field ?? '');
    return key && !['id', 'account'].includes(key);
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
    includeUserAccountFields: true,
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
const trainingsFormData = ref<Record<string, unknown>>({});

watch(
  [userFormData, employeeFormData],
  () => {
    const merged: Record<string, unknown> = {};
    const user = userFormData.value as Record<string, unknown>;
    const emp = employeeFormData.value as Record<string, unknown>;
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
    const user = userFormData.value as Record<string, unknown>;
    const emp = employeeFormData.value as Record<string, unknown>;
    for (const [key, src] of Object.entries(GENERAL_FIELD_SOURCES)) {
      if (key in g) {
        if (src === 'user') user[key] = g[key];
        else emp[key] = g[key];
      }
    }
  },
  { deep: true },
);

ensureCompensationType();

function ensureCompensationType() {
  if (employeeFormData.value?.compensation_type == null) {
    employeeFormData.value.compensation_type = 'fix';
  }
}

function sanitizeEmployeeFormData() {
  const netSalary = employeeFormData.value?.compensation_amount;
  const taxes = normalizeTaxesFromRelationValue(employeeFormData.value?.salary_taxes_applied, {
    taxById: taxById.value,
  });
  employeeFormData.value.gross_salary_per_month = calculateGrossSalaryFromNetAndTaxes(
    netSalary as any,
    taxes,
  );
}

async function loadTaxLookup() {
  const response = await api.get('/items/taxes', {
    params: {
      fields: ['id', 'name', 'tax_type', 'tax_value'],
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
      ...(row.name ? { name: String(row.name) } : {}),
      tax_type: taxType,
      tax_value: row.tax_value ?? null,
    };
  }
  taxById.value = next;
  sanitizeEmployeeFormData();
}

function hydrateSalaryTaxChangesetForDisplay() {
  const relationValue = employeeFormData.value?.salary_taxes_applied as any;
  if (!relationValue || typeof relationValue !== 'object') return;

  const relationBuckets = ['create', 'update'];
  for (const bucket of relationBuckets) {
    const items = relationValue?.[bucket];
    if (!Array.isArray(items)) continue;

    for (const item of items) {
      if (!item || typeof item !== 'object') continue;

      const currentTaxRef = item.taxes_id;
      const currentTaxId =
        typeof currentTaxRef === 'string' || typeof currentTaxRef === 'number'
          ? String(currentTaxRef)
          : typeof currentTaxRef?.id === 'string' || typeof currentTaxRef?.id === 'number'
            ? String(currentTaxRef.id)
            : null;

      if (!currentTaxId) continue;
      const resolvedTax = taxById.value[currentTaxId] as any;
      if (!resolvedTax) continue;

      item.taxes_id = {
        id: resolvedTax.id ?? currentTaxId,
        name: resolvedTax.name ?? currentTaxId,
        tax_type: resolvedTax.tax_type ?? null,
        tax_value: resolvedTax.tax_value ?? null,
      };
    }
  }
}

async function ensureSelectedSalaryTaxesLoaded() {
  const selectedTaxIds = extractTaxIdsFromRelationValue(
    employeeFormData.value?.salary_taxes_applied,
  );
  const missingIds = selectedTaxIds.filter((id) => !taxById.value[id]);
  if (missingIds.length === 0) {
    sanitizeEmployeeFormData();
    return;
  }

  const response = await api.get('/items/taxes', {
    params: {
      fields: ['id', 'name', 'tax_type', 'tax_value'],
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
      ...(row.name ? { name: String(row.name) } : {}),
      tax_type: taxType,
      tax_value: row.tax_value ?? null,
    };
  }

  hydrateSalaryTaxChangesetForDisplay();
  sanitizeEmployeeFormData();
}

onMounted(async () => {
  try {
    await applyBaseCurrencyToField(api, employeeFormData as any, 'currency');
    await loadTaxLookup();
  } catch (error) {
    console.error('Failed to load taxes lookup', error);
  }
});

watch(
  () => [employeeFormData.value?.compensation_amount, employeeFormData.value?.salary_taxes_applied],
  () => {
    sanitizeEmployeeFormData();
  },
  { deep: true, immediate: true },
);

watch(
  () => extractTaxIdsFromRelationValue(employeeFormData.value?.salary_taxes_applied).join(','),
  async () => {
    await ensureSelectedSalaryTaxesLoaded();
    hydrateSalaryTaxChangesetForDisplay();
  },
  { immediate: true },
);

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

const createDrivingLicensesDrawerOpen = ref(false);
const updateDrivingLicensesDrawerOpen = ref(false);
const selectDrivingLicensesDrawerOpen = ref(false);
const selectedLicense = ref<any | null>(null);

const openAddLicense = () => {
  createDrivingLicensesDrawerOpen.value = true;
};

const openAddExistingLicenses = () => {
  selectDrivingLicensesDrawerOpen.value = true;
};

const openUpdateLicense = (license: any) => {
  selectedLicense.value = license;
  updateDrivingLicensesDrawerOpen.value = true;
};

const saveLicense = (license: any) => {
  licenses.value.push(license);
  createDrivingLicensesDrawerOpen.value = false;
};

const updateLicense = (license: any) => {
  const idx = licenses.value.findIndex((l: any) => l.id === license.id);
  if (idx !== -1) {
    licenses.value[idx] = { ...license };
  }
  updateDrivingLicensesDrawerOpen.value = false;
};

const addExistingLicenses = (selectedLicenses: any[]) => {
  for (const license of selectedLicenses) {
    if (!licenses.value.find((l: any) => l.id === license.id)) {
      licenses.value.push(license);
    }
  }
  selectDrivingLicensesDrawerOpen.value = false;
};

const deleteLicense = async (index: number) => {
  licenses.value.splice(index, 1);
};

async function saveAndClose() {
  ensureCompensationType();
  await ensureSelectedSalaryTaxesLoaded();
  const result = await save(licenses.value);
  if (!result) return;
  goBack();
}

async function saveStay() {
  ensureCompensationType();
  await ensureSelectedSalaryTaxesLoaded();
  const result = await save(licenses.value);
  if (!result) return;
  router.push(`/erp/employees/${result.employeeId}`);
}

async function saveCreateNew() {
  ensureCompensationType();
  await ensureSelectedSalaryTaxesLoaded();
  const result = await save(licenses.value);
  if (!result) return;
  resetForms();
  licenses.value = [];
  generalFormData.value = {};
  trainingsFormData.value = {};
}

function discardChanges() {
  if (saving.value) return;
  discardAllChanges();
  licenses.value = [];
  generalFormData.value = {};
  trainingsFormData.value = {};
}

onMounted(async () => {
  await applyBaseCurrencyToField(api, employeeFormData as any, 'currency');
});

watch(
  () => [employeeFormData.value?.compensation_amount, employeeFormData.value?.salary_taxes_applied],
  async () => {
    if (employeeFormData.value?.compensation_amount && employeeFormData.value?.salary_taxes_applied) {
      const compensationAmount = Number(employeeFormData.value.compensation_amount);
      if (isNaN(compensationAmount)) {
        employeeFormData.value.gross_salary_per_month = null;
        return;
      }

      const response = await api.get(`/items/taxes/${employeeFormData.value.salary_taxes_applied}`);
      const tax = {
        type: response.data.data.tax_type,
        value: Number(response.data.data.tax_value) || 0,
      }

      if (isNaN(compensationAmount) || tax.value === 0) {
        employeeFormData.value.gross_salary_per_month = null;
        return;
      }

      if (tax.type === 'percentage_based') {
        const taxRate = tax.value / 100;
        const grossSalary = compensationAmount * (1 + taxRate);
        employeeFormData.value.gross_salary_per_month = parseFloat(grossSalary.toFixed(2));
      } else if (tax.type === 'fixed_amount') {
        const grossSalary = compensationAmount + tax.value;
        employeeFormData.value.gross_salary_per_month = parseFloat(grossSalary.toFixed(2));
      } else {
        employeeFormData.value.gross_salary_per_month = null;
      }
    }
  },
);

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
  border: var(--theme--border-width) solid var(--v-input-border-color, var(--theme--form--field--input--border-color));
  border-radius: var(--v-input-border-radius, var(--theme--border-radius));
  transition: var(--fast) var(--transition);
  transition-property: border-color, box-shadow;
  box-shadow: var(--theme--form--field--input--box-shadow);
}

.license-row:hover {
  background-color: var(--v-list-item-background-color-hover,
      var(--v-list-background-color-hover, var(--theme--form--field--input--background)));
  border: var(--theme--border-width) solid var(--v-list-item-border-color-hover, var(--theme--form--field--input--border-color-hover));
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
