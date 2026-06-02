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
        :can-submit="canSubmitCorrection"
        @save-primary="saveAndClose"
        @save-and-stay="saveAndStay"
        @save-and-create-new="saveAndCreateNew"
        @discard-all-changes="discardAllChangesLocal" />
    </template>

    <div class="correction-page">
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
            <h2 class="erp-title-display-md">Correction details</h2>
          </div>

          <div class="details-grid">
            <div class="field-wrapper">
              <label class="field-label">Added materials</label>
              <div class="materials-list">
                <template v-if="addedMaterials.length">
                  <VList>
                    <VListItem
                      v-for="row in addedMaterials"
                      :key="row.id"
                      type="button"
                      class="materials-item"
                      @click="openAddedMaterialsDrawer">
                      <div class="materials-row">
                        <div class="materials-main">
                          <span class="materials-quantity">{{ row.quantity }} x</span>
                          <span class="materials-text">
                            {{ formatMaterialSummary(row) }}
                          </span>
                        </div>
                        <div class="materials-actions">
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

                <div class="materials-actions-footer">
                  <VButton @click="openAddedMaterialsDrawer">Create New</VButton>
                </div>
              </div>
            </div>

            <div class="field-wrapper">
              <label class="field-label">Removed materials</label>
              <div class="materials-list">
                <template v-if="removedMaterials.length">
                  <VList>
                    <VListItem
                      v-for="row in removedMaterials"
                      :key="row.id"
                      type="button"
                      class="materials-item"
                      @click="openRemovedMaterialsDrawer">
                      <div class="materials-row">
                        <div class="materials-main">
                          <span class="materials-quantity">{{ row.quantity }} x</span>
                          <span class="materials-text">
                            {{ formatMaterialSummary(row) }}
                          </span>
                        </div>
                        <div class="materials-actions">
                          <VIcon
                            name="delete"
                            class="icon-delete"
                            @click.stop="removeRemovedMaterial(row.id)"
                            data-tooltip="Remove" />
                        </div>
                      </div>
                    </VListItem>
                  </VList>
                </template>
                <VNotice v-else type="info">
                  Removed materials will appear here. Add one with the button below.
                </VNotice>

                <div class="materials-actions-footer">
                  <VButton @click="openRemovedMaterialsDrawer">Create New</VButton>
                </div>
              </div>
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

    <AddedMaterialsDrawer
      v-model:open="removedMaterialsDrawerOpen"
      v-model:rows="removedMaterials"
      :location-id="locationId"
      mode="usage" />
  </ErpLayout>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCreateItem } from '../../composables/useCreateItem';
import ErpLayout from '../../layouts/ErpLayout.vue';
import CreateItemActionsMenu from '../../components/CreateItemActionsMenu.vue';
import AddedMaterialsDrawer from '../../components/inventory/AddedMaterialsDrawer.vue';
import type { DrawerRow } from '../../../services/inventoryTypes';
import { getCollectionInfo } from '../../api/inventoryApi';

const router = useRouter();
const route = useRoute();

const locationId = computed(() => String(route.query.locationId ?? ''));
const locationName = computed(() => String(route.query.locationName ?? ''));

const breadcrumbs = computed(() => [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Inventory', to: '/erp/inventories', disabled: 'false' },
  { name: 'New Correction', to: '/erp/inventories/correction', disabled: 'true' },
]);

const pageTitle = computed(
  () => `New Correction${locationName.value ? ` - ${locationName.value}` : ''}`,
);

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
  successMessage: 'Correction saved.',
});

const noticeWrapper = ref<HTMLElement | null>(null);

const addedMaterialsDrawerOpen = ref(false);
const removedMaterialsDrawerOpen = ref(false);

const addedMaterials = ref<DrawerRow[]>([]);
const removedMaterials = ref<DrawerRow[]>([]);

const canSubmitCorrection = computed(() => {
  if (!hasPermission.value) return false;
  if (!locationId.value) return false;
  if (addedMaterials.value.length === 0 && removedMaterials.value.length === 0) return false;
  if (saving.value) return false;
  return true;
});

watch(
  [locationId, addedMaterials, removedMaterials],
  () => {
    if (
      !locationId.value ||
      (addedMaterials.value.length === 0 && removedMaterials.value.length === 0)
    ) {
      formData.value = {};
      return;
    }

    const payload: Record<string, unknown> = {
      inventory_change_type: 'correction',
      source_location: locationId.value,
    };

    if (addedMaterials.value.length > 0) {
      payload.added_materials = addedMaterials.value.map((row: DrawerRow) => ({
        materials_id: row.materialId,
        quantity: row.quantity,
      }));
    }

    if (removedMaterials.value.length > 0) {
      payload.removed_materials = removedMaterials.value.map((row: DrawerRow) => ({
        materials_id: row.materialId,
        quantity: row.quantity,
      }));
    }

    formData.value = payload;
  },
  { deep: true, immediate: true },
);

function goBack() {
  router.push('/erp/inventories');
}

function openAddedMaterialsDrawer() {
  addedMaterialsDrawerOpen.value = true;
}

function openRemovedMaterialsDrawer() {
  removedMaterialsDrawerOpen.value = true;
}

function removeAddedMaterial(id: string) {
  addedMaterials.value = addedMaterials.value.filter((row: DrawerRow) => row.id !== id);
}

function removeRemovedMaterial(id: string) {
  removedMaterials.value = removedMaterials.value.filter((row: DrawerRow) => row.id !== id);
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

  if (!canSubmitCorrection.value) {
    if (!locationId.value) {
      errorMessage.value = 'Please select a location.';
    } else if (addedMaterials.value.length === 0 && removedMaterials.value.length === 0) {
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
  addedMaterials.value = [];
  removedMaterials.value = [];
}

function discardAllChangesLocal() {
  if (saving.value) return;
  resetNotices();
  resetForm();
  addedMaterials.value = [];
  removedMaterials.value = [];
}

watch(
  () => errorMessage.value || successMessage.value,
  async (message) => {
    if (!message) return;

    await nextTick();
    noticeWrapper.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
);
</script>

<style scoped>
.correction-page {
  background: var(--theme--background);
  padding: 20px;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px 24px;
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

.materials-list {
  margin-top: 8px;
}

.materials-item {
  margin-bottom: 8px;
  padding: 0;
  width: 100%;
}

.materials-row {
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

.materials-row:hover {
  background-color: var(
    --v-list-item-background-color-hover,
    var(--v-list-background-color-hover, var(--theme--form--field--input--background))
  );
  border: var(--theme--border-width) solid
    var(--v-list-item-border-color-hover, var(--theme--form--field--input--border-color-hover));
}

.materials-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.materials-quantity {
  font-weight: 600;
}

.materials-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.materials-actions {
  display: flex;
  align-items: center;
}

.icon-delete {
  cursor: pointer;
  color: var(--theme--danger);
  margin-left: 12px;
}

.materials-actions-footer {
  margin-top: 12px;
}
</style>
