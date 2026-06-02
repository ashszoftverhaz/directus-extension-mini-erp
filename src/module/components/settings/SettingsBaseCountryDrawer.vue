<template>
  <VDrawer v-model="openModel" direction="right" @cancel="close">
    <template #title>
      <h1 class="drawer-title">Select base country</h1>
    </template>
    <template #actions>
      <div class="search-input" role="search">
        <VIcon class="icon-search" name="search" @click="focusSearch" />
        <input
          ref="searchInput"
          v-model="search"
          type="search"
          :placeholder="searchFocused ? 'Search countries...' : ''"
          spellcheck="false"
          autocapitalize="off"
          autocorrect="off"
          autocomplete="off"
          @focus="searchFocused = true"
          @blur="searchFocused = false" />
        <div class="spacer" />
        <VIcon class="icon-filter" name="filter_list" />
      </div>

      <VButton icon rounded @click="close">
        <VIcon name="close" />
      </VButton>
    </template>

    <div class="drawer-content">
      <VProgressLinear v-if="loading" indeterminate />
      <VNotice v-else-if="error" type="danger">Failed to load countries.</VNotice>
      <div v-else-if="filteredCountries.length === 0" class="drawer-empty-state">
        <EmptyState
          icon="place"
          title="No items"
          action-label="Reset your filter"
          @action="resetFilter"
          action-variant="link" />
      </div>
      <div v-else class="v-table table">
        <table class="drawer-table" summary="Countries">
          <thead>
            <tr>
              <th>Code</th>
              <th>Country</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in filteredCountries"
              :key="c.id"
              class="drawer-row"
              @click="select(c.iso2)">
              <td>{{ c.iso2 }}</td>
              <td>{{ c.name }}</td>
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
import EmptyState from '../EmptyState.vue';

type CountryListItem = {
  id: string | number;
  name: string;
  iso2: string | null;
};

const props = withDefaults(
  defineProps<{
    open: boolean;
  }>(),
  {},
);

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'select', value: string): void;
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
const countries = ref<CountryListItem[]>([]);
const search = ref('');
const searchFocused = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);

async function loadCountries() {
  if (countries.value.length > 0 || loading.value) return;
  loading.value = true;
  error.value = false;

  try {
    const response = await api.get('/items/countries', {
      params: {
        fields: ['id', 'name', 'iso2'],
        sort: ['name'],
        limit: -1,
        meta: ['total_count'],
      },
    });
    countries.value = (response.data?.data ?? []) as CountryListItem[];
  } catch (e) {
    console.error('Failed to load countries', e);
    error.value = true;
  } finally {
    loading.value = false;
  }
}

const filteredCountries = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return countries.value;
  return countries.value.filter((c) => {
    const iso = (c.iso2 ?? '').toLowerCase();
    return c.name.toLowerCase().includes(q) || iso.includes(q);
  });
});

function close() {
  openModel.value = false;
}

function select(iso2: string | null) {
  if (!iso2) return;
  emit('select', iso2);
  close();
}

function focusSearch() {
  searchInput.value?.focus();
}

function resetFilter() {
  search.value = '';
  focusSearch();
}

onMounted(() => {
  if (openModel.value) loadCountries();
});

watch(
  () => props.open,
  (isOpen: boolean) => {
    if (isOpen) loadCountries();
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
  height: 100%;
  min-height: 0;
  overflow: auto;
}

.drawer-empty-state {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -140px;
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
