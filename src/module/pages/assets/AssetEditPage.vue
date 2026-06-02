<template>
  <ErpLayout title="ERP - Asset details" :getInfo="() => getCollectionInfo(api)">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>

    <template #title-icon>
      <div class="erp-title-prepend">
        <VButton class="header-icon" rounded icon secondary @click="goBack">
          <VIcon name="arrow_back" />
        </VButton>
        <VButton class="header-icon" rounded icon secondary disabled>
          <VIcon name="service_toolbox" />
        </VButton>
      </div>
    </template>

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
      <div v-if="!hasPermission || errorMessage || successMessage" class="erp-notices-wrapper" ref="noticeWrapper">
        <VNotice v-if="!hasPermission" type="danger" icon="warning">
          You do not have permissions to update assets.
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
        <div class="erp-form-section-header erp-no-top-margin">
          <VIcon name="service_toolbox" />
          <h2 class="erp-title-display-md">Asset details</h2>
        </div>
        <VForm v-model="formData" :fields="assetDetailsFields" />

        <div class="erp-form-section-header" style="margin-top: 24px">
          <VIcon name="assignment_ind" />
          <h2 class="erp-title-display-md">Assignment</h2>
        </div>
        <VForm v-model="formData" :fields="assignmentFields" />

        <div class="erp-form-section-header" style="margin-top: 24px">
          <VIcon name="contract" />
          <h2 class="erp-title-display-md">Contracts</h2>
        </div>
        <VForm v-model="formData" :fields="contractsFields" :primary-key="(formData as any)?.id" />

        <div class="erp-form-section-header" style="margin-top: 24px">
          <VIcon name="receipt_long" />
          <h2 class="erp-title-display-md">Expenses</h2>
        </div>
        <VForm v-model="formData" :fields="expensesFields" :primary-key="(formData as any)?.id" />
      </template>
    </div>

    <ConfirmDeleteDialog
      v-model:open="deleteDialogOpen"
      :busy="deleting"
      :message="deleteDialogMessage"
      @confirm="confirmDelete" />
  </ErpLayout>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useApi, useCollection, useStores } from '@directus/extensions-sdk';
import { useRoute, useRouter } from 'vue-router';
import ErpLayout from '../../layouts/ErpLayout.vue';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog.vue';
import { getCollectionInfo } from '../../api/assetsApi';

const api = useApi();
const router = useRouter();
const route = useRoute();
const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();

const collection = 'assets';
const { fields } = useCollection(collection);

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Assets', to: '/erp/assets', disabled: 'false' },
  { name: 'Details', to: route.fullPath, disabled: 'true' },
];

const noticeWrapper = ref<HTMLElement | null>(null);

const formData = ref<Record<string, unknown>>({});
const initialFormData = ref<Record<string, unknown> | null>(null);
const saving = ref(false);
const loading = ref(true);
const errorMessage = ref('');
const successMessage = ref('');

const deleteDialogOpen = ref(false);
const deleting = ref(false);

const hasPermission = computed(() => permissionsStore.hasPermission(collection, 'update'));
const canDelete = computed(() => permissionsStore.hasPermission(collection, 'delete'));

const allFields = computed(() => fields.value ?? []);

type AssetCategoryForEdit = {
  id: string | number;
  category_type?: string | null;
};

const assetCategoriesForEdit = ref<AssetCategoryForEdit[]>([]);

const isVehicleCategory = computed(() => {
  const category = (formData.value as any)?.asset_category;
  if (!category) return false;

  if (typeof category === 'object') {
    const type =
      (category as any)?.category_type ??
      (category as any)?.asset_categories_id?.category_type ??
      null;
    if (typeof type === 'string') {
      return type === 'vehicle';
    }
  }

  const id =
    typeof category === 'object' && category !== null
      ? (category as { id?: string | number }).id
      : category;

  if (!id) return false;

  const normalizedId = String(id);
  const match = assetCategoriesForEdit.value.find((entry) => String(entry.id) === normalizedId);

  if (!match) return false;

  return (
    String(match.category_type ?? '')
      .toLowerCase()
      .trim() === 'vehicle'
  );
});

const assetDetailsFields = computed(() => {
  const nameField = allFields.value.find((f: any) => f.field === 'name');
  const categoryField = allFields.value.find((f: any) => f.field === 'asset_category');
  const licensePlateField = allFields.value.find((f: any) => f.field === 'license_plate_number');
  const mileageField = allFields.value.find((f: any) => f.field === 'mileage_km');
  const usefulLifeField = allFields.value.find((f: any) => f.field === 'useful_life_months');

  const result: any[] = [];

  if (nameField) {
    result.push({
      ...nameField,
      sort: 1,
      meta: { ...(nameField.meta ?? {}), width: 'half', sort: 1 },
    });
  }

  if (categoryField) {
    result.push({
      ...categoryField,
      sort: 2,
      meta: { ...(categoryField.meta ?? {}), width: 'half', sort: 2 },
    });
  }

  if (usefulLifeField) {
    result.push({
      ...usefulLifeField,
      sort: 5,
      meta: { ...(usefulLifeField.meta ?? {}), width: 'full', sort: 5 },
    });
  }

  if (isVehicleCategory.value) {
    if (licensePlateField) {
      result.push({
        ...licensePlateField,
        sort: 3,
        meta: { ...(licensePlateField.meta ?? {}), width: 'half', sort: 3 },
      });
    }

    if (mileageField) {
      result.push({
        ...mileageField,
        sort: 4,
        meta: { ...(mileageField.meta ?? {}), width: 'half', sort: 4 },
      });
    }
  }

  return result.sort((a: any, b: any) => {
    const sortA = a.sort ?? a.meta?.sort ?? 0;
    const sortB = b.sort ?? b.meta?.sort ?? 0;
    return sortA - sortB;
  });
});

const assignmentFields = computed(() => {
  const assignmentField = allFields.value.find((f: any) => f.field === 'assignment');
  const assigneeEmployeeField = allFields.value.find((f: any) => f.field === 'assignee_employee');
  const assigneeUnitField = allFields.value.find((f: any) => f.field === 'assignee_washing_unit');
  const assigneeLocationField = allFields.value.find(
    (f: any) => f.field === 'assignee_washing_location',
  );

  const result: any[] = [];

  if (assignmentField) {
    result.push({
      ...assignmentField,
      sort: 1,
      meta: { ...(assignmentField.meta ?? {}), width: 'half', sort: 1 },
    });
  }

  const rawAssignment = (formData.value as any)?.assignment;
  const currentAssignment =
    rawAssignment === undefined || rawAssignment === null || rawAssignment === ''
      ? 'employee'
      : rawAssignment;

  if (currentAssignment === 'washing_unit' && assigneeUnitField) {
    result.push({
      ...assigneeUnitField,
      sort: 2,
      meta: { ...(assigneeUnitField.meta ?? {}), width: 'half', sort: 2 },
    });
  } else if (currentAssignment === 'washing_location' && assigneeLocationField) {
    result.push({
      ...assigneeLocationField,
      sort: 2,
      meta: { ...(assigneeLocationField.meta ?? {}), width: 'half', sort: 2 },
    });
  } else if (currentAssignment === 'employee' && assigneeEmployeeField) {
    result.push({
      ...assigneeEmployeeField,
      sort: 2,
      meta: { ...(assigneeEmployeeField.meta ?? {}), width: 'half', sort: 2 },
    });
  }

  return result.sort((a: any, b: any) => {
    const sortA = a.sort ?? a.meta?.sort ?? 0;
    const sortB = b.sort ?? b.meta?.sort ?? 0;
    return sortA - sortB;
  });
});

watch(
  () => [(formData.value as any)?.assignment, loading.value],
  ([newValue, isLoading]) => {
    if (isLoading) return;
    if (newValue === undefined || newValue === null || newValue === '') {
      (formData.value as any).assignment = 'employee';
    }
  },
);

const contractsFields = computed(() => {
  const contractsField = allFields.value.find((f: any) => f.field === 'contracts');
  return contractsField ? [contractsField] : [];
});

const expensesFields = computed(() => {
  const expensesField = allFields.value.find((f: any) => f.field === 'expenses');
  return expensesField ? [expensesField] : [];
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

const canSubmit = computed(() => isDirty.value);

watch(
  () => errorMessage.value || successMessage.value,
  async (message) => {
    if (!message) return;

    await nextTick();
    noticeWrapper.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
);

function goBack() {
  router.push('/erp/assets');
}

const deleteDialogMessage = computed(() => {
  return 'Are you sure you want to delete this asset? This action can not be undone.';
});

function openDeleteDialog() {
  if (!canDelete.value) return;
  deleteDialogOpen.value = true;
}

async function loadItem() {
  errorMessage.value = '';
  successMessage.value = '';
  loading.value = true;
  initialFormData.value = null;
  assetCategoriesForEdit.value = [];

  const id = route.params.id as string | undefined;
  if (!id) {
    errorMessage.value = 'Missing asset id.';
    loading.value = false;
    return;
  }

  try {
    const [assetResponse, categoriesResponse] = await Promise.all([
      api.get(`/items/${collection}/${id}`, {
        params: {
          fields: [ '*' ],
        },
      }),
      api.get('/items/asset_categories', {
        params: {
          fields: ['id', 'category_type'],
          limit: -1,
        },
      }),
    ]);

    formData.value = assetResponse?.data?.data ?? {};
    assetCategoriesForEdit.value = (categoriesResponse?.data?.data ?? []) as AssetCategoryForEdit[];

    await nextTick();
    initialFormData.value = JSON.parse(JSON.stringify(formData.value));
  } catch (loadError: any) {
    console.error('Failed to load asset', loadError);
    errorMessage.value = loadError?.response?.data?.errors?.[0]?.message ?? 'Load failed.';
  } finally {
    loading.value = false;
  }
}

async function save() {
  errorMessage.value = '';
  successMessage.value = '';

  if (!hasPermission.value) {
    errorMessage.value = 'You do not have permissions to update assets.';
    return;
  }

  if (!canSubmit.value) {
    errorMessage.value = 'No changes to save.';
    return;
  }

  const id = route.params.id as string | undefined;
  if (!id) {
    errorMessage.value = 'Missing asset id.';
    return;
  }

  saving.value = true;

  try {
    const payload = { ...(formData.value as Record<string, unknown>) };
    delete (payload as any).id;
    delete (payload as any).code;

    await api.patch(`/items/${collection}/${id}`, payload);

    successMessage.value = 'Asset updated.';
    router.push('/erp/assets');
  } catch (saveError: any) {
    console.error('Failed to update asset', saveError);
    errorMessage.value = saveError?.response?.data?.errors?.[0]?.message ?? 'Update failed.';
  } finally {
    saving.value = false;
  }
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
    router.push('/erp/assets');
  } catch (deleteError: any) {
    console.error('Failed to delete asset', deleteError);
    errorMessage.value = deleteError?.response?.data?.errors?.[0]?.message ?? 'Delete failed.';
  } finally {
    deleting.value = false;
  }
}

onMounted(loadItem);
watch(
  () => route.params.id,
  () => {
    loadItem();
  },
);
</script>

<style scoped>
.action-delete:hover :deep(.button),
.action-delete:focus-within :deep(.button) {
  background-color: var(--theme--danger);
  color: #fff;
  border: none;
}
</style>
