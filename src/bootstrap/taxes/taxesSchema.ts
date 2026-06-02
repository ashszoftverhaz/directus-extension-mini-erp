import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import { CollectionData } from '../helpers/collectionHelper';
import {
  createDecimalField,
  createDropdownField,
  createM2OField,
  createMultilineTextField,
  createStringField,
  createUuidPrimaryKeyField,
} from '../helpers/schemaHelpers';

const TAXES_COLLECTION = 'taxes';
const ERP_BOOTSTRAP_TAG = 'In Taxes, you can manage all tax types relevant to your business and apply them to areas such as employee salaries or expenses.';

function getDesiredFields(database: any) {
  const nameField = createStringField('name', 'Name', true, 2);
  nameField.schema = {
    ...(nameField.schema ?? {}),
    is_unique: true,
  };

  const codeField = createStringField('code', 'Code', true, 3);
  codeField.schema = {
    ...(codeField.schema ?? {}),
    is_unique: true,
  };

  return [
    createUuidPrimaryKeyField(database, 1),
    nameField,
    codeField,
    createMultilineTextField('description', 'Description', false, 4),
    createM2OField('country', 'Country', true, 5, 'half', {
      template: '{{name}} ({{iso2}})',
    }),
    createDropdownField(
      'tax_type',
      'Tax type',
      true,
      6,
      [
        { value: 'percentage_based', text: 'Percentage based' },
        { value: 'fixed_amount', text: 'Fixed amount' },
      ],
      'percentage_based',
      'half',
    ),
    createDecimalField('tax_value', 'Tax value', true, 7, 'half', 10, 2),
  ];
}

export function getTaxesSchema(database: any): CollectionData {
  const fields = getDesiredFields(database);

  return {
    collection: {
      collection: TAXES_COLLECTION,
      fields,
      meta: {
        icon: 'request_quote',
        note: ERP_BOOTSTRAP_TAG,
        singleton: false,
        hidden: true,
        accountability: 'all',
        group: ERP_COLLECTION_GROUP_NAMES.Finance,
      },
      schema: { name: TAXES_COLLECTION },
    },
    fields,
    relations: [
      {
        collection: TAXES_COLLECTION,
        field: 'country',
        related_collection: 'countries',
      },
    ],
  };
}

export { TAXES_COLLECTION, ERP_BOOTSTRAP_TAG };
