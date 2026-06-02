import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import { CollectionData } from '../helpers/collectionHelper';
import {
  createStringField,
  createUuidPrimaryKeyField,
  createM2OField,
} from '../helpers/schemaHelpers';

const collectionInfo = 'In Partner Billing Information, you can store partner billing details to make financial administration and transaction handling easier.';

function getFields(database: any): any {
  return [
    createUuidPrimaryKeyField(database, 1),
    createM2OField('country', 'Country', true, 2, 'full', { template: '{{name}} ({{iso2}})' }),
    createStringField('postal_code', '', true, 3),
    createStringField('city', '', true, 4),
    createStringField('address', '', true, 5),
    createStringField('other', '', false, 6),
  ];
}

export function getBillingInformationSchema(database: any): CollectionData {
  return {
    collection: {
      collection: 'partner_billing_information',
      fields: getFields(database),
      meta: { singleton: false, accountability: 'all', icon: 'receipt_long', group: ERP_COLLECTION_GROUP_NAMES.Partners, note: collectionInfo, hidden: true },
      schema: { name: 'partner_billing_information' },
    },
    fields: getFields(database),
    relations: [
      {
        collection: 'partner_billing_information',
        field: 'country',
        related_collection: 'countries',
      },
    ],
  };
}
