import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import { CollectionData } from '../helpers/collectionHelper';
import {
  createStringField,
  createUuidPrimaryKeyField,
  createDropdownField,
} from '../helpers/schemaHelpers';

const collectionInfo = 'In Currencies, you can manage the currencies used by your business, with the most commonly used global currencies already available in the system.';

function getFields(database: any): any {
  return [
    createUuidPrimaryKeyField(database, 1),
    createStringField('name', '', true, 2),
    createStringField('tax_number', '', false, 3),
    createStringField('registration_number', '', false, 4),
    createDropdownField(
      'status',
      '',
      false,
      5,
      [
        { text: 'Active', value: 'active', color: '#2ECC65' },
        { text: 'Potential', value: 'potential', color: '#FFC23B' },
        { text: 'Closed', value: 'closed', color: '#A2B5CD' },
      ],
      'potential',
    ),
    {
      field: 'preferred_currency',
      type: 'uuid',
      meta: {
        interface: 'select-dropdown-m2o',
        required: false,
        display: 'related-values',
        sort: 5,
        width: 'full',
        options: {
          template: '{{name}}',
        },
      },
      schema: { is_nullable: true, max_length: 36 },
    },
    {
      field: 'billing_information',
      type: 'uuid',
      meta: {
        interface: 'select-dropdown-m2o',
        required: false,
        display: 'related-values',
        sort: 6,
        width: 'full',
        options: {
          template: '{{address}}, {{city}}',
        },
      },
      schema: { is_nullable: true, max_length: 36 },
    },
  ];
}

export function getPartnersBaseSchema(database: any): CollectionData {
  return {
    collection: {
      collection: 'partners',
      fields: getFields(database),
      meta: { singleton: false, accountability: 'all', icon: 'people', group: ERP_COLLECTION_GROUP_NAMES.Partners, note: collectionInfo, hidden: true },
      schema: { name: 'partners' },
    },
    fields: getFields(database),
    relations: [
      {
        collection: 'partners',
        field: 'preferred_currency',
        related_collection: 'currencies',
      },
      {
        collection: 'partners',
        field: 'billing_information',
        related_collection: 'partner_billing_information',
      }
    ],
  };
}
