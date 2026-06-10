<template>
  <teleport to="body">
    <transition name="wizard-fade">
      <div v-if="props.open" class="setup-wizard" role="dialog" aria-modal="true" aria-label="Setup wizard">
        <div class="setup-wizard-overlay" @click="onCancel" />

        <transition name="wizard-slide" appear>
          <div v-if="props.open" class="setup-wizard-card" @click.stop>
            <div v-if="currentStep < steps.length - 1">
              <!-- Header -->
              <div class="wizard-header">
                <div class="wizard-header-title">
                  <span>Setup wizard</span>
                </div>
                <div class="wizard-step-counter">
                  Step {{ currentStep + 1 }} / {{ steps.length }}
                </div>
              </div>

              <!-- Step content -->
              <div class="wizard-body">
                <!-- Step 1: Base Country -->
                <div v-if="currentStep === 0" class="wizard-step">
                  <h2 class="wizard-step-title">🇭🇺 Set the Base country of the business.</h2>
                  <p class="wizard-step-description">
                    The base country of the business will help you create contracts more easily as it will be the
                    default setting when you need to select a location.
                  </p>
                  <div class="wizard-field">
                    <label class="wizard-field-label">Base country</label>
                    <button type="button" class="wizard-select-btn wizard-field-control" @click="onOpenCountryDrawer">
                      <span class="wizard-select-text" :class="{ 'is-placeholder': !form.base_country_display }">
                        {{ form.base_country_display || 'Select country…' }}
                      </span>
                      <VIcon name="arrow_drop_down" />
                    </button>
                  </div>
                </div>

                <!-- Step 2: Base Currency -->
                <div v-else-if="currentStep === 1" class="wizard-step">
                  <h2 class="wizard-step-title">💵 Set the Base currency of the business.</h2>
                  <p class="wizard-step-description">
                    The base currency of the business will determine the default value of money throughout the
                    organization, and transactions.
                  </p>
                  <div class="wizard-field">
                    <label class="wizard-field-label">Base currency</label>
                    <button type="button" class="wizard-select-btn wizard-field-control" @click="onOpenCurrencyDrawer">
                      <span class="wizard-select-text" :class="{ 'is-placeholder': !form.base_currency_display }">
                        {{ form.base_currency_display || 'Select currency…' }}
                      </span>
                      <VIcon name="arrow_drop_down" />
                    </button>
                  </div>
                </div>

                <!-- Step 3: Base Location -->
                <div v-else-if="currentStep === 2" class="wizard-step">
                  <h2 class="wizard-step-title">🏢 Document your place of business</h2>
                  <p class="wizard-step-description">
                    The system can handle asset and inventory management for multiple locations. This is why we need
                    your base locations data.
                  </p>
                  <template v-if="hasWashingLocationCollection">
                    <div class="wizard-field">
                      <label class="wizard-field-label">Base location</label>
                      <button type="button" class="wizard-select-btn wizard-field-control"
                        @click="onOpenLocationDrawer">
                        <span class="wizard-select-text" :class="{ 'is-placeholder': !form.base_location_display }">
                          {{ form.base_location_display || 'Select location…' }}
                        </span>
                        <VIcon name="arrow_drop_down" />
                      </button>
                    </div>
                  </template>
                  <template v-else-if="hasErpLocationCollection">
                    <div class="wizard-field">
                      <label class="wizard-field-label" for="setup-location-name">Location name</label>
                      <input id="setup-location-name" v-model="form.erp_location_name"
                        class="wizard-input wizard-field-control" type="text" placeholder="Enter location name" />
                    </div>

                    <div class="wizard-field">
                      <label class="wizard-field-label">Country</label>
                      <div class="wizard-field-control wizard-static-value">
                        {{ form.base_country_display || 'Base country will be used' }}
                      </div>
                    </div>

                    <div class="wizard-field wizard-field-grid">
                      <div class="wizard-field">
                        <label class="wizard-field-label" for="setup-location-city">City</label>
                        <input id="setup-location-city" v-model="form.erp_location_city"
                          class="wizard-input wizard-field-control" type="text" placeholder="Enter city" />
                      </div>
                      <div class="wizard-field">
                        <label class="wizard-field-label" for="setup-location-postal-code">Postal code</label>
                        <input id="setup-location-postal-code" v-model="form.erp_location_postal_code"
                          class="wizard-input wizard-field-control" type="text" placeholder="Enter postal code" />
                      </div>
                    </div>

                    <div class="wizard-field">
                      <label class="wizard-field-label" for="setup-location-address">Address</label>
                      <input id="setup-location-address" v-model="form.erp_location_address"
                        class="wizard-input wizard-field-control" type="text" placeholder="Enter address" />
                    </div>

                    <div class="wizard-field wizard-field-grid">
                      <div class="wizard-field">
                        <label class="wizard-field-label" for="setup-location-phone">Phone</label>
                        <input id="setup-location-phone" v-model="form.erp_location_phone"
                          class="wizard-input wizard-field-control" type="text" placeholder="Enter phone" />
                      </div>
                      <div class="wizard-field">
                        <label class="wizard-field-label" for="setup-location-email">Email</label>
                        <input id="setup-location-email" v-model="form.erp_location_email"
                          class="wizard-input wizard-field-control" type="email" placeholder="Enter email" />
                      </div>
                    </div>
                  </template>
                </div>

                <!-- Step 4: Base Account -->
                <div v-else-if="currentStep === 3" class="wizard-step">
                  <h2 class="wizard-step-title">🧾 Provide financial accounts</h2>
                  <p class="wizard-step-description">
                    If your business keeps money in different places, like a bank card, cash, or another bank card, you
                    can track where
                    the money is going from.
                  </p>

                  <div class="wizard-field">
                    <label class="wizard-field-label" for="setup-account-name">Account name</label>
                    <input id="setup-account-name" v-model="form.account_name" class="wizard-input wizard-field-control"
                      type="text" placeholder="Enter account name" />
                  </div>

                  <div class="wizard-field">
                    <label class="wizard-field-label" for="setup-payment-method">Payment method</label>
                    <select id="setup-payment-method" v-model="form.payment_method"
                      class="wizard-input wizard-field-control wizard-select-input">
                      <option value="">Select payment method…</option>
                      <option value="bank_card">Bank card</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>

                  <div class="wizard-field">
                    <label class="wizard-field-label" for="setup-account-notes">Notes</label>
                    <textarea id="setup-account-notes" v-model="form.account_notes"
                      class="wizard-input wizard-field-control wizard-textarea" rows="4" placeholder="Optional notes" />
                  </div>

                  <VNotice v-if="saveError" type="danger" class="wizard-notice">
                    {{ saveError }}
                  </VNotice>
                  <VNotice v-if="saveSuccess" type="success" class="wizard-notice">
                    Settings saved successfully.
                  </VNotice>
                </div>
              </div>

              <!-- Footer -->
              <div class="wizard-footer">
                <VButton secondary :disabled="saving" @click="onBack">
                  {{ currentStep === 0 ? 'Cancel' : 'Back' }}
                </VButton>

                <VButton :loading="saving" :disabled="saving || isLoading || saveSuccess" @click="onNext">
                  {{ currentStep === steps.length - 2 ? 'Finish' : 'Continue' }}
                </VButton>
              </div>
            </div>

            <div v-else-if="currentStep === steps.length - 1">
              <div class="wizard-header">
                <div class="wizard-header-title">
                  <span>Setup wizard</span>
                </div>
                <div class="wizard-step-completed">
                  Completed
                </div>
              </div>

              <div class="wizard-step">
                <h2 class="wizard-step-title">✅ Congratulations, you completed the Wizard!</h2>
                <p class="wizard-step-description">
                  Now you can start using the ERP Module and administrate everything about your business in one system.
                </p>
              </div>

              <div class="wizard-button-close-wrapper">
                <VButton :disabled="saving" class="wizard-button-close" @click="closeWizard">
                  Close
                </VButton>
              </div>
            </div>

            <!-- Loading overlay for initial data fetch -->
            <VProgressLinear v-if="isLoading" indeterminate class="wizard-progress" />
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import { formatLocationSettingValue, parseLocationSettingValue } from '../utils/settingsFormat';

const BASIC_SETTING_KEYS = ['base_currency', 'base_country', 'base_location'] as const;

type SettingKey = (typeof BASIC_SETTING_KEYS)[number];

type SettingRecord = {
  id: string | number;
  key: SettingKey;
  value: string | null;
};

const props = withDefaults(
  defineProps<{
    open: boolean;
    resumeMode?: boolean;
    baseCurrency?: string;
    baseCountry?: string;
    baseLocation?: string;
    baseLocationDisplay?: string;
  }>(),
  {
    resumeMode: false,
    baseCurrency: '',
    baseCountry: '',
    baseLocation: '',
    baseLocationDisplay: '',
  },
);
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'close-wizard'): void;
  (e: 'resume-consumed'): void;
  (e: 'open-currency-drawer'): void;
  (e: 'open-country-drawer'): void;
  (e: 'open-location-drawer'): void;
}>();

const api = useApi();

const steps = [
  { key: 'base_country', label: 'Base country' },
  { key: 'base_currency', label: 'Base currency' },
  { key: 'base_location', label: 'Base location' },
  { key: 'base_account', label: 'Base account' },
  { key: 'finish', label: 'Finish' },
];

const currentStep = ref(0);
const isLoading = ref(false);
const saving = ref(false);
const saveError = ref('');
const saveSuccess = ref(false);
const hasWashingLocationCollection = ref(false);
const hasErpLocationCollection = ref(false);

const settingIds = reactive<Partial<Record<SettingKey, string | number>>>({});
const form = reactive({
  base_currency: '',
  base_currency_display: '',
  base_country: '',
  base_country_display: '',
  base_location: '',
  base_location_display: '',
  erp_location_name: '',
  erp_location_city: '',
  erp_location_postal_code: '',
  erp_location_address: '',
  erp_location_phone: '',
  erp_location_email: '',
  account_name: '',
  payment_method: '',
  account_notes: '',
});

async function locationDisplayFromValue(val: string): Promise<string> {
  if (!val) return '';
  const parsed = parseLocationSettingValue(val);
  if (!parsed) return val;

  const candidateCollections = [parsed.collection, 'washing_location', 'erp_locations'].filter(
    (collection, index, all) => collection && all.indexOf(collection) === index,
  );

  for (const collection of candidateCollections) {
    if (!(await collectionExists(collection))) continue;

    const response = await api.get(`/items/${collection}`, {
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
  }

  return parsed.nameSlug || `${parsed.collection}:${parsed.id}`;
}

async function collectionExists(collection: string): Promise<boolean> {
  try {
    await api.get(`/collections/${collection}`, {
      params: {
        fields: ['collection'],
      },
    });
    return true;
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 403 || status === 404) return false;
    console.warn(`SetupWizard: failed to verify collection ${collection}`, error);
    return false;
  }
}

async function syncLocationCollectionAvailability() {
  hasWashingLocationCollection.value = await collectionExists('washing_location');
  hasErpLocationCollection.value = !hasWashingLocationCollection.value && await collectionExists('erp_locations');
}

async function getCountryIdByIso2(iso2: string): Promise<string | null> {
  if (!iso2) return null;

  const response = await api.get('/items/countries', {
    params: {
      filter: { iso2: { _eq: iso2 } },
      limit: 1,
      fields: ['id'],
    },
  });

  const country = Array.isArray(response.data?.data) ? response.data.data[0] : null;
  return country?.id ?? null;
}

async function createErpLocationAndBindSetting(): Promise<string | null> {
  const locationName = form.erp_location_name.trim();
  if (!locationName) return null;

  const countryId = await getCountryIdByIso2(form.base_country);
  const response = await api.post('/items/erp_locations', {
    name: locationName,
    country: countryId,
    city: form.erp_location_city.trim() || null,
    postal_code: form.erp_location_postal_code.trim() || null,
    address: form.erp_location_address.trim() || null,
    phone: form.erp_location_phone.trim() || null,
    email: form.erp_location_email.trim() || null,
  });

  const created = response.data?.data;
  const id = created?.id;
  if (!id) return null;

  const value = formatLocationSettingValue('erp_locations', String(id), locationName);
  form.base_location = value;
  form.base_location_display = locationName;

  return value;
}

async function applyExternalDraftValues() {
  if (props.baseCurrency) {
    form.base_currency = props.baseCurrency;
    form.base_currency_display = await getCurrencyName(props.baseCurrency);
  }
  if (props.baseCountry) {
    form.base_country = props.baseCountry;
    form.base_country_display = await getCountryName(props.baseCountry);
  }
  if (props.baseLocation) {
    form.base_location = props.baseLocation;
  }
  if (props.baseLocationDisplay) {
    form.base_location_display = props.baseLocationDisplay;
  } else if (props.baseLocation) {
    form.base_location_display = await locationDisplayFromValue(props.baseLocation);
  }
}

async function loadCurrentSettings() {
  isLoading.value = true;
  try {
    await syncLocationCollectionAvailability();
    const response = await api.get('/items/erp_settings', {
      params: {
        fields: ['id', 'key', 'value'],
        filter: { key: { _in: [...BASIC_SETTING_KEYS] } },
        limit: BASIC_SETTING_KEYS.length,
      },
    });
    const rows = (response.data?.data ?? []) as SettingRecord[];
    for (const row of rows) {
      if (!row?.key) continue;
      settingIds[row.key] = row.id;
      if (row.key === 'base_currency') {
        form.base_currency = row.value ?? '';
        form.base_currency_display = row.value ? await getCurrencyName(row.value) : '';
      }
      if (row.key === 'base_country') {
        form.base_country = row.value ?? '';
        form.base_country_display = row.value ? await getCountryName(row.value) : '';
      }
      if (row.key === 'base_location') {
        form.base_location = row.value ?? '';
        form.base_location_display = await locationDisplayFromValue(row.value ?? '');
      }
    }
  } catch (err) {
    console.error('SetupWizard: failed to load settings', err);
  } finally {
    await applyExternalDraftValues();
    isLoading.value = false;
  }
}

async function getCountryName(iso2: string): Promise<string> {
  try {
    const response = await api.get('/items/countries', {
      params: {
        fields: ['name'],
        filter: { iso2: { _eq: iso2 } },
        limit: 1,
      },
    });
    const country = response.data?.data?.[0];
    return country?.name ?? iso2;
  } catch (err) {
    console.error('Failed to fetch country name for ISO2:', iso2, err);
    return iso2;
  }
}

async function getCurrencyName(code: string): Promise<string> {
  try {
    const response = await api.get('/items/currencies', {
      params: {
        fields: ['name'],
        filter: { short_name: { _eq: code } },
        limit: 1,
      },
    });
    const currency = response.data?.data?.[0];
    return currency?.name ? `${currency.name} (${code})` : code;
  } catch (err) {
    console.error('Failed to fetch currency name for code:', code, err);
    return code;
  }
}

watch(
  () => [props.baseCurrency, props.baseCountry, props.baseLocation, props.baseLocationDisplay],
  async () => {
    await applyExternalDraftValues();
  },
);

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      saveError.value = '';
      saveSuccess.value = false;
      await syncLocationCollectionAvailability();
      if (props.resumeMode) {
        await applyExternalDraftValues();
        emit('resume-consumed');
      } else {
        currentStep.value = 0;
        await loadCurrentSettings();
      }
      window.addEventListener('keydown', onKeydown);
    } else {
      window.removeEventListener('keydown', onKeydown);
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') onCancel();
}

function onCancel() {
  emit('update:open', false);
}

function closeWizard() {
  emit('close-wizard');
  onCancel();
}

function onBack() {
  if (currentStep.value === 0) {
    onCancel();
  } else {
    currentStep.value--;
  }
}

async function onNext() {
  if (currentStep.value < steps.length - 2) {
    if (steps[currentStep.value]?.key === 'base_location') {
      if (hasWashingLocationCollection.value && !form.base_location.trim()) {
        saveError.value = 'Base location is required.';
        return;
      }

      if (hasErpLocationCollection.value && !form.erp_location_name.trim()) {
        saveError.value = 'Location name is required.';
        return;
      }
    }

    if (steps[currentStep.value]?.key === 'base_account' && !form.account_name.trim()) {
      saveError.value = 'Account name is required.';
      return;
    }

    saveError.value = '';
    currentStep.value++;
    return;
  }

  if (currentStep.value === steps.length - 2) {
    if (!form.account_name.trim()) {
      saveError.value = 'Account name is required.';
      return;
    }

    saveError.value = '';
    await onSave();
    currentStep.value++;
  }
}

function onOpenCurrencyDrawer() {
  emit('open-currency-drawer');
}

function onOpenCountryDrawer() {
  emit('open-country-drawer');
}

function onOpenLocationDrawer() {
  emit('open-location-drawer');
}

async function onSave() {
  saveError.value = '';
  saving.value = true;

  try {
    if (hasErpLocationCollection.value && !hasWashingLocationCollection.value) {
      const createdLocationValue = await createErpLocationAndBindSetting();
      if (!createdLocationValue) {
        throw new Error('Location creation failed.');
      }
    }

    const updates: Array<{ key: SettingKey; value: string | null }> = [
      { key: 'base_currency', value: form.base_currency || null },
      { key: 'base_country', value: form.base_country || null },
      { key: 'base_location', value: form.base_location || null },
    ];

    for (const { key, value } of updates) {
      const id = settingIds[key];
      if (!id) continue;
      await api.patch(`/items/erp_settings/${id}`, { value });
    }

    await api.post('/items/accounts', {
      account_name: form.account_name.trim(),
      payment_method: form.payment_method || null,
      notes: form.account_notes.trim() || null,
    });

    saveSuccess.value = true;
  } catch (err: any) {
    console.error('SetupWizard: failed to save settings', err);
    saveError.value =
      err?.response?.data?.errors?.[0]?.message ?? err?.message ?? 'Save failed.';
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.setup-wizard {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
}

.setup-wizard-overlay {
  position: absolute;
  inset: 0;
  background-color: var(--overlay-color);
}

.setup-wizard-card {
  position: relative;
  width: 540px;
  max-height: calc(100vh - 48px);
  background-color: var(--theme--background);
  border-radius: var(--theme--border-radius);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 28px 16px 28px 16px;
}

/* Header */
.wizard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  flex-shrink: 0;
}

.wizard-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  color: var(--theme--foreground);
}

.wizard-step-counter {
  font-size: 12px;
  color: var(--theme--foreground);
  background-color: #F0F4F9;
  padding: 8px 16px;
  border-radius: 8px;
}

/* Body */
.wizard-body {
  flex: 0 0 auto;
  overflow: visible;
  padding: 4px 20px 8px;
}

.wizard-step {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.wizard-step-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--theme--foreground);
  margin: 0;
}

.wizard-step-description {
  font-size: 12px;
  color: var(--theme--foreground-subdued);
  margin: 0;
  line-height: 1.5;
}

/* Field */
.wizard-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wizard-field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.wizard-field-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--theme--foreground-subdued);
}

.wizard-field-control {
  width: 100%;
  min-height: var(--theme--form--field--input--height);
  padding: 6px 10px;
  border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
  border-radius: var(--theme--border-radius);
  background: var(--theme--form--field--input--background);
  color: var(--theme--foreground);
  font-size: 13px;
  transition: border-color 160ms ease;
}

.wizard-field-control:hover {
  border-color: var(--theme--form--field--input--border-color-hover);
}

.wizard-field-control:focus {
  outline: none;
  border-color: var(--theme--form--field--input--border-color-hover);
}

.wizard-select-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.wizard-input {
  display: block;
}

.wizard-static-value {
  display: flex;
  align-items: center;
}

.wizard-select-input {
  appearance: none;
}

.wizard-textarea {
  min-height: 96px;
  resize: vertical;
}

.wizard-select-text.is-placeholder {
  color: var(--theme--foreground-subdued);
}

.wizard-notice {
  margin-top: 8px;
}

/* Footer */
.wizard-footer {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding-top: 20px;
  padding-bottom: 16px;
  padding-left: 16px;
  padding-right: 16px;
  flex-shrink: 0;
}

/* Progress bar */
.wizard-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

/* Transitions */
.wizard-fade-enter-active,
.wizard-fade-leave-active {
  transition: opacity 0.2s ease;
}

.wizard-fade-enter-from,
.wizard-fade-leave-to {
  opacity: 0;
}

.wizard-slide-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.wizard-slide-enter-from {
  opacity: 0;
  transform: scale(0.96) translateY(8px);
}

@media (max-width: 720px) {
  .setup-wizard-card {
    width: min(540px, calc(100vw - 24px));
  }

  .wizard-field-grid {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}

.wizard-button-close-wrapper {
  display: flex;
  align-items: stretch;
  gap: 8px;
  padding-top: 20px;
  padding-bottom: 16px;
  padding-left: 16px;
  padding-right: 16px;
  flex-shrink: 0;
}

.wizard-button-close {
  width: 100%;
}

.wizard-button-close :deep(.button) {
  width: 100%;
}

.wizard-step-completed {
  font-size: 14px;
  font-weight: 400;
  color: #237A57;
  background-color: #E6FFF2;
  padding: 8px 16px;
  border-radius: 8px;
}
</style>
