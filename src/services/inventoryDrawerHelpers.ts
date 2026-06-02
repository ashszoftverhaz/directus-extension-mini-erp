import type { DrawerMode, DrawerRow } from './inventoryTypes';
import type { InventoryListItem } from '../module/types/inventory';
import { computeThresholdAfterChange, formatAmount } from './inventoryService';

export interface DrawerModeConfig {
  title: string;
  directionLabel: string;
  directionIcon: string;
}

export interface InventoryModeBehavior {
  clampQuantityOnSelect(row: DrawerRow, currentQuantity: number): number;
  canIncrease(row: DrawerRow, currentQuantity: number): boolean;
  normalizeQuantityOnConfirm(row: DrawerRow, currentQuantity: number): number;
  shouldKeepRowOnConfirm(row: DrawerRow, currentQuantity: number): boolean;
  filterMaterialsSource(materials: InventoryListItem[]): InventoryListItem[];
  isRowBelowMinimum(row: DrawerRow, material: InventoryListItem | undefined): boolean;
  warningText(row: DrawerRow, material: InventoryListItem | undefined): string;
}

const MODE_CONFIG: Record<DrawerMode, DrawerModeConfig> = {
  procurement: {
    title: 'Added materials',
    directionLabel: 'Inward',
    directionIcon: 'input_circle',
  },
  usage: {
    title: 'Removed materials',
    directionLabel: 'Outward',
    directionIcon: 'output_circle',
  },
  correction: {
    title: 'Inventory correction',
    directionLabel: 'Adjustment',
    directionIcon: 'swap_vert',
  },
  handover: {
    title: 'Handover materials',
    directionLabel: 'Transfer',
    directionIcon: 'compare_arrows',
  },
};

export function getModeConfig(mode: DrawerMode): DrawerModeConfig {
  return MODE_CONFIG[mode] ?? MODE_CONFIG.procurement;
}

export function getEmptyTableText(mode: DrawerMode): string {
  if (mode === 'usage') {
    return 'Removed materials will appear here. Add one with the button below.';
  }

  if (mode === 'procurement') {
    return 'Added materials will appear here. Add one with the button below.';
  }

  return 'Materials will appear here once added.';
}

const procurementMode: InventoryModeBehavior = {
  clampQuantityOnSelect(row, _current) {
    const base = Math.max(1, Math.floor(Number(row.quantity) || 1));
    return base;
  },

  canIncrease(_row, _current) {
    return true;
  },

  normalizeQuantityOnConfirm(row, _current) {
    return Math.max(1, Math.floor(Number(row.quantity) || 1));
  },

  shouldKeepRowOnConfirm(_row, _current) {
    return true;
  },

  filterMaterialsSource(materials) {
    return materials;
  },

  isRowBelowMinimum(row, material) {
    if (!material) return false;

    const result = computeThresholdAfterChange(
      {
        quantity: material.quantity ?? 0,
        package_size: material.package_size ?? 0,
        material_category: material.material_category,
      },
      row.quantity ?? 0,
      'increase',
    );

    if (!result) return false;

    return result.nextAmount < result.minimum;
  },

  warningText(row, material) {
    if (!material) return '';

    const result = computeThresholdAfterChange(
      {
        quantity: material.quantity ?? 0,
        package_size: material.package_size ?? 0,
        material_category: material.material_category,
      },
      row.quantity ?? 0,
      'increase',
    );

    if (!result) return '';

    const remaining = result.minimum - result.nextAmount;

    // At or above minimum: no warning
    if (remaining <= 0) return '';

    const minText = formatAmount(result.minimum, result.unit);
    const totalText = formatAmount(result.nextAmount, result.unit);
    const remainingText = formatAmount(Math.max(0, remaining), result.unit);

    return `The minimum level of this category is ${minText}. After this order you will have ${totalText}, still missing ${remainingText}.`;
  },
};

const usageMode: InventoryModeBehavior = {
  clampQuantityOnSelect(row, current) {
    const base = Math.max(1, Math.floor(Number(row.quantity) || 1));
    return current > 0 ? Math.min(base, current) : 1;
  },

  canIncrease(row, current) {
    if (current <= 0) return false;
    return row.quantity < current;
  },

  normalizeQuantityOnConfirm(row, current) {
    const base = Math.max(1, Math.floor(Number(row.quantity) || 1));
    if (current <= 0) return 1;
    return Math.min(base, current);
  },

  shouldKeepRowOnConfirm(_row, current) {
    return current >= 1;
  },

  filterMaterialsSource(materials) {
    return materials.filter((m) => (m.quantity ?? 0) > 0);
  },

  isRowBelowMinimum(row, material) {
    if (!material) return false;

    const result = computeThresholdAfterChange(
      {
        quantity: material.quantity ?? 0,
        package_size: material.package_size ?? 0,
        material_category: material.material_category,
      },
      row.quantity ?? 0,
      'decrease',
    );

    if (!result) return false;

    return result.nextAmount <= result.minimum;
  },

  warningText(row, material) {
    if (!material) return '';

    const result = computeThresholdAfterChange(
      {
        quantity: material.quantity ?? 0,
        package_size: material.package_size ?? 0,
        material_category: material.material_category,
      },
      row.quantity ?? 0,
      'decrease',
    );

    if (!result) return '';

    if (result.nextAmount > result.minimum) return '';

    const remaining = Math.max(0, result.minimum - result.nextAmount);

    const minText = formatAmount(result.minimum, result.unit);
    const totalText = formatAmount(result.nextAmount, result.unit);

    if (remaining === 0) {
      return `The minimum level of this category is ${minText}. After this usage you will be exactly at the minimum level.`;
    }

    const remainingText = formatAmount(remaining, result.unit);

    return `The minimum level of this category is ${minText}. After this usage you will have ${totalText}, which is below the minimum by ${remainingText}.`;
  },
};

const MODE_BEHAVIOR: Record<DrawerMode, InventoryModeBehavior> = {
  procurement: procurementMode,
  usage: usageMode,
  correction: procurementMode,
  handover: procurementMode,
};

export function getModeBehavior(mode: DrawerMode): InventoryModeBehavior {
  return MODE_BEHAVIOR[mode] ?? procurementMode;
}
