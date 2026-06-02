import { createCollection } from '../helpers/collectionHelper';
import { getTaxesSchema } from './taxesSchema';
import type { BootstrapContext } from '../types';

type TaxesContext = Pick<
  BootstrapContext,
  'services' | 'logger' | 'database' | 'getSchema' | 'accountability'
>;

export async function bootstrapTaxes(context: TaxesContext): Promise<void> {
  const { logger } = context;

  logger.info('[ERP bootstrap] Taxes bootstrap started.');
  await createCollection(context, getTaxesSchema(context.database));

  logger.info('[ERP bootstrap] Taxes bootstrap finished.');
}
