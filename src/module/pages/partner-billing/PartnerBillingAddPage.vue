<template>
  <ErpLayout title="ERP - Add Billing Information" :getInfo="() => getCollectionInfo(api)">
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

    <!-- Page actions: Create menu -->
    <template #actions>
      <CreateItemActionsMenu
        :saving="saving"
        :can-submit="canSubmit"
        @save-primary="save"
        @save-and-stay="saveAndStay"
        @save-and-create-new="saveAndCreateNew"
        @discard-all-changes="discardAllChanges" />
    </template>
    
    <div class="erp-upload-form">
      <div class="erp-form-section-header erp-no-top-margin">
        <VIcon name="receipt_long" />
        <h2 class="erp-title-display-md">Add partner billing information</h2>
      </div>

      <v-notice v-if="!hasPermission" type="danger" icon="warning">
        You do not have permissions to create partner billing information.
      </v-notice>
      <v-notice v-else-if="errorMessage" ref="noticeWrapper" type="danger">
        {{ errorMessage }}
      </v-notice>
      <v-notice v-else-if="successMessage" ref="noticeWrapper" type="success">
        {{ successMessage }}
      </v-notice>

      <v-form v-if="hasPermission" v-model="formData" :fields="fieldData" />
    </div>
  </ErpLayout>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useApi, useCollection } from '@directus/extensions-sdk';
import { useRouter } from 'vue-router';
import ErpLayout from '../../layouts/ErpLayout.vue';
import { getCollectionInfo } from '../../api/billingInformationApi';
import { getBaseCountryCode } from '../../utils/baseCountryPreference';
import { useCreateItem } from '../../composables/useCreateItem';
import CreateItemActionsMenu from '../../components/CreateItemActionsMenu.vue';

const api = useApi();
const router = useRouter();
const collection = 'partner_billing_information';
const { fields } = useCollection(collection);

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Partner Billing Information', to: '/erp/partner-billing-informations', disabled: 'false' },
  { name: 'Add', to: '/erp/partner-billing-informations/add', disabled: 'true' },
];

const noticeWrapper = ref<HTMLElement | null>(null);
const fieldData = computed(() => fields.value ?? []);

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
} = useCreateItem(collection, { successMessage: 'Partner billing information saved.' });

const cancel = () => {
  router.push('/erp/partner-billing-informations');
};

watch(
  () => errorMessage.value || successMessage.value,
  async (message) => {
    if (!message) return;

    await nextTick();
    noticeWrapper.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
);

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
      formData.value.country = country.id;
    }
  } catch (error) {
    console.error('Failed to pre-select base country for partner billing information', error);
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
