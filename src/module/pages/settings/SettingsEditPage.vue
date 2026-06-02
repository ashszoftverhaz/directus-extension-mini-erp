<template>
  <ErpLayout title="ERP - Edit setting" :getInfo="() => getCollectionInfo()">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>

    <template #title-icon>
      <div class="erp-title-prepend">
        <VButton class="header-icon" rounded icon secondary @click="goBack">
          <VIcon name="arrow_back" />
        </VButton>
        <VButton class="header-icon" rounded icon secondary disabled>
          <VIcon name="settings" />
        </VButton>
      </div>
    </template>

    <template #actions>
      <VButton
        icon
        rounded
        :loading="saving"
        :disabled="saving || loading || !hasPermission || !canSubmit"
        @click="save">
        <VIcon name="check" />
      </VButton>
    </template>

    <div class="settings-edit-form">
      <div v-if="!hasPermission || errorMessage || successMessage" class="erp-notices-wrapper" ref="noticeWrapper">
        <VNotice v-if="!hasPermission" type="danger" icon="warning">
          You do not have permissions to update settings.
        </VNotice>
        <VNotice v-else-if="errorMessage" type="danger">
          {{ errorMessage }}
        </VNotice>
        <VNotice v-else-if="successMessage" type="success">
          {{ successMessage }}
        </VNotice>
      </div>

      <VProgressLinear v-if="loading" indeterminate />

      <div v-if="!loading && hasPermission" class="form-body">
        <div class="erp-form-section-header erp-no-top-margin">
          <VIcon name="settings" />
          <h2 class="erp-title-display-md">Setting</h2>
        </div>

        <div class="form-field">
          <label class="field-label">Settings name</label>
          <VInput v-model="settingsName" :disabled="!canEditMeta" placeholder="Setting name" />
        </div>

        <div class="form-field">
          <label class="field-label">{{ valueLabel }}</label>

          <!-- Base / single currency / country / location picker -->
          <button
            v-if="isBaseCurrency || isBaseCountry || isBaseLocation"
            type="button"
            class="field field-select"
            @click="openValuePicker">
            <span class="field-text">
              {{ valueDisplay || valuePlaceholder }}
            </span>
            <VIcon name="arrow_drop_down" class="field-icon-right" />
          </button>

          <!-- Fallback: simple text value -->
          <VInput v-else v-model="value" placeholder="Value" />
        </div>

        <div class="form-field">
          <label class="field-label">Notes</label>
          <VTextarea
            v-model="notes"
            :disabled="!canEditMeta"
            rows="3"
            placeholder="Notes for this setting" />
        </div>
      </div>
    </div>

    <SettingsBaseCurrencyDrawer v-model:open="currencyDrawerOpen" @select="selectBaseCurrency" />

    <SettingsBaseCountryDrawer v-model:open="countryDrawerOpen" @select="selectBaseCountry" />

    <SettingsBaseLocationDrawer
      v-model:open="locationDrawerOpen"
      :value="value"
      @select="selectBaseLocation" />
  </ErpLayout>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useApi, useStores } from '@directus/extensions-sdk';
import { useRoute, useRouter } from 'vue-router';
import ErpLayout from '../../layouts/ErpLayout.vue';
import { parseLocationSettingValue } from '../../utils/settingsFormat';
import SettingsBaseCurrencyDrawer from '../../components/settings/SettingsBaseCurrencyDrawer.vue';
import SettingsBaseCountryDrawer from '../../components/settings/SettingsBaseCountryDrawer.vue';
import SettingsBaseLocationDrawer from '../../components/settings/SettingsBaseLocationDrawer.vue';
import { getCollectionInfo } from '../../api/settingsApi';

const api = useApi();
const router = useRouter();
const route = useRoute();
const { usePermissionsStore, useUserStore } = useStores();
const permissionsStore = usePermissionsStore();
const userStore = useUserStore();

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Default settings', to: '/erp/settings', disabled: 'false' },
  { name: 'Edit', to: route.fullPath, disabled: 'true' },
];

const noticeWrapper = ref<HTMLElement | null>(null);

const hasPermission = computed(() => permissionsStore.hasPermission('erp_settings', 'update'));
const isGlobalAdmin = computed(() => {
  const user = userStore.currentUser as any;
  return Boolean(user?.admin_access);
});
const canEditMeta = computed(() => isGlobalAdmin.value);

const loading = ref(true);
const saving = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const settingsName = ref('');
const value = ref<string | null>(null);
const notes = ref<string | null>(null);
const key = ref('');

const initialSnapshot = ref<{
  settingsName: string;
  value: string | null;
  notes: string | null;
} | null>(null);

const isBaseCurrency = computed(() => key.value === 'base_currency');
const isBaseCountry = computed(() => key.value === 'base_country');
const isBaseLocation = computed(() => key.value === 'base_location');

const valueLabel = computed(() => {
  if (isBaseCurrency.value) return 'Base currency';
  if (isBaseCountry.value) return 'Base country';
  if (isBaseLocation.value) return 'Base location';
  return 'Value';
});

const valuePlaceholder = computed(() => {
  if (isBaseCurrency.value) return 'Select base currency...';
  if (isBaseCountry.value) return 'Select base country...';
  if (isBaseLocation.value) return 'Select base location...';
  return 'Set value...';
});

const canSubmit = computed(() => {
  if (!initialSnapshot.value) return false;
  const current = {
    settingsName: settingsName.value,
    value: value.value ?? null,
    notes: notes.value ?? null,
  };
  return JSON.stringify(initialSnapshot.value) !== JSON.stringify(current);
});

watch(
  () => errorMessage.value || successMessage.value,
  async (message) => {
    if (!message) return;

    await nextTick();
    noticeWrapper.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
);

function goBack() {
  router.push('/erp/settings');
}

async function loadSetting() {
  errorMessage.value = '';
  successMessage.value = '';
  loading.value = true;

  const id = route.params.id as string | undefined;
  if (!id) {
    errorMessage.value = 'Missing setting id.';
    loading.value = false;
    return;
  }

  try {
    const response = await api.get(`/items/erp_settings/${id}`, {
      params: {
        fields: ['id', 'key', 'settings_name', 'value', 'notes'],
      },
    });

    const data = response?.data?.data;
    if (!data) {
      throw new Error('Setting not found');
    }

    key.value = data.key ?? '';
    settingsName.value = data.settings_name ?? '';
    value.value = data.value ?? null;
    notes.value = data.notes ?? null;

    initialSnapshot.value = {
      settingsName: settingsName.value,
      value: value.value ?? null,
      notes: notes.value ?? null,
    };
  } catch (error: any) {
    console.error('Failed to load setting', error);
    errorMessage.value =
      error?.response?.data?.errors?.[0]?.message ?? error?.message ?? 'Load failed.';
  } finally {
    loading.value = false;
  }
}

async function save() {
  errorMessage.value = '';
  successMessage.value = '';

  if (!hasPermission.value) {
    errorMessage.value = 'You do not have permissions to update settings.';
    return;
  }

  if (!canSubmit.value) {
    errorMessage.value = 'No changes to save.';
    return;
  }

  const id = route.params.id as string | undefined;
  if (!id) {
    errorMessage.value = 'Missing setting id.';
    return;
  }

  saving.value = true;

  try {
    const payload: Record<string, any> = {};
    if (canEditMeta.value) {
      payload.settings_name = settingsName.value;
      payload.notes = notes.value ?? null;
    }
    payload.value = value.value ?? null;

    await api.patch(`/items/erp_settings/${id}`, payload);

    successMessage.value = 'Setting updated.';
    router.push('/erp/settings');
  } catch (error: any) {
    console.error('Failed to update setting', error);
    errorMessage.value =
      error?.response?.data?.errors?.[0]?.message ?? error?.message ?? 'Update failed.';
  } finally {
    saving.value = false;
  }
}

// Display helpers
const valueDisplay = computed(() => {
  if (!value.value) return '';

  if (isBaseLocation.value) {
    const parsed = parseLocationSettingValue(value.value);
    if (!parsed) return value.value;
    return parsed.nameSlug || `${parsed.collection}:${parsed.id}`;
  }

  return value.value;
});

// Drawer state
const currencyDrawerOpen = ref(false);
const countryDrawerOpen = ref(false);
const locationDrawerOpen = ref(false);

function selectBaseCurrency(code: string) {
  value.value = code;
}

function selectBaseCountry(iso2: string) {
  value.value = iso2;
}

function selectBaseLocation(formatted: string) {
  value.value = formatted;
}

function openValuePicker() {
  if (isBaseCurrency.value) {
    currencyDrawerOpen.value = true;
  } else if (isBaseCountry.value) {
    countryDrawerOpen.value = true;
  } else if (isBaseLocation.value) {
    locationDrawerOpen.value = true;
  }
}

onMounted(() => {
  loadSetting();
});
</script>

<style scoped>
.settings-edit-form {
  background: var(--theme--background);
  padding: 20px;
  padding-top: 0;
}
.form-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-inline-size: calc(var(--form-column-max-width) * 2 + var(--theme--form--column-gap));
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: var(--theme--form--field--input--height);
  padding: 6px 10px;
  border-radius: var(--theme--border-radius);
  border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
  background-color: var(--theme--form--field--input--background);
  cursor: pointer;
  transition: border-color 160ms ease;
}

.field:hover {
  border-color: var(--theme--form--field--input--border-color-hover);
}

.field-text {
  flex: 1;
  text-align: left;
}

.field-icon-right {
  color: var(--theme--foreground-subdued);
  margin-left: 6px;
}

.frequent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.frequent-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.frequent-add :deep(.button) {
  justify-content: flex-start;
}

.frequent-field {
  width: 100%;
  cursor: default;
}

.frequent-field .icon-button {
  min-inline-size: var(--theme--form--field--input--height);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--theme--danger);
  cursor: pointer;
  margin-left: 8px;
}

.drawer-title {
  font-size: 18px;
  font-weight: 600;
}

.drawer-content {
  padding: var(--content-padding);
  min-height: 0;
  overflow: auto;
}

.drawer-search {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  padding: 6px 8px;
  border-radius: var(--theme--border-radius);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  background-color: var(--theme--background);
}

.icon-search {
  color: var(--theme--foreground-subdued);
}

.search-input {
  border: 0;
  outline: none;
  width: 100%;
  background: transparent;
  color: var(--theme--foreground);
}

.drawer-list {
  display: flex;
  flex-direction: column;
}

.drawer-list-item {
  width: 100%;
  padding: 8px 10px;
  text-align: left;
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.drawer-list-item:hover {
  background-color: var(--theme--background-subdued);
}
</style>
