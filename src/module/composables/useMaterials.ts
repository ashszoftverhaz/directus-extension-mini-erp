import { getMaterials } from '../api/materialsApi';
import type { MaterialListItem } from '../types/materials';
import { usePaginatedList } from './usePaginatedList';

export function useMaterials() {
  const { items: materials, ...rest } = usePaginatedList<MaterialListItem>(getMaterials, {
    defaultSort: 'name_of_product',
    label: 'Materials',
  });
  return { materials, ...rest };
}
