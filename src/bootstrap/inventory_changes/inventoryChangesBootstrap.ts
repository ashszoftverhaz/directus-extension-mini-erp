import { createCollection, createJunction, JunctionData, PresetData } from '../helpers/collectionHelper';
import type { BootstrapContext } from '../types';
import { getInventoryChangesSchema } from './inventoryChangesSchema';
import { addPreset } from '../helpers/collectionHelper';
import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';

const addedMaterialsRelationData: JunctionData = {
  collection: 'inventory_changes',
  group: ERP_COLLECTION_GROUP_NAMES.InventoryManagement,
  idType: 'uuid',
  virtualFieldName: 'added_materials',
  relatedCollection: 'materials',
  relatedIdType: 'uuid',
  template: '{{materials_id.name_of_product}}',
  junctionName: 'inventory_changes_added_materials',
  extraFields: [
    {
      collection: 'inventory_changes_added_materials',
      field: 'quantity',
      type: 'integer',
      meta: {
        interface: 'input',
        required: true,
        options: { min: 1 },
      },
      schema: { is_nullable: false, default_value: 1 },
    },
  ],
};

const removedMaterialsRelationData: JunctionData = {
  collection: 'inventory_changes',
  group: ERP_COLLECTION_GROUP_NAMES.InventoryManagement,
  idType: 'uuid',
  virtualFieldName: 'removed_materials',
  relatedCollection: 'materials',
  relatedIdType: 'uuid',
  template: '{{materials_id.name_of_product}}',
  junctionName: 'inventory_changes_removed_materials',
  extraFields: [
    {
      collection: 'inventory_changes_removed_materials',
      field: 'quantity',
      type: 'integer',
      meta: {
        interface: 'input',
        required: true,
        options: { min: 1 },
      },
      schema: { is_nullable: false, default_value: 1 },
    },
  ],
};

const inventroryChangesPresetData: PresetData = {
  collection: 'inventory_changes',
  fields: ['partner.name', 'inventory_change_type', 'time_of_change', 'washing_unit.name'],
  icon: 'inventory',
}


export async function bootstrapInventoryChanges(
  context: BootstrapContext,
  washingRelatedCollectionsExists: boolean,
  inventoryLocationsCollectionExists: boolean,
): Promise<void> {
  const { logger } = context;

  logger.info('[ERP bootstrap] Inventory Changes bootstrap started.');

  await createCollection(
    context,
    getInventoryChangesSchema(
      context.database,
      washingRelatedCollectionsExists,
      inventoryLocationsCollectionExists,
    ),
  );
  await createJunction(context, addedMaterialsRelationData);
  await createJunction(context, removedMaterialsRelationData);
  await addPreset(context, inventroryChangesPresetData);

  logger.info('[ERP bootstrap] Inventory Changes bootstrap finished.');
}
