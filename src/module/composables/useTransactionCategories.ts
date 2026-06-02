import { getTransactionCategories } from '../api/transactionCategoriesApi';
import { TransactionCategoriesListItem } from '../types/transaction_categories';
import { usePaginatedList } from './usePaginatedList';

export function useTransactionCategories() {
	const { items: transactionCategories, ...rest } = usePaginatedList<TransactionCategoriesListItem>(
		getTransactionCategories,
		{ defaultSort: 'name', label: 'TransactionCategories' },
	);
	return { transactionCategories, ...rest };
}
