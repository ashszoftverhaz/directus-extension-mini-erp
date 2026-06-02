export type ContractTypesDto = {
  id: string;
  contract_type: string;
  description: string | null;
};

export type ContractTypeListItem = Pick<
  ContractTypesDto,
  'id' | 'contract_type' | 'description'
>;

import type { ListFetchOptions, ListFetchResult } from './list';

export type GetContractTypesOptions = ListFetchOptions;
export type GetContractTypesResult = ListFetchResult<ContractTypeListItem>;