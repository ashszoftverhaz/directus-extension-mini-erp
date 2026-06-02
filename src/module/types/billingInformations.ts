export type BillingInformationDto = {
  id: string;
  country: string | null;
  postal_code: string | null;
  city: string | null;
  address: string | null;
  other: string | null;
};

export type BillingInformationListItem = Pick<
  BillingInformationDto,
  'id' | 'country' | 'postal_code' | 'city' | 'address' | 'other'
>;

import type { ListFetchOptions, ListFetchResult } from './list';

export type GetBillingInformationsOptions = ListFetchOptions;
export type GetBillingInformationsResult = ListFetchResult<BillingInformationListItem>;
