<template>
  <div class="table-actions" :class="{ 'is-search-expanded': isSearchExpanded }">
    <div class="search-container" role="search">
      <div class="search-input" :class="{ 'is-expanded': isSearchExpanded }" @click="focusSearch">
        <VIcon class="icon-search" name="search" @click="focusSearch" />
        <input
          v-if="isSearchExpanded"
          ref="searchInput"
          :value="modelValue"
          type="search"
          :placeholder="searchFocused ? searchPlaceholder : ''"
          spellcheck="false"
          autocapitalize="off"
          autocorrect="off"
          autocomplete="off"
          @input="onInput"
          @focus="searchFocused = true"
          @blur="searchFocused = false" />
        <div v-if="isSearchExpanded" class="spacer" />
        <button
          v-if="isSearchExpanded && modelValue.trim().length > 0"
          type="button"
          class="clear-button"
          @click.stop="clearSearch"
          title="Clear search">
          <VIcon name="close" />
        </button>
        <VIcon class="icon-filter" name="filter_list" />
      </div>
    </div>

    <VButton
      v-if="showBulkEdit"
      icon
      rounded
      :secondary="bulkEditSecondary"
      :disabled="disabled"
      @click="$emit('bulk-edit')">
      <VIcon name="edit" />
    </VButton>

    <VButton
      v-if="showBulkDelete"
      icon
      rounded
      secondary
      class="action-delete"
      :loading="bulkDeleteLoading"
      :disabled="disabled || bulkDeleteLoading"
      @click="$emit('bulk-delete')">
      <VIcon name="delete" />
    </VButton>

    <VButton
      v-if="showAdd"
      icon
      rounded
      :disabled="disabled"
      @click="$emit('add')">
      <VIcon name="add" />
    </VButton>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    searchPlaceholder: string;
    selectedCount: number;
    disabled?: boolean;
    bulkDeleteLoading?: boolean;
    bulkEditSecondary?: boolean;
    showAdd?: boolean;
  }>(),
  {
    disabled: false,
    bulkDeleteLoading: false,
    bulkEditSecondary: true,
    showAdd: true,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'add'): void;
  (e: 'bulk-edit'): void;
  (e: 'bulk-delete'): void;
}>();

const searchFocused = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);

const isSearchExpanded = computed(() => searchFocused.value || props.modelValue.trim().length > 0);

const showBulkEdit = computed(() => props.selectedCount > 0);
const showBulkDelete = computed(() => props.selectedCount > 0);

async function focusSearch() {
  searchFocused.value = true;
  await nextTick();
  searchInput.value?.focus();
}

function onInput(event: Event) {
  const next = (event.target as HTMLInputElement | null)?.value ?? '';
  emit('update:modelValue', next);
}

function clearSearch() {
  emit('update:modelValue', '');
  searchFocused.value = true;
  nextTick(() => {
    searchInput.value?.focus();
  });
}
</script>

<style scoped>
.table-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  padding-inline-start: 0;
  transition: padding-inline-start 160ms ease;
}

.table-actions.is-search-expanded {
  padding-inline-start: 155px;
}

.search-container {
  position: relative;
  inline-size: 85px;
  block-size: 42px;
  flex: 0 0 85px;
  overflow: visible;
}

.search-input {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 0;
  inline-size: 65px;
  display: flex;
  align-items: center;
  padding: 9px 8px;
  overflow: hidden;
  border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
  border-radius: calc((42px + var(--theme--border-width) * 2) / 2);
  transition:
    inline-size 160ms ease,
    border-color 160ms ease;
  will-change: inline-size;
  z-index: 2;
}

.search-input:focus-within {
  inline-size: 240px;
  border-color: var(--theme--form--field--input--border-color-focus);
}

.search-input.is-expanded {
  inline-size: 240px;
}

.search-input input {
  border: 0;
  background: transparent;
  outline: none;
  color: var(--theme--foreground);
  width: 100%;
  min-width: 0;
}

.search-input .spacer {
  flex: 1;
}

.icon-search,
.icon-filter {
  color: var(--theme--foreground-subdued);
}

.icon-search {
  cursor: pointer;
}

.clear-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  margin: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--theme--foreground-subdued);
  transition: color 160ms ease;
  flex-shrink: 0;
}

.clear-button:hover {
  color: var(--theme--foreground);
}

.clear-button :deep(.v-icon) {
  font-size: 18px;
}

.action-delete:hover :deep(.button),
.action-delete:focus-within :deep(.button) {
  background-color: var(--theme--danger);
  color: #fff;
}
</style>
