import { getAssetCategories } from '../api/assetCategoriesApi';
import type { AssetCategoryListItem } from '../types/assetCategories';
import { usePaginatedList } from './usePaginatedList';

export function useAssetCategories() {
  const { items: assetCategories, ...rest } = usePaginatedList<AssetCategoryListItem>(
    getAssetCategories,
    {
      defaultSort: 'asset_category_name',
      label: 'Asset Categories',
    },
  );

  return { assetCategories, ...rest };
}
