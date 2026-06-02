<template>
  <span class="income-expense-pill" :class="pillClass">
    <VIcon v-if="direction === 'incomes'" name="input_circle" class="icon" />
    <VIcon v-else-if="direction === 'expenses'" name="output_circle" class="icon" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  direction: 'incomes' | 'expenses';
}>();

const label = computed(() => {
  return props.direction === 'incomes' ? 'Income' : 'Expense';
});

const pillClass = computed(() => {
  switch (label.value) {
    case 'Income':
      return 'is-income';
    case 'Expense':
      return 'is-expense';
  }
});
</script>

<style scoped>
.income-expense-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--theme--border-color-subdued);
  background: var(--theme--background-subdued);
  color: var(--theme--foreground);
  user-select: none;
}

.income-expense-pill :deep(.icon) {
  margin-right: 8px;
  transform: scale(0.7);
}

.income-expense-pill.is-income {
  border-color: var(--theme--success);
  color: var(--theme--success);
  background: color-mix(in srgb, var(--theme--success) 12%, var(--theme--background));
}

.income-expense-pill.is-expense {
  border-color: var(--theme--danger);
  color: var(--theme--danger);
  background: color-mix(in srgb, var(--theme--danger) 12%, var(--theme--background));
}
</style>
