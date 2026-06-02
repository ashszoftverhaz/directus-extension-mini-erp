import { usePaginatedList } from './usePaginatedList';
import type { IncomeListItem, GetIncomesOptions } from '../types/incomes';
import { getIncomes } from '../api/incomesApi';

export function useIncomes() {
  const fetchIncomes = async (
    apiClient: Parameters<typeof getIncomes>[0],
    options: GetIncomesOptions,
  ): Promise<{ data: IncomeListItem[]; total: number }> => {
    return getIncomes(apiClient as any, options);
  };

  const {
    items: incomes,
    filter,
    ...rest
  } = usePaginatedList<IncomeListItem>(fetchIncomes as any, {
    defaultSort: 'payment_due_date',
    label: 'Incomes',
    autoLoad: false,
  });

  return {
    incomes,
    filter,
    ...rest,
  };
}
