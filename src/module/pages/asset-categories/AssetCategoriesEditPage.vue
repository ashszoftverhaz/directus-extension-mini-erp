<template>
  <ErpLayout title="ERP - Edit Asset Category" :getInfo="() => getCollectionInfo(api)">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>

    <template #title-icon>
      <div class="erp-title-prepend">
        <VButton class="header-icon" rounded icon secondary @click="goBack">
          <VIcon name="arrow_back" />
        </VButton>
        <VButton class="header-icon" rounded icon secondary disabled>
          <VIcon name="category" />
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
        :disabled="deleting || saving || loading || !canDelete || isBaseVehicleCategory"
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
      <div v-if="!hasPermission || effectiveErrorMessage || successMessage" class="erp-notices-wrapper" ref="noticeWrapper">
        <VNotice v-if="!hasPermission" type="danger" icon="warning">
          You do not have permissions to update asset categories.
        </VNotice>
        <VNotice v-else-if="effectiveErrorMessage" type="danger">
          {{ effectiveErrorMessage }}
        </VNotice>
        <VNotice v-else-if="successMessage" type="success">
          {{ successMessage }}
        </VNotice>
      </div>

      <VProgressLinear v-if="loading" indeterminate />

      <template v-if="hasPermission && !loading">
        <div class="erp-form-section-header erp-no-top-margin">
          <VIcon name="category" />
          <h2 class="erp-title-display-md">Asset category information</h2>
        </div>
        <VForm v-model="formData" :fields="categoryFields" />
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
import { getCollectionInfo } from '../../api/assetCategoriesApi';

const api = useApi();
const router = useRouter();
const route = useRoute();
const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();

const collection = 'asset_categories';
const { fields } = useCollection(collection);

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Asset Categories', to: '/erp/asset-categories', disabled: 'false' },
  { name: 'Edit', to: route.fullPath, disabled: 'true' },
];

const noticeWrapper = ref<HTMLElement | null>(null);

const formData = ref<Record<string, unknown>>({});
const initialFormData = ref<Record<string, unknown> | null>(null);
const saving = ref(false);
const loading = ref(true);
const errorMessage = ref('');
const successMessage = ref('');

const effectiveErrorMessage = computed(() => {
  const raw = errorMessage.value;
  if (!raw) return '';

  const normalized = String(raw).toLowerCase();

  if (
    normalized.includes('violates foreign key constraint') &&
    normalized.includes('assets_asset_category_foreign')
  ) {
    return 'This asset category is still used by existing assets and cannot be deleted. Please reassign or delete those assets first.';
  }

  return raw;
});

const deleteDialogOpen = ref(false);
const deleting = ref(false);

const hasPermission = computed(() => permissionsStore.hasPermission(collection, 'update'));
const canDelete = computed(() => permissionsStore.hasPermission(collection, 'delete'));

const BASE_VEHICLE_CATEGORY_SHORT_NAME = 'VEH';

const isBaseVehicleCategory = computed(() => {
  const data = formData.value as any;
  if (!data) return false;

  const type = String(data.category_type ?? '')
    .toLowerCase()
    .trim();
  if (type !== 'vehicle') return false;

  const shortName = String(data.short_name ?? '')
    .toUpperCase()
    .trim();
  const name = String(data.asset_category_name ?? '')
    .toLowerCase()
    .trim();

  if (name !== 'vehicle') return false;

  return shortName === BASE_VEHICLE_CATEGORY_SHORT_NAME;
});

const categoryFields = computed(() => {
  const all = fields.value ?? [];
  return all.filter((f: any) => {
    const key = String(f?.field ?? '');
    return ['asset_category_name', 'notes'].includes(key);
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
  () => effectiveErrorMessage.value || successMessage.value,
  async (message) => {
    if (!message) return;

    await nextTick();
    noticeWrapper.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
);

function goBack() {
  router.push('/erp/asset-categories');
}

const deleteDialogMessage = computed(() => {
  if (isBaseVehicleCategory.value) {
    return 'The default "Vehicle" asset category cannot be deleted because it is required for vehicle-specific asset fields.';
  }

  return 'Are you sure you want to delete this asset category? This action can not be undone.';
});

function openDeleteDialog() {
  if (!canDelete.value) return;
  if (isBaseVehicleCategory.value) {
    errorMessage.value =
      'The default "Vehicle" asset category cannot be deleted because it is required for vehicle-specific asset fields.';
    return;
  }
  deleteDialogOpen.value = true;
}

async function loadItem() {
  errorMessage.value = '';
  successMessage.value = '';
  loading.value = true;
  initialFormData.value = null;

  const id = route.params.id as string | undefined;
  if (!id) {
    errorMessage.value = 'Missing asset category id.';
    loading.value = false;
    return;
  }

  try {
    const response = await api.get(`/items/${collection}/${id}`, { params: { fields: ['*'] } });
    formData.value = response?.data?.data ?? {};
    await nextTick();
    initialFormData.value = JSON.parse(JSON.stringify(formData.value));
  } catch (loadError: any) {
    console.error('Failed to load asset category', loadError);
    errorMessage.value = loadError?.response?.data?.errors?.[0]?.message ?? 'Load failed.';
  } finally {
    loading.value = false;
  }
}

async function save() {
  errorMessage.value = '';
  successMessage.value = '';

  if (!hasPermission.value) {
    errorMessage.value = 'You do not have permissions to update asset categories.';
    return;
  }

  if (!canSubmit.value) {
    errorMessage.value = 'No changes to save.';
    return;
  }

  const id = route.params.id as string | undefined;
  if (!id) {
    errorMessage.value = 'Missing asset category id.';
    return;
  }

  saving.value = true;

  try {
    const payload = { ...formData.value } as Record<string, unknown>;
    delete payload.id;
    await api.patch(`/items/${collection}/${id}`, payload);

    successMessage.value = 'Asset category updated.';
    router.push('/erp/asset-categories');
  } catch (saveError: any) {
    console.error('Failed to update asset category', saveError);
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
    router.push('/erp/asset-categories');
  } catch (deleteError: any) {
    console.error('Failed to delete asset category', deleteError);
    const rawMessage = deleteError?.response?.data?.errors?.[0]?.message ?? 'Delete failed.';
    const normalized = String(rawMessage).toLowerCase();

    if (
      normalized.includes('violates foreign key constraint') &&
      normalized.includes('assets_asset_category_foreign')
    ) {
      errorMessage.value =
        'This asset category is still used by existing assets and cannot be deleted. Please reassign or delete those assets first.';
    } else {
      errorMessage.value = rawMessage;
    }
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
</style>
