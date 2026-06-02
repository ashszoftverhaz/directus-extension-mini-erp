<template>
  <div class="erp-table-footer">
    <div class="left">
      <VPagination
        v-model="pageModel"
        :length="totalPages"
        :total-visible="totalVisible"
        color="primary"
        density="compact" />
    </div>

    <div class="right">
      <div class="rows-per-page">
        <span class="label">{{ rowsPerPageLabel }}</span>

        <VMenu>
          <template #activator="{ toggle }">
            <button
              type="button"
              class="rows-per-page-activator"
              :disabled="disabled"
              @click="toggle">
              <span class="value">{{ itemsPerPageModel }}</span>
              <VIcon class="v-icon" name="expand_more" />
            </button>
          </template>

          <VList>
            <VListItem
              v-for="option in rowsPerPageOptions"
              :key="option.value"
              clickable
              :active="itemsPerPageModel === option.value"
              @click="itemsPerPageModel = option.value">
              <VListItemContent>
                {{ option.text }}
              </VListItemContent>
            </VListItem>
          </VList>
        </VMenu>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

type RowsPerPageOption = { text: string; value: number };

const props = withDefaults(
  defineProps<{
    page: number;
    totalPages: number;
    totalVisible?: number;
    itemsPerPage: number;
    rowsPerPageOptions: RowsPerPageOption[];
    rowsPerPageLabel?: string;
    disabled?: boolean;
  }>(),
  {
    totalVisible: 7,
    rowsPerPageLabel: 'Per Page',
    disabled: false,
  }
);

const emit = defineEmits<{
  (e: 'update:page', value: number): void;
  (e: 'update:itemsPerPage', value: number): void;
}>();

const pageModel = computed<number>({
  get: () => props.page,
  set: (value) => emit('update:page', value),
});

const itemsPerPageModel = computed<number>({
  get: () => props.itemsPerPage,
  set: (value) => emit('update:itemsPerPage', value),
});
</script>

<style scoped>
.erp-table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  gap: 16px;
}

.left {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  flex: 0 0 auto;
}

.right {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  flex: 0 0 auto;
}

.rows-per-page {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  inline-size: 240px;
  color: var(--theme--foreground-subdued);
}

.rows-per-page .label {
  font-size: 16px;
  color: var(--theme--foreground-subdued);
  white-space: nowrap;
  margin-inline-end: 4px;
}

.rows-per-page-activator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-block-size: 32px;
  padding: 4px 8px;
  color: var(--theme--foreground);
  cursor: pointer;
  font: inherit;
  border: 0;
  background: transparent;
}

.rows-per-page-activator:disabled {
  cursor: default;
  opacity: 0.7;
}

.rows-per-page-activator .value {
  min-inline-size: 2ch;
  text-align: end;
}
</style>
