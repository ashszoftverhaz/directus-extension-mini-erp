<template>
  <private-view class="erp-layout" :title="title">
    <template #headline>
      <slot name="headline" />
    </template>
    <template #title-outer:prepend>
      <slot name="title-icon" />
    </template>
    <template #title-outer:append>
      <slot name="title-actions" />
    </template>
    <template #actions>
      <slot name="actions" />
    </template>
    <template #navigation>
      <ErpNavigation />
    </template>

    <!-- Main content slot for pages -->
    <div class="erp-layout-content">
      <slot />
    </div>

    <!-- Right sidebar -->
    <template #sidebar>
      <slot name="sidebar">
        <ErpSidebar
          :exportAvailable="exportAvailable"
          :isExporting="isExporting"
          :exportButtonEnable="exportButtonEnable"
          :omitExportDescription="omitExportDescription"
          :getInfo="getInfo"
          @export="$emit('export')"
        />
      </slot>
    </template>
  </private-view>
</template>

<script lang="ts" setup>
import ErpNavigation from '../components/erp-navigation.vue';
import ErpSidebar from '../components/erp-sidebar.vue';

defineProps<{
  title: string;
  exportAvailable?: boolean;    
  isExporting?: boolean;
  exportButtonEnable?: boolean;
  omitExportDescription?: boolean;
  getInfo?: () => Promise<string>;
}>();
defineEmits<{
  export: [];
}>();
</script>

<style scoped>
.erp-layout-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

:global(.erp-layout .private-view__navigation) {
  width: var(--erp-layout-navigation-width, 280px);
}
:global(.erp-layout .resize-wrapper.transition) { 
  transition: none !important; 
}
:global(.erp-layout .resize-wrapper.transition > :first-child) {
  transition: none !important;
}
</style>
