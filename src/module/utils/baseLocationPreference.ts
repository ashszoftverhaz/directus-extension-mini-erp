import type { useApi } from '@directus/extensions-sdk';
import { parseLocationSettingValue } from './settingsFormat';

type ApiClient = ReturnType<typeof useApi>;

export async function getBaseLocationId(api: ApiClient): Promise<string | null> {
  try {
    const response = await api.get('/items/erp_settings', {
      params: {
        filter: { key: { _eq: 'base_location' } },
        limit: 1,
        fields: ['value'],
      },
    });

    const raw = Array.isArray(response.data?.data) ? response.data.data[0] : null;
    const value = raw?.value as string | null | undefined;
    const parsed = parseLocationSettingValue(value ?? null);

    return parsed?.id ?? null;
  } catch (error) {
    // Fail silently; falling back to first location
    console.error('Failed to load base location setting', error);
    return null;
  }
}
