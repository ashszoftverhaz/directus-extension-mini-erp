<template>
  <VDrawer v-model="openModel" direction="left" @cancel="close">
    <template #title>
      <div class="header">
        <div class="header-title">
          <h1 class="type-title">Select washing location</h1>
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

      <VButton icon rounded :disabled="!selectedLocation" @click="confirm">
        <VIcon name="check" />
      </VButton>
    </template>

    <div class="drawer-content">
      <VProgressLinear v-if="loading" indeterminate />
      <VNotice v-else-if="error" type="danger">Failed to load washing locations.</VNotice>
      <VNotice v-else-if="filteredLocations.length === 0" type="info">
        No washing locations available.
      </VNotice>
      <div v-else class="v-table table">
        <table class="drawer-table" summary="Washing locations">
          <thead>
            <tr>
              <th class="col-check"></th>
              <th>Name</th>
              <th>City</th>
              <th>Address</th>
              <th>Country</th>
              <th>Postal code</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="loc in filteredLocations"
              :key="loc.id"
              class="drawer-row"
              :class="{ 'row-selected': selectedLocation?.id === loc.id }"
              @click="toggleLocation(loc)">
              <td class="col-check">
                <VRadio
                  :model-value="selectedLocation?.id"
                  :value="loc.id"
                  @click.stop
                  @update:model-value="() => setLocation(loc)" />
              </td>
              <td>{{ loc.name ?? '—' }}</td>
              <td>{{ loc.city ?? '—' }}</td>
              <td>{{ loc.address ?? '—' }}</td>
              <td>{{ loc.country ?? '—' }}</td>
              <td>{{ loc.postal_code ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </VDrawer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import type { WashingLocationItem } from '../api/inventoryApi';

const props = withDefaults(
  defineProps<{
    open: boolean;
    locations: WashingLocationItem[];
    modelValue: WashingLocationItem | null;
  }>(),
  {
    locations: () => [],
    modelValue: null,
  }
);

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'update:modelValue', value: WashingLocationItem | null): void;
  (e: 'confirm', value: WashingLocationItem | null): void;
}>();

const search = ref('');
const searchFocused = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);
const loading = ref(false);
const error = ref(false);
const selectedLocation = ref<WashingLocationItem | null>(props.modelValue);

const openModel = computed<boolean>({
  get() {
    return props.open;
  },
  set(val: boolean) {
    emit('update:open', val);
  },
});

const filteredLocations = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return props.locations;
  const match = (s: string | null | undefined) => (s ?? '').toLowerCase().includes(query);
  return props.locations.filter(
    (loc) =>
      match(loc.name) ||
      match(loc.city) ||
      match(loc.address) ||
      match(loc.country) ||
      match(loc.postal_code)
  );
});

watch(
  () => props.modelValue,
  (val) => {
    selectedLocation.value = val;
  },
  { immediate: true }
);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      selectedLocation.value = props.modelValue;
      search.value = '';
    }
  }
);

function close() {
  openModel.value = false;
}

function confirm() {
  emit('update:modelValue', selectedLocation.value);
  emit('confirm', selectedLocation.value);
  openModel.value = false;
}

function setLocation(loc: WashingLocationItem) {
  selectedLocation.value = loc;
}

function toggleLocation(loc: WashingLocationItem) {
  selectedLocation.value = selectedLocation.value?.id === loc.id ? null : loc;
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
  transition: width 160ms ease, min-width 160ms ease;
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
