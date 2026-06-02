import { usePaginatedList } from './usePaginatedList';
import { getExpenses } from '../api/expensesApi';
import { ExpenseListItem, GetExpensesOptions } from '../types/expenses';

export function useExpenses() {
  const fetchExpenses = async (
    apiClient: Parameters<typeof getExpenses>[0],
    options: GetExpensesOptions,
  ): Promise<{ data: ExpenseListItem[]; total: number }> => {
    return getExpenses(apiClient as any, options);
  };

  const {
    items: expenses,
    filter,
    ...rest
  } = usePaginatedList<ExpenseListItem>(fetchExpenses as any, {
    defaultSort: 'payment_due_date',
    label: 'Expenses',
    autoLoad: false,
  });

  return {
    expenses,
    filter,
    ...rest,
  };
}
