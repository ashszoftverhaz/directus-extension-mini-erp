<template>
  <ErpLayout title="ERP - Add Income" :getInfo="() => getCollectionInfo(api)">
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
      <div v-if="!hasPermission || errorMessage || successMessage" class="erp-notices-wrapper" ref="noticeWrapper">
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
          <VIcon name="input_circle" />
          <h2 class="erp-title-display-md">Income details</h2>
        </div>
        <VForm v-model="formData" :fields="incomeDetailsSection" primary-key="+" />

        <div class="erp-form-section-header">
          <VIcon name="attach_money" />
          <h2 class="erp-title-display-md">Financial details</h2>
        </div>
        <VForm v-model="formData" :fields="financialDetailsSection" />

        <div class="erp-form-section-header">
          <VIcon name="credit_card" />
          <h2 class="erp-title-display-md">Payment details</h2>
        </div>
        <div class="payment-section">
          <VButton
            class="payment-button"
            block
            color="primary"
            :disabled="isPaid"
            @click="markPaidLocally">
            <VIcon name="check_circle" left />
            <span>Invoice is paid</span>
          </VButton>

          <div v-if="isPaid" class="payment-indicator">
            <VIcon name="check_circle" class="payment-indicator-icon" />
            <div class="payment-indicator-text">
              <div class="title">Invoice marked as paid</div>
              <div class="subtitle">
                {{ paidAtDisplay }}
              </div>
            </div>
          </div>

          <VForm v-if="isPaid" v-model="formData" :fields="paymentDetailsSection" />
        </div>

        <div class="erp-form-section-header">
          <VIcon name="link" />
          <h2 class="erp-title-display-md">Connections</h2>
        </div>
        <VForm v-model="formData" :fields="connectionsSection" primary-key="+" />
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
import { getExchangeRate } from '../../api/exchangeRateApi';
import { getFolderForUploadedFile } from '../../utils/fileLocationHandler';
import { getCollectionInfo } from '../../api/incomesApi';

const api = useApi();
const router = useRouter();
const route = useRoute();
const collection = 'incomes';
const { fields } = useCollection(collection);

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Incomes', to: '/erp/incomes', disabled: 'false' },
  { name: 'Add', to: '/erp/incomes/add', disabled: 'true' },
];

const noticeWrapper = ref<HTMLElement | null>(null);

const incomeDetailsSection = computed(() => {
  const nameField = fields.value?.find((f) => f.field === 'name');
  return [
    nameField
      ? {
          ...nameField,
          name: 'Income name',
        }
      : undefined,
    ...(fields.value?.filter((f) =>
      [
        'income_type',
        'transaction_category',
        'from_partner',
        'payment_due_date',
        'upload_invoices',
      ].includes(String(f.field)),
    ) ?? []),
  ].filter(Boolean) as any[];
});

const financialDetailsSection = computed(() => {
  return fields.value?.filter((f) => ['currency', 'amount'].includes(String(f.field))) ?? [];
});

const paymentDetailsSection = computed(() => {
  const paymentDateField = fields.value?.find((f) => f.field === 'payment_date');
  const currencyRateField = fields.value?.find((f) => f.field === 'base_currency_fx_rate');
  const accountField = fields.value?.find((f) => f.field === 'account');
  const readonlyCurrencyRateField = currencyRateField
    ? { ...currencyRateField, meta: { ...currencyRateField.meta, readonly: true } }
    : undefined;

  return [paymentDateField, readonlyCurrencyRateField, accountField];
});

const connectionsSection = computed(() => {
  return (
    fields.value?.filter((f) =>
      ['connected_assets', 'connected_inventory_changes', 'connected_employees'].includes(
        String(f.field),
      ),
    ) ?? []
  );
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
  successMessage: 'Income saved.',
});

onMounted(async () => {
  const locationId = route.query.location as string | undefined;
  if (!locationId) {
    errorMessage.value = 'Missing location.';
    return;
  }

  (formData.value as any).location = locationId;

  await applyBaseCurrencyToField(api, formData as any, 'currency');

  const invoiceFolderId = await getFolderForUploadedFile(locationId, api);

  const locationField = fields.value?.filter((f) => f.field === 'upload_invoices')[0];
  if (!locationField) return;
  if (locationField.meta) {
    locationField.meta = {
      ...locationField.meta,
      options: { enableSelect: false, folder: invoiceFolderId }
    };
  } else {
    locationField.meta = {
      options: { enableSelect: false, folder: invoiceFolderId }
    } as any;
  }
});

const isPaid = computed(() => !!formData.value.payment_date);

const paidAtDisplay = computed(() => {
  const raw = formData.value.payment_date as string | null | undefined;
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  return `Paid on ${d.toLocaleDateString()}`;
});

function markPaidLocally() {
  if (isPaid.value) return;
  const now = new Date();
  formData.value.payment_date = now.toISOString().slice(0, 10);
}

watch(
  () => errorMessage.value || successMessage.value,
  async (message) => {
    if (!message) return;

    await nextTick();
    noticeWrapper.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
);

function goBack() {
  router.push('/erp/incomes');
}

function dedupeConnectedAssets() {
  const value = formData.value.connected_assets as unknown;
  if (!Array.isArray(value)) return;

  const byAssetId = new Map<string, any>();

  for (const entry of value) {
    if (!entry) continue;
    const assetsId = (entry as any).assets_id;
    let id: string | null = null;
    if (typeof assetsId === 'string') {
      id = assetsId;
    } else if (assetsId && typeof assetsId === 'object' && 'id' in assetsId) {
      const maybe = (assetsId as any).id;
      if (typeof maybe === 'string') id = maybe;
    }
    if (!id) continue;
    if (!byAssetId.has(id)) {
      byAssetId.set(id, entry);
    }
  }

  formData.value.connected_assets = Array.from(byAssetId.values());
}

async function saveAndClose() {
  dedupeConnectedAssets();
  const ok = await rawSave();
  if (!ok) return;
  goBack();
}

async function saveAndStay() {
  dedupeConnectedAssets();
  await rawSaveAndStay();
}

async function saveAndCreateNew() {
  dedupeConnectedAssets();
  await rawSaveAndCreateNew();
}

watch(
  () => [formData.value.payment_date, formData.value.currency],
  async ([paymentDate, currency], [prevPaymentDate, prevCurrency]) => {
    if (paymentDate === prevPaymentDate && currency === prevCurrency) {
      return;
    }

    if (paymentDate && currency) {
      try {console.log('Fetching exchange rate for', paymentDate, currency);
        const rate = await getExchangeRate(api, new Date(paymentDate as string), currency as string);
        formData.value.base_currency_fx_rate = rate;
      } catch (error) {
        formData.value.base_currency_fx_rate = null;
      }
    }
  },
);
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
