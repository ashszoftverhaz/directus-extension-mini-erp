import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import {
  createCollection,
  createJunction,
  createJunctionToFiles,
  JunctionData,
} from '../helpers/collectionHelper';
import type { BootstrapContext } from '../types';
import { getIncomesSchema } from './incomesSchema';

const incomesAssetsRelationData: JunctionData = {
  collection: 'incomes',
  group: ERP_COLLECTION_GROUP_NAMES.Finance,
  idType: 'uuid',
  virtualFieldName: 'connected_assets',
  relatedCollection: 'assets',
  relatedIdType: 'uuid',
  template: '{{assets_id.code}} — {{assets_id.name}}',
};

const incomesInventoryChangesRelationData: JunctionData = {
  collection: 'incomes',
  group: ERP_COLLECTION_GROUP_NAMES.Finance,
  idType: 'uuid',
  virtualFieldName: 'connected_inventory_changes',
  relatedCollection: 'inventory_changes',
  relatedIdType: 'uuid',
  template: '{{inventory_changes_id.id}} — {{inventory_changes_id.inventory_change_type}}',
};

const incomesEmployeesRelationData: JunctionData = {
  collection: 'incomes',
  group: ERP_COLLECTION_GROUP_NAMES.Finance,
  idType: 'uuid',
  virtualFieldName: 'connected_employees',
  relatedCollection: 'employees',
  relatedIdType: 'uuid',
  template: '{{employees_id.account.first_name}} {{employees_id.account.last_name}}',
};

const incomesFilesRelationData: JunctionData = {
  collection: 'incomes',
  group: ERP_COLLECTION_GROUP_NAMES.Finance,
  idType: 'uuid',
  virtualFieldName: 'upload_invoices',
  relatedCollection: 'directus_files',
  relatedIdType: 'uuid',
  virtualFieldSort: 7,
  virtualFieldWidth: 'half',
};

type IncomesContext = Pick<
  BootstrapContext,
  'services' | 'logger' | 'database' | 'getSchema' | 'accountability'
>;

export async function bootstrapIncomes(
  context: IncomesContext,
  washingRelatedCollectionsExists: boolean,
  inventoryLocationsCollectionExists: boolean,
): Promise<void> {
  const { logger } = context;

  logger.info('[ERP bootstrap] Incomes bootstrap started.');

  await createCollection(
    context,
    getIncomesSchema(
      context.database,
      washingRelatedCollectionsExists,
      inventoryLocationsCollectionExists,
    ),
  );

  await createJunction(context, incomesAssetsRelationData);
  await createJunction(context, incomesInventoryChangesRelationData);
  await createJunction(context, incomesEmployeesRelationData);
  await createJunctionToFiles(context, incomesFilesRelationData);

  logger.info('[ERP bootstrap] Incomes bootstrap finished.');
}
