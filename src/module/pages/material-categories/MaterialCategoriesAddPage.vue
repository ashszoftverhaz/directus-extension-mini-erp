<template>
  <ErpLayout title="ERP - Add Material Category" :getInfo="() => getCollectionInfo(api)">
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
      <h2 class="erp-form-title">Add material category</h2>

      <div class="erp-notices-wrapper" ref="noticeWrapper">
        <VNotice type="info" icon="info">
          Material categories represent the types or categories of products needed for a car wash.
          For example, if you need distilled water for a wash, create a "Distilled Water" category
          that groups all different products used as distilled water, regardless of their packaging
          size or brand.
        </VNotice>
        <VNotice v-if="!hasPermission" type="danger" icon="warning">
          You do not have permissions to create material categories.
        </VNotice>
        <VNotice v-else-if="errorMessage" type="danger">
          {{ errorMessage }}
        </VNotice>
        <VNotice v-else-if="successMessage" type="success">
          {{ successMessage }}
        </VNotice>
      </div>

      <template v-if="hasPermission">
        <!-- Material category information section -->
        <div class="erp-form-section-header erp-no-top-margin">
          <VIcon name="category" />
          <h2 class="erp-title-display-md">Material category information</h2>
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
import { getCollectionInfo } from '../../api/materialCategoriesApi';

const api = useApi();
const router = useRouter();

const collection = 'material_categories';
const { fields } = useCollection(collection);

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Material Categories', to: '/erp/material-categories', disabled: 'false' },
  { name: 'Add', to: '/erp/material-categories/add', disabled: 'true' },
];

const noticeWrapper = ref<HTMLElement | null>(null);

const categoryFields = computed(() => {
  const all = fields.value ?? [];
  return all.filter((f: any) => {
    const key = String(f?.field ?? '');
    return ['material_category_name', 'short_name', 'minimum_value', 'unit'].includes(key);
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
} = useCreateItem(collection, { successMessage: 'Material category saved.' });

watch(
  () => errorMessage.value || successMessage.value,
  async (message) => {
    if (!message) return;

    await nextTick();
    noticeWrapper.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
);

function goBack() {
  router.push('/erp/material-categories');
}

async function saveAndClose() {
  const ok = await save();
  if (!ok) return;
  goBack();
}
</script>

<style scoped>
</style>
