import { getDrivingLicencesSchema } from './driverslicencesSchema';
import type { BootstrapContext } from '../types';
import { createCollection } from '../helpers/collectionHelper';

type DriverslicencesContext = Pick<
  BootstrapContext,
  'services' | 'logger' | 'database' | 'getSchema'
>;

export async function bootstrapDriverslicences(
  context: DriverslicencesContext,
): Promise<void> {
  const { logger, database } = context;

  logger.info('[ERP bootstrap] Driverslicences bootstrap started.');

 await createCollection(context, getDrivingLicencesSchema(database));

  logger.info('[ERP bootstrap] Driverslicences bootstrap finished.');
}
