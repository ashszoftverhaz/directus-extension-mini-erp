import { seedCurrenciesIfEmpty } from './currenciesSeed';
import { createCollection } from '../helpers/collectionHelper';
import { getCurrenciesSchema } from './currenciesSchema';
import type { BootstrapContext } from '../types';

type CurrenciesContext = Pick<
  BootstrapContext,
  'services' | 'logger' | 'database' | 'getSchema'
>;

export async function bootstrapCurrencies(context: CurrenciesContext): Promise<void> {
  const { logger } = context;

  logger.info('[ERP bootstrap] Currencies bootstrap started.');

  await createCollection(context, getCurrenciesSchema(context.database));
  await seedCurrenciesIfEmpty(context);

  logger.info('[ERP bootstrap] Currencies bootstrap finished.');
}
