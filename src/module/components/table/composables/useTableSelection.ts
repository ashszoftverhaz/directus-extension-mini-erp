import { computed, ref, type ComputedRef, type Ref } from 'vue';

export type RowKey = string | number;

export function useTableSelection(options: {
  items: Ref<any[] | undefined>;
  rowKey: Ref<string | ((item: any) => RowKey) | undefined>;
  selectedIdsProp: Ref<RowKey[] | undefined>;
  emitSelectedIds: (value: RowKey[]) => void;
}) {
  const internalSelectedIds = ref<RowKey[]>([]);

  const selectedIdsModel = computed<RowKey[]>({
    get() {
      const fromProps = options.selectedIdsProp.value;
      if (Array.isArray(fromProps)) return fromProps;
      return internalSelectedIds.value;
    },
    set(value) {
      const next = Array.isArray(value) ? value : [];
      if (!Array.isArray(options.selectedIdsProp.value)) internalSelectedIds.value = next;
      options.emitSelectedIds(next);
    },
  });

  const selectedSet = computed(() => new Set<RowKey>(selectedIdsModel.value));

  function rowKeyFor(item: any): RowKey {
    const keyProp = options.rowKey.value;
    if (typeof keyProp === 'function') return keyProp(item);
    if (typeof keyProp === 'string' && keyProp.length > 0) return item?.[keyProp];
    return item?.id;
  }

  function isSelected(item: any) {
    const key = rowKeyFor(item);
    return selectedSet.value.has(key);
  }

  function setSelected(item: any, selected: boolean) {
    const key = rowKeyFor(item);
    const current = selectedIdsModel.value;

    if (selected) {
      if (selectedSet.value.has(key)) return;
      selectedIdsModel.value = [...current, key];
      return;
    }

    if (!selectedSet.value.has(key)) return;
    selectedIdsModel.value = current.filter((id) => id !== key);
  }

  function toggleAllVisible(next: boolean) {
    const visibleItems = options.items.value ?? [];
    const visibleKeys = visibleItems.map((item) => rowKeyFor(item));
    const current = new Set(selectedIdsModel.value);

    if (next) {
      for (const key of visibleKeys) current.add(key);
      selectedIdsModel.value = Array.from(current);
      return;
    }

    for (const key of visibleKeys) current.delete(key);
    selectedIdsModel.value = Array.from(current);
  }

  const computedSelectAll = computed<boolean>(() => {
    const visibleItems = options.items.value ?? [];
    if (visibleItems.length === 0) return false;
    return visibleItems.every((item) => isSelected(item));
  });

  const computedSelectIndeterminate = computed<boolean>(() => {
    const visibleItems = options.items.value ?? [];
    if (visibleItems.length === 0) return false;
    return visibleItems.some((item) => isSelected(item)) && !computedSelectAll.value;
  });

  return {
    selectedIdsModel,
    selectedSet: selectedSet as ComputedRef<Set<RowKey>>,
    rowKeyFor,
    isSelected,
    setSelected,
    toggleAllVisible,
    computedSelectAll,
    computedSelectIndeterminate,
  };
}

