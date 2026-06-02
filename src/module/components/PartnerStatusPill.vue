<template>
  <span class="status-pill" :class="pillClass">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  status: string | null | undefined;
}>();

const normalized = computed(() => String(props.status ?? 'draft').toLowerCase());

const label = computed(() => {
  switch (normalized.value) {
    case 'active':
      return 'Active';
    case 'potential':
      return 'Potential';
    case 'closed':
      return 'Closed';
    default:
      return '--';
  }
});

const pillClass = computed(() => {
  switch (normalized.value) {
    case 'active':
      return 'is-active';
    case 'potential':
      return 'is-potential';
    case 'closed':
      return 'is-closed';
    default:
      return 'is-closed';
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

.status-pill.is-closed {
  border-color: var(--theme--border-color-subdued);
  background: var(--theme--background-subdued);
  color: var(--theme--foreground-subdued);
}

.status-pill.is-active {
  border-color: var(--theme--success);
  color: var(--theme--success);
  background: color-mix(in srgb, var(--theme--success) 12%, var(--theme--background));
}

.status-pill.is-potential {
  border-color: #FFC23B;
  color: #FFC23B;
  background: color-mix(in srgb, #FFC23B 12%, var(--theme--background));
}
</style>

