import { createCollection } from '../helpers/collectionHelper';
import type { BootstrapContext } from '../types';
import { getAssetCategoriesSchema } from './assetCategoriesSchema';
import { seedAssetCategoriesIfEmpty } from './assetCategoriesSeed';

type AssetCategoriesContext = Pick<
  BootstrapContext,
  'services' | 'logger' | 'database' | 'getSchema' | 'accountability'
>;

export async function bootstrapAssetCategories(context: AssetCategoriesContext): Promise<void> {
  const { logger } = context;

  logger.info('[ERP bootstrap] Asset Categories bootstrap started.');

  await createCollection(context, getAssetCategoriesSchema(context.database));
  await seedAssetCategoriesIfEmpty(context);

  logger.info('[ERP bootstrap] Asset Categories bootstrap finished.');
}
