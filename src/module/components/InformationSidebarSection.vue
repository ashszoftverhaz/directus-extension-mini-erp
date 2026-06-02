<template>
  <div class="sidebar-section">
    <div class="sidebar-content">
      <p v-if="collectionNote" class="collection-note">
        {{ collectionNote }}
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps<{
  getInfo?: () => Promise<string>;
}>();


const route = useRoute();
const collectionNote = ref('');

async function loadCollectionNote() {
  if (!props.getInfo) {
    collectionNote.value = '';
    return;
  }

  try {
    collectionNote.value = await props.getInfo();
  } catch (error) {
    console.warn(`Failed to load note for collection`, error);
    collectionNote.value = '';
  }
}

watch(
  () => route.fullPath,
  () => {
    void loadCollectionNote();
  },
  { immediate: true },
);
</script>

<style scoped>
.sidebar-section {
  border-bottom: 1px solid var(--border-subdued);
}

.sidebar-content {
  padding: 16px;
  font-size: 13px;
  line-height: 1.4;
  margin-block-end: 8px;
    color: var(--theme--sidebar--foreground);
}

.collection-note {
  margin-bottom: 10px;
  color: var(--foreground-normal);
}
</style>