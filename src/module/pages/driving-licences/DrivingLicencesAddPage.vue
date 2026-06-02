<template>
  <ErpLayout title="ERP - Add Driving Licence" :getInfo="() => getCollectionInfo(api)">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>
    <template #title-icon>
      <div class="erp-title-prepend">
        <VButton class="header-icon" rounded icon secondary @click="goBack">
          <VIcon name="arrow_back" />
        </VButton>
        <VButton class="header-icon" rounded icon secondary disabled>
          <v-icon name="card_membership" />
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
        <VIcon name="card_membership" />
        <h2 class="erp-title-display-md">Add driving licence</h2>
      </div>

      <div v-if="!hasPermission || errorMessage || successMessage" class="erp-notices-wrapper" ref="noticeWrapper">
        <VNotice v-if="!hasPermission" type="danger" icon="warning">
          You do not have permissions to create driving licences.
        </VNotice>
        <VNotice v-else-if="errorMessage" type="danger">
          {{ errorMessage }}
        </VNotice>
        <VNotice v-else-if="successMessage" type="success">
          {{ successMessage }}
        </VNotice>
      </div>

      <v-form v-if="hasPermission" v-model="formData" :fields="fieldData" />
    </div>
  </ErpLayout>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useCollection, useApi } from '@directus/extensions-sdk';
import { useRouter } from 'vue-router';
import ErpLayout from '../../layouts/ErpLayout.vue';
import CreateItemActionsMenu from '../../components/CreateItemActionsMenu.vue';
import { useCreateItem } from '../../composables/useCreateItem';
import { getCollectionInfo } from '../../composables/useDrivingLicences';
import { getBaseCountryCode } from '../../utils/baseCountryPreference';

const router = useRouter();
const api = useApi();
const collection = 'driverslicences';
const { fields } = useCollection(collection);

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Driving licences', to: '/erp/driving-licences', disabled: 'false' },
  { name: 'Add', to: '/erp/driving-licences/add', disabled: 'true' },
];

const noticeWrapper = ref<HTMLElement | null>(null);

const fieldData = computed(() => {
  const isInternationalField = fields.value?.find((f) => f.field === 'isinternational');
  return [
    { ...isInternationalField, name: 'Is International' },
    ...fields.value.filter((f) => f.field !== 'isinternational'),
  ];
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
} = useCreateItem(collection, { successMessage: 'Driving licence saved.' });

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

async function saveAndClose() {
  const ok = await save();
  if (!ok) return;
  goBack();
}

onMounted(async () => {
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
      formData.value.issuer_country = country.id;
    }
  } catch (error) {
    console.error('Failed to pre-select base country for driving licence', error);
  }
});
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

@media (min-width: 960px) {
  .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.employee-select {
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
