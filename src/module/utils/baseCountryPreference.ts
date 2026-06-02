import type { useApi } from '@directus/extensions-sdk';

type ApiClient = ReturnType<typeof useApi>;

/**
 * Reads the Base country setting from `erp_settings` and returns the stored code
 * (expected to be the country's ISO2 code, e.g. "HU").
 */
export async function getBaseCountryCode(api: ApiClient): Promise<string | null> {
  try {
    const response = await api.get('/items/erp_settings', {
      params: {
        filter: { key: { _eq: 'base_country' } },
        limit: 1,
        fields: ['value'],
      },
    });

    const raw = Array.isArray(response.data?.data) ? response.data.data[0] : null;
    const value = (raw?.value as string | null | undefined)?.trim();
    if (!value) return null;

    return value.toUpperCase();
  } catch (error) {
    console.error('Failed to load base country setting', error);
    return null;
  }
}
