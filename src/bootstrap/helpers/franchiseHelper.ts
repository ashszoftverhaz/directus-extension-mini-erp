import { BootstrapContext } from '../types';

export async function checkFranchiseCollection(context: BootstrapContext): Promise<boolean> {
  const { database, getSchema, logger } = context;
  const schema = await getSchema({ database });

  const collectionExists = schema.collections?.['franchise'];

  if (collectionExists) {
    logger.info('Collection "franchise" exists.');
    return true;
  }

  logger.info('Collection "franchise" does not exist.');
  return false;
}

export function createFranchiseField(
  franchiseCollectionExists: boolean,
  sort: number,
  isRequired: boolean,
  options: Record<string, any> | undefined,
  width: 'half' | 'full' = 'full',
): any {
  if (!franchiseCollectionExists) {
    return undefined;
  }

  return {
    field: 'franchise',
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
    },
  };
}

export function addRelationToFranchise(
  collection: string,
  franchiseCollectionExists: boolean,
): any {
  if (!franchiseCollectionExists) {
    return undefined;
  }

  return {
    collection,
    field: 'franchise',
    related_collection: 'franchise',
  };
}
