<template>
  <ErpLayout title="ERP - Edit Contract" :getInfo="() => getCollectionInfo(api)">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>

    <template #title-icon>
      <div class="erp-title-prepend">
        <VButton class="header-icon" rounded icon secondary @click="goBack">
          <VIcon name="arrow_back" />
        </VButton>
        <VButton class="header-icon" rounded icon secondary disabled>
          <VIcon name="contract-exchange" />
        </VButton>
      </div>
    </template>

    <!-- Page actions: Delete and Save -->
    <template #actions>
      <VButton icon rounded secondary class="action-delete" :loading="deleting"
        :disabled="deleting || saving || loading || !canDelete" @click="openDeleteDialog">
        <VIcon name="delete" />
      </VButton>

      <VButton icon rounded :loading="saving" :disabled="saving || loading || !canSubmit || !hasPermission"
        @click="save">
        <VIcon name="check" />
      </VButton>
    </template>

    <div class="erp-upload-form">
      <div class="erp-form-section-header erp-no-top-margin">
        <VIcon name="contract" />
        <h2 class="erp-title-display-md">Contract data</h2>
      </div>

      <div v-if="!hasPermission || errorMessages.length || successMessage" ref="noticeWrapper" class="erp-notices-wrapper">
        <VNotice v-if="!hasPermission" type="danger" icon="warning">
          You do not have permissions to update contracts.
        </VNotice>
        <VNotice v-else-if="errorMessages.length" type="danger">
          <ul>
            <li v-for="(msg, index) in errorMessages" :key="index">{{ msg.message }}</li>
          </ul>
        </VNotice>
        <VNotice v-else-if="successMessage" type="success">
          {{ successMessage }}
        </VNotice>
      </div>

      <VProgressLinear v-if="loading" indeterminate />

      <VForm v-if="hasPermission && !loading" v-model="formData" :fields="fieldData"
        :primary-key="(formData as any).id" />
    </div>

    <ConfirmDeleteDialog v-model:open="deleteDialogOpen" :busy="deleting" :message="deleteDialogMessage"
      @confirm="confirmDelete" />
  </ErpLayout>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useApi, useCollection, useStores } from '@directus/extensions-sdk';
import { useRoute, useRouter } from 'vue-router';
import ErpLayout from '../../layouts/ErpLayout.vue';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog.vue';
import { getCollectionInfo } from '../../api/contractsApi';

const api = useApi();
const router = useRouter();
const route = useRoute();
const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();

const collection = 'contracts';
const { fields } = useCollection(collection);
const noticeWrapper = ref<HTMLElement | null>(null);

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Contracts', to: '/erp/contracts', disabled: 'false' },
  { name: 'Edit', to: route.fullPath, disabled: 'true' },
];

const formData = ref<Record<string, unknown>>({});
const initialFormData = ref<Record<string, unknown> | null>(null);
const saving = ref(false);
const loading = ref(true);
const errorMessages = ref<Array<{ message: string }>>([]);
const successMessage = ref('');

const deleteDialogOpen = ref(false);
const deleting = ref(false);

const hasPermission = computed(() => permissionsStore.hasPermission(collection, 'update'));
const canDelete = computed(() => permissionsStore.hasPermission(collection, 'delete'));
const fieldData = computed(() => {
  const base = fields.value ?? [];

  return base.map((f: any) => {
    const fieldName = String(f?.field ?? '');
    if (fieldName !== 'status') return f;

    return {
      ...f,
      meta: {
        ...(f?.meta ?? {}),
        readonly: true,
      },
    };
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

// To handle deleted values we have to get undefined fields and treat them as null, because Directus API returns null for empty values but when we set a field to empty, it becomes undefined in formData. So we compare normalized and stabilized versions of initial and current form data, treating undefined as null, to determine which fields have changed.
const changedFields = computed(() => {
  if (!initialFormData.value) return {};
  const initial = normalizeForCompare(initialFormData.value);
  const current = normalizeForCompare(formData.value);
  const changes: Record<string, unknown> = {};

  const allKeys = new Set([...Object.keys(initial), ...Object.keys(current)]);
  for (const key of allKeys) {
    const initialHas = Object.prototype.hasOwnProperty.call(initial, key);
    const currentHas = Object.prototype.hasOwnProperty.call(current, key);
    if (!currentHas || !initialHas) {
      if ((initialHas && !currentHas) || (!initialHas && currentHas)) {
        changes[key] = current[key];
      }
    } else if (JSON.stringify(current[key]) !== JSON.stringify(initial[key])) {
      changes[key] = current[key];
    }
  } 
  
  for (const key in changes) {
    if (typeof changes[key] === 'undefined') {
      changes[key] = null;
    }
  }
  return changes;
});

const canSubmit = computed(() => Object.keys(changedFields.value).length > 0);

function goBack() {
  router.push('/erp/contracts');
}

const deleteDialogMessage = computed(() => {
  return 'Are you sure you want to delete this contract? This action can not be undone.';
});

function openDeleteDialog() {
  if (!canDelete.value) return;
  deleteDialogOpen.value = true;
}

async function loadItem() {
  errorMessages.value = [];
  successMessage.value = '';
  loading.value = true;
  initialFormData.value = null;

  const id = route.params.id as string | undefined;
  if (!id) {
    errorMessages.value = [{ message: 'Missing contract id.' }];
    loading.value = false;
    return;
  }

  try {
    const response = await api.get(`/items/${collection}/${id}`, { params: { fields: ['*'] } });
    formData.value = response?.data?.data ?? {};
    await nextTick();
    initialFormData.value = JSON.parse(JSON.stringify(formData.value));
  } catch (loadError: any) {
    console.error('Failed to load contract', loadError);
    errorMessages.value = loadError?.response?.data?.errors ?? [{ message: 'Load failed.' }];
  } finally {
    loading.value = false;
  }
}

function checkEmailNotification() {
  if (!formData.value.email_notification) return;

  const days: string[] = (formData.value.email_notification as any);  
  for (const day of days) {
    if (!/^\d+$/.test(day)) {
      errorMessages.value = [{ message: 'Notification email days must be integers.' }];
      return;
    }
  }
}

async function save() {
  errorMessages.value = [];
  successMessage.value = '';

  if (!hasPermission.value) {
    errorMessages.value = [{ message: 'You do not have permissions to update contracts.' }];
    return;
  }

  if (!canSubmit.value) {
    errorMessages.value = [{ message: 'No changes to save.' }];
    return;
  }

  const id = route.params.id as string | undefined;
  if (!id) {
    errorMessages.value = [{ message: 'Missing contract id.' }];
    return;
  }

  saving.value = true;

  try {
    // handle partner-emloyee choice, 
    if (formData.value.other_party_type === 'employee' && !formData.value.employee) {
      errorMessages.value.push({ message: 'Please select employee.' });
      return;
    }
    if (formData.value.other_party_type === 'partner' && !formData.value.partner) {
      errorMessages.value.push({ message: 'Please select partner.' });
      return;
    }
    if (formData.value.other_party_type === 'partner') {
      formData.value.employee = null;
    } else if (formData.value.other_party_type === 'employee') {
      formData.value.partner = null;
    }

    const relatedContracts = changedFields.value.related_contracts as Record<string, unknown> | undefined;
    if (relatedContracts && relatedContracts.create && Array.isArray(relatedContracts.create) && relatedContracts.create.find((item: any) => item.related_contracts_id.id === id)) {
      errorMessages.value.push({ message: 'Self referencing of related contract! Remove self reference from related contracts to prevent update failure.' });
      return;
    }

    checkEmailNotification();
    if (errorMessages.value.length) return;

    delete changedFields.value.id;
    delete changedFields.value.contract_id;
    delete changedFields.value.status;
    await api.patch(`/items/${collection}/${id}`, changedFields.value);

    successMessage.value = 'Contract updated.';
    router.push('/erp/contracts');
  } catch (saveError: any) {
    console.error('Failed to update contract', JSON.stringify(saveError, null, 2));
    errorMessages.value = saveError?.response?.data?.errors ?? [{ message: 'Update failed.' }];
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
  errorMessages.value = [];

  try {
    await api.delete(`/items/${collection}/${id}`);
    router.push('/erp/contracts');
  } catch (deleteError: any) {
    console.error('Failed to delete contract', deleteError);
    errorMessages.value = deleteError?.response?.data?.errors ?? [{ message: 'Delete failed.' }];
  } finally {
    deleting.value = false;
  }
}

onMounted(loadItem);
watch(() => route.params.id, loadItem);

watch(
  () => errorMessages.value.length || successMessage.value,
  async (message) => {
    if (!message) return;

    await nextTick();
    noticeWrapper.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
);
</script>

<style scoped>
.action-delete:hover :deep(.button),
.action-delete:focus-within :deep(.button) {
  background-color: var(--theme--danger);
  color: #FFF;
  border: none;
}
</style>
