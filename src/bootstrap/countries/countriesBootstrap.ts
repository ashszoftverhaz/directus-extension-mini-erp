import { seedCountriesIfEmpty } from './countriesSeed';
import { createCollection } from '../helpers/collectionHelper';
import { getCountriesSchema } from './countriesSchema';
import type { BootstrapContext } from '../types';

type CountriesContext = Pick<BootstrapContext, 'services' | 'logger' | 'database' | 'getSchema'>;

export async function bootstrapCountries(context: CountriesContext): Promise<void> {
  const { logger, database } = context;

  logger.info('[ERP bootstrap] Countries bootstrap started.');

  await createCollection(context, getCountriesSchema(database));
  await seedCountriesIfEmpty(context);

  logger.info('[ERP bootstrap] Countries bootstrap finished.');
}
