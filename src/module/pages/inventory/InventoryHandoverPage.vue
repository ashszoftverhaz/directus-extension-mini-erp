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
        :can-submit="canSubmitHandover"
        @save-primary="saveAndClose"
        @save-and-stay="saveAndStay"
        @save-and-create-new="saveAndCreateNew"
        @discard-all-changes="discardAllChangesLocal" />
    </template>

    <div class="handover-page">
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
            <h2 class="erp-title-display-md">Handover details</h2>
          </div>

          <div class="details-grid">
            <div class="field-wrapper">
              <label class="field-label">Location type</label>
              <VMenu v-model="locationTypeMenuOpen" placement="bottom-start">
                <template #activator="{ toggle }">
                  <button type="button" class="field-select-button" @click="toggle">
                    <span class="field-select-value">
                      {{ locationTypeLabel(locationType) }}
                    </span>
                    <VIcon name="arrow_drop_down" class="field-select-icon" />
                  </button>
                </template>
                <div class="location-type-menu">
                  <button
                    type="button"
                    class="location-type-option"
                    v-if="hasWashingLocationCollection"
                    :class="{ 'option-selected': locationType === 'washing_location' }"
                    @click="selectLocationType('washing_location')">
                    Fixed washing location
                  </button>
                  <button
                    type="button"
                    class="location-type-option"
                    v-if="hasWashingUnitCollection"
                    :class="{ 'option-selected': locationType === 'washing_unit' }"
                    @click="selectLocationType('washing_unit')">
                    Mobile washing unit
                  </button>
                  <div
                    v-if="!hasWashingLocationCollection && !hasWashingUnitCollection"
                    class="location-type-empty">
                    No location types available.
                  </div>
                </div>
              </VMenu>
            </div>

            <div class="field-wrapper">
              <label class="field-label">Target location / unit</label>
              <button type="button" class="field-select-button" @click="openOtherPartyDrawer">
                <span class="field-select-value">
                  {{ otherPartyLabel }}
                </span>
                <VIcon name="chevron_right" class="field-select-icon" />
              </button>
            </div>
          </div>
        </section>

        <section class="erp-form-section">
          <div class="erp-form-section-header">
            <VIcon name="output_circle" />
            <h2 class="erp-title-display-md">Removed materials</h2>
          </div>

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
        </section>
      </template>
    </div>

    <HandoverOtherPartyDrawer
      v-model:open="otherPartyDrawerOpen"
      v-model:selected-other-party="selectedOtherParty"
      :type="locationType" />

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
import { useStores } from '@directus/extensions-sdk';
import { useCreateItem } from '../../composables/useCreateItem';
import ErpLayout from '../../layouts/ErpLayout.vue';
import CreateItemActionsMenu from '../../components/CreateItemActionsMenu.vue';
import AddedMaterialsDrawer from '../../components/inventory/AddedMaterialsDrawer.vue';
import HandoverOtherPartyDrawer from '../../components/inventory/HandoverOtherPartyDrawer.vue';
import type { DrawerRow } from '../../../services/inventoryTypes';
import { getCollectionInfo } from '../../api/inventoryApi';

type LocationType = 'washing_location' | 'washing_unit';

type SelectedOtherParty = {
  id: string;
  name: string;
};

const router = useRouter();
const route = useRoute();
const noticeWrapper = ref<HTMLElement | null>(null);

const { useCollectionsStore } = useStores();
const collectionsStore = useCollectionsStore();

const hasWashingLocationCollection = computed(() =>
  collectionsStore.collections.some(
    (collection: any) =>
      collection.collection === 'washing_location' ||
      collection.collection === 'erp_locations',
  ),
);

watch(
  () => errorMessage.value || successMessage.value,
  async (message) => {
    if (!message) return;

    await nextTick();
    noticeWrapper.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
);

const hasWashingUnitCollection = computed(() =>
  collectionsStore.collections.some((collection: any) => collection.collection === 'washing_unit'),
);

const locationId = computed(() => String(route.query.locationId ?? ''));
const locationName = computed(() => String(route.query.locationName ?? ''));

const breadcrumbs = computed(() => [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Inventory', to: '/erp/inventories', disabled: 'false' },
  { name: 'New Handover', to: '/erp/inventories/handover', disabled: 'true' },
]);

const pageTitle = computed(
  () => `New Handover${locationName.value ? ` - ${locationName.value}` : ''}`,
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
  successMessage: 'Handover saved.',
});

const removedMaterialsDrawerOpen = ref(false);
const removedMaterials = ref<DrawerRow[]>([]);

const locationType = ref<LocationType | null>(null);
const locationTypeMenuOpen = ref(false);

const selectedOtherParty = ref<SelectedOtherParty | null>(null);
const otherPartyDrawerOpen = ref(false);

const canSubmitHandover = computed(() => {
  if (!hasPermission.value) return false;
  if (!locationId.value) return false;
  if (!locationType.value) return false;
  if (!selectedOtherParty.value) return false;
  if (removedMaterials.value.length === 0) return false;
  if (saving.value) return false;
  return true;
});

const otherPartyLabel = computed(() => {
  if (!locationType.value) return 'Select other party...';
  if (selectedOtherParty.value) return selectedOtherParty.value.name;
  if (locationType.value === 'washing_unit') return 'Select washing unit...';
  return 'Select washing location...';
});

watch(
  [locationId, locationType, selectedOtherParty, removedMaterials],
  () => {
    if (
      !locationId.value ||
      !locationType.value ||
      !selectedOtherParty.value ||
      removedMaterials.value.length === 0
    ) {
      formData.value = {};
      return;
    }

    const payload: Record<string, unknown> = {
      inventory_change_type: 'handover',
      source_location: locationId.value,
      removed_materials: removedMaterials.value.map((row: DrawerRow) => ({
        materials_id: row.materialId,
        quantity: row.quantity,
      })),
    };

    if (locationType.value === 'washing_unit') {
      payload.washing_unit = selectedOtherParty.value.id;
      payload.target_location = null;
    } else if (locationType.value === 'washing_location') {
      payload.target_location = selectedOtherParty.value.id;
      payload.washing_unit = null;
    }

    formData.value = payload;
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

function locationTypeLabel(type: LocationType | null): string {
  if (!type) return 'Select location type...';
  if (type === 'washing_unit') return 'Mobile washing unit';
  return 'Fixed washing location';
}

function selectLocationType(type: LocationType) {
  if (type === 'washing_unit' && !hasWashingUnitCollection.value) return;
  if (type === 'washing_location' && !hasWashingLocationCollection.value) return;
  locationType.value = type;
  selectedOtherParty.value = null;
  locationTypeMenuOpen.value = false;
}

function openOtherPartyDrawer() {
  resetNotices();
  if (!locationType.value) {
    errorMessage.value = 'Please select a location type first.';
    return;
  }
  otherPartyDrawerOpen.value = true;
}

async function performSave(): Promise<boolean> {
  resetNotices();

  if (!canSubmitHandover.value) {
    if (!locationId.value) {
      errorMessage.value = 'Please select a location.';
    } else if (!locationType.value) {
      errorMessage.value = 'Please select a location type.';
    } else if (!selectedOtherParty.value) {
      errorMessage.value = 'Please select the other party.';
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
  selectedOtherParty.value = null;
  locationType.value = null;
  removedMaterials.value = [];
}

function discardAllChangesLocal() {
  if (saving.value) return;
  resetNotices();
  resetForm();
  selectedOtherParty.value = null;
  locationType.value = null;
  removedMaterials.value = [];
}
</script>

<style scoped>
.handover-page {
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

.location-type-menu {
  display: flex;
  flex-direction: column;
  background-color: var(--theme--background);
  border-radius: var(--theme--border-radius);
  box-shadow: var(--theme--shadow-lg);
  width: 100%;
  min-width: 338px;
  max-width: none;
}

.location-type-option {
  padding: 8px 12px;
  text-align: left;
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
}

.location-type-option:hover {
  background-color: var(--theme--background-subdued);
}

.location-type-option.option-selected {
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
