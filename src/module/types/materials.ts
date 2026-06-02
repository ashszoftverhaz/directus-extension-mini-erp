export interface MaterialCategory {
  id: string;
  material_category_name: string;
  short_name: string;
  minimum_value?: number;
}

export interface MaterialListItem {
  id: string;
  name_of_product: string;
  material_category?: MaterialCategory;
  sku?: string;
  package_size?: number;
  brand?: string;
}

export interface GetMaterialsOptions {
  limit?: number;
  offset?: number;
  sort?: string[];
  search?: string;
}

export interface GetMaterialsResult {
  data: MaterialListItem[];
  total: number;
}
