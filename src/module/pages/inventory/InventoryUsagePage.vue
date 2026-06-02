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
        :can-submit="canSubmitUsage"
        @save-primary="saveAndClose"
        @save-and-stay="saveAndStay"
        @save-and-create-new="saveAndCreateNew"
        @discard-all-changes="discardAllChangesLocal" />
    </template>

    <div class="usage-page">
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
            <h2 class="erp-title-display-md">Usage details</h2>
          </div>

          <div class="details-grid">
            <div class="field-wrapper">
              <label class="field-label">Removed materials</label>
              <div class="removed-materials-list">
                <template v-if="removedMaterials.length">
                  <VList>
                    <VListItem
                      v-for="row in removedMaterials"
                      :key="row.id"
                      type="button"
                      class="removed-material-item"
                      @click="openRemovedMaterialsDrawer">
                      <div class="removed-material-row">
                        <div class="removed-material-main">
                          <span class="removed-material-quantity">{{ row.quantity }} x</span>
                          <span class="removed-material-text">
                            {{ formatMaterialSummary(row) }}
                          </span>
                        </div>
                        <div class="removed-material-actions">
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

                <div class="removed-materials-actions">
                  <VButton @click="openRemovedMaterialsDrawer">Create New</VButton>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>

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
const noticeWrapper = ref<HTMLElement | null>(null);

const locationId = computed(() => String(route.query.locationId ?? ''));
const locationName = computed(() => String(route.query.locationName ?? ''));

const breadcrumbs = computed(() => [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Inventory', to: '/erp/inventories', disabled: 'false' },
  { name: 'New Usage', to: '/erp/inventories/usage', disabled: 'true' },
]);

const pageTitle = computed(
  () => `New Usage${locationName.value ? ` - ${locationName.value}` : ''}`,
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
  successMessage: 'Usage saved.',
});

const removedMaterialsDrawerOpen = ref(false);
const removedMaterials = ref<DrawerRow[]>([]);

const canSubmitUsage = computed(() => {
  if (!hasPermission.value) return false;
  if (!locationId.value) return false;
  if (removedMaterials.value.length === 0) return false;
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
  [locationId, removedMaterials],
  () => {
    if (!locationId.value || removedMaterials.value.length === 0) {
      formData.value = {};
      return;
    }

    formData.value = {
      inventory_change_type: 'usage',
      source_location: locationId.value,
      removed_materials: removedMaterials.value.map((row: DrawerRow) => ({
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

function openRemovedMaterialsDrawer() {
  removedMaterialsDrawerOpen.value = true;
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

  if (!canSubmitUsage.value) {
    if (!locationId.value) {
      errorMessage.value = 'Please select a location.';
    } else if (removedMaterials.value.length === 0) {
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
  removedMaterials.value = [];
}

function discardAllChangesLocal() {
  if (saving.value) return;
  resetNotices();
  resetForm();
  removedMaterials.value = [];
}
</script>

<style scoped>
.usage-page {
  background: var(--theme--background);
  padding: 20px;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
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

.removed-materials-list {
  margin-top: 8px;
}

.removed-material-item {
  margin-bottom: 8px;
  padding: 0;
  width: 100%;
}

.removed-material-row {
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

.removed-material-row:hover {
  background-color: var(
    --v-list-item-background-color-hover,
    var(--v-list-background-color-hover, var(--theme--form--field--input--background))
  );
  border: var(--theme--border-width) solid
    var(--v-list-item-border-color-hover, var(--theme--form--field--input--border-color-hover));
}

.removed-material-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.removed-material-quantity {
  font-weight: 600;
}

.removed-material-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.removed-material-actions {
  display: flex;
  align-items: center;
}

.icon-delete {
  cursor: pointer;
  color: var(--theme--danger);
  margin-left: 12px;
}

.removed-materials-actions {
  margin-top: 12px;
}
</style>
