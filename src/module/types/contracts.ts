export type ContractsDto = {
  id: string;
  contract_id: string;
  status: string | null;
  signed_at: Date;
  contract_type?: { contract_type: string } | null;
  other_party_type?: 'employee' | 'partner';
  employee?: { account: { first_name: string; last_name: string; } };
  partner?: { name: string; };
};

export type ContractListItem = ContractsDto;

import type { ListFetchOptions, ListFetchResult } from './list';

export type GetContractsOptions = ListFetchOptions;
export type GetContractsResult = ListFetchResult<ContractListItem>;
