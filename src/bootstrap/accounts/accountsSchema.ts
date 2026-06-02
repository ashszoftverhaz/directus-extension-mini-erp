import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import { CollectionData } from '../helpers/collectionHelper';
import {
  createDropdownField,
  createStringField,
  createUuidPrimaryKeyField,
} from '../helpers/schemaHelpers';

export const CONTRACT_TYPES_COLLECTION = 'accounts';
const ERP_BOOTSTRAP_TAG = 'In Accounts, you can manage the different places where your business holds money, such as bank accounts, bank cards, or cash accounts.';

function getDesiredFields(database: any) {
  return [
    createUuidPrimaryKeyField(database, 1),
    createStringField('account_name', '', true, 2, 'half'),
    createDropdownField(
      'payment_method',
      '',
      true,
      3,
      [
        { text: 'Bank card', value: 'bank_card' },
        { text: 'Cash', value: 'cash' },
      ],
      '',
      'half',
    ),
    createStringField('notes', '', false, 4),
  ];
}

export function getAccountsSchema(database: any): CollectionData {
  return {
    collection: {
      collection: CONTRACT_TYPES_COLLECTION,
      fields: getDesiredFields(database),
      meta: {
        icon: 'account_box',
        note: ERP_BOOTSTRAP_TAG,
        singleton: false,
        hidden: true,
        accountability: 'all',
        group: ERP_COLLECTION_GROUP_NAMES.Finance,
      },
      schema: { name: CONTRACT_TYPES_COLLECTION },
    },
    fields: getDesiredFields(database),
    relations: [],
  };
}
