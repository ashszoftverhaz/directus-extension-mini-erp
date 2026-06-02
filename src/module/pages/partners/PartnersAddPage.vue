<template>
  <ErpLayout title="ERP - Add Partner" :getInfo="() => getCollectionInfo(api)">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>
    <template #title-icon>
      <div class="erp-title-prepend">
        <VButton class="header-icon" rounded icon secondary @click="goBack">
          <VIcon name="arrow_back" />
        </VButton>
        <VButton class="header-icon" rounded icon secondary disabled>
          <VIcon name="group" />
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
      <div class="erp-form-section-header erp-no-top-margin">
        <VIcon name="group" />
        <h2 class="erp-title-display-md">Add partner</h2>
      </div>

      <v-notice v-if="!hasPermission" type="danger" icon="warning">
        You do not have permissions to create partners.
      </v-notice>
      <v-notice v-else-if="errorMessage" ref="noticeWrapper" type="danger">
        {{ errorMessage }}
      </v-notice>
      <v-notice v-else-if="successMessage" ref="noticeWrapper" type="success">
        {{ successMessage }}
      </v-notice>

      <v-form
        v-if="hasPermission"
        v-model="formData"
        :fields="fieldData"
        collection="partners"
        primary-key="+"
      />
    </div>
  </ErpLayout>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue';
import { useApi, useCollection, useStores } from '@directus/extensions-sdk';
import { useRouter } from 'vue-router';
import ErpLayout from '../../layouts/ErpLayout.vue';
import CreateItemActionsMenu from '../../components/CreateItemActionsMenu.vue';
import { getCollectionInfo } from '../../api/partnersApi';

const api = useApi();
const router = useRouter();
const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();
const collection = 'partners';
const { fields } = useCollection(collection);

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Partners', to: '/erp/partners', disabled: 'false' },
  { name: 'Add', to: '/erp/partners/add', disabled: 'true' },
];

const formData = ref<Record<string, unknown>>({});
const saving = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const noticeWrapper = ref<HTMLElement | null>(null);

const hasPermission = computed(() => permissionsStore.hasPermission(collection, 'create'));
const fieldData = computed(() => fields.value ?? []);
const canSubmit = computed(() => Object.keys(formData.value).length > 0);

watch(
  () => errorMessage.value || successMessage.value,
  async (message) => {
    if (!message) return;

    await nextTick();
    noticeWrapper.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
);

async function save(): Promise<boolean> {
  errorMessage.value = '';
  successMessage.value = '';

  if (!hasPermission.value) {
    errorMessage.value = 'You do not have permissions to create partners.';
    return false;
  }

  if (!canSubmit.value) {
    errorMessage.value = 'Please fill in the required fields.';
    return false;
  }

  saving.value = true;

  try {
    await api.post(`/items/${collection}`, formData.value);
    successMessage.value = 'Partner saved.';
    return true;
  } catch (saveError: any) {
    console.error('Failed to save partner', saveError);
    errorMessage.value = saveError?.response?.data?.errors?.[0]?.message ?? 'Save failed.';
    return false;
  } finally {
    saving.value = false;
  }
}

async function saveAndClose() {
  const ok = await save();
  if (!ok) return;
  router.push('/erp/partners');
}

async function saveAndStay() {
  await save();
}

async function saveAndCreateNew() {
  const ok = await save();
  if (!ok) return;
  formData.value = {};
  errorMessage.value = '';
  successMessage.value = '';
}

function discardAllChanges() {
  if (saving.value) return;
  formData.value = {};
  errorMessage.value = '';
  successMessage.value = '';
}

function goBack() {
  router.push('/erp/partners');
}
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

@media (min-width: 960px) {
  .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.partner-select {
  grid-column: 1 / -1;
}

.file-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-label {
  font-weight: 600;
}

.file-input {
  border: 1px solid var(--theme--border-color);
  border-radius: 6px;
  padding: 6px 8px;
}

.file-status {
  color: var(--theme--foreground-subdued);
  font-size: 12px;
}
</style>
