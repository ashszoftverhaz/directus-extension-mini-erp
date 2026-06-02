<template>
  <ErpLayout title="ERP - Edit Expense" :getInfo="() => getCollectionInfo(api)">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>

    <template #title-icon>
      <div class="erp-title-prepend">
        <VButton class="header-icon" rounded icon secondary @click="goBack">
          <VIcon name="arrow_back" />
        </VButton>
        <VButton class="header-icon" rounded icon secondary disabled>
          <VIcon name="output_circle" />
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
      <div ref="noticeWrapper" class="erp-notices-wrapper">
        <VNotice v-if="!hasPermission" type="danger" icon="warning">
          You do not have permissions to update expenses.
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

      <div>        
        <!-- Expense details -->
        <div class="erp-form-section-header erp-no-top-margin">
          <VIcon name="service_toolbox" />
          <h2 class="erp-title-display-md">Expense Details</h2>
        </div>
        <VForm v-if="hasPermission" v-model="formData" :fields="expenseDetailsSection"
          :primary-key="(formData as any).id" />

        <!-- Finance details -->
        <div class="erp-form-section-header">
          <VIcon name="finance" />
          <h2 class="erp-title-display-md">Finance Details</h2>
        </div>
        <VForm v-if="hasPermission" v-model="formData" :fields="financeDetailsSection"
          :primary-key="(formData as any).id" />

        <!-- Payment details -->
        <div class="erp-form-section-header">
          <VIcon name="attach_money" />
          <h2 class="erp-title-display-md">Payment Details</h2>
        </div>
        <div>
          <VButton v-if="!isPaid && hasPermission" class="payment-button" block color="primary" @click="displayPaymentData">
            Expense is paid
          </VButton>
          <VForm v-else-if="hasPermission" v-model="formData" :fields="paymentDetailsSection"
            :primary-key="(formData as any).id" />
        </div>

        <!-- Connections -->
        <div class="erp-form-section-header">
          <VIcon name="link" />
          <h2 class="erp-title-display-md">Connections</h2>
        </div>
        <VForm v-if="hasPermission" v-model="formData" :fields="connectionsSection"
          :primary-key="(formData as any).id" />
      </div>
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
import { getExchangeRate } from '../../api/exchangeRateApi';
import { getTransactionStatus } from '../../utils/transactionStatus';
import { getFolderForUploadedFile } from '../../utils/fileLocationHandler';
import { getCollectionInfo } from '../../api/expensesApi';
const api = useApi();
const router = useRouter();
const route = useRoute();
const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();

const collection = 'expenses';
const { fields } = useCollection(collection);
const userClickedPaid = ref(false);

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Expenses', to: '/erp/expenses', disabled: 'false' },
  { name: 'Edit', to: route.fullPath, disabled: 'true' },
];

const noticeWrapper = ref<HTMLElement | null>(null);

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
const expenseDetailsSection = computed(() => {
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
    { ...nameField, name: 'Expense name' },
    ...fields.value?.filter((f) =>
      ['expense_type', 'transaction_category', 'partner', 'payment_due_date', 'upload_invoices'].includes(String(f.field))
    ),
  ];
})

const financeDetailsSection = computed(() => {
  return [
    ...fields.value?.filter((f) =>
      ['currency', 'amount'].includes(String(f.field))
    ),
  ];
})

const paymentDetailsSection = computed(() => {
  const paymentDateField = fields.value?.find((f) => f.field === 'payment_date');
  const currencyRateField = fields.value?.find((f) => f.field === 'currency_rate');
  const accountField = fields.value?.find((f) => f.field === 'account');
  const readonlyCurrencyRateField = currencyRateField ? { ...currencyRateField, name: 'Base Currency FX Rate', meta: { ...currencyRateField.meta, readonly: true } } : undefined;
  
  return [
    paymentDateField,
    readonlyCurrencyRateField,
    accountField,
  ];
})

const connectionsSection = computed(() => {
  return [
    ...fields.value?.filter((f) =>
      ['assets', 'inventory_changes', 'employees'].includes(String(f.field))
    ),
  ];
})

const isPaid = computed(() => {
  const paymentDate = formData.value.payment_date;
  if (paymentDate && paymentDate !== null) {
    return true;
  }

  return false || userClickedPaid.value;
});

function displayPaymentData() {
  userClickedPaid.value = true;
}


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
  router.push('/erp/expenses');
}

const deleteDialogMessage = computed(() => {
  return 'Are you sure you want to delete this expense? This action can not be undone.';
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
    errorMessages.value = [{ message: 'Missing expense id.' }];
    loading.value = false;
    return;
  }

  try {
    const response = await api.get(`/items/${collection}/${id}`, { params: { fields: ['*'] } });
    formData.value = response?.data?.data ?? {};
    (formData.value as any).status = getTransactionStatus((formData.value as any)?.payment_due_date ?? null, (formData.value as any)?.payment_date ?? null);
    await nextTick();
    initialFormData.value = JSON.parse(JSON.stringify(formData.value));
  } catch (loadError: any) {
    console.error('Failed to load expense', loadError);
    errorMessages.value = loadError?.response?.data?.errors ?? [{ message: 'Load failed.' }];
  } finally {
    loading.value = false;
  }
}

async function save() {
  errorMessages.value = [];
  successMessage.value = '';

  if (!hasPermission.value) {
    errorMessages.value = [{ message: 'You do not have permissions to update expenses.' }];
    return;
  }

  if (!canSubmit.value) {
    errorMessages.value = [{ message: 'No changes to save.' }];
    return;
  }

  const id = route.params.id as string | undefined;
  if (!id) {
    errorMessages.value = [{ message: 'Missing expense id.' }];
    return;
  }

  saving.value = true;

  try {
    delete changedFields.value.id;
    delete changedFields.value.status;
    await api.patch(`/items/${collection}/${id}`, changedFields.value);

    successMessage.value = 'Expense updated.';
    router.push('/erp/expenses');
  } catch (saveError: any) {
    console.error('Failed to update expense', JSON.stringify(saveError, null, 2));
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
    router.push('/erp/expenses');
  } catch (deleteError: any) {
    console.error('Failed to delete expense', deleteError);
    errorMessages.value = deleteError?.response?.data?.errors ?? [{ message: 'Delete failed.' }];
  } finally {
    deleting.value = false;
  }
}

onMounted(async () => {
  await loadItem();

  const locationId = formData.value.location;
  if (!locationId || typeof locationId !== 'string') {
    errorMessages.value = [{ message: 'Invalid location ID for expense.' }];
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
watch(() => route.params.id, loadItem);
watch(
  () => [formData.value.payment_date, formData.value.currency],
  async ([paymentDate, currency], [prevPaymentDate, prevCurrency]) => {
    if (paymentDate === prevPaymentDate && currency === prevCurrency) {
      return;
    }

    if (paymentDate && currency) {
      try {
        const rate = await getExchangeRate(api, new Date(paymentDate as string), currency as string);
        formData.value.currency_rate = rate;
      } catch (error) {
        formData.value.currency_rate = null;
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

.payment-button :deep(.button) {
  justify-content: center;
  width: calc(var(--form-column-max-width) * 2 + var(--theme--form--column-gap));
}
</style>
