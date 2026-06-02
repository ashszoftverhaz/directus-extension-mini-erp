import { createCollection } from '../helpers/collectionHelper';
import { getMaterialsSchema } from './materialsSchema';
import type { BootstrapContext } from '../types';

type MaterialsContext = Pick<BootstrapContext, 'services' | 'logger' | 'database' | 'getSchema'>;

export async function bootstrapMaterials(context: MaterialsContext): Promise<void> {
  const { logger } = context;

  logger.info('[ERP bootstrap] Materials bootstrap started.');

  await createCollection(context, getMaterialsSchema(context.database));

  logger.info('[ERP bootstrap] Materials bootstrap finished.');
}
