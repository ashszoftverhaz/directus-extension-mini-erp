import { createCollection } from '../helpers/collectionHelper';
import { getMaterialCategoriesSchema } from './materialCategoriesSchema';
import type { BootstrapContext } from '../types';

type MaterialCategoriesContext = Pick<
  BootstrapContext,
  'services' | 'logger' | 'database' | 'getSchema' | 'accountability'
>;

export async function bootstrapMaterialCategories(context: MaterialCategoriesContext): Promise<void> {
  const { logger } = context;
  logger.info('[ERP bootstrap] Material Categories bootstrap started.');

  await createCollection(context, getMaterialCategoriesSchema(context.database));

  logger.info('[ERP bootstrap] Material Categories bootstrap finished.');
}
