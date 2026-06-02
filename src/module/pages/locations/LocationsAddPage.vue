<template>
  <ErpLayout title="ERP - Add Location">
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
      <div v-if="!hasPermission || errorMessage || successMessage" class="erp-notices-wrapper" ref="noticeWrapper">
        <VNotice v-if="!hasPermission" type="danger" icon="warning">
          You do not have permissions to create locations.
        </VNotice>
        <VNotice v-else-if="errorMessage" type="danger">
          {{ errorMessage }}
        </VNotice>
        <VNotice v-else-if="successMessage" type="success">
          {{ successMessage }}
        </VNotice>
      </div>

      <template v-if="hasPermission">
        <div class="erp-form-section-header">
          <VIcon name="place" />
          <h2 class="erp-title-display-md">Location information</h2>
        </div>
        <VForm v-model="formData" :fields="fields" />
      </template>
    </div>
  </ErpLayout>
</template>

<script lang="ts" setup>
import { useApi, useCollection } from '@directus/extensions-sdk';
import { useRouter } from 'vue-router';
import ErpLayout from '../../layouts/ErpLayout.vue';
import CreateItemActionsMenu from '../../components/CreateItemActionsMenu.vue';
import { useCreateItem } from '../../composables/useCreateItem';
import { nextTick, onMounted, ref, watch } from 'vue';
import { getBaseCountryCode } from '../../utils/baseCountryPreference';

const router = useRouter();
const api = useApi();

const collection = 'erp_locations';
const { fields } = useCollection(collection);

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Locations', to: '/erp/locations', disabled: 'false' },
  { name: 'Add', to: '/erp/locations/add', disabled: 'true' },
];

const noticeWrapper = ref<HTMLElement | null>(null);

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
} = useCreateItem(collection, { successMessage: 'Location saved.' });

watch(
  () => errorMessage.value || successMessage.value,
  async (message) => {
    if (!message) return;

    await nextTick();
    noticeWrapper.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
);

function goBack() {
  router.push('/erp/locations');
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
      formData.value.country = country.id;
    }
  } catch (error) {
    console.error('Failed to pre-select base country for tax', error);
  }
});
</script>

<style scoped>
</style>
