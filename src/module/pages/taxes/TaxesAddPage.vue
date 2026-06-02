<template>
  <ErpLayout title="ERP - Add Tax" :getInfo="() => getCollectionInfo(api)">
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
          You do not have permissions to create taxes.
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
  </ErpLayout>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useApi, useCollection } from '@directus/extensions-sdk';
import { useRouter } from 'vue-router';
import ErpLayout from '../../layouts/ErpLayout.vue';
import CreateItemActionsMenu from '../../components/CreateItemActionsMenu.vue';
import { useCreateItem } from '../../composables/useCreateItem';
import { getBaseCountryCode } from '../../utils/baseCountryPreference';
import { getCollectionInfo } from '../../api/taxesApi';

const router = useRouter();
const api = useApi();

const collection = 'taxes';
const { fields } = useCollection(collection);

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Taxes', to: '/erp/taxes', disabled: 'false' },
  { name: 'Add', to: '/erp/taxes/add', disabled: 'true' },
];

const noticeWrapper = ref<HTMLElement | null>(null);

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
} = useCreateItem(collection, {
  successMessage: 'Tax saved.',
  excludeFields: ['currency_display'],
});

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

watch(
  () => formData.value.country,
  async (countryId) => {
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
  },
  { immediate: true },
);

watch(
  currencyDisplay,
  (value) => {
    formData.value.currency_display = value;
  },
  { immediate: true },
);

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

async function saveAndClose() {
  const saveSucceeded = await save();
  if (!saveSucceeded) return;
  goBack();
}
</script>

<style scoped>
</style>
