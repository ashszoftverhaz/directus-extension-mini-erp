<template>
  <ErpLayout title="ERP - Add Material" :getInfo="() => getCollectionInfo(api)">
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

    <!-- Page actions: Create menu -->
    <template #actions>
      <CreateItemActionsMenu
        :saving="saving"
        :can-submit="canSubmit"
        @save-primary="saveAndClose"
        @save-and-stay="saveAndStay"
        @save-and-create-new="saveAndCreateNew"
        @discard-all-changes="discardAllChanges" />
    </template>

    <div class="erp-upload-form">
      <h2 class="erp-form-title">Add material</h2>

      <div class="erp-notices-wrapper" ref="noticeWrapper">
        <VNotice type="info" icon="info">
          Materials are the products needed to perform a car wash. If a product comes in multiple
          packaging sizes (such as 300 ml or 600 ml), create separate records for each size. The
          material category helps identify the type of product (e.g., "Insect Spray") and its role
          in the washing process.
        </VNotice>
        <VNotice v-if="!hasPermission" type="danger" icon="warning">
          You do not have permissions to create materials.
        </VNotice>
        <VNotice v-else-if="errorMessage" type="danger">
          {{ errorMessage }}
        </VNotice>
        <VNotice v-else-if="successMessage" type="success">
          {{ successMessage }}
        </VNotice>
      </div>

      <template v-if="hasPermission">
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
  </ErpLayout>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue';
import { useApi, useCollection } from '@directus/extensions-sdk';
import { useRouter } from 'vue-router';
import ErpLayout from '../../layouts/ErpLayout.vue';
import CreateItemActionsMenu from '../../components/CreateItemActionsMenu.vue';
import { useCreateItem } from '../../composables/useCreateItem';
import { getCollectionInfo } from '../../api/materialsApi';

const router = useRouter();
const api = useApi();

const collection = 'materials';
const { fields } = useCollection(collection);

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Materials', to: '/erp/materials', disabled: 'false' },
  { name: 'Add', to: '/erp/materials/add', disabled: 'true' },
];

const noticeWrapper = ref<HTMLElement | null>(null);

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

const {
  formData,
  saving,
  errorMessage,
  successMessage,
  hasPermission,
  canSubmit,
  save,
  saveAndStay,
  saveAndCreateNew,
  discardAllChanges,
} = useCreateItem(collection, {
  successMessage: 'Material saved.',
  excludeFields: ['unit_display'],
});

watch(
  () => formData.value.material_category,
  async (categoryId) => {
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
  },
  { immediate: true },
);

watch(
  categoryUnit,
  (val) => {
    formData.value.unit_display = val;
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
  router.push('/erp/materials');
}

async function saveAndClose() {
  const ok = await save();
  if (!ok) return;
  goBack();
}
</script>

<style scoped>
.package-unit-row {
  padding-top: 32px;
}
</style>
