import type { BootstrapContext } from '../../bootstrap/types';

export type AssetCategoryType = 'vehicle' | 'tool' | 'it_equipment' | 'other';

/**
 * Generates a short, uppercase code from an asset category name
 * Takes the first 3 alphanumeric characters (after trimming and cleaning),
 * uppercases them and pads with X if shorter
 *
 * Examples:
 *  - "Vehicle"        -> "VEH"
 *  - "Power tools"    -> "POW"
 *  - "IT equipment"   -> "ITE"
 */
export function generateAssetCategoryShortName(name: string | null | undefined): string {
  if (!name || typeof name !== 'string') {
    return 'CAT';
  }

  const cleaned = name
    .trim()
    .replace(/[^\p{L}\p{N}]/gu, '')
    .toUpperCase();

  if (!cleaned) {
    return 'CAT';
  }

  return cleaned.substring(0, 3).padEnd(3, 'X');
}

/**
 * Infers the asset category type from a human-readable category name
 * If we can't confidently decide, we fall back to "other"
 *
 * This allows the UI to keep category type hidden and still ensure
 * vehicle-specific behaviour works for obvious vehicle categories
 */
export function inferAssetCategoryType(name: string | null | undefined): AssetCategoryType {
  const value = (name ?? '').toLowerCase();

  const vehicleKeywords = [
    'vehicle',
    'car',
    'truck',
    'van',
    'bus',
    'auto',
    'fleet',
    'motor',
    'motorcycle',
    'bike',
    'motorbike',
  ];

  const toolKeywords = [
    'tool',
    'equipment',
    'machine',
    'washer',
    'compressor',
    'pressure washer',
    'high-pressure',
  ];

  const itKeywords = [
    'it',
    'laptop',
    'notebook',
    'computer',
    'pc',
    'printer',
    'router',
    'server',
    'tablet',
    'monitor',
    'smartphone',
    'phone',
    'mobile',
  ];

  const containsAny = (keywords: string[]) =>
    keywords.some((keyword) => {
      const base = keyword.toLowerCase();
      const variants = [base, `${base}s`, base.endsWith('s') ? `${base}es` : ''];
      return variants.some((variant) => variant && value.includes(variant));
    });

  if (containsAny(vehicleKeywords)) return 'vehicle';
  if (containsAny(toolKeywords)) return 'tool';
  if (containsAny(itKeywords)) return 'it_equipment';

  return 'other';
}

/**
 * Helper to ensure asset category payloads have both short_name and category_type
 * before insert/update. Intended to be used from flows or hooks
 */
export function normalizeAssetCategoryPayload(
  payload: Record<string, any>,
  _context?: BootstrapContext,
): Record<string, any> {
  const next = { ...payload };

  const name = (next.asset_category_name ?? '') as string;

  if (!next.short_name) {
    next.short_name = generateAssetCategoryShortName(name);
  }

  if (!next.category_type) {
    next.category_type = inferAssetCategoryType(name);
  }

  return next;
}
