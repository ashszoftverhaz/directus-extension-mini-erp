import { createCollection } from '../helpers/collectionHelper';
import { BootstrapContext } from '../types';
import { getContractTypesSchema } from './contractTypesSchema';
import { seedContractTypesIfEmpty } from './contractTypesSeed';

export async function bootstrapContractTypes(context: Omit<BootstrapContext, 'accountability'>): Promise<void> {
  const { logger } = context;

  logger.info('[ERP bootstrap] Contract types bootstrap started.');

  await createCollection(context, getContractTypesSchema(context.database));
  await seedContractTypesIfEmpty(context);

  logger.info('[ERP bootstrap] Contract types bootstrap finished.');
}
