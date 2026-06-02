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
    case 'expired':
      return 'Expired';
    case 'draft':
    default:
      return 'Draft';
  }
});

const pillClass = computed(() => {
  switch (normalized.value) {
    case 'active':
      return 'is-active';
    case 'expired':
      return 'is-expired';
    default:
      return 'is-draft';
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

.status-pill.is-draft {
  border-color: var(--theme--border-color-subdued);
  background: var(--theme--background-subdued);
  color: var(--theme--foreground-subdued);
}

.status-pill.is-active {
  border-color: var(--theme--success);
  color: var(--theme--success);
  background: color-mix(in srgb, var(--theme--success) 12%, var(--theme--background));
}

.status-pill.is-expired {
  border-color: var(--theme--danger);
  color: var(--theme--danger);
  background: color-mix(in srgb, var(--theme--danger) 12%, var(--theme--background));
}
</style>

