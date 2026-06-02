<template>
  <VDrawer v-model="openModel" direction="right" @cancel="close">
    <template #title>
      <h1 class="drawer-title">Select base location</h1>
    </template>
    <template #actions>
      <div class="search-input" role="search">
        <VIcon class="icon-search" name="search" @click="focusSearch" />
        <input
          ref="searchInput"
          v-model="search"
          type="search"
          :placeholder="searchFocused ? 'Search locations...' : ''"
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
      <VNotice v-else-if="error" type="danger">Failed to load locations.</VNotice>
      <div v-else-if="filteredLocations.length === 0" class="drawer-empty-state">
        <EmptyState 
          icon="place"
          title="No items"
          action-label="Reset your filter"
          @action="resetFilter"
          action-variant="link" />
      </div>
      <div v-else class="v-table table">
        <table class="drawer-table" summary="Locations">
          <thead>
            <tr>
              <th>Name</th>
              <th>City</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="loc in filteredLocations"
              :key="loc.id"
              class="drawer-row"
              @click="select(loc)">
              <td>{{ loc.name ?? '—' }}</td>
              <td>{{ loc.city ?? '—' }}</td>
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
import { parseLocationSettingValue, formatLocationSettingValue } from '../../utils/settingsFormat';
import EmptyState from '../EmptyState.vue';

type LocationListItem = {
  id: string | number;
  name: string;
  city?: string | null;
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
const locations = ref<LocationListItem[]>([]);
const search = ref('');
const searchFocused = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);
const activeCollection = ref<'washing_location' | 'erp_locations'>('washing_location');

async function loadLocations() {
  if (locations.value.length > 0 || loading.value) return;

  loading.value = true;
  error.value = false;

  try {
    const parsed = props.value ? parseLocationSettingValue(props.value) : null;
    if (
      parsed &&
      (parsed.collection === 'washing_location' || parsed.collection === 'erp_locations')
    ) {
      activeCollection.value = parsed.collection as any;
    } else {
      activeCollection.value = 'washing_location';
    }

    try {
      const response = await api.get(`/items/${activeCollection.value}`, {
        params: {
          fields: ['id', 'name', 'city'],
          sort: ['name'],
          limit: -1,
          meta: ['total_count'],
        },
      });
      locations.value = (response.data?.data ?? []) as LocationListItem[];
    } catch (e: any) {
      if (activeCollection.value === 'washing_location') {
        activeCollection.value = 'erp_locations';
        const response = await api.get('/items/erp_locations', {
          params: {
            fields: ['id', 'name'],
            sort: ['name'],
            limit: -1,
            meta: ['total_count'],
          },
        });
        locations.value = (response.data?.data ?? []) as LocationListItem[];
      } else {
        throw e;
      }
    }
  } catch (e) {
    console.error('Failed to load locations', e);
    error.value = true;
  } finally {
    loading.value = false;
  }
}

const filteredLocations = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return locations.value;
  return locations.value.filter((loc) => {
    const name = (loc.name ?? '').toLowerCase();
    const city = (loc.city ?? '').toLowerCase();
    return name.includes(q) || city.includes(q);
  });
});

function close() {
  openModel.value = false;
}

function select(loc: LocationListItem) {
  const formatted = formatLocationSettingValue(activeCollection.value, String(loc.id), loc.name);
  emit('select', formatted);
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
  if (openModel.value) loadLocations();
});

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      search.value = '';
      loadLocations();
    }
  },
);
</script>

<style scoped>
.drawer-empty-state {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -140px;
}

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
