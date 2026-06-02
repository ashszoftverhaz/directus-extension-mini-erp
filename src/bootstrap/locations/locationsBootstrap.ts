import { createCollection } from '../helpers/collectionHelper';
import type { BootstrapContext } from '../types';
import { getLocationsSchema, LOCATIONS_COLLECTION } from './locationsSchema';

export async function bootstrapLocations(
  context: BootstrapContext,
  shouldCreate: boolean,
): Promise<void> {
  const { logger, database, getSchema } = context;

  if (!shouldCreate) {
    logger.info(
      '[ERP bootstrap] Locations bootstrap skipped (collection exists or washing locations present).',
    );
    return;
  }

  const schema = await getSchema({ database });
  const alreadyExists = schema.collections?.[LOCATIONS_COLLECTION];

  if (alreadyExists) {
    logger.info(
      `[ERP bootstrap] Locations collection "${LOCATIONS_COLLECTION}" already exists. Skipping creation.`,
    );
    return;
  }

  logger.info('[ERP bootstrap] Locations bootstrap started.');

  await createCollection(context, getLocationsSchema(database));

  logger.info('[ERP bootstrap] Locations bootstrap finished.');
}
