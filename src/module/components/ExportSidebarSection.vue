<template>
    <div class="sidebar-section">
        <div class="sidebar-content">
            <VButton
                class="export-button"
                :loading="props.isExporting"
                :disabled="props.isExporting || !props.exportButtonEnable" 
                @click="$emit('export')">
                {{ props.omitExportDescription ? 'Export' : 'Export Items' }}
            </VButton>
            <p v-if="!props.omitExportDescription" class="export-text">
                Choose the items from the list you want to export and click on this button to download the items as a CSV.
            </p>
        </div>
    </div>
</template>

<script lang="ts" setup>

const props = defineProps<{
    isExporting?: boolean;
    exportButtonEnable?: boolean;
    omitExportDescription?: boolean;
}>();

defineEmits<{
    export: [];
}>();

</script>

<style scoped>
.sidebar-section {
    border-bottom: 1px solid var(--border-subdued);
}

.sidebar-content {
    padding: 16px;
    font-size: 13px;
    color: var(--foreground-subdued);
    line-height: 1.4;
    width: 100%;
}

.sidebar-content :deep(button) {
    width: 100%;
}

.sidebar-content :deep(.export-button) {
    width: 100%;
}

.export-text {
    margin-top: 8px;
    color: var(--theme--foreground-subdued);
    font-weight: 300;
    display: block;
    inline-size: 100%;
    margin-block-start: 8px;
    transition: color var(--fast) var(--transition);
}
</style>