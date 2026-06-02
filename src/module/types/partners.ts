export type PartnerDto = {
  id: string;
  name: string;
  status: string;
  tax_number: string | null;
  registration_number: string | null;
  preferred_currency: string | null;
  contacts: string[] | null;
};

export type PartnerListItem = Pick<
  PartnerDto,
  'id' | 'name' | 'status' | 'tax_number' | 'registration_number'
>;

import type { ListFetchOptions, ListFetchResult } from './list';

export type GetPartnersOptions = ListFetchOptions;
export type GetPartnersResult = ListFetchResult<PartnerListItem>;
