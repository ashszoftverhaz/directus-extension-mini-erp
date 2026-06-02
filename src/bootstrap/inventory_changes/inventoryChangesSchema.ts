import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import { CollectionData } from '../helpers/collectionHelper';
import {
  createM2OField,
  createDropdownField,
  createUuidPrimaryKeyField,
  createDateCreatedField,
  createUserCreatedField,
} from '../helpers/schemaHelpers';
import {
  addRelationToWashingRelated,
  createWashingRelatedField,
} from '../helpers/washingRelatedHelper';

const INVENTORY_CHANGES_COLLECTION = 'inventory_changes';
const LOCATIONS_COLLECTION = 'erp_locations';
const ERP_BOOTSTRAP_TAG = 'In Inventory Changes, you can track every change in inventory, including usage, corrections, and procurements.';

function getDesiredFields(
  database: any,
  washingRelatedCollectionsExists: boolean,
  locationsCollectionExists: boolean,
): any[] {
  const baseFields = [
    createUuidPrimaryKeyField(database, 1),
    createDateCreatedField('time_of_change', 2, false),
    createDropdownField('inventory_change_type', '', true, 3, [
      { value: 'procurement', text: 'Procurement' },
      { value: 'usage', text: 'Usage' },
      { value: 'correction', text: 'Correction' },
      { value: 'handover', text: 'Handover' },
    ]),
    createM2OField('partner', '', false, 4, 'full', {"template":"{{name}}"}),
  ];

  if (washingRelatedCollectionsExists) {
    return [
      ...baseFields,
      createWashingRelatedField(washingRelatedCollectionsExists, 'washing_unit', false, 5),
      createWashingRelatedField(
        washingRelatedCollectionsExists,
        'source_location',
        true,
        6,
        { template: '{{name}}' },
        'half',
      ),
      createWashingRelatedField(
        washingRelatedCollectionsExists,
        'target_location',
        false,
        7,
        { template: '{{name}}' },
        'half',
      ),
      // Fallback location for setups without washing-related collections
      createM2OField('fallback_location', '', false, 8, 'half'),
      createUserCreatedField('made_by', 9, false),
    ];
  }

  if (locationsCollectionExists) {
    return [
      ...baseFields,
      // No washing_unit
      createM2OField('source_location', '', true, 6, 'half'),
      createM2OField('target_location', '', false, 7, 'half'),
      createM2OField('fallback_location', '', false, 8, 'half'),
      createUserCreatedField('made_by', 9, false),
    ];
  }

  // no location collections at all
  return [...baseFields, createUserCreatedField('made_by', 5, false)];
}

export function getInventoryChangesSchema(
  database: any,
  washingRelatedCollectionsExists: boolean,
  locationsCollectionExists: boolean,
): CollectionData {
  const fields = getDesiredFields(
    database,
    washingRelatedCollectionsExists,
    locationsCollectionExists,
  );

  return {
    collection: {
      collection: INVENTORY_CHANGES_COLLECTION,
      fields,
      meta: {
        icon: 'inventory',
        note: ERP_BOOTSTRAP_TAG,
        singleton: false,
        hidden: true,
        accountability: 'all',
        group: ERP_COLLECTION_GROUP_NAMES.InventoryManagement,
      },
      schema: { name: INVENTORY_CHANGES_COLLECTION },
    },
    fields,
    relations: [
      {
        collection: 'inventory_changes',
        field: 'made_by',
        related_collection: 'directus_users',
      },
      washingRelatedCollectionsExists
        ? addRelationToWashingRelated(
            'inventory_changes',
            'source_location',
            'washing_location',
            washingRelatedCollectionsExists,
          )
        : locationsCollectionExists
          ? {
              collection: 'inventory_changes',
              field: 'source_location',
              related_collection: LOCATIONS_COLLECTION,
            }
          : undefined,
      washingRelatedCollectionsExists
        ? addRelationToWashingRelated(
            'inventory_changes',
            'target_location',
            'washing_location',
            washingRelatedCollectionsExists,
          )
        : locationsCollectionExists
          ? {
              collection: 'inventory_changes',
              field: 'target_location',
              related_collection: LOCATIONS_COLLECTION,
            }
          : undefined,
      {
        collection: 'inventory_changes',
        field: 'partner',
        related_collection: 'partners',
      },
      addRelationToWashingRelated(
        'inventory_changes',
        'washing_unit',
        'washing_unit',
        washingRelatedCollectionsExists,
      ),
      locationsCollectionExists
        ? {
            collection: 'inventory_changes',
            field: 'fallback_location',
            related_collection: LOCATIONS_COLLECTION,
          }
        : undefined,
    ],
  };
}
