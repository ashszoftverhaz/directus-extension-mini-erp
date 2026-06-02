export interface MaterialCategoryListItem {
  id: string;
  material_category_name: string;
  short_name: string;
  minimum_value?: number;
  unit: string;
}

export interface GetMaterialCategoriesOptions {
  limit?: number;
  offset?: number;
  sort?: string[];
  search?: string;
}

export interface GetMaterialCategoriesResult {
  data: MaterialCategoryListItem[];
  total: number;
}
