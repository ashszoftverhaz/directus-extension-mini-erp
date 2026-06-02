<template>
  <div class="user-box">
    <div class="avatar">
      <VIcon class="v-icon x-large" :name="icon" />
    </div>

    <div class="user-box-content">
      <div class="name type-label">{{ name || '—' }}</div>
      <div class="email">
        <VIcon class="v-icon small" name="alternate_email" />
        {{ email || '—' }}
      </div>
      <div v-if="role" class="role">
        <span class="role-pill">
          <VIcon class="v-icon x-small" name="badge" />
          <span class="role-text">{{ role }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    name: string;
    email: string;
    role?: string;
    icon?: string;
  }>(),
  {
    icon: 'account_circle',
  },
);
</script>

<style scoped>
.user-box {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 42px 16px;
  max-inline-size: calc(var(--form-column-max-width) * 2 + var(--theme--form--column-gap));
  margin-block-end: var(--theme--form--row-gap);
  border-radius: calc(var(--theme--border-radius) + 4px);
  background-color: var(--theme--background-normal);
}

.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  color: var(--theme--foreground-subdued);
}

.user-box-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.email {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--theme--foreground-subdued);
  min-width: 0;
}

.role {
  display: inline-flex;
  align-items: center;
  min-width: 0;
}

.role-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  background-color: var(--theme--background-subdued);
  color: var(--theme--foreground);
  font-size: 12px;
  font-weight: 500;
  max-width: 100%;
}

.role-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
