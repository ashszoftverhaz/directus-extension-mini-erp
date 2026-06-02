export interface AssetCategory {
  id: string;
  asset_category_name: string;
  short_name: string;
  category_type: 'vehicle' | 'tool' | 'it_equipment' | 'other' | string;
}

export interface AssetListItem {
  id: string;
  name: string;
  code: string;
  asset_category?: AssetCategory | null;
  assignment?: 'washing_unit' | 'washing_location' | 'employee' | string | null;
  assignee_employee?: {
    id: string;
    account?: {
      id: string;
      first_name?: string | null;
      last_name?: string | null;
    } | null;
  } | null;
  assignee_washing_unit?: {
    id: string;
    name?: string | null;
  } | null;
  assignee_washing_location?: {
    id: string;
    name?: string | null;
  } | null;
}

export interface GetAssetsOptions {
  limit?: number;
  offset?: number;
  sort?: string[];
  search?: string;
  filter?: Record<string, any>;
  includeWashingUnitFields?: boolean;
  includeWashingLocationFields?: boolean;
}

export interface GetAssetsResult {
  data: AssetListItem[];
  total: number;
}
