import { createCollection } from '../helpers/collectionHelper';
import { BootstrapContext } from '../types';
import { getVersionStatusSchema, VERSION_STATUS_COLLECTION } from './verisonStatusSchema';

export async function bootstrapVersionStatus(context: Omit<BootstrapContext, 'accountability'>): Promise<void> {
  const { logger } = context;

  logger.info('[ERP bootstrap] Version status bootstrap started.');

  await createCollection(context, getVersionStatusSchema(context.database));
  await createEmptyItemIfNotExist(context);

  logger.info('[ERP bootstrap] Version status bootstrap finished.');
}

async function createEmptyItemIfNotExist(
  context: Omit<BootstrapContext, 'accountability'>,
): Promise<void> {
  const { services, logger, database, getSchema } = context;
  const { ItemsService } = services;

  const schema = await getSchema({ database });

  const itemsService = new ItemsService(VERSION_STATUS_COLLECTION, {
    database,
    schema,
  });

  const existing = await itemsService.readByQuery({ limit: 1, fields: ['id'] });
  if (existing?.length > 0) {
    logger.info('[ERP bootstrap] Version status item already exists; skipping.');
    return;
  }

  await itemsService.createOne({
    last_version_check_time: null,
    latest_version: null,
  });
}
