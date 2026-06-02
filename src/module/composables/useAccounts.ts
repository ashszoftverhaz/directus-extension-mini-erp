import { getAccounts } from '../api/accountsApi';
import { AccountListItem } from '../types/accounts';
import { usePaginatedList } from './usePaginatedList';

export function useAccounts() {
	const { items: accounts, ...rest } = usePaginatedList<AccountListItem>(
		getAccounts,
		{ defaultSort: 'account_name', label: 'Accounts' },
	);
	return { accounts, ...rest };
}
