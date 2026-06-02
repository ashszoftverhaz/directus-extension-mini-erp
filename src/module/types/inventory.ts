export interface InventoryListItem {
  id: string;
  name_of_product: string;
  material_category?: {
    id: string;
    material_category_name: string;
    short_name: string;
    minimum_value?: number;
    unit?: string;
  };
  sku?: string;
  package_size?: number;
  quantity: number;
  measurement_unit?: string;
}

export interface GetInventoryOptions {
  limit?: number;
  offset?: number;
  sort?: string[];
  search?: string;
  filter?: Record<string, unknown>;
}

export interface GetInventoryResult {
  data: InventoryListItem[];
  total: number;
  allItemsForRunningLow?: InventoryListItem[];
}

export interface InventoryItemForRunningLow {
  quantity: number;
  package_size?: number | null;
  material_category?: {
    id: string;
    minimum_value?: number | null;
    unit?: string | null;
  } | null;
}

export type ThresholdDirection = 'increase' | 'decrease';

export interface ThresholdComputationResult {
  currentAmount: number;
  nextAmount: number;
  minimum: number;
  unit: string | null;
}

export type InventoryItemWithThreshold = InventoryItemForRunningLow;
