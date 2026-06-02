export type DrawerMode = 'procurement' | 'usage' | 'correction' | 'handover';

export type DrawerRow = {
  id: string;
  materialId: string;
  materialName?: string;
  packageSize?: number | null;
  sku?: string | null;
  quantity: number;
};

