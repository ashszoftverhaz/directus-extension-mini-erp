import { createCollection } from '../helpers/collectionHelper';
import { BootstrapContext } from '../types';
import { getAccountsSchema } from './accountsSchema';

export async function bootstrapAccounts(context: Omit<BootstrapContext, 'accountability'>): Promise<void> {
  const { logger } = context;

  logger.info('[ERP bootstrap] Accounts bootstrap started.');

  await createCollection(context, getAccountsSchema(context.database));

  logger.info('[ERP bootstrap] Accounts bootstrap finished.');
}
