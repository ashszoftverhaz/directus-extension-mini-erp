import { getMaterialCategories } from '../api/materialCategoriesApi';
import type { MaterialCategoryListItem } from '../types/materialCategories';
import { usePaginatedList } from './usePaginatedList';

export function useMaterialCategories() {
  const { items: materialCategories, ...rest } = usePaginatedList<MaterialCategoryListItem>(
    getMaterialCategories,
    {
      defaultSort: 'material_category_name',
      label: 'Material Categories',
    },
  );
  return { materialCategories, ...rest };
}
