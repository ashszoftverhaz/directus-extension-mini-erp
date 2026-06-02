import { getTaxes } from '../api/taxesApi';
import type { TaxListItem } from '../types/taxes';
import { usePaginatedList } from './usePaginatedList';

export function useTaxes() {
  const { items: taxes, ...rest } = usePaginatedList<TaxListItem>(getTaxes, {
    defaultSort: 'name',
    label: 'Taxes',
  });

  return { taxes, ...rest };
}
