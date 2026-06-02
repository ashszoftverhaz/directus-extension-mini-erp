import type {
  InventoryItemForRunningLow,
  ThresholdComputationResult,
  ThresholdDirection,
  InventoryItemWithThreshold,
} from '../module/types/inventory';

/**
 * Total amount for one material in the category's unit (quantity × package_size)
 * If package_size is missing, treated as 0 so the material doesn't contribute
 */
export function totalAmountInCategoryUnit(item: InventoryItemForRunningLow): number {
  const quantity = item.quantity ?? 0;
  const packageSize = item.package_size ?? 0;
  return quantity * packageSize;
}

function aggregateCategoryTotals(
  items: InventoryItemForRunningLow[],
): Map<string, { total: number; minimum: number }> {
  const categoryTotals = new Map<string, { total: number; minimum: number }>();

  for (const item of items) {
    const cat = item.material_category;
    if (!cat?.id || cat.minimum_value == null) continue;

    const amount = totalAmountInCategoryUnit(item);
    const existing = categoryTotals.get(cat.id);
    const total = (existing?.total ?? 0) + amount;
    categoryTotals.set(cat.id, {
      total,
      minimum: cat.minimum_value,
    });
  }

  return categoryTotals;
}

/**
 * True when at least one material category has total amount less than or equal to its minimum_value
 */
export function isAnyCategoryRunningLow(items: InventoryItemForRunningLow[]): boolean {
  const categoryTotals = aggregateCategoryTotals(items);

  for (const { total, minimum } of categoryTotals.values()) {
    if (total <= minimum) return true;
  }
  return false;
}

/**
 * True when at least one material category has completely run out
 * (total 0 in that category) while its minimum_value is greater than 0
 */
export function hasAnyCategoryRunOut(items: InventoryItemForRunningLow[]): boolean {
  const categoryTotals = aggregateCategoryTotals(items);

  for (const { total, minimum } of categoryTotals.values()) {
    if (minimum > 0 && total === 0) return true;
  }
  return false;
}

// Threshold and formatting helpers (merged from inventoryHelpers.ts)

/** Calculates threshold values before and after a quantity change for one material. */
export function computeThresholdAfterChange(
  item: InventoryItemWithThreshold,
  deltaQuantity: number,
  direction: ThresholdDirection,
): ThresholdComputationResult | null {
  const category = item.material_category;
  if (!category || category.minimum_value == null || category.minimum_value <= 0) return null;

  const packageSize = item.package_size ?? 0;
  if (packageSize <= 0) return null;

  const currentQty = item.quantity ?? 0;
  const deltaQty = deltaQuantity ?? 0;

  const currentAmount = currentQty * packageSize;
  const deltaAmount = deltaQty * packageSize;

  const nextAmount =
    direction === 'increase'
      ? currentAmount + deltaAmount
      : Math.max(0, currentAmount - deltaAmount);

  return {
    currentAmount,
    nextAmount,
    minimum: category.minimum_value,
    unit: category.unit ?? null,
  };
}

/** Formats an amount with a unit. */
export function formatAmount(amount: number, unit?: string | null): string {
  const rounded = Math.round(amount);
  const num = rounded.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return unit ? `${num} ${unit}` : num;
}

/** Formats an inventory change type. */
export function formatInventoryChangeType(value: string | null | undefined): string {
  if (!value) return '—';
  const lower = value.toLowerCase();
  switch (lower) {
    case 'procurement':
      return 'Procurement';
    case 'usage':
      return 'Usage';
    case 'correction':
      return 'Correction';
    case 'handover':
      return 'Handover';
    default:
      return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
}

/** Formats an inventory change time. */
export function formatInventoryChangeTime(value: unknown): string {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${year}.${month}.${day}. - ${hour}:${minute}`;
}
