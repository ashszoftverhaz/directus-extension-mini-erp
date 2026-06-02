import { usePaginatedList } from './usePaginatedList';
import { TransactionListItem } from '../types/transactions';
import { getTransactions } from '../api/transactionsApi';

export function useTransactions() {
  const {
    items: transactions,
    filter,
    ...rest
  } = usePaginatedList<TransactionListItem>(getTransactions, {
    defaultSort: 'payment_due_date',
    label: 'Transactions',
    autoLoad: false,
  });

  return {
    transactions,
    filter,
    ...rest,
  };
}
