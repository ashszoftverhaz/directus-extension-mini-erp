<template>
  <VDrawer v-model="openModel" direction="right" @cancel="close">
    <template #title>
      <h1 class="drawer-title">Select frequent currencies</h1>
    </template>
    <template #actions>
      <div class="search-input" role="search">
        <VIcon class="icon-search" name="search" @click="focusSearch" />
        <input
          ref="searchInput"
          v-model="search"
          type="search"
          :placeholder="searchFocused ? 'Search currencies...' : ''"
          spellcheck="false"
          autocapitalize="off"
          autocorrect="off"
          autocomplete="off"
          @focus="searchFocused = true"
          @blur="searchFocused = false" />
        <div class="spacer" />
        <VIcon class="icon-filter" name="filter_list" />
      </div>

      <VButton icon rounded @click="confirmSelection">
        <VIcon name="check" />
      </VButton>
    </template>

    <div class="drawer-content">
      <VProgressLinear v-if="loading" indeterminate />
      <VNotice v-else-if="error" type="danger">Failed to load currencies.</VNotice>
      <div v-else class="v-table table">
        <table class="drawer-table" summary="Currencies">
          <thead>
            <tr>
              <th class="col-check"></th>
              <th>Code</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="cur in filteredCurrencies"
              :key="cur.id"
              class="drawer-row"
              @click="toggleRow(cur.short_name)">
              <td class="col-check">
                <VCheckbox
                  :model-value="selection.has(cur.short_name)"
                  @click.stop
                  @update:model-value="(checked: boolean) => toggle(cur.short_name, checked)" />
              </td>
              <td>{{ cur.short_name }}</td>
              <td>{{ cur.name }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </VDrawer>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useApi } from '@directus/extensions-sdk';

type CurrencyListItem = {
  id: string | number;
  name: string;
  short_name: string;
};

const props = withDefaults(
  defineProps<{
    open: boolean;
    value: string | null;
  }>(),
  {
    value: null,
  },
);

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'confirm', value: string): void;
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
const currencies = ref<CurrencyListItem[]>([]);
const search = ref('');
const searchFocused = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);
const selection = ref<Set<string>>(new Set());

function syncSelectionFromValue() {
  const codes = (props.value ?? '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  selection.value = new Set(codes);
}

async function loadCurrencies() {
  if (currencies.value.length > 0 || loading.value) return;
  loading.value = true;
  error.value = false;

  try {
    const response = await api.get('/items/currencies', {
      params: {
        fields: ['id', 'name', 'short_name'],
        sort: ['name'],
        limit: -1,
        meta: ['total_count'],
      },
    });
    currencies.value = (response.data?.data ?? []) as CurrencyListItem[];
  } catch (e) {
    console.error('Failed to load currencies', e);
    error.value = true;
  } finally {
    loading.value = false;
  }
}

const filteredCurrencies = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return currencies.value;
  return currencies.value.filter(
    (c) => c.name.toLowerCase().includes(q) || c.short_name.toLowerCase().includes(q),
  );
});

function close() {
  openModel.value = false;
}

function toggleRow(code: string) {
  toggle(code, !selection.value.has(code));
}

function toggle(code: string, checked: boolean) {
  const next = new Set(selection.value);
  if (checked) {
    next.add(code);
  } else {
    next.delete(code);
  }
  selection.value = next;
}

function confirmSelection() {
  const codes = Array.from(selection.value);
  emit('confirm', codes.join(','));
  close();
}

function focusSearch() {
  searchInput.value?.focus();
}

onMounted(() => {
  if (openModel.value) {
    loadCurrencies();
    syncSelectionFromValue();
  }
});

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      loadCurrencies();
      syncSelectionFromValue();
    }
  },
);

watch(
  () => props.value,
  () => {
    if (!openModel.value) return;
    syncSelectionFromValue();
  },
);
</script>

<style scoped>
.drawer-title {
  font-size: 18px;
  font-weight: 600;
}

.drawer-content {
  padding: var(--content-padding);
  min-height: 0;
  overflow: auto;
}

.v-table.table {
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
  background-color: var(--theme--background);
  overflow: hidden;
}

.drawer-table {
  width: 100%;
  border-collapse: collapse;
}

.drawer-table th,
.drawer-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: var(--theme--border-width) solid var(--theme--border-color-subdued);
  font-size: 14px;
}

.drawer-table thead th {
  font-weight: 600;
  color: var(--theme--foreground);
  background-color: var(--theme--background-subdued);
}

.drawer-table tbody tr:last-child td {
  border-bottom: 0;
}

.drawer-row {
  cursor: pointer;
  transition: background-color 160ms ease;
}

.drawer-row:hover {
  background-color: var(--theme--background-subdued);
}

.col-check {
  width: 48px;
  padding-right: 8px;
}

.search-input {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  width: 85px;
  background-color: var(--theme--background-subdued);
  border: 1px solid var(--theme--border-color);
  transition:
    width 160ms ease,
    min-width 160ms ease;
}

.search-input:focus-within {
  width: 260px;
  min-width: 260px;
}

.search-input input {
  border: 0;
  background: transparent;
  outline: none;
  color: var(--theme--foreground);
  width: 100%;
  min-width: 0;
}

.icon-search,
.icon-filter {
  color: var(--theme--foreground-subdued);
}

.icon-search {
  cursor: pointer;
}
</style>
