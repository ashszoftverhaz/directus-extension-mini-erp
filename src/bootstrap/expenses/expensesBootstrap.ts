import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import {
  createCollection,
  createJunction,
  createJunctionToFiles,
  JunctionData,
} from '../helpers/collectionHelper';
import type { BootstrapContext } from '../types';
import { getExpensesSchema } from './expensesSchema';

const expensesAssetsRelationData: JunctionData = {
  collection: 'expenses',
  group: ERP_COLLECTION_GROUP_NAMES.Finance,
  idType: 'uuid',
  virtualFieldName: 'assets',
  relatedCollection: 'assets',
  relatedIdType: 'uuid',
  template: '{{assets_id.name}}',
  relatedVirtualFieldName: 'expenses',
  relatedOptions: { template: '{{expenses_id.name}}', enableCreate: false, enableSelect: false },
};

const expensesInventoryChangesRelationData: JunctionData = {
  collection: 'expenses',
  group: ERP_COLLECTION_GROUP_NAMES.Finance,
  idType: 'uuid',
  virtualFieldName: 'inventory_changes',
  relatedCollection: 'inventory_changes',
  relatedIdType: 'uuid',
  template: '{{inventory_changes_id.partner.name}}',
  relatedVirtualFieldName: 'expenses',
  relatedOptions: { template: '{{expenses_id.name}}', enableCreate: false, enableSelect: false },

};

const expensesEmployeeRelationData: JunctionData = {
  collection: 'expenses',
  group: ERP_COLLECTION_GROUP_NAMES.Finance,
  idType: 'uuid',
  virtualFieldName: 'employees',
  relatedCollection: 'employees',
  relatedIdType: 'uuid',
  template: '{{employees_id.account.first_name}} {{employees_id.account.last_name}}',
};

const expensesDirectusFilesRelationData: JunctionData = {
  collection: 'expenses',
  group: ERP_COLLECTION_GROUP_NAMES.Finance,
  idType: 'uuid',
  virtualFieldName: 'upload_invoices',
  relatedCollection: 'directus_files',
  relatedIdType: 'uuid',
  virtualFieldSort: 7,
  virtualFieldWidth: 'half',
};

export async function bootstrapExpenses(
  context: BootstrapContext,
  washingRelatedCollectionsExists: boolean,
  inventoryLocationsCollectionExists: boolean,
): Promise<void> {
  const { logger } = context;

  logger.info('[ERP bootstrap] Expenses bootstrap started.');

  await createCollection(
    context,
    getExpensesSchema(
      context.database,
      washingRelatedCollectionsExists,
      inventoryLocationsCollectionExists,
    ),
  );

  await createJunction(context, expensesAssetsRelationData);
  await createJunction(context, expensesInventoryChangesRelationData);
  await createJunction(context, expensesEmployeeRelationData);
  await createJunctionToFiles(context, expensesDirectusFilesRelationData);

  logger.info('[ERP bootstrap] Expenses bootstrap finished.');
}
