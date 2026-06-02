<template>
  <ErpLayout title="ERP - Edit Material" :getInfo="() => getCollectionInfo(api)">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>

    <template #title-icon>
      <div class="erp-title-prepend">
        <VButton class="header-icon" rounded icon secondary @click="goBack">
          <VIcon name="arrow_back" />
        </VButton>
        <VButton class="header-icon" rounded icon secondary disabled>
          <VIcon name="inventory_2" />
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
      <div v-if="!hasPermission || errorMessage || successMessage" class="erp-notices-wrapper" ref="noticeWrapper">
        <VNotice v-if="!hasPermission" type="danger" icon="warning">
          You do not have permissions to update materials.
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
        <!-- Material product information section -->
        <div class="erp-form-section-header erp-no-top-margin">
          <VIcon name="inventory_2" />
          <h2 class="erp-title-display-md">Material product information</h2>
        </div>
        <VForm v-model="formData" :fields="productInfoFields" />

        <div class="package-unit-row">
          <VForm v-model="formData" :fields="packageSizeFields" />
        </div>

        <!-- Internal data section -->
        <div class="erp-form-section-header" style="margin-top: 24px">
          <VIcon name="code" />
          <h2 class="erp-title-display-md">Internal data</h2>
        </div>
        <VForm v-model="formData" :fields="internalDataFields" />
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
import { getCollectionInfo } from '../../api/materialsApi';

const api = useApi();
const router = useRouter();
const route = useRoute();
const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();

const collection = 'materials';
const { fields } = useCollection(collection);

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Materials', to: '/erp/materials', disabled: 'false' },
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

const allFields = computed(() => fields.value ?? []);
const categoryUnit = ref<string>('');

const productInfoFields = computed(() => {
  const nameField = allFields.value.find((f: any) => f.field === 'name_of_product');
  const brandField = allFields.value.find((f: any) => f.field === 'brand');
  const categoryField = allFields.value.find((f: any) => f.field === 'material_category');

  const orderedFields: any[] = [];

  // Row 1: Name of Product (half) - Brand (half)
  if (nameField) {
    orderedFields.push({
      ...nameField,
      sort: 1,
      meta: { ...nameField.meta, width: 'half', sort: 1 },
    });
  }

  if (brandField) {
    orderedFields.push({
      ...brandField,
      sort: 2,
      meta: { ...brandField.meta, width: 'half', sort: 2 },
    });
  }

  // Row 2: Material Category (full width)
  if (categoryField) {
    orderedFields.push({
      ...categoryField,
      sort: 3,
      meta: { ...categoryField.meta, width: 'full', sort: 3 },
    });
  }

  return orderedFields.sort((a: any, b: any) => {
    const sortA = a.sort ?? a.meta?.sort ?? 0;
    const sortB = b.sort ?? b.meta?.sort ?? 0;
    return sortA - sortB;
  });
});

const packageSizeFields = computed(() => {
  const packageSizeField = allFields.value.find((f: any) => f.field === 'package_size');
  if (!packageSizeField) return [];

  const unitDisplayField = {
    field: 'unit_display',
    name: 'Unit',
    type: 'string',
    collection: 'materials',
    schema: { type: 'string', is_nullable: true },
    meta: {
      interface: 'input',
      width: 'half',
      sort: 2,
      readonly: true,
      note: 'Unit from the selected material category.',
      group: null,
    },
  };

  return [
    {
      ...packageSizeField,
      meta: { ...packageSizeField.meta, width: 'half', sort: 1, group: null },
    },
    unitDisplayField,
  ];
});

const internalDataFields = computed(() => {
  return allFields.value.filter((f: any) => {
    const key = String(f?.field ?? '');
    return key === 'sku';
  });
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
  delete payload.unit_display; // display-only, from material category
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
  router.push('/erp/materials');
}

const deleteDialogMessage = computed(() => {
  return 'Are you sure you want to delete this material? This action can not be undone.';
});

function openDeleteDialog() {
  if (!canDelete.value) return;
  deleteDialogOpen.value = true;
}

async function loadCategoryUnit(categoryId: string | null | undefined) {
  if (!categoryId) {
    categoryUnit.value = '';
    return;
  }

  try {
    const response = await api.get(`/items/material_categories/${categoryId}`, {
      params: { fields: ['unit'] },
    });
    categoryUnit.value = response?.data?.data?.unit || '';
  } catch (error) {
    console.error('Failed to load category unit', error);
    categoryUnit.value = '';
  }
}

async function loadItem() {
  errorMessage.value = '';
  successMessage.value = '';
  loading.value = true;
  initialFormData.value = null;

  const id = route.params.id as string | undefined;
  if (!id) {
    errorMessage.value = 'Missing material id.';
    loading.value = false;
    return;
  }

  try {
    const response = await api.get(`/items/${collection}/${id}`, { params: { fields: ['*'] } });
    formData.value = response?.data?.data ?? {};
    await nextTick();
    initialFormData.value = JSON.parse(JSON.stringify(formData.value));

    await loadCategoryUnit(formData.value.material_category as string | null | undefined);
  } catch (loadError: any) {
    console.error('Failed to load material', loadError);
    errorMessage.value = loadError?.response?.data?.errors?.[0]?.message ?? 'Load failed.';
  } finally {
    loading.value = false;
  }
}

watch(
  () => formData.value.material_category,
  async (categoryId) => {
    await loadCategoryUnit(categoryId as string | null | undefined);
  },
);

watch(
  categoryUnit,
  (val) => {
    formData.value.unit_display = val;
  },
  { immediate: true },
);

async function save() {
  errorMessage.value = '';
  successMessage.value = '';

  if (!hasPermission.value) {
    errorMessage.value = 'You do not have permissions to update materials.';
    return;
  }

  if (!canSubmit.value) {
    errorMessage.value = 'No changes to save.';
    return;
  }

  const id = route.params.id as string | undefined;
  if (!id) {
    errorMessage.value = 'Missing material id.';
    return;
  }

  saving.value = true;

  try {
    const payload = { ...formData.value } as Record<string, unknown>;
    delete payload.id;
    delete payload.sku; // SKU is readonly and auto-generated
    delete payload.unit_display; // display-only, from material category
    await api.patch(`/items/${collection}/${id}`, payload);

    successMessage.value = 'Material updated.';
    router.push('/erp/materials');
  } catch (saveError: any) {
    console.error('Failed to update material', saveError);
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
    router.push('/erp/materials');
  } catch (deleteError: any) {
    console.error('Failed to delete material', deleteError);
    errorMessage.value = deleteError?.response?.data?.errors?.[0]?.message ?? 'Delete failed.';
  } finally {
    deleting.value = false;
  }
}

onMounted(loadItem);
watch(() => route.params.id, loadItem);
</script>

<style scoped>
.action-delete:hover :deep(.button),
.action-delete:focus-within :deep(.button) {
  background-color: var(--theme--danger);
  color: #fff;
  border: none;
}

.package-unit-row {
  padding-top: 32px;
}
</style>
