<template>
  <ErpLayout
    :title="`ERP New Assets Procurement - ${location?.name ?? ''}`"
    :breadcrumbs="breadcrumbs"
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
          <VIcon name="service_toolbox" />
        </VButton>
      </div>
    </template>

    <!-- Page actions: Create menu -->
    <template #actions>
      <CreateItemActionsMenu
        :saving="saving"
        :can-submit="canSubmit"
        @save-primary="saveAndCloseWithPartyCheck"
        @save-and-stay="saveAndStayWithPartyCheck"
        @save-and-create-new="saveAndCreateNewWithPartyCheck"
        @discard-all-changes="discardAllChanges" />
    </template>

    <div class="erp-upload-form">
      <div v-if="!hasPermission || errorMessage || successMessage" ref="noticeWrapper" class="erp-notices-wrapper">
        <VNotice v-if="!hasPermission" type="danger" icon="warning">
          You do not have permissions to create asset.
        </VNotice>
        <VNotice v-else-if="errorMessage" type="danger">
          {{ errorMessage }}
        </VNotice>
        <VNotice v-else-if="successMessage" type="success">
          {{ successMessage }}
        </VNotice>
      </div>

      <div>
        <div class="erp-form-section-header erp-no-top-margin">
          <VIcon name="question_exchange" />
          <h2 class="erp-title-display-md">Procurement Details</h2>
        </div>
        <VForm v-if="hasPermission" v-model="formData" :fields="procurementDetailsSection" />
      </div>

      <div class="details-section">
        <div class="erp-form-section-header">
          <VIcon name="attach_money" />
          <h2 class="erp-title-display-md">Financial details</h2>
        </div>
        <VForm v-if="hasPermission" v-model="formData" :fields="financialDetailsSection" />
      </div>

      <div class="details-section">
        <div class="erp-form-section-header">
          <VIcon name="user_attributes" />
          <h2 class="erp-title-display-md">Assignment</h2>
        </div>
        <VForm v-if="hasPermission" v-model="formData" :fields="assignmentDetailsSection" />
      </div>
    </div>
  </ErpLayout>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useApi, useCollection } from '@directus/extensions-sdk';
import { useRouter, useRoute } from 'vue-router';
import ErpLayout from '../../layouts/ErpLayout.vue';
import CreateItemActionsMenu from '../../components/CreateItemActionsMenu.vue';
import { useCreateItem } from '../../composables/useCreateItem';
import { applyBaseCurrencyToField } from '../../utils/baseCurrencyPreference';
import { getCollectionInfo } from '../../api/assetsApi';

const router = useRouter();
const api = useApi();
const route = useRoute();

const collection = 'assets';
const { fields } = useCollection(collection);
const washingLocationCollection = useCollection('washing_location');
const erpLocationCollection = useCollection('erp_locations');
const location = ref<{ id: string; name: string } | null>(null);

type AssetCategory = {
  id: string | number;
  asset_category_name?: string;
  category_type?: string;
};

const assetCategories = ref<AssetCategory[]>([]);

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Assets', to: '/erp/assets', disabled: 'false' },
  { name: 'Add', to: '/erp/assets/add', disabled: 'true' },
];

onMounted(async () => {
  try {
    const response = await api.get('/items/asset_categories', {
      params: {
        fields: ['id', 'asset_category_name', 'category_type'],
        limit: -1,
      },
    });

    assetCategories.value = response?.data?.data ?? [];
  } catch (error) {
    console.error('Failed to load asset categories', error);
    assetCategories.value = [];
  }

  const locationId = route.params.id as string | undefined;
  if (!locationId) {
    errorMessage.value = 'Missing location.';
    return;
  }

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
});

function getSelectedAssetCategory(): AssetCategory | null {
  const value = (formData.value as any)?.asset_category;
  if (!value) return null;

  const id =
    typeof value === 'object' && value !== null ? (value as { id?: string | number }).id : value;

  if (!id) return null;

  return assetCategories.value.find((category) => String(category.id) === String(id)) ?? null;
}

const procurementDetailsSection = computed(() => {
  const raw = fields.value ?? [];
  const order = [
    'name',
    'asset_category',
    'license_plate_number',
    'mileage_km',
    'useful_life_months',
    'purchase_partner',
  ];

  const selectedCategory = getSelectedAssetCategory();
  const isVehicle = selectedCategory?.category_type === 'vehicle';

  return order
    .map((key) => raw.find((f: any) => String(f.field) === key))
    .filter(Boolean)
    .map((field: any) => {
      if (!field) return field;

      if (field.field === 'license_plate_number' || field.field === 'mileage_km') {
        return {
          ...field,
          meta: {
            ...field.meta,
            hidden: !isVehicle,
          },
        };
      }

      return field;
    });
});

const financialDetailsSection = computed(() => {
  const raw = fields.value ?? [];
  const order = ['purchase_currency', 'purchase_amount', 'payment_due_date'];
  return order.map((key) => raw.find((f: any) => String(f.field) === key)).filter(Boolean);
});

const assignmentDetailsSection = computed(() => {
  const raw = fields.value ?? [];
  const order = [
    'assignment',
    'assignee_employee',
    'assignee_washing_location',
    'assignee_washing_unit',
  ];
  return order.map((key) => raw.find((f: any) => String(f.field) === key)).filter(Boolean);
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
} = useCreateItem(collection, { successMessage: 'Asset saved.' });

const noticeWrapper = ref<HTMLElement | null>(null);

onMounted(async () => {
  await applyBaseCurrencyToField(api, formData as any, 'purchase_currency');
});

let assigneeFetchRequestId = 0;

watch(
  () => formData.value?.assignee_employee,
  async (nextAssignee) => {
    if (!nextAssignee || !formData.value) return;

    // If we already have enriched account data on the assignee, avoid refetching in a loop.
    if (typeof nextAssignee === 'object' && (nextAssignee as any)?.account) {
      return;
    }

    const employeeId =
      typeof nextAssignee === 'object' && nextAssignee !== null
        ? (nextAssignee as { id?: string | number }).id
        : nextAssignee;

    if (!employeeId) return;

    const requestId = ++assigneeFetchRequestId;

    try {
      const response = await api.get(`/items/employees/${employeeId}`, {
        params: {
          fields: ['id', 'account.first_name', 'account.last_name'],
        },
      });

      if (requestId !== assigneeFetchRequestId) return;

      const account = response?.data?.data?.account;
      const normalizedAccount = {
        first_name: account?.first_name ?? '',
        last_name: account?.last_name ?? '',
      };

      const currentAssignee = formData.value.assignee_employee;
      if (
        typeof currentAssignee === 'object' &&
        currentAssignee !== null &&
        String((currentAssignee as { id?: string | number }).id) === String(employeeId)
      ) {
        formData.value.assignee_employee = {
          ...currentAssignee,
          account: normalizedAccount,
        };
        return;
      }

      if (String(currentAssignee) === String(employeeId)) {
        formData.value.assignee_employee = {
          id: employeeId,
          account: normalizedAccount,
        };
      }
    } catch (error) {
      console.error('Failed to load assignee employee account names', error);
    }
  },
);

function goBack() {
  router.push('/erp/assets');
}

/**  handle assignee choice,
 * if one of them is selected, remove others*/
function deleteUnusedAssignees() {
  if (formData.value.assignment === 'washing_unit') {
    formData.value.assignee_employee = null;
    formData.value.assignee_washing_location = null;
  } else if (formData.value.assignment === 'employee') {
    formData.value.assignee_washing_unit = null;
    formData.value.assignee_washing_location = null;
  } else if (formData.value.assignment === 'washing_location') {
    formData.value.assignee_employee = null;
    formData.value.assignee_washing_unit = null;
  }
}

function saveAndStayWithPartyCheck() {
  deleteUnusedAssignees();
  saveAndStay();
}

function saveAndCreateNewWithPartyCheck() {
  deleteUnusedAssignees();
  saveAndCreateNew();
}

async function saveAndCloseWithPartyCheck() {
  deleteUnusedAssignees();
  const ok = await save();
  if (!ok) return;
  goBack();
}

watch(
  () => errorMessage.value.length || successMessage.value,
  async (message) => {
    if (!message) return;

    await nextTick();
    noticeWrapper.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
);
</script>

<style scoped>
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.details-section {
  margin-top: 32px;
}
</style>
