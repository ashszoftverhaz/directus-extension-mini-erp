<template>
  <ErpLayout title="ERP - Edit Location">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>

    <template #title-icon>
      <div class="erp-title-prepend">
        <VButton class="header-icon" rounded icon secondary @click="goBack">
          <VIcon name="arrow_back" />
        </VButton>
        <VButton class="header-icon" rounded icon secondary disabled>
          <VIcon name="place" />
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
      <div v-if="!hasPermission || effectiveErrorMessage || successMessage" class="erp-notices-wrapper" ref="noticeWrapper">
        <VNotice v-if="!hasPermission" type="danger" icon="warning">
          You do not have permissions to update locations.
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
          <VIcon name="place" />
          <h2 class="erp-title-display-md">Location information</h2>
        </div>
        <VForm v-model="formData" :fields="fields" />
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
import { getBaseCountryCode } from '../../utils/baseCountryPreference';

const api = useApi();
const router = useRouter();
const route = useRoute();
const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();

const collection = 'erp_locations';
const { fields } = useCollection(collection);

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Locations', to: '/erp/locations', disabled: 'false' },
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
    normalized.includes('violates foreign key constraint') 
  ) {
    return 'This location is still used by existing assets and cannot be deleted. Please reassign or delete those assets first.';
  }

  return raw;
});

const deleteDialogOpen = ref(false);
const deleting = ref(false);

const hasPermission = computed(() => permissionsStore.hasPermission(collection, 'update'));
const canDelete = computed(() => permissionsStore.hasPermission(collection, 'delete'));

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
  router.push('/erp/locations');
}

const deleteDialogMessage = 'Are you sure you want to delete this location? This action can not be undone.';

function openDeleteDialog() {
  if (!canDelete.value) return;
  deleteDialogOpen.value = true;
}

async function loadItem() {
  errorMessage.value = '';
  successMessage.value = '';
  loading.value = true;
  initialFormData.value = null;

  const id = route.params.id as string | undefined;
  if (!id) {
    errorMessage.value = 'Missing location id.';
    loading.value = false;
    return;
  }

  try {
    const response = await api.get(`/items/${collection}/${id}`, { params: { fields: ['*'] } });
    formData.value = response?.data?.data ?? {};
    await nextTick();
    initialFormData.value = JSON.parse(JSON.stringify(formData.value));
  } catch (loadError: any) {
    console.error('Failed to load location', loadError);
    errorMessage.value = loadError?.response?.data?.errors?.[0]?.message ?? 'Load failed.';
  } finally {
    loading.value = false;
  }
}

async function save() {
  errorMessage.value = '';
  successMessage.value = '';

  if (!hasPermission.value) {
    errorMessage.value = 'You do not have permissions to update locations.';
    return;
  }

  if (!canSubmit.value) {
    errorMessage.value = 'No changes to save.';
    return;
  }

  const id = route.params.id as string | undefined;
  if (!id) {
    errorMessage.value = 'Missing location id.';
    return;
  }

  saving.value = true;

  try {
    const payload = { ...formData.value } as Record<string, unknown>;
    delete payload.id;
    await api.patch(`/items/${collection}/${id}`, payload);

    successMessage.value = 'Location updated.';
    router.push('/erp/locations');
  } catch (saveError: any) {
    console.error('Failed to update location', saveError);
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
    router.push('/erp/locations');
  } catch (deleteError: any) {
    console.error('Failed to delete location', deleteError);
    const rawMessage = deleteError?.response?.data?.errors?.[0]?.message ?? 'Delete failed.';
    const normalized = String(rawMessage).toLowerCase();

    if (
      normalized.includes('violates foreign key constraint') 
    ) {
      errorMessage.value =
        'This location is still used by existing items and cannot be deleted. Please reassign or delete those items first.';
    } else {
      errorMessage.value = rawMessage;
    }
  } finally {
    deleting.value = false;
  }
}

async function loadDefaultCountry() {
  if (formData.value.country) return;

  try {
    const baseCountryCode = await getBaseCountryCode(api);
    if (!baseCountryCode) return;

    const response = await api.get('/items/countries', {
      params: {
        filter: { iso2: { _eq: baseCountryCode } },
        limit: 1,
        fields: ['id'],
      },
    });

    const country = Array.isArray(response.data?.data) ? response.data.data[0] : null;
    if (country?.id) {
      formData.value.country = country.id;
    }
  } catch (error) {
    console.error('Failed to pre-select base country for tax', error);
  }
}

onMounted(() => {
  loadItem();
  loadDefaultCountry();
});
watch(() => route.params.id, () => {
  loadItem();
});
</script>

<style scoped>
.action-delete:hover :deep(.button),
.action-delete:focus-within :deep(.button) {
  background-color: var(--theme--danger);
  color: #fff;
  border: none;
}
</style>
