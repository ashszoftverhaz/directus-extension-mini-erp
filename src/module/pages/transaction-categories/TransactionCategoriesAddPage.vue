<template>
  <ErpLayout title="ERP - Add Transaction Category" :getInfo="() => getCollectionInfo(api)">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>

    <template #title-icon>
      <div class="erp-title-prepend">
        <VButton class="header-icon" rounded icon secondary @click="goBack">
          <VIcon name="arrow_back" />
        </VButton>
        <VButton class="header-icon" rounded icon secondary disabled>
          <VIcon name="category" />
        </VButton>
      </div>
    </template>

    <!-- Page actions: Create menu -->
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
      <div class="erp-form-section-header erp-no-top-margin">
        <VIcon name="category" />
        <h2 class="erp-title-display-md">Add transaction category</h2>
      </div>

      <div v-if="!hasPermission || errorMessage || successMessage" class="erp-notices-wrapper" ref="noticeWrapper">
        <VNotice v-if="!hasPermission" type="danger" icon="warning">
          You do not have permissions to create transaction categories.
        </VNotice>
        <VNotice v-else-if="errorMessage" type="danger">
          {{ errorMessage }}
        </VNotice>
        <VNotice v-else-if="successMessage" type="success">
          {{ successMessage }}
        </VNotice>
      </div>

      <VForm v-if="hasPermission" v-model="formData" :fields="fieldData" />
    </div>
  </ErpLayout>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue';
import { useCollection } from '@directus/extensions-sdk';
import { useRouter } from 'vue-router';
import ErpLayout from '../../layouts/ErpLayout.vue';
import CreateItemActionsMenu from '../../components/CreateItemActionsMenu.vue';
import { useCreateItem } from '../../composables/useCreateItem';
import { getCollectionInfo } from '../../api/transactionCategoriesApi';
import { useApi } from '@directus/extensions-sdk';

const api = useApi();
const router = useRouter();

const collection = 'transaction_categories';
const { fields } = useCollection(collection);

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Transaction Categories', to: '/erp/transaction-categories', disabled: 'false' },
  { name: 'Add', to: '/erp/transaction-categories/add', disabled: 'true' },
];

const noticeWrapper = ref<HTMLElement | null>(null);

const fieldData = computed(() => fields.value ?? []);

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
} = useCreateItem(collection, { successMessage: 'Transaction category saved.' });

watch(
  () => errorMessage.value || successMessage.value,
  async (message) => {
    if (!message) return;

    await nextTick();
    noticeWrapper.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
);

function goBack() {
  router.push('/erp/transaction-categories');
}

async function saveAndClose() {
  const ok = await save();
  if (!ok) return;
  goBack();
}
</script>

<style scoped>
</style>
