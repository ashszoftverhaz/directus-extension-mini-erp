import type { InventoryListItem } from '../module/types/inventory';
import { totalAmountInCategoryUnit, formatAmount } from './inventoryService';

export interface MaterialCategoryStatistic {
  categoryId: string;
  categoryName: string;
  minimumAmount: number;
  currentAmount: number;
  unit: string | null;
  percentageOfMinimum: number;
  hasShortage: boolean;
}

function createRunningLowItemFromInventoryItem(item: InventoryListItem) {
  const category = item.material_category;

  return {
    quantity: item.quantity ?? 0,
    package_size: item.package_size ?? 0,
    material_category: category
      ? {
          id: category.id,
          minimum_value: category.minimum_value ?? null,
          unit: category.unit ?? null,
        }
      : null,
  };
}

export function computeMaterialCategoryStatistics(
  items: InventoryListItem[],
): MaterialCategoryStatistic[] {
  const byCategory = new Map<string, MaterialCategoryStatistic>();

  for (const item of items) {
    const category = item.material_category;
    if (!category?.id) continue;

    const minimumAmount = category.minimum_value ?? 0;
    if (minimumAmount <= 0) continue;

    const totalAmount = totalAmountInCategoryUnit(createRunningLowItemFromInventoryItem(item));

    if (totalAmount <= 0 && !byCategory.has(category.id)) {
      byCategory.set(category.id, {
        categoryId: category.id,
        categoryName: category.material_category_name,
        minimumAmount,
        currentAmount: 0,
        unit: category.unit ?? null,
        percentageOfMinimum: 0,
        hasShortage: true,
      });
      continue;
    }

    if (totalAmount <= 0) continue;

    const existing = byCategory.get(category.id);
    const currentAmount = (existing?.currentAmount ?? 0) + totalAmount;

    const percentageOfMinimum = minimumAmount > 0 ? (currentAmount / minimumAmount) * 100 : 0;

    byCategory.set(category.id, {
      categoryId: category.id,
      categoryName: category.material_category_name,
      minimumAmount,
      currentAmount,
      unit: category.unit ?? null,
      percentageOfMinimum,
      hasShortage: currentAmount < minimumAmount,
    });
  }

  const stats = Array.from(byCategory.values());

  stats.sort((left, right) => {
    if (left.hasShortage !== right.hasShortage) {
      return left.hasShortage ? -1 : 1;
    }

    return left.percentageOfMinimum - right.percentageOfMinimum;
  });

  return stats;
}

export function formatCategoryStatisticSummary(stat: MaterialCategoryStatistic): string {
  const current = formatAmount(stat.currentAmount, stat.unit);
  const minimum = formatAmount(stat.minimumAmount, stat.unit);
  return `You have ${current}, but the minimum amount is ${minimum}.`;
}

export function hasSurplus(stat: MaterialCategoryStatistic): boolean {
  const percentage = stat.percentageOfMinimum;
  if (stat.hasShortage) return false;
  if (!Number.isFinite(percentage)) return false;
  return percentage > 100;
}

export function getShortageWidth(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0%';
  const clamped = Math.min(value, 100);
  return `${clamped}%`;
}

export function getSurplusWidthPercent(value: number): number {
  if (!Number.isFinite(value) || value <= 100) return 0;

  const surplus = value - 100;
  const SCALE = 400;
  const MIN_SURPLUS_WIDTH = 10;
  const MAX_SURPLUS_WIDTH = 50;

  const t = 1 - Math.exp(-surplus / SCALE);
  return MIN_SURPLUS_WIDTH + t * (MAX_SURPLUS_WIDTH - MIN_SURPLUS_WIDTH);
}

export function getBaseWidthPercent(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;

  if (value <= 100) {
    const clamped = Math.min(value, 100);
    return clamped;
  }

  const surplusWidth = getSurplusWidthPercent(value);
  return Math.max(0, 100 - surplusWidth);
}

export type ShortageSeverity = 'out' | 'critical' | 'high' | 'medium' | null;

export function getShortageSeverity(stat: MaterialCategoryStatistic): ShortageSeverity {
  if (!stat.hasShortage) return null;
  if (stat.currentAmount <= 0) return 'out';

  const percentage = stat.percentageOfMinimum;
  if (!Number.isFinite(percentage)) return 'critical';
  if (percentage <= 25) return 'critical';
  if (percentage <= 60) return 'high';
  return 'medium';
}
