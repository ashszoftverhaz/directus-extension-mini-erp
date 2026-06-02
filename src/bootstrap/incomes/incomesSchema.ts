import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import { CollectionData } from '../helpers/collectionHelper';
import {
  createDateField,
  createDecimalField,
  createFileField,
  createM2OField,
  createDropdownField,
  createUuidPrimaryKeyField,
  createStringField,
} from '../helpers/schemaHelpers';
import {
  addRelationToWashingRelated,
  createWashingRelatedField,
} from '../helpers/washingRelatedHelper';

const INCOMES_COLLECTION = 'incomes';
const ERP_BOOTSTRAP_TAG = 'In Incomes, you can store all business income records in a controlled list where new income entries can be created, but existing records cannot be deleted.';
const LOCATIONS_COLLECTION = 'erp_locations';

export function getIncomesSchema(
  database: any,
  washingRelatedCollectionsExists: boolean,
  locationsCollectionExists: boolean,
): CollectionData {
  const fields: any[] = [];

  fields.push(createUuidPrimaryKeyField(database, 1));

  const nameField = createStringField('name', 'Income name', true, 2, 'half');
  nameField.meta.name = 'Income name';
  nameField.meta.note = 'Human-friendly name for this income entry.';
  fields.push(nameField);

  const amountField = createDecimalField('amount', 'Amount', true, 9, 'half', 14, 2);
  amountField.meta.note = 'Total income amount for this entry.';
  amountField.meta.options = {
    ...(amountField.meta.options ?? {}),
    min: 0,
  };
  fields.push(amountField);

  const typeField = createDropdownField(
    'income_type',
    'Type',
    true,
    3,
    [
      { text: 'Service', value: 'service' },
      { text: 'Asset', value: 'asset' },
      { text: 'Other', value: 'other' },
    ],
    'service',
    'half',
  );
  typeField.meta.name = 'Income type';
  typeField.meta.note = 'Type of income (service revenue, asset sale, or other).';
  fields.push(typeField);

  const paymentDueDateField = createDateField(
    'payment_due_date',
    'Payment due date',
    false,
    6,
    'half',
  );
  paymentDueDateField.meta.note = 'Due date of the payment for this income.';
  fields.push(paymentDueDateField);

  const currencyField = createM2OField('currency', 'Currency', true, 8, 'half', {
    template: '{{short_name}}',
  });
  currencyField.meta.note =
    'Currency of the income amount (shown by its short name, e.g. HUF, EUR).';
  fields.push(currencyField);

  const categoryField = createM2OField(
    'transaction_category',
    'Transaction category',
    false,
    4,
    'half',
    {
      template: '{{name}}',
    },
  );
  categoryField.meta.name = 'Transaction category';
  categoryField.meta.note =
    'Transaction category for this income (e.g. washing, parking, other services).';
  fields.push(categoryField);

  const invoiceField = createFileField('invoice', 'Invoice', false, 10, 'full');
  invoiceField.meta.note = 'Uploaded invoice file associated with this income.';
  fields.push(invoiceField);

  const fromPartnerField = createM2OField('from_partner', 'From partner', false, 5, 'half', {
    template: '{{name}}',
  });
  fromPartnerField.meta.note = 'Partner this income is associated with.';
  fields.push(fromPartnerField);

  if (washingRelatedCollectionsExists) {
    const locationField = createWashingRelatedField(
      washingRelatedCollectionsExists,
      'location',
      false,
      11,
      { template: '{{name}}' },
      'half',
    );
    if (locationField) {
      locationField.meta.note =
        'Location this income belongs to. Used for filtering incomes per location.';
      fields.push(locationField);
    }
  } else if (locationsCollectionExists) {
    const locationField = createM2OField('location', 'Location', false, 11, 'half', {
      template: '{{name}}',
    });
    locationField.meta.note =
      'Location this income belongs to. Used for filtering incomes per location.';
    fields.push(locationField);
  }

  const paymentDateField = createDateField('payment_date', 'Payment date', false, 12, 'half');
  paymentDateField.meta.name = 'Payment date';
  paymentDateField.meta.note = 'Date when the income was actually paid.';
  fields.push(paymentDateField);

  const fxRateField = createDecimalField(
    'base_currency_fx_rate',
    'Base currency FX rate',
    false,
    13,
    'half',
    18,
    6,
  );
  fxRateField.meta.name = 'Base currency FX rate';
  fxRateField.meta.note =
    'Exchange rate to the base currency at the time of payment (filled automatically later).';
  fxRateField.meta.readonly = true;
  fields.push(fxRateField);

  const accountField = createM2OField('account', '', false, 14, 'full', {
    template: '{{account_name}}'
  });
  accountField.meta.name = 'Account';
  accountField.meta.note =
    'Placeholder for the account this income was paid into. Will be converted to a relation later.';
  fields.push(accountField);

  return {
    collection: {
      collection: INCOMES_COLLECTION,
      fields,
      meta: {
        icon: 'input_circle',
        note: ERP_BOOTSTRAP_TAG,
        singleton: false,
        hidden: true,
        accountability: 'all',
        group: ERP_COLLECTION_GROUP_NAMES.Finance,
      },
      schema: { name: INCOMES_COLLECTION },
    },
    fields,
    relations: [
      {
        collection: INCOMES_COLLECTION,
        field: 'currency',
        related_collection: 'currencies',
      },
      {
        collection: INCOMES_COLLECTION,
        field: 'transaction_category',
        related_collection: 'transaction_categories',
      },
      {
        collection: INCOMES_COLLECTION,
        field: 'invoice',
        related_collection: 'directus_files',
      },
      {
        collection: INCOMES_COLLECTION,
        field: 'from_partner',
        related_collection: 'partners',
      },
      {
        collection: INCOMES_COLLECTION,
        field: 'account',
        related_collection: 'accounts',
      },
      washingRelatedCollectionsExists
        ? addRelationToWashingRelated(
            INCOMES_COLLECTION,
            'location',
            'washing_location',
            washingRelatedCollectionsExists,
          )
        : locationsCollectionExists
          ? {
              collection: INCOMES_COLLECTION,
              field: 'location',
              related_collection: LOCATIONS_COLLECTION,
            }
          : undefined,
    ],
  };
}

export { INCOMES_COLLECTION, ERP_BOOTSTRAP_TAG };
