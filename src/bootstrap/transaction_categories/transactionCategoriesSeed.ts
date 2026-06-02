import defaultTransactionCategories from '../../module/data/transactionCategories.json';
import { BootstrapContext } from '../types';
import { TRANSACTION_CATEGORIES_COLLECTION } from './transactionCategoriesSchema';

type TransactionCategorySeedItem = {
  name: string;
  description: string;
};

export async function seedTransactionCategoriesIfEmpty(context: Omit<BootstrapContext, 'accountability'>): Promise<void> {
  const { services, logger, database, getSchema } = context;
  const { ItemsService } = services;

  const schema = await getSchema({ database });

  const itemsService = new ItemsService(TRANSACTION_CATEGORIES_COLLECTION, {
    database,
    schema,
  });

  const seedItems = defaultTransactionCategories as TransactionCategorySeedItem[];
  if (!Array.isArray(seedItems) || seedItems.length === 0) {
    logger.warn('[ERP bootstrap] transactionCategories.json is empty; skipping seed.');
    return;
  }

  const existing = await itemsService.readByQuery({ limit: 1, fields: ['id'] });
  if (existing?.length > 0) {
    logger.info('[ERP bootstrap] Transaction categories already seeded; skipping.');
    return;
  }

  logger.info(`[ERP bootstrap] Seeding ${seedItems.length} transaction categories...`);

  const chunkSize = 200;
  for (let index = 0; index < seedItems.length; index += chunkSize) {
    const chunk = seedItems.slice(index, index + chunkSize).map((item) => ({
      name: item.name,
      description: item.description,
    }));

    await itemsService.createMany(chunk);
  }

  logger.info('[ERP bootstrap] Transaction categories seed finished.');
}
