<template>
  <ErpLayout title="ERP - Add Asset Category" :getInfo="() => getCollectionInfo(api)">
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
      <div v-if="!hasPermission || errorMessage || successMessage" class="erp-notices-wrapper" ref="noticeWrapper">
        <VNotice v-if="!hasPermission" type="danger" icon="warning">
          You do not have permissions to create asset categories.
        </VNotice>
        <VNotice v-else-if="errorMessage" type="danger">
          {{ errorMessage }}
        </VNotice>
        <VNotice v-else-if="successMessage" type="success">
          {{ successMessage }}
        </VNotice>
      </div>

      <template v-if="hasPermission">
        <div class="erp-form-section-header">
          <VIcon name="category" />
          <h2 class="erp-title-display-md">Asset category information</h2>
        </div>
        <VForm v-model="formData" :fields="categoryFields" />
      </template>
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
import {
  generateAssetCategoryShortName,
  inferAssetCategoryType,
} from '../../../flows/assets/assetCategoryHelpers';
import { getCollectionInfo } from '../../api/assetCategoriesApi';

const api = useApi();
const router = useRouter();

const collection = 'asset_categories';
const { fields } = useCollection(collection);

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Asset Categories', to: '/erp/asset-categories', disabled: 'false' },
  { name: 'Add', to: '/erp/asset-categories/add', disabled: 'true' },
];

const noticeWrapper = ref<HTMLElement | null>(null);

const categoryFields = computed(() => {
  const all = fields.value ?? [];
  return all.filter((f: any) => {
    const key = String(f?.field ?? '');
    return ['asset_category_name', 'notes'].includes(key);
  });
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
} = useCreateItem(collection, { successMessage: 'Asset category saved.' });

function applyDerivedCategoryFields() {
  const data = formData.value as any;
  const name = data.asset_category_name as string | null | undefined;
  if (!name || typeof name !== 'string' || name.trim().length === 0) return;

  if (!data.short_name) {
    data.short_name = generateAssetCategoryShortName(name);
  }

  if (!data.category_type) {
    data.category_type = inferAssetCategoryType(name);
  }
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
  router.push('/erp/asset-categories');
}

async function saveAndClose() {
  applyDerivedCategoryFields();
  const ok = await rawSave();
  if (!ok) return;
  goBack();
}

async function saveAndStay() {
  applyDerivedCategoryFields();
  await rawSaveAndStay();
}

async function saveAndCreateNew() {
  applyDerivedCategoryFields();
  await rawSaveAndCreateNew();
}
</script>

<style scoped>
</style>
