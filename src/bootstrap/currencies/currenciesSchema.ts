import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import { CollectionData } from '../helpers/collectionHelper';
import { createBooleanField, createIntField, createStringField, createUuidPrimaryKeyField } from '../helpers/schemaHelpers';

const CURRENCIES_COLLECTION = 'currencies';
const ERP_BOOTSTRAP_TAG = 'In Currencies, you can manage the currencies used by your business, with the most commonly used global currencies already available in the system.';

function getDesiredFields(database: any) {
  return [
    createUuidPrimaryKeyField(database, 1),
    createStringField('short_name', 'Short name (ISO code)', true, 2),
    createStringField('name', 'Name', true, 3),
    createStringField('symbol', 'Symbol', false, 4),
    createIntField('numeric_code', 'Numeric code', false, 5),
    createIntField('minor_units', 'Minor units', false, 6),
    createBooleanField('is_active', 'Is active', true, true, 7),
  ];
}

export function getCurrenciesSchema(database: any): CollectionData {
  return {
    collection: {
      collection: CURRENCIES_COLLECTION,
      fields: getDesiredFields(database),
      meta: {
        icon: 'paid',
        note: ERP_BOOTSTRAP_TAG,
        singleton: false,
        hidden: true,
        accountability: 'all',
        group: ERP_COLLECTION_GROUP_NAMES.Finance,
      },
      schema: { name: CURRENCIES_COLLECTION },
    },
    fields: getDesiredFields(database),
    relations: [],
  };
}

export { CURRENCIES_COLLECTION, ERP_BOOTSTRAP_TAG };
