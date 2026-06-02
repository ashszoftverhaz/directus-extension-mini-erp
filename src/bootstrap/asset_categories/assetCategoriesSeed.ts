import type { BootstrapContext } from '../types';

type SeedContext = Pick<
  BootstrapContext,
  'services' | 'logger' | 'database' | 'getSchema' | 'accountability'
>;

export const BASE_VEHICLE_CATEGORY_SHORT_NAME = 'VEH';

const DEFAULT_ASSET_CATEGORIES = [
  {
    asset_category_name: 'Vehicle',
    short_name: BASE_VEHICLE_CATEGORY_SHORT_NAME,
    category_type: 'vehicle',
  },
  { asset_category_name: 'Tool', short_name: 'TOO', category_type: 'tool' },
  { asset_category_name: 'IT Equipment', short_name: 'ITE', category_type: 'it_equipment' },
  { asset_category_name: 'Other', short_name: 'OTH', category_type: 'other' },
] as const;

export async function seedAssetCategoriesIfEmpty(context: SeedContext): Promise<void> {
  const { services, logger, getSchema, database, accountability } = context;
  const schema = await getSchema({ database });
  const { ItemsService } = services;

  const assetCategoriesService = new ItemsService('asset_categories', {
    accountability: { ...accountability, admin: true },
    schema,
  });

  const existing = await assetCategoriesService.readByQuery({
    limit: 1,
    fields: ['id'],
  });

  if (Array.isArray(existing) && existing.length > 0) {
    logger.info('[ERP bootstrap] Asset Categories already seeded, skipping.');
    return;
  }

  logger.info('[ERP bootstrap] Seeding default Asset Categories.');

  try {
    await assetCategoriesService.createMany(DEFAULT_ASSET_CATEGORIES as any);
  } catch (error: any) {
    logger.warn(`[ERP bootstrap] Failed to seed Asset Categories: ${error?.message ?? error}`);
  }
}
