import type { useApi } from '@directus/extensions-sdk';
import type { Ref } from 'vue';

type ApiClient = ReturnType<typeof useApi>;

/**
 * Reads the Base currency setting from `erp_settings` and returns the stored code
 * (expected to be the currency's short_name, e.g. "EUR")
 */
export async function getBaseCurrencyCode(api: ApiClient): Promise<string | null> {
  try {
    const response = await api.get('/items/erp_settings', {
      params: {
        filter: { key: { _eq: 'base_currency' } },
        limit: 1,
        fields: ['value'],
      },
    });

    const raw = Array.isArray(response.data?.data) ? response.data.data[0] : null;
    const value = (raw?.value as string | null | undefined)?.trim();
    if (!value) return null;

    return value.toUpperCase();
  } catch (error) {
    console.error('Failed to load base currency setting', error);
    return null;
  }
}

/**
 * Helper to pre-select the base currency on a given form field, if the field
 * is currently empty and a matching currency exists
 */
export async function applyBaseCurrencyToField(
  api: ApiClient,
  formData: Ref<Record<string, any>>,
  fieldKey: string,
): Promise<void> {
  if ((formData.value as any)[fieldKey]) return;

  try {
    const baseCurrencyCode = await getBaseCurrencyCode(api);
    if (!baseCurrencyCode) return;

    const response = await api.get('/items/currencies', {
      params: {
        filter: { short_name: { _eq: baseCurrencyCode } },
        limit: 1,
        fields: ['id'],
      },
    });

    const currency = Array.isArray(response.data?.data) ? response.data.data[0] : null;
    if (currency?.id) {
      (formData.value as any)[fieldKey] = currency.id;
    }
  } catch (error) {
    console.error('Failed to pre-select base currency for field', fieldKey, error);
  }
}
