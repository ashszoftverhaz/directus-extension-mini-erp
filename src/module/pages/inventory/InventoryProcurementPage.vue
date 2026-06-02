<template>
  <ErpLayout :title="pageTitle" :getInfo="() => getCollectionInfo()">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>

    <template #title-icon>
      <div class="erp-title-prepend">
        <VButton class="header-icon" rounded icon secondary @click="goBack">
          <VIcon name="arrow_back" />
        </VButton>
        <VButton class="header-icon" rounded icon secondary disabled>
          <VIcon name="inventory" />
        </VButton>
      </div>
    </template>

    <template #actions>
      <CreateItemActionsMenu
        :saving="saving"
        :can-submit="canSubmitProcurement"
        @save-primary="saveAndClose"
        @save-and-stay="saveAndStay"
        @save-and-create-new="saveAndCreateNew"
        @discard-all-changes="discardAllChangesLocal" />
    </template>

    <div class="procurement-page">
      <div v-if="!hasPermission || errorMessage || successMessage" ref="noticeWrapper" class="erp-notices-wrapper">
        <VNotice v-if="!hasPermission" type="danger" icon="warning">
          You do not have permissions to create inventory changes.
        </VNotice>
        <VNotice v-else-if="errorMessage" type="danger">
          {{ errorMessage }}
        </VNotice>
        <VNotice v-else-if="successMessage" type="success">
          {{ successMessage }}
        </VNotice>
      </div>

      <template v-if="hasPermission">
        <section class="erp-form-section">
          <div class="erp-form-section-header erp-no-top-margin">
            <VIcon name="inventory" />
            <h2 class="erp-title-display-md">Procurement details</h2>
          </div>

          <div class="details-grid">
            <VForm v-model="formData" :fields="partnerField" />
          </div>
        </section>

        <section class="erp-form-section">
          <div class="erp-form-section-header">
            <VIcon name="add_shopping_cart" />
            <h2 class="erp-title-display-md">Added materials</h2>
          </div>

          <div class="added-materials-list">
            <template v-if="addedMaterials.length">
              <VList>
                <VListItem
                  v-for="row in addedMaterials"
                  :key="row.id"
                  type="button"
                  class="added-material-item"
                  @click="openAddedMaterialsDrawer">
                  <div class="added-material-row">
                    <div class="added-material-main">
                      <span class="added-material-quantity">{{ row.quantity }} x</span>
                      <span class="added-material-text">
                        {{ formatMaterialSummary(row) }}
                      </span>
                    </div>
                    <div class="added-material-actions">
                      <VIcon
                        name="delete"
                        class="icon-delete"
                        @click.stop="removeAddedMaterial(row.id)"
                        data-tooltip="Remove" />
                    </div>
                  </div>
                </VListItem>
              </VList>
            </template>
            <VNotice v-else type="info">
              Added materials will appear here. Add one with the button below.
            </VNotice>

            <div class="added-materials-actions">
              <VButton @click="openAddedMaterialsDrawer">Create New</VButton>
            </div>
          </div>
        </section>
      </template>
    </div>

    <AddedMaterialsDrawer
      v-model:open="addedMaterialsDrawerOpen"
      v-model:rows="addedMaterials"
      :location-id="locationId"
      mode="procurement" />
  </ErpLayout>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCreateItem } from '../../composables/useCreateItem';
import ErpLayout from '../../layouts/ErpLayout.vue';
import CreateItemActionsMenu from '../../components/CreateItemActionsMenu.vue';
import AddedMaterialsDrawer from '../../components/inventory/AddedMaterialsDrawer.vue';
import type { DrawerRow } from '../../../services/inventoryTypes';
import { getCollectionInfo } from '../../api/inventoryApi';
import { useCollection } from '@directus/extensions-sdk';

const router = useRouter();
const route = useRoute();
const noticeWrapper = ref<HTMLElement | null>(null);

const locationId = computed(() => String(route.query.locationId ?? ''));
const locationName = computed(() => String(route.query.locationName ?? ''));

const breadcrumbs = computed(() => [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Inventory', to: '/erp/inventories', disabled: 'false' },
  { name: 'New Procurement', to: '/erp/inventories/procurement', disabled: 'true' },
]);

const pageTitle = computed(
  () => `New Procurement${locationName.value ? ` - ${locationName.value}` : ''}`,
);


const { fields } = useCollection('inventory_changes');
const partnerField = computed(() => { 
  const field = fields.value?.find((f: any) => f.field === 'partner');
  return [field];
});

const {
  formData,
  saving,
  errorMessage,
  successMessage,
  hasPermission,
  resetNotices,
  resetForm,
  save,
} = useCreateItem('inventory_changes', {
  successMessage: 'Procurement saved.',
});

const addedMaterialsDrawerOpen = ref(false);

const addedMaterials = ref<DrawerRow[]>([]);

const canSubmitProcurement = computed(() => {
  if (!hasPermission.value) return false;
  if (!locationId.value) return false;
  if (!formData.value.partner) return false;
  if (addedMaterials.value.length === 0) return false;
  if (saving.value) return false;
  return true;
});

watch(
  () => errorMessage.value || successMessage.value,
  async (message) => {
    if (!message) return;

    await nextTick();
    noticeWrapper.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
);

watch(
  [locationId, addedMaterials],
  () => {
    if (!locationId.value || addedMaterials.value.length === 0) {
      formData.value = {};
      return;
    }

    formData.value = {
      ...formData.value,
      inventory_change_type: 'procurement',
      source_location: locationId.value,
      added_materials: addedMaterials.value.map((row: DrawerRow) => ({
        materials_id: row.materialId,
        quantity: row.quantity,
      })),
    };
  },
  { deep: true, immediate: true },
);

function goBack() {
  router.push('/erp/inventories');
}

function openAddedMaterialsDrawer() {
  addedMaterialsDrawerOpen.value = true;
}

function removeAddedMaterial(id: string) {
  addedMaterials.value = addedMaterials.value.filter((row: DrawerRow) => row.id !== id);
}

function formatMaterialSummary(row: DrawerRow): string {
  const base = row.materialName || 'Unknown material';
  const size = row.packageSize != null && row.packageSize !== null ? String(row.packageSize) : null;
  const sku = row.sku ? `(${row.sku})` : null;

  if (size && sku) return `${base} - ${size} ${sku}`;
  if (size) return `${base} - ${size}`;
  if (sku) return `${base} ${sku}`;
  return base;
}

async function performSave(): Promise<boolean> {
  resetNotices();

  if (!canSubmitProcurement.value) {
    if (!formData.value.partner) {
      errorMessage.value = 'Please select a partner for this procurement.';
    } else if (!locationId.value) {
      errorMessage.value = 'Please select a location.';
    } else if (addedMaterials.value.length === 0) {
      errorMessage.value = 'Please add at least one material.';
    } else {
      errorMessage.value = 'Please check the form and try again.';
    }
    return false;
  }

  const ok = await save();
  return ok;
}

async function saveAndClose() {
  const ok = await performSave();
  if (!ok) return;
  goBack();
}

async function saveAndStay() {
  await performSave();
}

async function saveAndCreateNew() {
  const ok = await performSave();
  if (!ok) return;
  resetForm();
  formData.value.partner = null;
  addedMaterials.value = [];
}

function discardAllChangesLocal() {
  if (saving.value) return;
  resetNotices();
  resetForm();
  formData.value.partner = null;
  addedMaterials.value = [];
}

onMounted(() => {
  if (route.query.openDrawer) {
    addedMaterialsDrawerOpen.value = true;
  }
});
</script>

<style scoped>
.procurement-page {
  background: var(--theme--background);
  padding: 20px;
  padding-top: 0;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px 24px;
  width: 100%;
}

.details-grid :deep(.v-form),
.details-grid :deep(form) {
  width: 100%;
  max-width: none !important;
  grid-template-columns: minmax(0, 1fr) !important;
}

.details-grid :deep(.v-form > *),
.details-grid :deep(form > *) {
  width: 100%;
  max-width: none;
}

.details-grid :deep(.field) {
  width: 100%;
  grid-column: 1 / -1 !important;
}

.field-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 14px;
  font-weight: 600;
}

.field-display {
  padding: var(--theme--form--field--input--padding);
  border-radius: var(--theme--border-radius);
  border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
  background-color: var(--theme--form--field--input--background);
  font-size: 14px;
}

.field-help {
  font-size: 13px;
  color: var(--theme--foreground-subdued);
}

.field-select-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--theme--form--field--input--padding);
  border-radius: var(--theme--border-radius);
  border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
  background-color: var(--theme--form--field--input--background);
  cursor: pointer;
  transition: border-color 160ms ease;
}

.field-select-button:hover {
  border-color: var(--theme--form--field--input--border-color-hover);
}

.field-select-value {
  flex: 1;
  text-align: left;
}

.field-select-icon {
  color: var(--theme--foreground-subdued);
}

.added-materials-list {
  margin-top: 8px;
}

.added-material-item {
  margin-bottom: 8px;
  padding: 0;
  width: 100%;
}

.added-material-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  block-size: var(--theme--form--field--input--height);
  padding: var(--theme--form--field--input--padding);
  color: var(--v-input-color, var(--theme--form--field--input--foreground));
  font-family: var(--v-input-font-family, var(--theme--fonts--sans--font-family));
  background-color: var(--v-input-background-color, var(--theme--form--field--input--background));
  border: var(--theme--border-width) solid
    var(--v-input-border-color, var(--theme--form--field--input--border-color));
  border-radius: var(--v-input-border-radius, var(--theme--border-radius));
  transition: var(--fast) var(--transition);
  transition-property: border-color, box-shadow, background-color;
}

.added-material-row:hover {
  background-color: var(
    --v-list-item-background-color-hover,
    var(--v-list-background-color-hover, var(--theme--form--field--input--background))
  );
  border: var(--theme--border-width) solid
    var(--v-list-item-border-color-hover, var(--theme--form--field--input--border-color-hover));
}

.added-material-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.added-material-quantity {
  font-weight: 600;
}

.added-material-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.added-material-actions {
  display: flex;
  align-items: center;
}

.icon-delete {
  cursor: pointer;
  color: var(--theme--danger);
  margin-left: 12px;
}

.added-materials-actions {
  margin-top: 12px;
}
</style>
