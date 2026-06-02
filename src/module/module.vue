<template>
  <router-view v-if="hasErpAccess" />
  <div v-else class="erp-access-denied">
    <VNotice type="danger">You do not have access to the ERP module.</VNotice>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useStores } from '@directus/extensions-sdk';
import { ERP_COLLECTIONS } from '../bootstrap/types'; 

const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();

const hasErpAccess = computed(() =>
  ERP_COLLECTIONS.some((collection) => permissionsStore.hasPermission(collection, 'read')),
);
</script>

<style scoped>
.erp-access-denied {
  padding: 24px;
}
</style>
