<template>
  <teleport to="body">
    <transition name="confirm-delete-fade">
      <div v-if="props.open" class="confirm-delete" role="dialog" aria-modal="true">
        <div class="confirm-delete-overlay" @click="onCancel" />

        <transition name="confirm-delete-slide" appear>
          <VCard v-if="props.open" class="confirm-delete-card" @click.stop>
            <div class="v-card-title type-label">
              {{ props.message }}
            </div>

            <div class="v-card-actions confirm-delete-actions">
              <VButton secondary :disabled="props.busy" @click="onCancel">
                {{ props.cancelText }}
              </VButton>
              <VButton danger class="confirm-delete-danger" :loading="props.busy" :disabled="props.busy" @click="onConfirm">
                {{ props.confirmText }}
              </VButton>
            </div>
          </VCard>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    open: boolean;
    message: string;
    confirmText?: string;
    cancelText?: string;
    busy?: boolean;
  }>(),
  {
    confirmText: 'Delete',
    cancelText: 'Cancel',
    busy: false,
  }
);

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') onCancel();
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) window.addEventListener('keydown', onKeydown);
    else window.removeEventListener('keydown', onKeydown);
  },
  { immediate: true }
);

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));

function onCancel() {
  emit('cancel');
  emit('update:open', false);
}

function onConfirm() {
  emit('confirm');
}
</script>

<style scoped>
.confirm-delete {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
}

.confirm-delete-overlay {
  position: absolute;
  inset: 0;
  background-color: var(--overlay-color);
}

.confirm-delete-card {
  position: relative;
  min-width: 540px;
  background-color: var(--theme--background);
  box-shadow: 0 4px 12px #2632381a;
}

.v-card-title {
  padding-block-end: 8px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-block-start: 4px;
  padding: 28px 24px;
  font-weight: 600;
  line-height: 1.6em;
}

.type-label {
  font-size: 16px;
}

.v-card-actions {
  display: flex;
  justify-content: flex-end;
  padding: 28px 16px;
  gap: 12px;
}

.confirm-delete-danger:hover :deep(.button) {
  filter: brightness(0.95);
}

.confirm-delete-fade-enter-active,
.confirm-delete-fade-leave-active {
  transition: opacity 160ms ease;
}

.confirm-delete-fade-enter-from,
.confirm-delete-fade-leave-to {
  opacity: 0;
}

.confirm-delete-slide-enter-active,
.confirm-delete-slide-leave-active {
  transition: transform 180ms ease, opacity 180ms ease;
}

.confirm-delete-slide-enter-from,
.confirm-delete-slide-leave-to {
  transform: translateY(36px);
  opacity: 0;
}
</style>
