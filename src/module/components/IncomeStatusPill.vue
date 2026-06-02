<template>
  <span class="status-pill" :class="pillClass">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getTransactionStatus } from '../utils/transactionStatus';

const props = defineProps<{
  paymentDueDate?: string | null;
  paymentDate?: string | null;
}>();

const status = computed<'planned' | 'overdue' | 'paid'>(() => {
  return getTransactionStatus(props.paymentDueDate ?? null, props.paymentDate ?? null);
});

const label = computed(() => {
  switch (status.value) {
    case 'paid':
      return 'Paid';
    case 'overdue':
      return 'Overdue';
    case 'planned':
    default:
      return 'Planned';
  }
});

const pillClass = computed(() => {
  switch (status.value) {
    case 'paid':
      return 'is-paid';
    case 'overdue':
      return 'is-overdue';
    case 'planned':
    default:
      return 'is-planned';
  }
});
</script>

<style scoped>
.status-pill {
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

.status-pill.is-planned {
  border-color: var(--theme--border-color-subdued);
  background: var(--theme--background-subdued);
  color: var(--theme--foreground-subdued);
}

.status-pill.is-paid {
  border-color: var(--theme--success);
  color: var(--theme--success);
  background: color-mix(in srgb, var(--theme--success) 12%, var(--theme--background));
}

.status-pill.is-overdue {
  border-color: var(--theme--danger);
  color: var(--theme--danger);
  background: color-mix(in srgb, var(--theme--danger) 12%, var(--theme--background));
}
</style>
