<template>
  <ErpLayout title="ERP">
    <div class="cards-wrapper">
      <VCard class="wizard-card">
        <VCardTitle>Setup Wizard</VCardTitle>
        <VCardText>
          <p>With the help of the Setup Wizard, you can make sure all the required data is setup correctly to start using the ERP.</p>
        </VCardText>
        <VCardActions class="wizard-actions">
          <VButton class="wizard-button" block @click="openWizardFromCard">
            Run setup wizard
          </VButton>
        </VCardActions>
        <div v-if="showBottomLine" class="bottom-line">
          <VCardText>
            <p>Steps 0/5</p>
          </VCardText>
          <VCardText>
            <p class="attention-required">Attention required!</p>
          </VCardText>
        </div>
      </VCard>

      <VCard>
        <VCardTitle>ERP Overview</VCardTitle>
        <VCardText>
          <p>This ERP space is scoped to its own menu so we can add modules over time.</p>
          <p>Use the sidebar to manage washers, currencies and other ERP resources.</p>
        </VCardText>
      </VCard>
    </div>

    <SetupWizard
      v-model:open="wizardOpen"
      :base-currency="form.base_currency"
      :base-country="form.base_country"
      :base-location="form.base_location"
      :base-location-display="form.base_location_display"
      :resume-mode="wizardResumeMode"
      @open-currency-drawer="openCurrencyDrawerFromWizard"
      @open-country-drawer="openCountryDrawerFromWizard"
      @open-location-drawer="openLocationDrawerFromWizard"
      @resume-consumed="wizardResumeMode = false"
      @close-wizard="wizardOpen = false" />
    <SettingsBaseCurrencyDrawer
      v-model:open="currencyDrawerOpen"
      @select="(code) => { form.base_currency = code; currencyDrawerOpen = false; }" />

    <SettingsBaseCountryDrawer
      v-model:open="countryDrawerOpen"
      @select="(iso2) => { form.base_country = iso2; countryDrawerOpen = false; }" />

    <SettingsBaseLocationDrawer
      v-model:open="locationDrawerOpen"
      :value="form.base_location"
      @select="async (formatted) => { form.base_location = formatted; form.base_location_display = await locationDisplayFromValue(formatted); locationDrawerOpen = false; }" />
  </ErpLayout>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import ErpLayout from '../layouts/ErpLayout.vue';
import SetupWizard from '../components/SetupWizard.vue';
import SettingsBaseCurrencyDrawer from '../components/settings/SettingsBaseCurrencyDrawer.vue';
import SettingsBaseCountryDrawer from '../components/settings/SettingsBaseCountryDrawer.vue';
import SettingsBaseLocationDrawer from '../components/settings/SettingsBaseLocationDrawer.vue';
import { parseLocationSettingValue } from '../utils/settingsFormat';
import { useApi } from '@directus/extensions-sdk';

const api = useApi();
const wizardOpen = ref(false);
const currencyDrawerOpen = ref(false);
const countryDrawerOpen = ref(false);
const locationDrawerOpen = ref(false);
const reopenWizardAfterDrawerClose = ref(false);
const wizardResumeMode = ref(false);
const showBottomLine = ref(false);

const REQUIRED_SETTING_KEYS = ['base_currency', 'base_country', 'base_location'] as const;

const anyDrawerOpen = computed(
  () => currencyDrawerOpen.value || countryDrawerOpen.value || locationDrawerOpen.value,
);

watch(anyDrawerOpen, (isAnyOpen, wasAnyOpen) => {
  if (isAnyOpen) {
    wizardOpen.value = false;
    return;
  }

  if (wasAnyOpen && reopenWizardAfterDrawerClose.value) {
    wizardOpen.value = true;
    reopenWizardAfterDrawerClose.value = false;
  }
});

function openCurrencyDrawerFromWizard() {
  wizardResumeMode.value = true;
  reopenWizardAfterDrawerClose.value = true;
  currencyDrawerOpen.value = true;
}

function openCountryDrawerFromWizard() {
  wizardResumeMode.value = true;
  reopenWizardAfterDrawerClose.value = true;
  countryDrawerOpen.value = true;
}

function openLocationDrawerFromWizard() {
  wizardResumeMode.value = true;
  reopenWizardAfterDrawerClose.value = true;
  locationDrawerOpen.value = true;
}

function openWizardFromCard() {
  wizardResumeMode.value = false;
  wizardOpen.value = true;
}

type ErpSettingRow = {
  key?: string;
  value?: string | null;
};

async function refreshBottomLineVisibility(): Promise<void> {
  try {
    const response = await api.get('/items/erp_settings', {
      params: {
        fields: ['key', 'value'],
        filter: {
          key: { _in: [...REQUIRED_SETTING_KEYS] },
        },
        limit: REQUIRED_SETTING_KEYS.length,
      },
    });

    const rows = (response.data?.data ?? []) as ErpSettingRow[];
    const valueByKey = new Map<string, string | null | undefined>();

    for (const row of rows) {
      if (!row?.key) continue;
      valueByKey.set(row.key, row.value);
    }

    showBottomLine.value = REQUIRED_SETTING_KEYS.some((key) => valueByKey.get(key) == null);
  } catch (err) {
    console.error('OverviewPage: failed to evaluate required ERP settings', err);
    // Fail open so missing setup still gets attention if this check cannot run.
    showBottomLine.value = true;
  }
}

onMounted(() => {
  void refreshBottomLineVisibility();
});

const form = reactive({
  base_currency: '',
  base_country: '',
  base_location: '',
  base_location_display: '',
});

async function locationDisplayFromValue(val: string): Promise<string> {
  if (!val) return '';
  const parsed = parseLocationSettingValue(val);
  if (!parsed) return val;

  const response = await api.get('/items/washing_location', {
      params: {
        fields: ['name'],
        filter: { id: { _eq: parsed.id } },
        limit: 1,
      },
    });
  const location = response.data?.data?.[0];
  if (location?.name) {
    return location.name;
  }

  return parsed.nameSlug || `${parsed.collection}:${parsed.id}`;
}
</script>

<style scoped>
.cards-wrapper {
  padding-left: 16px;
  display: flex;
  gap: 16px;
}

.wizard-card {
  display: flex;
  flex-direction: column;
}

.wizard-actions {
  display: flex;
  align-items: stretch;
}

.wizard-button {
  width: 100%;
}

.wizard-button :deep(.button) {
  width: 100%;
}

.bottom-line {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.attention-required {
  color: red;
  font-weight: 700;
}
</style>
