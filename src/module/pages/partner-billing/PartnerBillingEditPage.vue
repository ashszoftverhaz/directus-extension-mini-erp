<template>
  <ErpLayout title="ERP - Edit Billing Information" :getInfo="() => getCollectionInfo(api)">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>
    
    <template #title-icon>
      <div class="erp-title-prepend">
        <VButton class="header-icon" rounded icon secondary @click="cancel">
          <VIcon name="arrow_back" />
        </VButton>
        <VButton class="header-icon" rounded icon secondary disabled>
          <VIcon name="receipt_long" />
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
        <VIcon name="receipt_long" />
        <h2 class="erp-title-display-md">Partner billing information data</h2>
      </div>

      <v-notice v-if="!hasPermission" type="danger" icon="warning">
        You do not have permissions to update partner billing information.
      </v-notice>
      <v-notice v-else-if="errorMessage" ref="noticeWrapper" type="danger">
        {{ errorMessage }}
      </v-notice>
      <v-notice v-else-if="successMessage" ref="noticeWrapper" type="success">
        {{ successMessage }}
      </v-notice>
      <v-progress-linear v-if="loading" indeterminate />

      <v-form v-if="hasPermission && !loading" v-model="formData" :fields="fieldData" />
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
import { getCollectionInfo } from '../../api/billingInformationApi';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog.vue';

const api = useApi();
const router = useRouter();
const route = useRoute();
const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();
const collection = 'partner_billing_information';
const { fields } = useCollection(collection);
const noticeWrapper = ref<HTMLElement | null>(null);

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Partner Billing Information', to: '/erp/partner-billing-informations', disabled: 'false' },
  { name: 'Edit', to: route.fullPath, disabled: 'true' },
];

const formData = ref<Record<string, unknown>>({});
const saving = ref(false);
const loading = ref(true);
const errorMessage = ref('');
const successMessage = ref('');

const deleteDialogOpen = ref(false);
const deleting = ref(false);

const hasPermission = computed(() => permissionsStore.hasPermission(collection, 'update'));
const fieldData = computed(() => fields.value ?? []);
const canSubmit = computed(() => Object.keys(formData.value).length > 0);
const canDelete = computed(() => permissionsStore.hasPermission(collection, 'delete'));

watch(
  () => errorMessage.value || successMessage.value,
  async (message) => {
    if (!message) return;

    await nextTick();
    noticeWrapper.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
);

const deleteDialogMessage = computed(() => {
  return 'Are you sure you want to delete this partner billing information? This action can not be undone.';
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
    router.push('/erp/partner-billing-informations');
  } catch (deleteError: any) {
    console.error('Failed to delete partner billing information', deleteError);
    errorMessage.value = deleteError?.response?.data?.errors?.[0]?.message ?? 'Delete failed.';
  } finally {
    deleting.value = false;
  }
}

const loadItem = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  loading.value = true;

  const id = route.params.id as string | undefined;
  if (!id) {
    errorMessage.value = 'Missing partner billing information id.';
    loading.value = false;
    return;
  }

  try {
    const response = await api.get(`/items/${collection}/${id}`, {
      params: {
        fields: ['*', 'contacts.directus_users_id'],
      },
    });

    formData.value = response?.data?.data ?? {};
  } catch (loadError: any) {
    console.error('Failed to load partner billing information', loadError);
    errorMessage.value = loadError?.response?.data?.errors?.[0]?.message ?? 'Load failed.';
  } finally {
    loading.value = false;
  }
};

const save = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (!hasPermission.value) {
    errorMessage.value = 'You do not have permissions to update partner billing information.';
    return;
  }

  if (!canSubmit.value) {
    errorMessage.value = 'Please fill in the required fields.';
    return;
  }

  const id = route.params.id as string | undefined;
  if (!id) {
    errorMessage.value = 'Missing partner billing information id.';
    return;
  }

  saving.value = true;

  try {
    const payload = { ...formData.value } as Record<string, unknown>;
    delete payload.id;
    await api.patch(`/items/${collection}/${id}`, payload);

    successMessage.value = 'Partner billing information updated.';
    router.push('/erp/partner-billing-informations');
  } catch (saveError: any) {
    console.error('Failed to update partner billing information', saveError);
    errorMessage.value = saveError?.response?.data?.errors?.[0]?.message ?? 'Update failed.';
  } finally {
    saving.value = false;
  }
};

const cancel = () => {
  router.push('/erp/partner-billing-informations');
};

onMounted(loadItem);
watch(() => route.params.id, loadItem);
</script>

<style scoped>
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}
</style>
