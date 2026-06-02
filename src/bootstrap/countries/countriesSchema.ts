import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import { CollectionData } from '../helpers/collectionHelper';
import {
  createIntField,
  createM2OField,
  createStringField,
  createUuidPrimaryKeyField,
} from '../helpers/schemaHelpers';

const COUNTRIES_COLLECTION = 'countries';
const ERP_BOOTSTRAP_TAG = 'ERP_BOOTSTRAP:countries';

function getDesiredFields(database: any) {
  return [
    createUuidPrimaryKeyField(database, 1),
    createStringField('name', 'Country name', true, 2),
    createStringField('iso2', 'ISO 3166-1 alpha-2', true, 3, 'half'),
    createStringField('iso3', 'ISO 3166-1 alpha-3', false, 4, 'half'),
    createIntField('numeric_code', 'ISO 3166-1 numeric code', false, 5, 'half'),
    createM2OField('default_currency', 'Default currency', true, 6, 'half', {
      template: '{{short_name}} — {{name}}',
    }),
  ];
}

export function getCountriesSchema(database: any): CollectionData {
  const fields = getDesiredFields(database);

  return {
    collection: {
      collection: COUNTRIES_COLLECTION,
      fields,
      meta: {
        icon: 'public',
        note: ERP_BOOTSTRAP_TAG,
        singleton: false,
        hidden: false,
        accountability: 'all',
        group: ERP_COLLECTION_GROUP_NAMES.Settings,
      },
      schema: { name: COUNTRIES_COLLECTION },
    },
    fields,
    relations: [
      {
        collection: COUNTRIES_COLLECTION,
        field: 'default_currency',
        related_collection: 'currencies',
      },
    ],
  };
}

export { COUNTRIES_COLLECTION, ERP_BOOTSTRAP_TAG };
