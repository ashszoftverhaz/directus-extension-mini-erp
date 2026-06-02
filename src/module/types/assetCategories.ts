import type { ListFetchOptions, ListFetchResult } from './list';

export interface AssetCategoryListItem {
  id: string | number;
  asset_category_name: string;
  notes: string | null;
  short_name?: string | null;
  category_type?: string | null;
}

export type GetAssetCategoriesOptions = ListFetchOptions;
export type GetAssetCategoriesResult = ListFetchResult<AssetCategoryListItem>;
