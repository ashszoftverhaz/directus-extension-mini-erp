<template>
  <div class="erp-sidebar">
    <sidebar-detail icon="info" title="Information" close>
      <InformationSidebarSection :getInfo="props.getInfo" />
    </sidebar-detail>

    <sidebar-detail
      v-if="props.exportAvailable"
      icon="swap_vert"
      title="Export"
      close
    >
      <ExportSidebarSection
        :isExporting="props.isExporting"
        :exportButtonEnable="props.exportButtonEnable"
        :omitExportDescription="props.omitExportDescription"
        @export="$emit('export')"
      />
    </sidebar-detail>
  </div>
</template>

<script lang="ts" setup>
import ExportSidebarSection from './ExportSidebarSection.vue';
import InformationSidebarSection from './InformationSidebarSection.vue';

const props = defineProps<{
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
.erp-sidebar {
  display: flex;
  flex-direction: column;
}
</style>