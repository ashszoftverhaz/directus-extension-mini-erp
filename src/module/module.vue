<template>
  <router-view v-if="hasErpAccess" />
  <div v-else class="erp-access-denied">
    <VNotice type="danger">You do not have access to the ERP module.</VNotice>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useApi, useStores } from '@directus/extensions-sdk';
import { ERP_COLLECTIONS } from '../bootstrap/types'; 
import { getVersionStatus } from '../services/versionHandler';

const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();

const hasErpAccess = computed(() =>
  ERP_COLLECTIONS.some((collection) => permissionsStore.hasPermission(collection, 'read')),
);


const { useNotificationsStore } = useStores();
const notificationsStore = useNotificationsStore();
const api = useApi();

onMounted(async () => {
  try {    
    const bundleVersionStatus = await getVersionStatus(api);

    if (bundleVersionStatus.updateAvailable) {
      notificationsStore.add({
        type: 'info',
        title: 'Update available',
        text: `A newer ERP bundle version is available: ${bundleVersionStatus.latestVersion}`,
        dialog: true,
      });
    }
  } catch (err) {
    console.error(err);
  }
});
</script>

<style scoped>
.erp-access-denied {
  padding: 24px;
}
</style>
