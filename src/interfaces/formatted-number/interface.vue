<template>
  <VInput
    :model-value="displayValue"
    @update:model-value="onInput"
  />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps(['value']);
const emit = defineEmits(['input']);

const displayValue = computed(() => {
  if (props.value == null || Number(props.value) === 0) return '';
  return new Intl.NumberFormat('hu-HU').format(Number(props.value));
});

function onInput(val) {
  const raw = String(val ?? '').replace(/\s/g, '');
  emit('input', raw === '' ? 0 : Number(raw));
}
</script>
