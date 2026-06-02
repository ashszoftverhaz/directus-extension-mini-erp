<template>
  <div class="create-actions">
    <VButton
      icon
      rounded
      :loading="saving"
      :disabled="saving || !canSubmit"
      @click="$emit('save-primary')"
    >
      <VIcon name="check" />
    </VButton>

    <VMenu>
      <template #activator="{ toggle }">
        <VButton icon :disabled="saving" class="more-button" @click="toggle">
          <VIcon name="more_vert" />
        </VButton>
      </template>

      <VList>
        <VListItem clickable :disabled="saving || !canSubmit" @click="$emit('save-and-stay')">
          <VListItemContent>
            <div class="menu-item">
              <div class="menu-item-left">
                <VIcon name="check" />
                <span>Save and Stay</span>
              </div>
              <!-- TODO Implement keyboard shortcut -->
              <div class="menu-item-hint">Ctrl+S</div>
            </div>
          </VListItemContent>
        </VListItem>

        <VListItem clickable :disabled="saving || !canSubmit" @click="$emit('save-and-create-new')">
          <VListItemContent>
            <div class="menu-item">
              <div class="menu-item-left">
                <VIcon name="add" />
                <span>Save and Create New</span>
              </div>
              <!-- TODO Implement keyboard shortcut -->
              <div class="menu-item-hint">Ctrl+Shift+S</div>
            </div>
          </VListItemContent>
        </VListItem>

        <VListItem clickable :disabled="saving" @click="$emit('discard-all-changes')">
          <VListItemContent>
            <div class="menu-item">
              <div class="menu-item-left">
                <VIcon name="undo" />
                <span>Discard All Changes</span>
              </div>
            </div>
          </VListItemContent>
        </VListItem>
      </VList>
    </VMenu>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  saving: boolean;
  canSubmit: boolean;
}>();

defineEmits<{
  (e: 'save-primary'): void;
  (e: 'save-and-stay'): void;
  (e: 'save-and-create-new'): void;
  (e: 'discard-all-changes'): void;
}>();
</script>

<style scoped>
.create-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.more-button :deep(.button) {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
  color: var(--theme--foreground) !important;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}

.menu-item-left {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.menu-item-hint {
  font-size: 12px;
  color: var(--theme--foreground-subdued);
  white-space: nowrap;
}
</style>

