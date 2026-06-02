import { getContractTypes } from '../api/contractsTypesApi';
import type { ContractTypeListItem } from '../types/contractTypes';
import { usePaginatedList } from './usePaginatedList';

export function useContractTypes() {
	const { items: contractTypes, ...rest } = usePaginatedList<ContractTypeListItem>(
		getContractTypes,
		{ defaultSort: 'contract_type', label: 'ContractTypes' },
	);
	return { contractTypes, ...rest };
}
