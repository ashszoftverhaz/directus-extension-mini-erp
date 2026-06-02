<template>
  <ErpLayout title="ERP - Edit Tax" :getInfo="() => getCollectionInfo(api)">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>

    <template #title-icon>
      <div class="erp-title-prepend">
        <VButton class="header-icon" rounded icon secondary @click="goBack">
          <VIcon name="arrow_back" />
        </VButton>
        <VButton class="header-icon" rounded icon secondary disabled>
          <VIcon name="request_quote" />
        </VButton>
      </div>
    </template>

    <template #actions>
      <VButton
        icon
        rounded
        secondary
        class="action-delete"
        :loading="deleting"
        :disabled="deleting || saving || loading || !canDelete"
        @click="openDeleteDialog">
        <VIcon name="delete" />
      </VButton>

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
          You do not have permissions to update taxes.
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
          <VIcon name="description" />
          <h2 class="erp-title-display-md">Tax details</h2>
        </div>
        <VForm v-model="formData" :fields="taxDetailsFields" />

        <div class="erp-form-section-header" style="margin-top: 24px">
          <VIcon name="paid" />
          <h2 class="erp-title-display-md">Financial details</h2>
        </div>
        <VForm v-model="formData" :fields="financialDetailsFields" />
      </template>
    </div>

    <ConfirmDeleteDialog
      v-model:open="deleteDialogOpen"
      :busy="deleting"
      :message="deleteDialogMessage"
      @confirm="confirmDelete" />
  </ErpLayout>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useApi, useCollection, useStores } from '@directus/extensions-sdk';
import { useRoute, useRouter } from 'vue-router';
import ErpLayout from '../../layouts/ErpLayout.vue';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog.vue';
import { getCollectionInfo } from '../../api/taxesApi';

const api = useApi();
const router = useRouter();
const route = useRoute();
const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();

const collection = 'taxes';
const { fields } = useCollection(collection);

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Taxes', to: '/erp/taxes', disabled: 'false' },
  { name: 'Edit', to: route.fullPath, disabled: 'true' },
];

const noticeWrapper = ref<HTMLElement | null>(null);

const formData = ref<Record<string, unknown>>({});
const initialFormData = ref<Record<string, unknown> | null>(null);
const saving = ref(false);
const loading = ref(true);
const errorMessage = ref('');
const successMessage = ref('');

const deleteDialogOpen = ref(false);
const deleting = ref(false);

const hasPermission = computed(() => permissionsStore.hasPermission(collection, 'update'));
const canDelete = computed(() => permissionsStore.hasPermission(collection, 'delete'));

const allFields = computed(() => fields.value ?? []);
const currencyDisplay = ref<string>('');

const taxDetailsFields = computed(() => {
  const nameField = allFields.value.find((field: any) => field.field === 'name');
  const codeField = allFields.value.find((field: any) => field.field === 'code');
  const descriptionField = allFields.value.find((field: any) => field.field === 'description');
  const countryField = allFields.value.find((field: any) => field.field === 'country');

  const orderedFields: any[] = [];

  if (nameField) {
    orderedFields.push({
      ...nameField,
      sort: 1,
      meta: {
        ...nameField.meta,
        width: 'half',
        sort: 1,
        note: 'The name of the tax, like income tax.',
      },
    });
  }

  if (codeField) {
    orderedFields.push({
      ...codeField,
      sort: 2,
      meta: {
        ...codeField.meta,
        width: 'half',
        sort: 2,
        note: 'This short name is for internal usage. Like IT.',
      },
    });
  }

  if (descriptionField) {
    orderedFields.push({
      ...descriptionField,
      sort: 3,
      meta: {
        ...descriptionField.meta,
        width: 'full',
        sort: 3,
        note: 'You can add a description for the tax to make sure you and your colleagues know what it is.',
      },
    });
  }

  if (countryField) {
    orderedFields.push({
      ...countryField,
      sort: 4,
      meta: {
        ...countryField.meta,
        width: 'full',
        sort: 4,
        note: 'Select the country this tax applies to.',
      },
    });
  }

  return orderedFields.sort((firstField: any, secondField: any) => {
    const firstSort = firstField.sort ?? firstField.meta?.sort ?? 0;
    const secondSort = secondField.sort ?? secondField.meta?.sort ?? 0;
    return firstSort - secondSort;
  });
});

const financialDetailsFields = computed(() => {
  const taxTypeField = allFields.value.find((field: any) => field.field === 'tax_type');
  const taxValueField = allFields.value.find((field: any) => field.field === 'tax_value');

  const fieldsForSection: any[] = [];

  if (taxTypeField) {
    fieldsForSection.push({
      ...taxTypeField,
      sort: 1,
      meta: {
        ...taxTypeField.meta,
        width: 'half',
        sort: 1,
        note: "Select if it's a percentage or a fixed value.",
      },
    });
  }

  const currencyField = {
    field: 'currency_display',
    name: 'Currency',
    type: 'string',
    collection: collection,
    schema: { type: 'string', is_nullable: true },
    meta: {
      interface: 'input',
      width: 'half',
      sort: 2,
      readonly: true,
      note: 'If you have a fixed tax, we need to know the currency.',
      group: null,
    },
  };

  fieldsForSection.push(currencyField);

  if (taxValueField) {
    fieldsForSection.push({
      ...taxValueField,
      sort: 3,
      meta: {
        ...taxValueField.meta,
        width: 'full',
        sort: 3,
        note: 'If it is a percentage, then the value will be %, if fixed then the number in the given currency.',
      },
    });
  }

  return fieldsForSection.sort((firstField: any, secondField: any) => {
    const firstSort = firstField.sort ?? firstField.meta?.sort ?? 0;
    const secondSort = secondField.sort ?? secondField.meta?.sort ?? 0;
    return firstSort - secondSort;
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
  delete payload.currency_display;
  return stable(payload);
}

const isDirty = computed(() => {
  if (!initialFormData.value) return false;
  const previousValue = JSON.stringify(normalizeForCompare(initialFormData.value));
  const currentValue = JSON.stringify(normalizeForCompare(formData.value));
  return previousValue !== currentValue;
});

const canSubmit = computed(() => isDirty.value);

watch(
  () => errorMessage.value || successMessage.value,
  async (message) => {
    if (!message) return;

    await nextTick();
    noticeWrapper.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
);

function goBack() {
  router.push('/erp/taxes');
}

const deleteDialogMessage = computed(() => {
  return 'Are you sure you want to delete this tax? This action can not be undone.';
});

function openDeleteDialog() {
  if (!canDelete.value) return;
  deleteDialogOpen.value = true;
}

async function loadCurrencyForCountry(countryId: string | null | undefined) {
  if (!countryId) {
    currencyDisplay.value = '';
    return;
  }

  try {
    const response = await api.get(`/items/countries/${countryId}`, {
      params: { fields: ['default_currency.short_name', 'default_currency.name'] },
    });

    const defaultCurrency = response?.data?.data?.default_currency;
    const currencyShortName = defaultCurrency?.short_name;
    const currencyName = defaultCurrency?.name;

    if (currencyShortName && currencyName) {
      currencyDisplay.value = `${currencyShortName} - ${currencyName}`;
    } else if (currencyShortName) {
      currencyDisplay.value = currencyShortName;
    } else {
      currencyDisplay.value = '';
    }
  } catch (error) {
    console.error('Failed to load default currency for country', error);
    currencyDisplay.value = '';
  }
}

async function loadItem() {
  errorMessage.value = '';
  successMessage.value = '';
  loading.value = true;
  initialFormData.value = null;

  const id = route.params.id as string | undefined;
  if (!id) {
    errorMessage.value = 'Missing tax id.';
    loading.value = false;
    return;
  }

  try {
    const response = await api.get(`/items/${collection}/${id}`, { params: { fields: ['*'] } });
    formData.value = response?.data?.data ?? {};
    await nextTick();
    initialFormData.value = JSON.parse(JSON.stringify(formData.value));

    await loadCurrencyForCountry(formData.value.country as string | null | undefined);
  } catch (loadError: any) {
    console.error('Failed to load tax', loadError);
    errorMessage.value = loadError?.response?.data?.errors?.[0]?.message ?? 'Load failed.';
  } finally {
    loading.value = false;
  }
}

watch(
  () => formData.value.country,
  async (countryId) => {
    await loadCurrencyForCountry(countryId as string | null | undefined);
  },
);

watch(
  currencyDisplay,
  (value) => {
    formData.value.currency_display = value;
  },
  { immediate: true },
);

async function save() {
  errorMessage.value = '';
  successMessage.value = '';

  if (!hasPermission.value) {
    errorMessage.value = 'You do not have permissions to update taxes.';
    return;
  }

  if (!canSubmit.value) {
    errorMessage.value = 'No changes to save.';
    return;
  }

  const id = route.params.id as string | undefined;
  if (!id) {
    errorMessage.value = 'Missing tax id.';
    return;
  }

  saving.value = true;

  try {
    const payload = { ...formData.value } as Record<string, unknown>;
    delete payload.id;
    delete payload.currency_display;
    await api.patch(`/items/${collection}/${id}`, payload);

    successMessage.value = 'Tax updated.';
    router.push('/erp/taxes');
  } catch (saveError: any) {
    console.error('Failed to update tax', saveError);
    errorMessage.value = saveError?.response?.data?.errors?.[0]?.message ?? 'Update failed.';
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
  errorMessage.value = '';

  try {
    await api.delete(`/items/${collection}/${id}`);
    router.push('/erp/taxes');
  } catch (deleteError: any) {
    console.error('Failed to delete tax', deleteError);
    errorMessage.value = deleteError?.response?.data?.errors?.[0]?.message ?? 'Delete failed.';
  } finally {
    deleting.value = false;
  }
}

onMounted(loadItem);
watch(() => route.params.id, loadItem);
</script>

<style scoped>
.action-delete:hover :deep(.button),
.action-delete:focus-within :deep(.button) {
  background-color: var(--theme--danger);
  color: #fff;
  border: none;
}
</style>
