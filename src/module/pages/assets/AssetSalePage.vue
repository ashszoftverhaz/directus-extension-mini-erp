<template>
  <ErpLayout :title="`ERP - New Asset Sale - ${location?.name ?? ''}`"
    :getInfo="() => getCollectionInfo(api)">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>

    <template #title-icon>
      <div class="erp-title-prepend">
        <VButton class="header-icon" rounded icon secondary @click="goBack">
          <VIcon name="arrow_back" />
        </VButton>
        <VButton class="header-icon" rounded icon secondary disabled>
          <VIcon name="input_circle" />
        </VButton>
      </div>
    </template>

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
      <div v-if="!hasPermission || errorMessage || successMessage" ref="noticeWrapper" class="erp-notices-wrapper">
        <VNotice v-if="!hasPermission" type="danger" icon="warning">
          You do not have permissions to create incomes.
        </VNotice>
        <VNotice v-else-if="errorMessage" type="danger">
          {{ errorMessage }}
        </VNotice>
        <VNotice v-else-if="successMessage" type="success">
          {{ successMessage }}
        </VNotice>
      </div>

      <template v-if="hasPermission">
        <div class="erp-form-section-header erp-no-top-margin">
          <VIcon name="question_exchange" />
          <h2 class="erp-title-display-md">Sale details</h2>
        </div>
        <VForm v-model="formData" :fields="saleDetailsSection" primary-key="+" />

        <div class="erp-form-section-header">
          <VIcon name="attach_money" />
          <h2 class="erp-title-display-md">Financial details</h2>
        </div>
        <VForm v-model="formData" :fields="financialDetailsSection" />        
      </template>
    </div>
  </ErpLayout>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useApi, useCollection } from '@directus/extensions-sdk';
import { useRoute, useRouter } from 'vue-router';
import ErpLayout from '../../layouts/ErpLayout.vue';
import CreateItemActionsMenu from '../../components/CreateItemActionsMenu.vue';
import { useCreateItem } from '../../composables/useCreateItem';
import { applyBaseCurrencyToField } from '../../utils/baseCurrencyPreference';
import { getCollectionInfo } from '../../api/assetsApi';

const api = useApi();
const router = useRouter();
const route = useRoute();
const collection = 'incomes';
const { fields } = useCollection(collection);
const washingLocationCollection = useCollection('washing_location');
const erpLocationCollection = useCollection('erp_locations');
const location = ref<{ id: string; name: string } | null>(null);
const noticeWrapper = ref<HTMLElement | null>(null);

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Assets', to: '/erp/assets', disabled: 'false' },
  { name: 'Sale', to: '/erp/assets/sale', disabled: 'false' },
];

const saleDetailsSection = computed(() => {
  const assetField = fields.value?.find((f) => f.field === 'connected_assets');
  if (!assetField) {
    errorMessage.value = 'Missing assets.';
    return;
  }
  return [{ 
    ...assetField, 
    name: 'Asset to be sold', 
    meta: { 
      ...assetField.meta, 
      options:{ template: "{{assets_id.code}} — {{assets_id.name}}" } } }] as any[];
});

watch(
  () => errorMessage.value || successMessage.value,
  async (message) => {
    if (!message) return;

    await nextTick();
    noticeWrapper.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
);

const financialDetailsSection = computed(() => {
  const currencyField = fields.value?.find((f) => f.field === 'currency');
  const amountField = fields.value?.find((f) => f.field === 'amount');
  const paymentDueDateField = fields.value?.find((f) => f.field === 'payment_due_date');
  return [{
    ...currencyField,
    meta: {
      ...currencyField?.meta,
      sort: 1,
    },
  }, {
    ...amountField,
    meta: {
      ...amountField?.meta,
      sort: 2,
    },
  }, {
    ...paymentDueDateField,
    meta: {
      ...paymentDueDateField?.meta,
      sort: 3,
      width: 'full',
    },
  }].filter(Boolean) as any[];
});

const {
  formData,
  saving,
  errorMessage,
  successMessage,
  hasPermission,
  canSubmit,
  save: rawSave,
  saveAndStay: rawSaveAndStay,
  saveAndCreateNew: rawSaveAndCreateNew,
  discardAllChanges,
} = useCreateItem(collection, {
  successMessage: 'Asset sale saved.',
});

onMounted(async () => {
  (formData.value as any).income_type = 'asset';
  await applyBaseCurrencyToField(api, formData as any, 'currency');

  const locationId = route.params.id as string | undefined;
  if (!locationId) {
    errorMessage.value = 'Missing location.';
    return;
  }

  (formData.value as any).location = locationId;
  if (washingLocationCollection.info.value) {
    try {
      const response = await api.get(`/items/washing_location/${locationId}`, {
        params: {
          fields: ['id', 'name'],
        },
      });

      location.value = response?.data?.data ?? null;
      formData.value.location = location.value?.id ?? null;
    } catch (error) {
      console.error('Failed to load washing location', error);
      location.value = null;
      errorMessage.value = 'Missing location.';
    } finally {
      return;
    }
  }

  if (erpLocationCollection.info.value) {
    try {
      const response = await api.get(`/items/erp_locations/${locationId}`, {
        params: {
          fields: ['id', 'name'],
        },
      });

      location.value = response?.data?.data ?? null;
      formData.value.location = location.value?.id ?? null;
    } catch (error) {
      console.error('Failed to load ERP location', error);
      location.value = null;
      errorMessage.value = 'Missing location.';
    } finally {
      return;
    }
  }

  await applyBaseCurrencyToField(api, formData as any, 'currency');
});

function goBack() {
  router.push('/erp/assets');
}

async function deleteAssets() {  
  const connectedAssets = formData.value.connected_assets;
  (formData.value as any).name = `Sale of asset(s)`;

  for (const entry of (connectedAssets as any).create as any[]) {
    const assetsId = (entry as any).assets_id;
    let id: string | null = null;
    if (typeof assetsId === 'string') {
      id = assetsId;
    } else if (assetsId && typeof assetsId === 'object' && 'id' in assetsId) {
      const maybe = (assetsId as any).id;
      if (typeof maybe === 'string') id = maybe;
    }
    if (!id) continue;

    try {
      await api.delete(`/items/assets/${id}`);
      formData.value.connected_assets = null;
    } catch (error) {
      console.error(`Failed to delete asset with id ${id}`, error);
    }
  }
}

async function saveAndClose() {
  await deleteAssets();
  const ok = await rawSave();
  if (!ok) return;
  goBack();
}

async function saveAndStay() {
  await deleteAssets();
  await rawSaveAndStay();
}

async function saveAndCreateNew() {
  await deleteAssets();
  await rawSaveAndCreateNew();
}
</script>

<style scoped>
.payment-section {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-inline-size: calc(var(--form-column-max-width) * 2 + var(--theme--form--column-gap));
}

.payment-button :deep(.button) {
  justify-content: center;
  width: calc(var(--form-column-max-width) * 2 + var(--theme--form--column-gap));
}

.payment-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--theme--border-radius);
  border: 1px solid var(--theme--success);
  background: color-mix(in srgb, var(--theme--success) 8%, var(--theme--background));
  width: 100%;
}

.payment-indicator-icon {
  color: var(--theme--success);
}

.payment-indicator-text .title {
  font-weight: 600;
}

.payment-indicator-text .subtitle {
  font-size: 13px;
  color: var(--theme--foreground-subdued);
}
</style>
