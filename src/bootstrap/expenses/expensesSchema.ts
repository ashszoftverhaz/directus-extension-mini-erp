import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import { CollectionData } from '../helpers/collectionHelper';
import {
  createDateField,
  createDecimalField,
  createDropdownField,
  createM2OField,
  createStringField,
  createUuidPrimaryKeyField,
} from '../helpers/schemaHelpers';
import {
  addRelationToWashingRelated,
} from '../helpers/washingRelatedHelper';

const EXPENSES_COLLECTION = 'expenses';
const ERP_BOOTSTRAP_TAG = 'In Expenses, you can store all business expenses in a controlled list where new expenses can be created, but existing records cannot be deleted.';
const LOCATIONS_COLLECTION = 'erp_locations';

function getDesiredFields(database: any): any[] {
  return [
    createUuidPrimaryKeyField(database, 1),
    createStringField('name', 'Expense Name', true, 2, 'half'),
    createDropdownField('expense_type', '', true, 3, [
      { text: 'Asset', value: 'asset' },
      { text: 'Inventory change', value: 'inventory_change' },
      { text: 'Operational cost', value: 'operational_cost' },        
      { text: 'Employee', value: 'employee' },
      { text: 'Interest', value: 'interest' },
      { text: 'Taxes', value: 'taxes' },
    ], '', 'half',),
    createM2OField('transaction_category', '', false, 4, 'half', { template: '{{name}}' }),
    createM2OField('partner', '', false, 5, 'half', { template: '{{name}}' }),
    createDateField('payment_due_date', '', true, 6, 'half'),
    createM2OField('currency', '', true, 8, 'half', { template: '{{name}}' }),
    createDecimalField('amount', '', true, 9, 'half', 14, 0),
    createDateField('payment_date', '', false, 10, 'half'),
    createDecimalField('currency_rate', '', false, 11, 'half', 14, 2),
    createM2OField('account', '', false, 12, 'full', { template: '{{account_name}}' }),
    createM2OField('location', '', true, 13, 'full', { template: '{{name}}' }),
  ];
}

export function getExpensesSchema(
  database: any,
  washingRelatedCollectionsExists: boolean,
  locationsCollectionExists: boolean,
): CollectionData {
  const fields = getDesiredFields(database);

  return {
    collection: {
      collection: EXPENSES_COLLECTION,
      fields,
      meta: {
        icon: 'output_circle',
        note: ERP_BOOTSTRAP_TAG,
        singleton: false,
        hidden: true,
        accountability: 'all',
        group: ERP_COLLECTION_GROUP_NAMES.Finance,
      },
      schema: { name: EXPENSES_COLLECTION },
    },
    fields,
    relations: [
      {
        collection: EXPENSES_COLLECTION,
        field: 'transaction_category',
        related_collection: 'transaction_categories',
      },
      {
        collection: EXPENSES_COLLECTION,
        field: 'partner',
        related_collection: 'partners',
      },
      {
        collection: EXPENSES_COLLECTION,
        field: 'currency',
        related_collection: 'currencies',
      },
      {
        collection: EXPENSES_COLLECTION,
        field: 'account',
        related_collection: 'accounts',
      },
      washingRelatedCollectionsExists
        ? addRelationToWashingRelated(
            EXPENSES_COLLECTION,
            'location',
            'washing_location',
            washingRelatedCollectionsExists,
          )
        : locationsCollectionExists
          ? {
              collection: EXPENSES_COLLECTION,
              field: 'location',
              related_collection: LOCATIONS_COLLECTION,
            }
          : undefined,
    ],
  };
}

export { EXPENSES_COLLECTION, ERP_BOOTSTRAP_TAG };
