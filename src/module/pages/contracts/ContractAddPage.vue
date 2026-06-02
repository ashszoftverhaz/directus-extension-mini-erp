<template>
  <ErpLayout title="ERP - Add Contract" :getInfo="() => getCollectionInfo(api)">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>
    <template #title-icon>
      <div class="erp-title-prepend">
        <VButton class="header-icon" rounded icon secondary @click="goBack">
          <VIcon name="arrow_back" />
        </VButton>
        <VButton class="header-icon" rounded icon secondary disabled>
          <VIcon name="contract" />
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
      <div class="erp-form-section-header erp-no-top-margin">
        <VIcon name="contract" />
        <h2 class="erp-title-display-md">Add contract</h2>
      </div>

      <div
        v-if="!hasPermission || errorMessage || successMessage"
        ref="noticeWrapper"
        class="erp-notices-wrapper">
        <VNotice v-if="!hasPermission" type="danger" icon="warning">
          You do not have permissions to create contracts.
        </VNotice>
        <VNotice v-else-if="errorMessage" type="danger">
          {{ errorMessage }}
        </VNotice>
        <VNotice v-else-if="successMessage" type="success">
          {{ successMessage }}
        </VNotice>
      </div>

      <VForm v-if="hasPermission" v-model="formData" :fields="fieldData" primary-key="+" />
    </div>
  </ErpLayout>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue';
import { useCollection, useApi } from '@directus/extensions-sdk';
import { useRouter } from 'vue-router';
import ErpLayout from '../../layouts/ErpLayout.vue';
import CreateItemActionsMenu from '../../components/CreateItemActionsMenu.vue';
import { useCreateItem } from '../../composables/useCreateItem';
import { getCollectionInfo } from '../../api/contractsApi';

const router = useRouter();

const collection = 'contracts';
const { fields } = useCollection(collection);
const api = useApi();

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Contracts', to: '/erp/contracts', disabled: 'false' },
  { name: 'Add', to: '/erp/contracts/add', disabled: 'true' },
];

const noticeWrapper = ref<HTMLElement | null>(null);

const fieldData = computed(() => {
  const base = fields.value ?? [];

  return base.map((f: any) => {
    const fieldName = typeof f === 'string' ? f : String(f?.field ?? '');
    if (fieldName !== 'status') return f;
    if (!f || typeof f !== 'object') return f;

    // Status is computed by hooks after save, so we enforce readonly here
    return {
      ...f,
      meta: {
        ...(f?.meta ?? {}),
        readonly: true,
      },
    };
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
} = useCreateItem(collection, { successMessage: 'Contract saved.' });

watch(
  () => errorMessage.value || successMessage.value,
  async (message) => {
    if (!message) return;

    await nextTick();
    noticeWrapper.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
);

function goBack() {
  router.push('/erp/contracts');
}

/**  handle partner-emloyee choice,
 * one of them (shown in the other party type field) is required,
 * if partner is selected, remove employee and vice versa*/
function handlePartnerEmployeeChoice() {
  if (!formData.value.employee && !formData.value.partner) {
    errorMessage.value =
      'Contract must be associated with either an employee or a partner. Please select either employee or partner.';
    return;
  }
  if (formData.value.other_party_type === 'employee' && !formData.value.employee) {
    errorMessage.value = 'Please select employee.';
    return;
  }
  if (formData.value.other_party_type === 'partner' && !formData.value.partner) {
    errorMessage.value = 'Please select partner.';
    return;
  }
  errorMessage.value = '';

  if (formData.value.other_party_type === 'partner') {
    formData.value.employee = null;
  } else if (formData.value.other_party_type === 'employee') {
    formData.value.partner = null;
  }
}

function checkEmailNotification() {
  if (!formData.value.email_notification) return;

  const days: string[] = (formData.value.email_notification as any);  
  for (const day of days) {
    if (!/^\d+$/.test(day)) {
      errorMessage.value = 'Notification email days must be integers.';
      return;
    }
  }
}

function saveAndStayWithPartyCheck() {
  handlePartnerEmployeeChoice();
  checkEmailNotification();
  if (errorMessage.value) return;
  saveAndStay();
}

function saveAndCreateNewWithPartyCheck() {
  handlePartnerEmployeeChoice();
  checkEmailNotification();
  if (errorMessage.value) return;
  saveAndCreateNew();
}

async function saveAndCloseWithPartyCheck() {
  handlePartnerEmployeeChoice();
  checkEmailNotification();
  if (errorMessage.value) return;
  const ok = await save();
  if (!ok) return;
  goBack();
}
</script>

<style scoped>
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}
</style>
