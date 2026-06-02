import type { ListFetchOptions, ListFetchResult } from './list';

export interface LocationsListItem {
  id: string | number;
  name: string;
  city: string | null;
  address?: string | null;
  country?: string | null;
  postal_code?: string | null;
}

export type GetLocationsOptions = ListFetchOptions;
export type GetLocationsResult = ListFetchResult<LocationsListItem>;
