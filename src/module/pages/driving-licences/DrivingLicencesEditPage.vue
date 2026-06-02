<template>
  <ErpLayout title="ERP - Edit Driving Licence" :getInfo="() => getCollectionInfo(api)">
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
      <div class="erp-form-section-header erp-no-top-margin">
        <VIcon name="card_membership" />
        <h2 class="erp-title-display-md">License data</h2>
      </div>

      <div v-if="!hasPermission || errorMessage || successMessage" class="erp-notices-wrapper" ref="noticeWrapper">
        <VNotice v-if="!hasPermission" type="danger" icon="warning">
        You do not have permissions to update driverslicences.
        </VNotice>
        <VNotice v-else-if="errorMessage" type="danger">
        {{ errorMessage }}
        </VNotice>
        <VNotice v-else-if="successMessage" type="success">
        {{ successMessage }}
        </VNotice>
      </div>

      <VProgressLinear v-if="loading" indeterminate />

      <VForm v-if="hasPermission && !loading" v-model="formData" :fields="fieldData" />
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
import { getCollectionInfo } from '../../composables/useDrivingLicences';

const api = useApi();
const router = useRouter();
const route = useRoute();
const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();
const collection = 'driverslicences';
const { fields } = useCollection(collection);
const EMPLOYEE_SECTION_FIELD = '__erp_employee_section';

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Driving licences', to: '/erp/driving-licences', disabled: 'false' },
  { name: 'Edit', to: route.fullPath, disabled: 'true' },
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
const fieldData = computed(() => {
  const isInternationalField = fields.value?.find((f) => f.field === 'isinternational');
  const base = [
    { ...isInternationalField, name: 'Is International' },
    ...fields.value.filter((f) => f.field !== 'isinternational'),
  ];

  if (base.some((f: any) => String(f?.field) === EMPLOYEE_SECTION_FIELD)) return base;

  const index = base.findIndex((f: any) => {
    const fieldName = String(f?.field ?? '').toLowerCase();
    const label = String(f?.meta?.label ?? '').toLowerCase();
    return fieldName.includes('employee') || label.includes('employee');
  });

  const employeeField: any = index >= 0 ? base[index] : null;
  const employeeSort = employeeField?.meta?.sort;
  const employeeGroup = employeeField?.meta?.group;

  // A Directus "presentation divider" above the employee field.
  const employeeDivider: any = {
    field: EMPLOYEE_SECTION_FIELD,
    type: 'alias',
    meta: {
      interface: 'presentation-divider',
      width: 'full',
      group: employeeGroup,
      sort: typeof employeeSort === 'number' ? employeeSort - 0.01 : undefined,
      options: {
        icon: 'face',
        title: 'Employee',
      },
    },
  };

  if (index === -1) return [...base, employeeDivider];
  return [...base.slice(0, index), employeeDivider, ...base.slice(index)];
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

const loadItem = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  loading.value = true;
  initialFormData.value = null;

  const id = route.params.id as string | undefined;
  if (!id) {
    errorMessage.value = 'Missing driving licence id.';
    loading.value = false;
    return;
  }

  try {
    const response = await api.get(`/items/${collection}/${id}`, {
      params: {
        fields: ['*'],
      },
    });

    formData.value = response?.data?.data ?? {};
    await nextTick();
    initialFormData.value = JSON.parse(JSON.stringify(formData.value));
  } catch (loadError: any) {
    console.error('Failed to load driving licence', loadError);
    errorMessage.value = loadError?.response?.data?.errors?.[0]?.message ?? 'Load failed.';
  } finally {
    loading.value = false;
  }
};

const save = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (!hasPermission.value) {
    errorMessage.value = 'You do not have permissions to update driverslicences.';
    return;
  }

  if (!canSubmit.value) {
    errorMessage.value = 'No changes to save.';
    return;
  }

  const id = route.params.id as string | undefined;
  if (!id) {
    errorMessage.value = 'Missing driving licence id.';
    return;
  }

  saving.value = true;

  try {
    const payload = { ...formData.value } as Record<string, unknown>;
    delete payload.id;
    delete (payload as any)[EMPLOYEE_SECTION_FIELD];
    if (!Object.prototype.hasOwnProperty.call(payload, 'isinternational')) {
      payload.isinternational = false;
    }
    await api.patch(`/items/${collection}/${id}`, payload);

    successMessage.value = 'Driving licence updated.';
    router.push('/erp/driving-licences');
  } catch (saveError: any) {
    console.error('Failed to update driving licence', saveError);
    errorMessage.value = saveError?.response?.data?.errors?.[0]?.message ?? 'Update failed.';
  } finally {
    saving.value = false;
  }
};

watch(
  () => errorMessage.value || successMessage.value,
  async (message) => {
    if (!message) return;

    await nextTick();
    noticeWrapper.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
);

function goBack() {
  router.push('/erp/driving-licences');
}

const deleteDialogMessage = computed(() => {
  return 'Are you sure you want to delete this driving licence? This action can not be undone.';
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
    router.push('/erp/driving-licences');
  } catch (deleteError: any) {
    console.error('Failed to delete driving licence', deleteError);
    errorMessage.value = deleteError?.response?.data?.errors?.[0]?.message ?? 'Delete failed.';
  } finally {
    deleting.value = false;
  }
}

onMounted(loadItem);
watch(() => route.params.id, loadItem);
</script>

<style scoped>
.erp-upload-form {
  background: var(--theme--background);
  padding: 20px;
  padding-top: 0;
}

.erp-upload-form :deep(.field[data-field="__erp_employee_section"]) {
  margin-block-end: -24px;
}

.action-delete:hover :deep(.button),
.action-delete:focus-within :deep(.button) {
  background-color: var(--theme--danger);
  color: #FFF;
  border: none;
}
</style>
