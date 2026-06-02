<template>
  <ErpLayout title="ERP - Inventory Change Details" :getInfo="() => getCollectionInfo(api)">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>

    <template #title-icon>
      <div class="erp-title-prepend">
        <VButton class="header-icon" rounded icon secondary @click="goBack">
          <VIcon name="arrow_back" />
        </VButton>
        <VButton class="header-icon" rounded icon secondary disabled>
          <VIcon name="inventory" />
        </VButton>
      </div>
    </template>

    <div class="erp-upload-form">
      <div class="erp-form-section-header erp-no-top-margin">
        <VIcon name="inventory" />
        <h2 class="erp-title-display-md">Inventory change data</h2>
      </div>

      <div v-if="!hasPermission || errorMessage || successMessage" class="erp-notices-wrapper">
        <VNotice v-if="!hasPermission" type="danger" icon="warning">
          You do not have permissions to read inventory changes.
        </VNotice>
        <VNotice v-else-if="errorMessage" type="danger">
          {{ errorMessage }}
        </VNotice>
        <VNotice v-else-if="successMessage" type="success">
          {{ successMessage }}
        </VNotice>
      </div>

      <VProgressLinear v-if="loading" indeterminate />

      <VForm v-if="hasPermission && !loading" v-model="formData" :fields="fieldData" :primary-key="(formData as any).id" />
    </div>
  </ErpLayout>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useApi, useCollection, useStores } from '@directus/extensions-sdk';
import { useRoute, useRouter } from 'vue-router';
import ErpLayout from '../../layouts/ErpLayout.vue';
import { getCollectionInfo } from '../../api/inventoryChangesApi';

const api = useApi();
const router = useRouter();
const route = useRoute();
const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();

const collection = 'inventory_changes';
const { fields } = useCollection(collection);

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Inventory changes', to: '/erp/inventory-changes', disabled: 'false' },
  { name: 'Details', to: route.fullPath, disabled: 'true' },
];

const formData = ref<Record<string, unknown>>({});
const loading = ref(true);
const errorMessage = ref('');
const successMessage = ref('');

const hasPermission = computed(() => permissionsStore.hasPermission(collection, 'read'));
const fieldData = computed(() => (fields.value ?? [])
  .filter((field: any) => {
    if (field?.field === 'fallback_location') {
      return formData.value?.fallback_location !== null;
    }
    return true;
  })
  .map((field: any) => ({
    ...field,
    meta: {
      ...(field?.meta ?? {}),
      ...(field?.field === 'added_materials' || field?.field === 'removed_materials'
        ? { options: { template: `{{quantity}} x {{materials_id.name_of_product}} ({{materials_id.package_size}} {{materials_id.material_category.unit}})`, enableCreate: false, enableSelect: false } }
        : {}),
      readonly: true,
    },
  })));

function goBack() {
  router.push('/erp/inventory-changes');
}

async function loadItem() {
  errorMessage.value = '';
  successMessage.value = '';
  loading.value = true;

  const id = route.params.id as string | undefined;
  if (!id) {
    errorMessage.value = 'Missing inventory change id.';
    loading.value = false;
    return;
  }

  try {
    const response = await api.get(`/items/${collection}/${id}`, { params: { fields: ['*'] } });
    formData.value = response?.data?.data ?? {};
  } catch (loadError: any) {
    console.error('Failed to load inventory change', loadError);
    errorMessage.value = loadError?.response?.data?.errors?.[0]?.message ?? 'Load failed.';
  } finally {
    loading.value = false;
  }
}

onMounted(loadItem);
watch(() => route.params.id, loadItem);
</script>

<style scoped>
.action-delete:hover :deep(.button),
.action-delete:focus-within :deep(.button) {
  background-color: var(--theme--danger);
  color: #FFF;
  border: none;
}
</style>

