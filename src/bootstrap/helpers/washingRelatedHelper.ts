import { BootstrapContext } from '../types';

export async function checkWashingRelatedCollection(context: BootstrapContext, collection: string): Promise<boolean> {
  const { database, getSchema, logger } = context;
  const schema = await getSchema({ database });

  const collectionExists = schema.collections?.[collection];

  if (collectionExists) {
    logger.info(`Collection "${collection}" exists.`);
    return true;
  }

  logger.info(`Collection "${collection}" does not exist.`);
  return false;
}

export function createWashingRelatedField(
  washingRelatedCollectionExists: boolean,
  field: string,
  isRequired: boolean,
  sort: number,
  options?: Record<string, any> | undefined,
  width: 'half' | 'full' = 'full',
  conditions?: any
): any {
  if (!washingRelatedCollectionExists) {
    return undefined;
  }

  return {
    field,
    type: 'uuid',
    schema: {
      is_nullable: !isRequired,
    },
    meta: {
      interface: 'select-dropdown-m2o',
      required: isRequired,
      sort,
      options,
      special: 'm2o',
      display: 'related-values',
      width,
      display_options: options ?? undefined,
      conditions: conditions ?? undefined,
    },
  };
}

export function addRelationToWashingRelated(
  collection: string,
  field: string,
  washingRelatedCollection: string,
  washingRelatedCollectionExists: boolean,
): any {
  if (!washingRelatedCollectionExists) {
    return undefined;
  }

  return {
    collection,
    field: field,
    related_collection: washingRelatedCollection,
  };
}
