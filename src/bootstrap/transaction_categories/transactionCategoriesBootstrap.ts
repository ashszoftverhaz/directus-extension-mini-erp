import { createCollection } from '../helpers/collectionHelper';
import { BootstrapContext } from '../types';
import { getTransactionCategoriesSchema } from './transactionCategoriesSchema';
import { seedTransactionCategoriesIfEmpty } from './transactionCategoriesSeed';

export async function bootstrapTransactionCategories(context: Omit<BootstrapContext, 'accountability'>): Promise<void> {
  const { logger } = context;

  logger.info('[ERP bootstrap] Transaction categories bootstrap started.');

  await createCollection(context, getTransactionCategoriesSchema(context.database));
  await seedTransactionCategoriesIfEmpty(context);

  logger.info('[ERP bootstrap] Transaction categories bootstrap finished.');
}
