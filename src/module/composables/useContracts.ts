import { getContracts } from '../api/contractsApi';
import type { ContractListItem } from '../types/contracts';
import { usePaginatedList } from './usePaginatedList';

export function useContracts() {
	const { items: contracts, ...rest } = usePaginatedList<ContractListItem>(getContracts, {
		defaultSort: 'contract_id',
		label: 'Contracts',
	});
	return { contracts, ...rest };
}
