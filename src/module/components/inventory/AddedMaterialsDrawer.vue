<template>
  <VDrawer v-model="openModel" direction="right" @cancel="close">
    <template #title>
      <div class="header">
        <div class="header-title">
          <h1 class="type-title">
            {{ modeTitle }}
          </h1>
        </div>
      </div>
    </template>

    <template #actions>
      <VButton icon rounded @click="confirm" :disabled="rowsInternal.length === 0">
        <VIcon name="check" />
      </VButton>
    </template>

    <div class="drawer-content">
      <VProgressLinear v-if="loading" indeterminate />
      <VNotice v-else-if="error" type="danger">
        Failed to load materials for this location.
      </VNotice>
      <VNotice v-else-if="!locationId">
        Please start procurement from a specific location.
      </VNotice>
      <VNotice v-else-if="materialsInventory.length === 0" type="info">
        There are no materials defined yet.
      </VNotice>

      <div v-else class="materials-table-wrapper">
        <table v-if="rowsInternal.length" class="materials-table" summary="Added materials">
          <thead>
            <tr>
              <th class="col-direction">Direction</th>
              <th class="col-current">Current</th>
              <th class="col-material">Material</th>
              <th class="col-quantity">Quantity</th>
              <th class="col-actions"></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="row in rowsInternal" :key="row.id">
              <tr :class="rowClasses(row)">
                <td class="col-direction">
                  <div class="field field-readonly">
                    <span class="field-text">{{ directionLabel }}</span>
                    <VIcon :name="directionIcon" class="field-icon-right" />
                  </div>
                </td>
                <td class="col-current">
                  <div class="field field-readonly">
                    <span class="field-text">{{ currentQuantity(row.materialId) }}</span>
                  </div>
                </td>
                <td class="col-material">
                  <VMenu
                    v-model="materialMenuOpen[row.id]"
                    :close-on-content-click="false"
                    placement="bottom-start">
                    <template #activator="{ toggle }">
                      <button type="button" class="field field-select" @click="toggle">
                        <span class="field-text">
                          {{ materialLabel(row.materialId) || 'Select material...' }}
                        </span>
                        <VIcon name="arrow_drop_down" class="field-icon-right" />
                      </button>
                    </template>
                    <div class="material-menu">
                      <div class="material-menu-search">
                        <VIcon name="search" class="icon-search" />
                        <input
                          v-model="materialSearch"
                          type="search"
                          placeholder="Search materials..."
                          class="material-search-input" />
                      </div>
                      <div class="material-menu-list">
                        <button
                          v-for="mat in filteredMaterials"
                          :key="mat.id"
                          type="button"
                          class="material-menu-item"
                          :class="{ 'material-menu-item-warning': isBelowMinimum(mat) }"
                          @click="selectMaterial(row.id, mat.id)">
                          <span class="material-menu-text">
                            {{ buildMaterialDisplay(mat) }}
                          </span>
                          <VIcon v-if="isBelowMinimum(mat)" name="error" class="icon-warning" />
                        </button>
                      </div>
                    </div>
                  </VMenu>
                </td>
                <td class="col-quantity">
                  <div class="field field-quantity">
                    <input
                      v-model.number="row.quantity"
                      type="number"
                      min="1"
                      class="quantity-input-field" />
                    <div class="quantity-buttons">
                      <button
                        type="button"
                        class="quantity-btn"
                        :disabled="!canIncrease(row)"
                        @click="increase(row)">
                        <VIcon name="keyboard_arrow_up" />
                      </button>
                      <button
                        type="button"
                        class="quantity-btn"
                        :disabled="!canDecrease(row)"
                        @click="decrease(row)">
                        <VIcon name="keyboard_arrow_down" />
                      </button>
                    </div>
                  </div>
                </td>
                <td class="col-actions">
                  <button
                    type="button"
                    class="delete-button"
                    @click="removeRow(row.id)"
                    data-tooltip="Delete">
                    <VIcon name="delete" />
                  </button>
                </td>
              </tr>
              <tr v-show="rowWarningText(row)" class="row-warning-note">
                <td colspan="5" class="below-minimum-note">
                  {{ rowWarningText(row) }}
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <div v-else class="drawer-empty-note">
          {{ emptyTableText }}
        </div>

        <div class="table-footer">
          <VButton @click="addRow">Add new material</VButton>
        </div>
      </div>
    </div>
  </VDrawer>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import type { InventoryListItem } from '../../types/inventory';
import { getMaterialsInventoryForLocation } from '../../api/inventoryApi';
import {
  getModeConfig,
  getEmptyTableText,
  getModeBehavior,
  type InventoryModeBehavior,
} from '../../../services/inventoryDrawerHelpers';
import type { DrawerMode, DrawerRow } from '../../../services/inventoryTypes';

const props = withDefaults(
  defineProps<{
    open: boolean;
    rows: DrawerRow[];
    locationId: string;
    mode: DrawerMode;
  }>(),
  {
    rows: () => [],
    locationId: '',
    mode: 'procurement',
  },
);

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'update:rows', value: DrawerRow[]): void;
}>();

const api = useApi();

const openModel = computed<boolean>({
  get() {
    return props.open;
  },
  set(val: boolean) {
    emit('update:open', val);
  },
});

const loading = ref(false);
const error = ref(false);
const materialsInventory = ref<InventoryListItem[]>([]);

const rowsInternal = ref<DrawerRow[]>([]);
const materialMenuOpen = reactive<Record<string, boolean>>({});
const materialSearch = ref('');

const modeConfig = computed(() => getModeConfig(props.mode));
const modeBehavior = computed<InventoryModeBehavior>(() => getModeBehavior(props.mode));
const modeTitle = computed(() => modeConfig.value.title);
const directionLabel = computed(() => modeConfig.value.directionLabel);
const directionIcon = computed(() => modeConfig.value.directionIcon);
const emptyTableText = computed(() => getEmptyTableText(props.mode));

watch(
  () => props.rows,
  (val) => {
    rowsInternal.value = val.map((r) => ({ ...r }));
  },
  { immediate: true },
);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.locationId) {
      loadMaterials();
    }
  },
);

async function loadMaterials() {
  if (!props.locationId) return;
  loading.value = true;
  error.value = false;
  try {
    const result = await getMaterialsInventoryForLocation(api, props.locationId);
    materialsInventory.value = result;
  } catch (e) {
    console.error('Failed to load materials inventory', e);
    error.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (props.open && props.locationId) {
    loadMaterials();
  }
});

function close() {
  openModel.value = false;
}

function confirm() {
  const sanitized = rowsInternal.value
    .filter((r) => {
      if (!r.materialId || r.quantity < 1) return false;
      const current = currentQuantity(r.materialId);
      return modeBehavior.value.shouldKeepRowOnConfirm(r, current);
    })
    .map((r) => {
      const current = currentQuantity(r.materialId);
      return {
        ...r,
        quantity: modeBehavior.value.normalizeQuantityOnConfirm(r, current),
        ...materialMetaFor(r.materialId),
      };
    });
  emit('update:rows', sanitized);
  openModel.value = false;
}

function addRow() {
  const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
  rowsInternal.value.push({
    id,
    materialId: '',
    quantity: 1,
  });
}

function removeRow(id: string) {
  rowsInternal.value = rowsInternal.value.filter((r) => r.id !== id);
}

function currentQuantity(materialId: string): number {
  if (!materialId) return 0;
  const item = materialsInventory.value.find((m) => m.id === materialId);
  return item?.quantity ?? 0;
}

function buildMaterialDisplay(mat: InventoryListItem): string {
  const base = mat.name_of_product ?? '—';
  const size = mat.package_size != null ? String(mat.package_size) : '';
  const sku = mat.sku ? `(${mat.sku})` : '';
  const sizePart = size ? ` - ${size}` : '';
  const skuPart = sku ? ` ${sku}` : '';
  return `${base}${sizePart}${skuPart}`;
}

const filteredMaterials = computed(() => {
  const query = materialSearch.value.trim().toLowerCase();
  const inventorySource = modeBehavior.value.filterMaterialsSource(materialsInventory.value);

  if (!query) return inventorySource;

  const match = (s: string | null | undefined) => (s ?? '').toLowerCase().includes(query);

  return inventorySource.filter((m) => {
    return (
      match(m.name_of_product) ||
      match(m.sku) ||
      match(String(m.package_size ?? '')) ||
      match(m.material_category?.material_category_name)
    );
  });
});

function materialLabel(materialId: string): string {
  if (!materialId) return '';
  const material = materialsInventory.value.find((m) => m.id === materialId);
  return material ? buildMaterialDisplay(material) : '';
}

function selectMaterial(rowId: string, materialId: string) {
  const row = rowsInternal.value.find((r) => r.id === rowId);
  if (!row) return;
  row.materialId = materialId;

  const current = currentQuantity(materialId);
  row.quantity = modeBehavior.value.clampQuantityOnSelect(row, current);

  materialMenuOpen[rowId] = false;
}

function canIncrease(row: DrawerRow): boolean {
  if (!row.materialId) return false;
  const current = currentQuantity(row.materialId);
  return modeBehavior.value.canIncrease(row, current);
}

function canDecrease(row: DrawerRow): boolean {
  return row.quantity > 1;
}

function increase(row: DrawerRow) {
  if (!canIncrease(row)) return;
  const next = Math.max(1, Math.floor(Number(row.quantity) || 1) + 1);

  if (props.mode === 'usage' && row.materialId) {
    const current = currentQuantity(row.materialId);
    row.quantity = Math.min(next, current);
  } else {
    row.quantity = next;
  }
}

function decrease(row: DrawerRow) {
  if (!canDecrease(row)) return;
  row.quantity = Math.max(1, Math.floor(Number(row.quantity) || 1) - 1);
}

function isBelowMinimum(mat: InventoryListItem): boolean {
  const category = mat.material_category;
  if (!category || category.minimum_value == null || category.minimum_value <= 0) return false;
  const quantity = mat.quantity ?? 0;
  const packageSize = mat.package_size ?? 0;
  const total = quantity * packageSize;
  return total < category.minimum_value;
}

function rowClasses(r: DrawerRow) {
  const material = materialsInventory.value.find((m) => m.id === r.materialId);
  const warn = modeBehavior.value.isRowBelowMinimum(r, material);

  return {
    'row-warning': warn,
  };
}

function materialMetaFor(materialId: string): {
  materialName?: string;
  packageSize?: number | null;
  sku?: string | null;
} {
  const mat = materialsInventory.value.find((m) => m.id === materialId);
  if (!mat) return {};
  return {
    materialName: mat.name_of_product,
    packageSize: mat.package_size ?? null,
    sku: mat.sku ?? null,
  };
}

function rowWarningText(row: DrawerRow): string {
  const material = materialsInventory.value.find((m) => m.id === row.materialId);
  return modeBehavior.value.warningText(row, material);
}
</script>

<style scoped>
.drawer-content {
  padding: var(--content-padding);
  min-height: 0;
  overflow: auto;
}

.materials-table-wrapper {
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
  background-color: var(--theme--background);
  overflow: hidden;
}

.materials-table {
  width: 100%;
  border-collapse: collapse;
}

.materials-table th,
.materials-table td {
  padding: 10px 12px;
  text-align: left;
  font-size: 14px;
}

.materials-table thead th {
  font-weight: 600;
  color: var(--theme--foreground);
  /* background-color: var(--theme--background-subdued); */
}

.materials-table tbody tr:last-child td {
  border-bottom: 0;
}

.drawer-empty-note {
  padding: 16px 12px;
  text-align: left;
  font-size: 14px;
  color: var(--theme--foreground-subdued);
}

.row-warning {
  background-color: transparent;
}

.row-warning .field-quantity {
  background-color: color-mix(in srgb, var(--theme--warning) 12%, transparent);
}

.col-direction {
  width: 120px;
}

.col-current {
  width: 80px;
}

.col-quantity {
  width: 160px;
}

.col-actions {
  width: 56px;
  text-align: center;
}

.field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: var(--theme--form--field--input--height);
  padding: 6px 10px;
  border-radius: var(--theme--border-radius);
  border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
  background-color: var(--theme--form--field--input--background);
  cursor: pointer;
  transition: border-color 160ms ease;
}

.field:hover {
  border-color: var(--theme--form--field--input--border-color-hover);
}

.field-readonly {
  cursor: default;
  background-color: var(--theme--background-subdued);
}

.field-text {
  flex: 1;
  text-align: left;
}

.col-current .field-text {
  text-align: center;
}

.field-icon-right {
  color: var(--theme--foreground-subdued);
  margin-left: 6px;
}

.field-quantity {
  display: flex;
  align-items: center;
  gap: 4px;
}

.quantity-input-field {
  width: 72px;
  padding: 4px 6px;
  border-radius: 0;
  border: 0;
  background-color: transparent;
}

.quantity-buttons {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quantity-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 18px;
  border-radius: 4px;
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  background-color: transparent;
  cursor: pointer;
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.table-footer {
  padding: 10px 12px;
  /* border-top: var(--theme--border-width) solid var(--theme--border-color-subdued); */
  /* background-color: var(--theme--background-subdued); */
}

.material-menu {
  width: 100%;
  min-width: 100%;
  max-width: none;
  display: flex;
  flex-direction: column;
  background-color: var(--theme--background);
  border-radius: var(--theme--border-radius);
  box-shadow: var(--theme--shadow-lg);
}

.material-menu-search {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: var(--theme--border-width) solid var(--theme--border-color-subdued);
}

.icon-search {
  color: var(--theme--foreground-subdued);
}

.material-search-input {
  border: 0;
  outline: none;
  width: 100%;
  background: transparent;
  color: var(--theme--foreground);
}

.material-menu-list {
  overflow: auto;
}

.material-menu-item {
  width: 100%;
  padding: 8px 10px;
  text-align: left;
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.material-menu-item:hover {
  background-color: var(--theme--background-subdued);
}

.material-menu-text {
  font-size: 14px;
}

.icon-warning {
  color: var(--theme--warning);
}

.material-menu-item-warning {
  color: var(--theme--warning);
}

.material-menu-item-warning:hover {
  background-color: var(--theme--background-subdued);
}

.row-warning-note .below-minimum-note {
  font-size: 12px;
  color: var(--theme--warning);
  padding: 4px 12px 10px;
}

.delete-button {
  min-inline-size: var(--theme--form--field--input--height);
  min-block-size: var(--theme--form--field--input--height);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  background-color: var(--theme--background);
  color: var(--theme--danger);
  cursor: pointer;
}

.delete-button:hover {
  background-color: var(--theme--background-subdued);
}
</style>
