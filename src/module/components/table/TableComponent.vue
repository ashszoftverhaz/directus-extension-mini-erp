<template>
  <div
    ref="wrapperEl"
    class="erp-tabular-wrapper layout-tabular"
    :class="{ 'is-loading': isLoading, 'is-empty': showEmpty, 'is-selectable': selectable }"
    :style="wrapperStyle">
    <template v-if="showEmpty">
      <slot name="empty">
        <EmptyState
          :title="emptyTitle"
          :description="resolvedEmptyDescription"
          :icon="emptyIcon"
          :action-label="emptyActionLabel"
          :action-disabled="emptyActionDisabled"
          :wrapper-class="emptyWrapperClass"
          @action="onEmptyAction" />
      </slot>      
    </template>
    <div v-else class="v-table table">
      <div class="erp-tabular-scroll">
        <div class="erp-tabular-card">
          <table class="erp-tabular-table" :summary="summary" :style="mergedTableStyle">
            <thead class="table-header">
              <tr class="fixed">
                <slot v-if="$slots.header" name="header" />

                <template v-else>
                  <th v-if="selectable" class="select cell sticky-column" scope="col">
                    <VCheckbox
                      :model-value="computedSelectAll"
                      :indeterminate="computedSelectIndeterminate"
                      :disabled="disabled"
                      :aria-label="selectAllAriaLabel"
                      @update:model-value="(val: boolean) => toggleAllVisible(val)"
                      @click.stop />
                  </th>

                  <th
                    v-for="column in resolvedColumns"
                    :key="column.key"
                    class="cell"
                    :class="[
                      column.align ? `align-${column.align}` : 'align-left',
                      column.sortable ? 'actionable' : null,
                    ]"
                    scope="col">
                    <button
                      v-if="column.sortable"
                      type="button"
                      class="header-btn"
                      :disabled="disabled"
                      @click="onToggleSort(column.key)">
                      <span class="name">{{ column.label }}</span>
                      <VIcon
                        class="action-icon"
                        name="arrow_drop_down"
                        small
                        :style="sortIconStyle(column.key)" />
                    </button>
                    <span v-else class="name">{{ column.label }}</span>

                    <span
                      v-if="column.resizable"
                      class="resize-handle"
                      @mousedown.prevent="startResize(column.key, $event)"></span>
                  </th>

                  <th v-if="showSpacer" class="spacer cell" scope="col"></th>
                </template>
              </tr>
            </thead>

            <tbody>
              <slot v-if="$slots.body" name="body" />

              <template v-else>
                <tr
                  v-for="item in items"
                  :key="rowKeyFor(item)"
                  class="table-row"
                  :class="{
                    'is-selected': selectable && isSelected(item),
                    'is-clickable': rowClickable && !disabled,
                  }"
                  @click="onRowClick(item)">
                  <td v-if="selectable" class="select cell sticky-column" @click.stop>
                    <VCheckbox
                      :model-value="isSelected(item)"
                      :disabled="disabled"
                      aria-label="Select row"
                      @update:model-value="(val: boolean) => setSelected(item, val)"
                      @click.stop />
                  </td>

                  <td
                    v-for="column in resolvedColumns"
                    :key="column.key"
                    class="cell"
                    :class="[column.align ? `align-${column.align}` : 'align-left']">
                    <slot
                      :name="`cell-${column.key}`"
                      :item="item"
                      :column="column"
                      :value="getCellValue(item, column.key)">
                      {{ getCellValue(item, column.key) }}
                    </slot>
                  </td>

                  <td v-if="showSpacer" class="spacer cell"></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <div class="footer">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * `TableComponent` – reusable ERP table shell.
 *
 * ## Basic usage
 * - Provide data via `:items` and columns via `:fields` (or `:columns` for full control).
 * - Use `:column-overrides` to tweak labels, widths, alignment, and resizability per column key.
 *
 * ## Selection
 * - Enable selection with `selectable` and bind selection via `v-model:selected-ids`.
 * - Use `row-key` (or default `id`) to define the row identifier.
 * - The header checkbox automatically handles “select all visible” and indeterminate state.
 *
 * ## Row click
 * - Listen to `@row-click="(item) => ..."`; rows become clickable automatically when the listener is provided.
 *
 * ## Sorting
 * - Pass `:sort="{ key, order }"` and listen to `@sort-change` (and/or `@update:sort`).
 *
 * ## Slots
 * - Cell slots: `#cell-<fieldKey>="{ item, column, value }"` to customize a column rendering.
 * - `#header`, `#body`, `#footer` can fully override those regions.
 */
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, toRef } from 'vue';
import { useTableColumns, type SortOrder, type TableColumn } from './composables/useTableColumns';
import { useTableSelection, type RowKey } from './composables/useTableSelection';
import { useTableResize } from './composables/useTableResize';
import EmptyState from '../EmptyState.vue';

export type { TableColumn } from './composables/useTableColumns';

const props = withDefaults(
  defineProps<{
    isLoading: boolean;
    columns?: TableColumn[];
    fields?: readonly string[];
    columnOverrides?: Record<string, Partial<TableColumn>>;
    items?: any[];
    rowKey?: string | ((item: any) => RowKey);
    selectedIds?: RowKey[];
    summary: string;
    tableStyle?: Record<string, string>;
    showEmpty: boolean;
    emptyText: string;
    emptyTitle?: string;
    emptyDescription?: string;
    emptyIcon?: string;
    emptyActionLabel?: string;
    emptyActionDisabled?: boolean;
    emptyWrapperClass?: string;
    selectable?: boolean;
    selectAllAriaLabel?: string;
    showSpacer?: boolean;
    disabled?: boolean;
    sort?: { key: string; order: SortOrder } | null;
    minResizableWidth?: number;
    selectColumnWidth?: string;
    spacerColumnWidth?: string;
    defaultColumnWidth?: string;
    defaultSortable?: boolean;
    defaultResizable?: boolean;
  }>(),
  {
    items: () => [],
    selectable: false,
    selectAllAriaLabel: 'Select all',
    showSpacer: false,
    disabled: false,
    sort: null,
    minResizableWidth: 120,
    selectColumnWidth: '36px',
    spacerColumnWidth: '1fr',
    defaultColumnWidth: 'minmax(160px, 1fr)',
    defaultSortable: true,
    defaultResizable: true,
    emptyTitle: 'No Items',
    emptyIcon: 'star',
    emptyActionDisabled: false,
    emptyWrapperClass: 'erp-empty-state',
  },
);

const emit = defineEmits<{
  (e: 'sort-change', value: { key: string; order: SortOrder }): void;
  (e: 'update:sort', value: { key: string; order: SortOrder } | null): void;
  (e: 'update:selectedIds', value: RowKey[]): void;
  (e: 'row-click', item: any): void;
  (e: 'empty-action'): void;
}>();

const instance = getCurrentInstance();

const wrapperEl = ref<HTMLElement | null>(null);
const wrapperMinHeight = ref<string | null>(null);

function updateWrapperHeight() {
  if (!wrapperEl.value) return;

  const rect = wrapperEl.value.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const available = viewportHeight - rect.top;

  if (available > 0) {
    wrapperMinHeight.value = `${available}px`;
  } else {
    wrapperMinHeight.value = null;
  }
}

onMounted(() => {
  updateWrapperHeight();
  window.addEventListener('resize', updateWrapperHeight);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateWrapperHeight);
});

const wrapperStyle = computed(() => {
  if (!wrapperMinHeight.value) return {};
  return { minHeight: wrapperMinHeight.value };
});
const rowClickable = computed(() => Boolean((instance?.vnode.props as any)?.onRowClick));

const columnWidths = ref<Record<string, number | null>>({});

const {
  rowKeyFor,
  isSelected,
  setSelected,
  toggleAllVisible,
  computedSelectAll,
  computedSelectIndeterminate,
} = useTableSelection({
  items: toRef(props, 'items'),
  rowKey: toRef(props, 'rowKey'),
  selectedIdsProp: toRef(props, 'selectedIds'),
  emitSelectedIds: (value) => emit('update:selectedIds', value),
});

function getCellValue(item: any, key: string) {
  if (!item) return '';
  if (key.includes('.')) {
    const parts = key.split('.');
    let cur: any = item;
    for (const part of parts) {
      cur = cur?.[part];
      if (cur === undefined || cur === null) return '';
    }
    return cur ?? '';
  }
  return item[key] ?? '';
}

function onRowClick(item: any) {
  if (!rowClickable.value || props.disabled) return;
  emit('row-click', item);
}

const resolvedEmptyDescription = computed(() => {
  if (typeof props.emptyDescription === 'string') return props.emptyDescription;
  return props.emptyText;
});

const { resolvedColumns, widthForColumn } = useTableColumns({
  columns: toRef(props, 'columns'),
  fields: toRef(props, 'fields'),
  columnOverrides: toRef(props, 'columnOverrides'),
  defaultColumnWidth: computed(() => props.defaultColumnWidth),
  defaultSortable: computed(() => props.defaultSortable),
  defaultResizable: computed(() => props.defaultResizable),
  columnWidths,
});

const { startResize } = useTableResize({
  resolvedColumns,
  disabled: toRef(props, 'disabled'),
  minResizableWidth: computed(() => props.minResizableWidth),
  columnWidths,
});

const gridTemplate = computed(() => {
  const parts: string[] = [];
  if (props.selectable) parts.push(props.selectColumnWidth);
  for (const col of resolvedColumns.value) parts.push(widthForColumn(col));
  if (props.showSpacer) parts.push(props.spacerColumnWidth);
  return parts.join(' ');
});

const computedTableStyle = computed<Record<string, string>>(() => {
  return {
    '--columns-header': gridTemplate.value,
    '--columns-body': gridTemplate.value,
  };
});

const mergedTableStyle = computed<Record<string, string>>(() => {
  return { ...computedTableStyle.value, ...(props.tableStyle ?? {}) };
});

function onToggleSort(sortKey: string) {
  if (props.disabled) return;
  const current = props.sort;
  if (current?.key === sortKey) {
    const next = { key: sortKey, order: current.order === 'asc' ? 'desc' : 'asc' } as const;
    emit('sort-change', next);
    emit('update:sort', next);
    return;
  }
  const next = { key: sortKey, order: 'asc' } as const;
  emit('sort-change', next);
  emit('update:sort', next);
}

function sortIconStyle(sortKey: string) {
  const current = props.sort;
  if (!current || current.key !== sortKey) return { visibility: 'hidden' };
  return {
    visibility: 'visible',
    transform: current.order === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)',
  };
}

function onEmptyAction() {
  if (props.emptyActionDisabled) return;
  emit('empty-action');
}
</script>

<style scoped>
.erp-tabular-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--theme--background);
  --v-table-sticky-offset-top: calc(var(--layout-offset-top, 0px));
  --v-table-header-divider-inset: 10px;
}

.erp-tabular-wrapper.is-loading {
  pointer-events: none;
}

.erp-tabular-wrapper.is-empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.v-table.table {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  width: 100%;
}

.erp-tabular-scroll {
  flex: 1;
  min-height: 0;
  padding-right: 8px;
  overflow-x: auto;
}

.erp-tabular-card {
  margin-inline: var(--content-padding);
  --erp-tabular-card-padding-inline: 8px;
  padding: 0 var(--erp-tabular-card-padding-inline) 0;
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: 12px;
  background-color: var(--v-table-background-color, var(--theme--background));
  overflow: visible;
  width: max-content;
  min-width: calc(100% - var(--content-padding) - var(--content-padding) - 20px);
  margin-bottom: 20px;
  margin-right: 20px;
}

.erp-tabular-table {
  min-width: max-content;
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;

  --columns-body: 36px minmax(280px, 2fr) minmax(160px, 1fr) minmax(160px, 1fr) 1fr;
  --columns-header: 36px minmax(280px, 2fr) minmax(160px, 1fr) minmax(160px, 1fr) 1fr;
}

.table-header {
  --grid-columns: var(--columns-header);
}

.table-header .fixed {
  display: grid;
  grid-template-columns: var(--grid-columns);
  min-height: 50px;
}

.erp-tabular-table tbody {
  --grid-columns: var(--columns-body);
}

.table-header .fixed {
  display: grid;
  grid-template-columns: var(--grid-columns);
  margin-inline-end: 0;
}

.erp-tabular-table :deep(tbody tr) {
  display: grid;
  grid-template-columns: var(--grid-columns);
  margin-inline-end: 0;
}

.erp-tabular-table :deep(th),
.erp-tabular-table :deep(td) {
  display: flex;
  align-items: center;
  justify-content: start;
  text-align: start;
  color: var(--v-table-color, var(--theme--foreground));
}

.table-header :deep(th) {
  position: relative;
  min-height: 50px;
  height: 50px;
  box-sizing: border-box;
  padding: 0 12px;
  font-weight: 600;
  font-size: 14px;
  background-color: var(--v-table-background-color, var(--theme--background));
  border-block-end: var(--theme--border-width) solid var(--theme--border-color-subdued);
}

.table-header :deep(th:not(.spacer):not(.select))::after {
  content: '';
  position: absolute;
  inset-block: var(--v-table-header-divider-inset, 10px);
  inset-inline-end: 0;
  inline-size: 1px;
  background: var(--theme--border-color-subdued);
  pointer-events: none;
}

.table-header :deep(.resize-handle) {
  position: absolute;
  inset-inline-end: 0;
  inset-block-start: 0;
  block-size: 100%;
  inline-size: 8px;
  cursor: col-resize;
  user-select: none;
}

.table-header :deep(th:not(.spacer):hover .resize-handle) {
  background: transparent;
}

.erp-tabular-table :deep(.table-row td) {
  display: flex;
  align-items: center;
  block-size: 50px;
  padding: 0 12px;
  background-color: var(--v-table-background-color, var(--theme--background));
  border-block-end: var(--theme--border-width) solid var(--theme--border-color-subdued);
}

.erp-tabular-table :deep(tbody tr:last-child td) {
  border-block-end: 0;
}

.erp-tabular-table :deep(.table-row:hover td) {
  background-color: transparent;
}

.erp-tabular-table :deep(.table-row.is-clickable) {
  cursor: pointer;
}

.erp-tabular-table :deep(.table-row.is-clickable td.select) {
  cursor: default;
}

.erp-tabular-table :deep(.table-row.is-selected td) {
  background-color: transparent;
}

.erp-tabular-table :deep(.table-row) {
  position: relative;
}

.erp-tabular-table :deep(.table-row)::before {
  content: '';
  position: absolute;
  inset-block: 0;
  inset-inline: calc(-1 * var(--erp-tabular-card-padding-inline, 8px));
  background-color: transparent;
  pointer-events: none;
  z-index: 0;
}

.erp-tabular-table :deep(.table-row:hover)::before {
  background-color: var(--theme--background-subdued);
}

.erp-tabular-table :deep(.table-row.is-selected)::before {
  background-color: var(--theme--background-subdued);
}

.erp-tabular-table :deep(.table-row td) {
  position: relative;
  z-index: 1;
}

.erp-tabular-wrapper.is-selectable .table-header :deep(tr > th:first-child),
.erp-tabular-wrapper.is-selectable .erp-tabular-table :deep(.table-row > td:first-child) {
  position: sticky;
  inset-inline-start: 2px;
  z-index: 2;
  background: var(--v-table-background-color, var(--theme--background));
}

.erp-tabular-wrapper.is-selectable .erp-tabular-table :deep(.table-row:hover > td:first-child),
.erp-tabular-wrapper.is-selectable .erp-tabular-table :deep(.table-row.is-selected > td:first-child) {
  background-color: transparent;
}

.erp-tabular-wrapper.is-selectable .table-header :deep(tr > th:first-child) {
  z-index: 4;
}

.erp-tabular-table :deep(.v-checkbox) {
  margin: 0;
}

.erp-tabular-table :deep(.manual.cell),
.erp-tabular-table :deep(.select.cell) {
  text-align: center;
}

.erp-tabular-table :deep(.manual.cell .v-icon),
.erp-tabular-table :deep(.select.cell .v-checkbox) {
  justify-content: center;
}

.erp-tabular-table :deep(th.align-left),
.erp-tabular-table :deep(td.align-left) {
  justify-content: start;
  text-align: start;
}

.erp-tabular-table :deep(.header-btn) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-transform: inherit;
  cursor: pointer;
}

.erp-tabular-table :deep(.cell.empty) {
  text-align: center;
  color: var(--theme--foreground-subdued);
}

.erp-tabular-table :deep(td.full-row) {
  grid-column: 1 / -1;
  justify-content: center;
}

.footer {
  flex-shrink: 0;
  border-top: 1px solid var(--theme--border-color-subdued);
  background: var(--theme--background);
  position: sticky;
  inset-block-end: 0;
  z-index: 3;
}

.sticky-column {
  position: sticky;
  left: 0;
  z-index: 2;
  background: transparent;
}

thead .sticky-column {
  z-index: 3;
}
</style>
