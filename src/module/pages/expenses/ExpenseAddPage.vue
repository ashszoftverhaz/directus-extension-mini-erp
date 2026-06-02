<template>
  <ErpLayout title="ERP - New Expense" :getInfo="() => getCollectionInfo(api)">
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
          You do not have permissions to create expenses.
        </VNotice>
        <VNotice v-else-if="errorMessage" type="danger">
          {{ errorMessage }}
        </VNotice>
        <VNotice v-else-if="successMessage" type="success">
          {{ successMessage }}
        </VNotice>
      </div>

      <div>
        <!-- Expense details -->
        <div class="erp-form-section-header erp-no-top-margin">
          <VIcon name="service_toolbox" />
          <h2 class="erp-title-display-md">Expense Details</h2>
        </div>
        <VForm v-if="hasPermission" v-model="formData" :fields="expenseDetailsSection"  primary-key="+" />

        <!-- Finance details -->
        <div class="erp-form-section-header">
          <VIcon name="finance" />
          <h2 class="erp-title-display-md">Finance Details</h2>
        </div>
        <VForm v-if="hasPermission" v-model="formData" :fields="financeDetailsSection"  primary-key="+" />

        <!-- Payment details -->
        <div class="erp-form-section-header">
          <VIcon name="attach_money" />
          <h2 class="erp-title-display-md">Payment Details</h2>
        </div>
        <div>
          <VButton
            v-if="!isPaid && hasPermission"
            class="payment-button"
            block
            color="primary"
            @click="displayPaymentData">
            Expense is paid
          </VButton>
          <VForm v-else-if="hasPermission" v-model="formData" :fields="paymentDetailsSection"  primary-key="+" />
        </div>

        <!-- Connections -->
        <div class="erp-form-section-header">
          <VIcon name="link" />
          <h2 class="erp-title-display-md">Connections</h2>
        </div>
        <VForm v-if="hasPermission" v-model="formData" :fields="connectionsSection" primary-key="+" />
      </div>
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
import { getCollectionInfo } from '../../api/expensesApi';

const api = useApi();
const router = useRouter();
const route = useRoute();

const collection = 'expenses';
const { fields } = useCollection(collection);
const userClickedPaid = ref(false);

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Expenses', to: '/erp/expenses', disabled: 'false' },
  { name: 'Add', to: '/erp/expenses/add', disabled: 'true' },
];

const noticeWrapper = ref<HTMLElement | null>(null);

const expenseDetailsSection = computed(() => {
  const nameField = fields.value?.find((f) => f.field === 'name');
  return [
    { ...nameField, name: 'Expense name' },
    ...fields.value?.filter((f) =>
      [
        'expense_type',
        'transaction_category',
        'partner',
        'payment_due_date',
        'upload_invoices',
      ].includes(String(f.field)),
    ),
  ];
});

const financeDetailsSection = computed(() => {
  return [...fields.value?.filter((f) => ['currency', 'amount'].includes(String(f.field)))];
});

const paymentDetailsSection = computed(() => {  
  return [
    ...fields.value?.filter((f) =>
      ['payment_date', 'currency_rate', 'account'].includes(String(f.field)),
    ),
  ];
});

const connectionsSection = computed(() => {
  return [
    ...fields.value?.filter((f) =>
      ['assets', 'inventory_changes', 'employees'].includes(String(f.field)),
    ),
  ];
});

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
} = useCreateItem(collection, { successMessage: 'Expense saved.' });

watch(
  () => errorMessage.value || successMessage.value,
  async (message) => {
    if (!message) return;

    await nextTick();
    noticeWrapper.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
);

function goBack() {
  router.push('/erp/expenses');
}

onMounted(async () => {
  const locationId = route.params.id as string | undefined;
  if (!locationId) {
    errorMessage.value = 'Missing location.';
    return;
  }
  formData.value.location = locationId;

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
</script>

<style scoped>
.payment-button :deep(.button) {
  justify-content: center;
  width: calc(var(--form-column-max-width) * 2 + var(--theme--form--column-gap));
}
</style>
