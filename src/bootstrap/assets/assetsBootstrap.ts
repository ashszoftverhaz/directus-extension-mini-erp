import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import { createCollection, createJunction, JunctionData } from '../helpers/collectionHelper';
import type { BootstrapContext } from '../types';
import { getAssetsSchema } from './assetsSchema';

const assetsContractsRelationData: JunctionData = {
  collection: 'assets',
  group: ERP_COLLECTION_GROUP_NAMES.Assets,
  idType: 'uuid',
  virtualFieldName: 'contracts',
  relatedCollection: 'contracts',
  relatedIdType: 'uuid',
  template:
    '{{contracts_id.contract_id}} / {{contracts_id.status}} / {{contracts_id.contract_type.contract_type}}',
};

type AssetsContext = Pick<
  BootstrapContext,
  'services' | 'logger' | 'database' | 'getSchema' | 'accountability'
>;

export async function bootstrapAssets(
  context: AssetsContext,
  washingRelatedCollectionsExists: boolean,
  inventoryLocationsCollectionExists: boolean,
  franchiseCollectionExists: boolean,
): Promise<void> {
  const { logger } = context;

  logger.info('[ERP bootstrap] Assets bootstrap started.');

  await createCollection(
    context,
    getAssetsSchema(
      context.database,
      washingRelatedCollectionsExists,
      inventoryLocationsCollectionExists,
      franchiseCollectionExists,
    ),
  );

  await createJunction(context, assetsContractsRelationData);

  logger.info('[ERP bootstrap] Assets bootstrap finished.');
}
