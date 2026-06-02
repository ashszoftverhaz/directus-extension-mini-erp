import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import { CollectionData } from '../helpers/collectionHelper';
import {
  createM2OField,
  createStringField,
  createUuidPrimaryKeyField,
} from '../helpers/schemaHelpers';

const ERP_BOOTSTRAP_TAG = 'erp_locations';
const LOCATIONS_COLLECTION = 'erp_locations';

function getDesiredFields(database: any): any[] {
  return [
    createUuidPrimaryKeyField(database, 1),
    createStringField('name', '', true, 2, 'full'),
    createM2OField('country', '', false, 3, 'half', { template: '{{name}}' }),
    createStringField('city', '', false, 4, 'half'),
    createStringField('postal_code', '', false, 5, 'half'),
    createStringField('address', '', false, 6, 'half'),
    createStringField('phone', '', false, 7, 'half'),
    createStringField('email', '', false, 8, 'half'),
  ];
}

export function getLocationsSchema(
  database: any,
): CollectionData {
  const fields = getDesiredFields(database);

  return {
    collection: {
      collection: LOCATIONS_COLLECTION,
      fields,
      meta: {
        icon: 'place',
        note: ERP_BOOTSTRAP_TAG,
        singleton: false,
        hidden: true,
        accountability: 'all',
        group: ERP_COLLECTION_GROUP_NAMES.Settings,
      },
      schema: { name: LOCATIONS_COLLECTION },
    },
    fields,
    relations: [
      {
        collection: LOCATIONS_COLLECTION,
        field: 'country',
        related_collection: 'countries',
      },
    ],
  };
}

export { LOCATIONS_COLLECTION, ERP_BOOTSTRAP_TAG };
