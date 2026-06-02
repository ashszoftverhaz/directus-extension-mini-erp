import { createCollection } from '../helpers/collectionHelper';
import { getLanguagesSchema } from './languagesSchema';
import { seedLanguagesIfEmpty } from './languagesSeed';
import { HookContext } from './types';

export async function bootstrapLanguages(context: HookContext): Promise<void> {
  const { logger } = context;

  logger.info('[ERP bootstrap] Languages bootstrap started.');

  await createCollection(context, getLanguagesSchema(context.database));
  await seedLanguagesIfEmpty(context);

  logger.info('[ERP bootstrap] Languages bootstrap finished.');
}