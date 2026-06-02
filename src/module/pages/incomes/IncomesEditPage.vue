<template>
  <ErpLayout title="ERP - Edit Income" :getInfo="() => getCollectionInfo(api)">
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
      <div v-if="!hasPermission || errorMessage || successMessage" class="erp-notices-wrapper" ref="noticeWrapper">
        <VNotice v-if="!hasPermission" type="danger" icon="warning">
          You do not have permissions to update incomes.
        </VNotice>
        <VNotice v-else-if="errorMessage" type="danger">
          {{ errorMessage }}
        </VNotice>
        <VNotice v-else-if="successMessage" type="success">
          {{ successMessage }}
        </VNotice>
      </div>

      <VProgressLinear v-if="loading" indeterminate />

      <template v-if="hasPermission && !loading">
        <div class="erp-form-section-header erp-no-top-margin">
          <VIcon name="input_circle" />
          <h2 class="erp-title-display-md">Income details</h2>
        </div>
        <VForm
          v-model="formData"
          :fields="incomeDetailsSection"
          :primary-key="(formData as any)?.id" />

        <div class="erp-form-section-header">
          <VIcon name="attach_money" />
          <h2 class="erp-title-display-md">Financial details</h2>
        </div>
        <VForm
          v-model="formData"
          :fields="financialDetailsSection"
          :primary-key="(formData as any)?.id" />

        <div class="erp-form-section-header">
          <VIcon name="credit_card" />
          <h2 class="erp-title-display-md">Payment details</h2>
        </div>
        <div class="payment-section">
          <div v-if="isOverdue" class="payment-overdue-indicator">
            <VIcon name="warning_amber" class="payment-overdue-icon" />
            <div class="payment-overdue-text">
              <div class="title">This income is overdue</div>
              <div class="subtitle">
                Due on
                {{ paymentDueDateDisplay }}
              </div>
            </div>
          </div>

          <VButton
            v-if="!isPaid"
            class="payment-button"
            block
            color="primary"
            :loading="markingPaid"
            :disabled="markingPaid || !hasPermission"
            @click="markPaid">
            <VIcon name="check_circle" left />
            <span>Invoice is paid</span>
          </VButton>

          <div v-else class="payment-indicator">
            <VIcon name="check_circle" class="payment-indicator-icon" />
            <div class="payment-indicator-text">
              <div class="title">Invoice paid</div>
              <div class="subtitle">
                {{ paidAtDisplay }}
              </div>
            </div>
          </div>

          <VForm
            v-if="isPaid"
            v-model="formData"
            :fields="paymentDetailsSection"
            :primary-key="(formData as any)?.id" />
        </div>

        <div class="erp-form-section-header">
          <VIcon name="link" />
          <h2 class="erp-title-display-md">Connections</h2>
        </div>
        <VForm
          v-model="formData"
          :fields="connectionsSection"
          :primary-key="(formData as any)?.id" />
      </template>
    </div>
  </ErpLayout>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useApi, useCollection, useStores } from '@directus/extensions-sdk';
import { useRoute, useRouter } from 'vue-router';
import ErpLayout from '../../layouts/ErpLayout.vue';
import { getExchangeRate } from '../../api/exchangeRateApi';
import { getTransactionStatus } from '../../utils/transactionStatus';
import { getFolderForUploadedFile } from '../../utils/fileLocationHandler';
import { getCollectionInfo } from '../../api/incomesApi';

const api = useApi();
const router = useRouter();
const route = useRoute();
const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();

const collection = 'incomes';
const { fields } = useCollection(collection);

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Incomes', to: '/erp/incomes', disabled: 'false' },
  { name: 'Edit', to: route.fullPath, disabled: 'true' },
];

const noticeWrapper = ref<HTMLElement | null>(null);

const formData = ref<Record<string, any>>({});
const initialFormData = ref<Record<string, any> | null>(null);
const saving = ref(false);
const loading = ref(true);
const errorMessage = ref('');
const successMessage = ref('');
const markingPaid = ref(false);

const hasPermission = computed(() => permissionsStore.hasPermission(collection, 'update'));

const incomeDetailsSection = computed(() => {
  const nameField = fields.value?.find((f) => f.field === 'name');
  const statusField = {
    field: 'status',
    name: 'Status',
    meta: {
      readonly: true,
    },
  };
  return [
    statusField,
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
  const previousValue = JSON.stringify(normalizeForCompare(initialFormData.value));
  const currentValue = JSON.stringify(normalizeForCompare(formData.value));
  return previousValue !== currentValue;
});

const canSubmit = computed(() => isDirty.value);

const isPaid = computed(() => !!formData.value.payment_date);

const paidAtDisplay = computed(() => {
  const raw = formData.value.payment_date as string | null | undefined;
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
});

const paymentDueDateDisplay = computed(() => {
  const raw = formData.value.payment_due_date as string | null | undefined;
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString();
});

const isOverdue = computed(() => {
  if (formData.value.payment_date) return false;
  const raw = formData.value.payment_due_date as string | null | undefined;
  if (!raw) return false;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
});

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

async function loadItem() {
  errorMessage.value = '';
  successMessage.value = '';
  loading.value = true;
  initialFormData.value = null;

  const id = route.params.id as string | undefined;
  if (!id) {
    errorMessage.value = 'Missing income id.';
    loading.value = false;
    return;
  }

  try {
    const response = await api.get(`/items/${collection}/${id}`, {
      params: {
        fields: [
          '*',
          'connected_assets.id',
          'connected_assets.incomes_id',
          'connected_assets.assets_id.*',
        ],
      },
    });
    formData.value = response?.data?.data ?? {};
    dedupeConnectedAssets();
    (formData.value as any).status = getTransactionStatus((formData.value as any)?.payment_due_date ?? null, (formData.value as any)?.payment_date ?? null);
    await nextTick();
    initialFormData.value = JSON.parse(JSON.stringify(formData.value));
  } catch (loadError: any) {
    console.error('Failed to load income', loadError);
    errorMessage.value = loadError?.response?.data?.errors?.[0]?.message ?? 'Load failed.';
  } finally {
    loading.value = false;
  }
}

async function save() {
  errorMessage.value = '';
  successMessage.value = '';

  if (!hasPermission.value) {
    errorMessage.value = 'You do not have permissions to update incomes.';
    return;
  }

  if (!canSubmit.value) {
    errorMessage.value = 'No changes to save.';
    return;
  }

  const id = route.params.id as string | undefined;
  if (!id) {
    errorMessage.value = 'Missing income id.';
    return;
  }

  saving.value = true;

  try {
    dedupeConnectedAssets();
    const payload = { ...formData.value } as Record<string, unknown>;
    delete payload.id;
    delete payload.status;
    await api.patch(`/items/${collection}/${id}`, payload);

    successMessage.value = 'Income updated.';
    router.push('/erp/incomes');
  } catch (saveError: any) {
    console.error('Failed to update income', saveError);
    errorMessage.value = saveError?.response?.data?.errors?.[0]?.message ?? 'Update failed.';
  } finally {
    saving.value = false;
  }
}

async function markPaid() {
  if (isPaid.value) return;

  const now = new Date();
  const paymentDate = now.toISOString().slice(0, 10);

  formData.value.payment_date = paymentDate;
}

onMounted(async () => {
  await loadItem();

  const locationId = formData.value.location;
  if (!locationId || typeof locationId !== 'string') {
    errorMessage.value = 'Invalid location ID for income.';
    return;
  }
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

watch(
  () => [formData.value.payment_date, formData.value.currency],
  async ([paymentDate, currency], [prevPaymentDate, prevCurrency]) => {
    if (paymentDate === prevPaymentDate && currency === prevCurrency) {
      return;
    }

    if (paymentDate && currency) {
      try {
        const rate = await getExchangeRate(api, new Date(paymentDate as string), currency as string);
        formData.value.base_currency_fx_rate = rate;
      } catch (error) {
        formData.value.base_currency_fx_rate = null;
      }
    }
  },
);

watch(
  () => [formData.value.payment_due_date, formData.value.payment_date],
  ([paymentDueDate, paymentDate]) => {
    (formData.value as any).status = getTransactionStatus(
      paymentDueDate as string ?? null,
      paymentDate as string ?? null
    );
  }
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

.payment-overdue-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--theme--border-radius);
  border: 1px solid var(--theme--danger);
  background: color-mix(in srgb, var(--theme--danger) 8%, var(--theme--background));
  width: 100%;
}

.payment-overdue-icon {
  color: var(--theme--danger);
}

.payment-overdue-text .title {
  font-weight: 600;
  color: var(--theme--danger);
}

.payment-overdue-text .subtitle {
  font-size: 13px;
  color: var(--theme--foreground-subdued);
}
</style>
