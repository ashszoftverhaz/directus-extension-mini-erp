import type { useApi } from '@directus/extensions-sdk';
import type { DirectusItemsResponse } from '../types/apiTypes';
import { GetLocationsOptions, GetLocationsResult, LocationsListItem } from '../types/locations';

type ApiClient = ReturnType<typeof useApi>;

export async function getLocations(
  api: ApiClient,
  options: GetLocationsOptions = {},
): Promise<GetLocationsResult> {
  const response = await api.get<DirectusItemsResponse<LocationsListItem[]>>(
    '/items/erp_locations',
    {
      params: {
        fields: ['id', 'name', 'city', 'address', 'country.name', 'postal_code'],
        sort: options.sort ?? ['name'],
        limit: options.limit ?? -1,
        offset: options.offset ?? 0,
        ...(options.search ? { search: options.search } : {}),
        meta: ['total_count', 'filter_count'],
      },
    },
  );

  const data = response.data?.data ?? [];
  const total = response.data?.meta?.total_count ?? 0;

  return {
    data,
    total,
  };
}
