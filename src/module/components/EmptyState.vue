<template>
  <div :class="wrapperClass">
    <div class="v-info info center">
      <div class="icon">
        <VIcon class="large" :name="icon" />
      </div>
      <h2 class="title type-title">{{ title }}</h2>
      <p v-if="description" class="content">{{ description }}</p>
      <div v-if="actionLabel" class="v-button">
        <a
          v-if="actionVariant === 'link'"
          class="action-link"
          @click="onAction"
        >
          {{ actionLabel }}
        </a>
        <VButton v-else-if="!actionDisabled" class="align-center normal" :disabled="actionDisabled" @click="onAction">
          {{ actionLabel }}
        </VButton>
      </div>
      <slot name="extra" />
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    icon?: string;
    actionLabel?: string;
    actionDisabled?: boolean;
    actionVariant?: 'button' | 'link';
    wrapperClass?: string;
  }>(),
  {
    icon: 'star',
    actionDisabled: false,
    actionVariant: 'button',
    wrapperClass: 'erp-empty-state',
  }
);

const emit = defineEmits<{
  (e: 'action'): void;
}>();

function onAction() {
  if (props.actionDisabled || !props.actionLabel) return;
  emit('action');
}
</script>

<style scoped>
.erp-empty-state {
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.v-info.info.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 480px;
  margin: 0 auto;
}

.content {
  margin-block-end: 24px;
}

.action-link {
  text-decoration: underline;
  text-underline-offset: 2px;
  font-weight: 600;
}

.action-link:hover {
  cursor: pointer;
}

.action-link.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.v-info.info.center .icon {
  color: var(--theme--foreground-subdued);
  background-color: var(--theme--background-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  inline-size: 100px;
  block-size: 100px;
  margin-block-end: 16px;
  border-radius: 50%;
}
</style>
