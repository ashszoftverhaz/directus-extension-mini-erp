<template>
  <VDrawer v-model="openModel" direction="right" @cancel="close">
    <template #title>
      <div class="header">
        <div class="header-title">
          <h1 class="type-title">{{ drawerTitle }}</h1>
        </div>
      </div>
    </template>

    <template #actions>
      <div class="search-input" role="search">
        <VIcon class="icon-search" name="search" @click="focusSearch" />
        <input
          ref="searchInput"
          v-model="search"
          type="search"
          :placeholder="searchFocused ? searchPlaceholder : ''"
          spellcheck="false"
          autocapitalize="off"
          autocorrect="off"
          autocomplete="off"
          @focus="searchFocused = true"
          @blur="searchFocused = false" />
        <div class="spacer" />
        <VIcon class="icon-filter" name="filter_list" />
      </div>

      <VButton icon rounded :disabled="!selectedItem" @click="confirm">
        <VIcon name="check" />
      </VButton>
    </template>

    <div class="drawer-content">
      <VNotice v-if="!type" type="info"> Please select a location type first. </VNotice>

      <template v-else>
        <VProgressLinear v-if="loading" indeterminate />
        <VNotice v-else-if="error" type="danger">
          Failed to load {{ type === 'washing_unit' ? 'washing units' : 'washing locations' }}.
        </VNotice>
        <VNotice v-else-if="filteredItems.length === 0" type="info">
          No {{ type === 'washing_unit' ? 'washing units' : 'washing locations' }} available.
        </VNotice>

        <div v-else class="v-table table">
          <table
            class="drawer-table"
            :summary="type === 'washing_unit' ? 'Washing units' : 'Washing locations'">
            <thead>
              <tr>
                <th class="col-check"></th>
                <th>Name</th>
                <th v-if="type === 'washing_location'">City</th>
                <th v-if="type === 'washing_location'">Address</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in filteredItems"
                :key="item.id"
                class="drawer-row"
                :class="{ 'row-selected': selectedItem?.id === item.id }"
                @click="toggleItem(item)">
                <td class="col-check">
                  <VRadio
                    :model-value="selectedItem?.id"
                    :value="item.id"
                    @click.stop
                    @update:model-value="() => setItem(item)" />
                </td>
                <td>{{ item.name ?? '—' }}</td>
                <td v-if="type === 'washing_location'">
                  {{ (item as WashingLocationItem).city ?? '—' }}
                </td>
                <td v-if="type === 'washing_location'">
                  {{ (item as WashingLocationItem).address ?? '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </VDrawer>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useApi, useStores } from '@directus/extensions-sdk';
import type { WashingLocationItem } from '../../api/inventoryApi';
import type { DirectusItemsResponse } from '../../types/apiTypes';

type LocationType = 'washing_location' | 'washing_unit' | null;

type SelectedOtherParty = {
  id: string;
  name: string;
};

type WashingUnitItem = {
  id: string;
  name: string;
};

type DrawerItem = WashingLocationItem | WashingUnitItem;

const props = withDefaults(
  defineProps<{
    open: boolean;
    type: LocationType;
    selectedOtherParty: SelectedOtherParty | null;
  }>(),
  {
    type: null,
    selectedOtherParty: null,
  },
);

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'update:selected-other-party', value: SelectedOtherParty | null): void;
}>();

const api = useApi();
const { useCollectionsStore } = useStores();
const collectionsStore = useCollectionsStore();

const openModel = computed<boolean>({
  get() {
    return props.open;
  },
  set(val: boolean) {
    emit('update:open', val);
  },
});

const search = ref('');
const searchFocused = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);
const loading = ref(false);
const error = ref(false);

const items = ref<DrawerItem[]>([]);
const selectedItem = ref<SelectedOtherParty | null>(props.selectedOtherParty);

const drawerTitle = computed(() => {
  if (props.type === 'washing_unit') return 'Select washing unit';
  if (props.type === 'washing_location') return 'Select washing location';
  return 'Select other party';
});

const searchPlaceholder = computed(() => {
  if (props.type === 'washing_unit') return 'Search washing units...';
  if (props.type === 'washing_location') return 'Search locations...';
  return 'Search...';
});

const filteredItems = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return items.value;

  const match = (s: string | null | undefined) => (s ?? '').toLowerCase().includes(query);

  if (props.type === 'washing_location') {
    return items.value.filter((loc) => {
      const asLoc = loc as WashingLocationItem;
      return match(asLoc.name) || match(asLoc.city) || match(asLoc.address);
    });
  }

  return items.value.filter((unit) => match((unit as WashingUnitItem).name));
});

watch(
  () => props.selectedOtherParty,
  (val) => {
    selectedItem.value = val;
  },
  { immediate: true },
);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      search.value = '';
      if (props.type) {
        loadItems();
      }
    }
  },
);

watch(
  () => props.type,
  async () => {
    search.value = '';
    items.value = [];
    selectedItem.value = null;
    if (props.open && props.type) {
      await loadItems();
    }
  },
);

onMounted(() => {
  if (props.open && props.type) {
    loadItems();
  }
});

async function loadItems() {
  if (!props.type) return;

  loading.value = true;
  error.value = false;

  try {
    if (props.type === 'washing_location') {
      const hasWashingLocations = collectionsStore.collections.some(
        (collection: any) => collection.collection === 'washing_location',
      );
      if (hasWashingLocations) {
        const response = await api.get<DirectusItemsResponse<WashingLocationItem[]>>(
          '/items/washing_location',
          {
            params: {
              fields: ['id', 'name', 'city', 'address', 'country', 'postal_code'],
              sort: ['name'],
              limit: -1,
            },
          },
        );
        items.value = response.data?.data ?? [];
      } else {
        const hasErpLocations = collectionsStore.collections.some(
          (collection: any) => collection.collection === 'erp_locations',
        );
        if (hasErpLocations) {
          const response = await api.get<
            DirectusItemsResponse<Array<{ id: string; name: string }>>
          >('/items/erp_locations', {
            params: {
              fields: ['id', 'name'],
              sort: ['name'],
              limit: -1,
            },
          });
          const raw = response.data?.data ?? [];
          items.value = raw.map((loc) => ({
            id: loc.id,
            name: loc.name,
          }));
        } else {
          items.value = [];
        }
      }
    } else if (props.type === 'washing_unit') {
      const response = await api.get<DirectusItemsResponse<WashingUnitItem[]>>(
        '/items/washing_unit',
        {
          params: {
            fields: ['id', 'name'],
            sort: ['name'],
            limit: -1,
          },
        },
      );
      items.value = response.data?.data ?? [];
    }
  } catch (e) {
    console.error('Failed to load other parties for handover', e);
    error.value = true;
  } finally {
    loading.value = false;
  }
}

function close() {
  openModel.value = false;
}

function confirm() {
  emit('update:selected-other-party', selectedItem.value);
  openModel.value = false;
}

function setItem(item: DrawerItem) {
  selectedItem.value = {
    id: item.id,
    name: item.name,
  };
}

function toggleItem(item: DrawerItem) {
  if (selectedItem.value?.id === item.id) {
    selectedItem.value = null;
  } else {
    setItem(item);
  }
}

function focusSearch() {
  searchInput.value?.focus();
}
</script>

<style scoped>
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

.drawer-row.row-selected {
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
