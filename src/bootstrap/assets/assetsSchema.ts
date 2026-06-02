import { CollectionData } from '../helpers/collectionHelper';
import {
  createDateField,
  createDecimalField,
  createM2OField,
  createStringField,
  createUuidPrimaryKeyField,
} from '../helpers/schemaHelpers';
import {
  addRelationToWashingRelated,
  createWashingRelatedField,
} from '../helpers/washingRelatedHelper';
import { addRelationToFranchise, createFranchiseField } from '../helpers/franchiseHelper';
import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';

const ASSETS_COLLECTION = 'assets';
const ERP_BOOTSTRAP_TAG = 'In Assets, you can store and manage your company’s larger business investments, such as vehicles, computers, equipment, or furniture.';
const LOCATIONS_COLLECTION = 'erp_locations';

export function getAssetsSchema(
  database: any,
  washingRelatedCollectionsExists: boolean,
  locationsCollectionExists: boolean,
  franchiseCollectionExists: boolean,
): CollectionData {
  const fields: any[] = [];

  fields.push(createUuidPrimaryKeyField(database, 1));

  const nameField = createStringField('name', 'Asset Name', true, 2, 'half');
  nameField.meta.note =
    'The descriptive name of the asset (e.g., "VW Transporter", "High-pressure washer").';
  fields.push(nameField);

  const codeField = createStringField('code', 'Asset Code', false, 3, 'half');
  codeField.meta.note =
    'System-generated asset code (e.g., VEH-001). This field is read-only and generated automatically.';
  codeField.meta.readonly = true;
  fields.push(codeField);

  const categoryField = createM2OField('asset_category', 'Asset Category', true, 4, 'half', {
    template: '{{asset_category_name}}',
  });
  categoryField.meta.note = 'Category of the asset (e.g., Vehicle, Tool, IT Equipment).';
  fields.push(categoryField);

  if (washingRelatedCollectionsExists) {
    const locationField = createWashingRelatedField(
      washingRelatedCollectionsExists,
      'location',
      false,
      5,
      { template: '{{name}}' },
      'half',
    );
    if (locationField) {
      locationField.meta.note = 'Location where the asset is primarily used or stored.';
      fields.push(locationField);
    }
  } else if (locationsCollectionExists) {
    const locationField = createM2OField('location', 'Location', false, 5, 'half', {
      template: '{{name}}',
    });
    locationField.meta.note = 'Location where the asset is primarily used or stored.';
    fields.push(locationField);
  }

  const franchiseField = createFranchiseField(
    franchiseCollectionExists,
    6,
    false,
    undefined,
    'half',
  );
  if (franchiseField) {
    franchiseField.meta.note =
      'Franchise this asset belongs to. Only available in PerfektAuto-specific environments.';
    fields.push(franchiseField);
  }

  if (franchiseCollectionExists) {
    const assignmentField = {
      ...createStringField('assignment', 'Assignment Type', false, 7, 'half'),
    };
    assignmentField.meta.interface = 'select-dropdown';
    assignmentField.meta.options = {
      choices: [
        { text: 'Washing Unit', value: 'washing_unit' },
        { text: 'Washing Location', value: 'washing_location' },
        { text: 'Employee', value: 'employee' },
      ],
    };
    assignmentField.schema.default_value = 'employee';
    assignmentField.meta.note =
      'How this asset is assigned (to a washing unit, washing location, or an employee).';
    fields.push(assignmentField);

    const washingUnitAssigneeField = createWashingRelatedField(
      washingRelatedCollectionsExists,
      'assignee_washing_unit',
      false,
      8,
      { template: '{{name}}' },
      'half',
      [
        {
          name: 'Hide washing unit',
          rule: { _and: [{ assignment: { _neq: 'washing_unit' } }] },
          hidden: true,
          clear_hidden_value_on_save: true,
        },
      ],
    );
    if (washingUnitAssigneeField) {
      washingUnitAssigneeField.meta.note =
        'Assigned washing unit (when assignment type is Washing Unit).';
      fields.push(washingUnitAssigneeField);
    }

    const washingLocationAssigneeField = createWashingRelatedField(
      washingRelatedCollectionsExists,
      'assignee_washing_location',
      false,
      9,
      { template: '{{name}}' },
      'half',
      [
        {
          name: 'Hide washing location',
          rule: { _and: [{ assignment: { _neq: 'washing_location' } }] },
          hidden: true,
          clear_hidden_value_on_save: true,
        },
      ],
    );
    if (washingLocationAssigneeField) {
      washingLocationAssigneeField.meta.note =
        'Assigned washing location (when assignment type is Washing Location).';
      fields.push(washingLocationAssigneeField);
    }
  }

  const employeeAssigneeField = createM2OField(
    'assignee_employee',
    'Assigned employee',
    false,
    10,
    'half',
    {
      template: '{{account.first_name}} {{account.last_name}} ({{seniority}})',
    },
    [
      {
        name: 'Hide employee',
        rule: { _and: [{ assignment: { _neq: 'employee' } }] },
        hidden: true,
        clear_hidden_value_on_save: true,
      },
    ],
  );
  employeeAssigneeField.meta.note =
    'Employee responsible for or using this asset. Always available, even without franchise setup.';
  fields.push(employeeAssigneeField);

  const purchasePartnerField = createM2OField(
    'purchase_partner',
    'Bought from partner',
    false,
    11,
    'full',
    { template: '{{name}}' },
  );
  purchasePartnerField.meta.note = 'Partner from whom the asset was purchased.';
  fields.push(purchasePartnerField);

  const purchaseCurrencyField = createM2OField('purchase_currency', 'Currency', false, 12, 'half', {
    template: '{{short_name}}',
  });
  if (!purchaseCurrencyField.meta) purchaseCurrencyField.meta = {};
  (purchaseCurrencyField.meta as any).allowCreate = false;
  purchaseCurrencyField.meta.note =
    'Currency used when purchasing the asset (shown by its short name, e.g. HUF, EUR).';
  fields.push(purchaseCurrencyField);

  const purchaseAmountField = createDecimalField(
    'purchase_amount',
    'Purchase amount',
    false,
    13,
    'half',
    14,
    2,
  );
  purchaseAmountField.meta.note = 'Total purchase price of the asset.';
  fields.push(purchaseAmountField);

  const paymentDueDateField = createDateField(
    'payment_due_date',
    'Payment due date',
    false,
    14,
    'full',
  );
  paymentDueDateField.meta.note = 'Due date of the payment for this asset (if applicable).';
  fields.push(paymentDueDateField);

  const licensePlateField = createStringField(
    'license_plate_number',
    'License plate number',
    false,
    15,
    'half',
  );
  licensePlateField.meta.note =
    'License plate number for vehicle assets (only meaningful when category is Vehicle).';
  fields.push(licensePlateField);

  const mileageField = createDecimalField('mileage_km', 'Mileage (km)', false, 16, 'half', 12, 0);
  mileageField.meta.note =
    'Current mileage of the vehicle in kilometers (only meaningful when category is Vehicle).';
  fields.push(mileageField);

  const usefulLifeField = createDecimalField(
    'useful_life_months',
    'Useful life (months)',
    false,
    17,
    'full',
    10,
    0,
  );
  usefulLifeField.meta.note =
    'Planned useful life of the asset in months (commonly used for depreciation, especially for vehicles).';
  fields.push(usefulLifeField);

  return {
    collection: {
      collection: ASSETS_COLLECTION,
      fields,
      meta: {
        icon: 'service_toolbox',
        note: ERP_BOOTSTRAP_TAG,
        singleton: false,
        hidden: true,
        accountability: 'all',
        group: ERP_COLLECTION_GROUP_NAMES.Assets,
      },
      schema: { name: ASSETS_COLLECTION },
    },
    fields,
    relations: [
      {
        collection: ASSETS_COLLECTION,
        field: 'asset_category',
        related_collection: 'asset_categories',
      },
      {
        collection: ASSETS_COLLECTION,
        field: 'purchase_partner',
        related_collection: 'partners',
      },
      {
        collection: ASSETS_COLLECTION,
        field: 'purchase_currency',
        related_collection: 'currencies',
      },
      {
        collection: ASSETS_COLLECTION,
        field: 'assignee_employee',
        related_collection: 'employees',
      },
      washingRelatedCollectionsExists
        ? addRelationToWashingRelated(
            ASSETS_COLLECTION,
            'location',
            'washing_location',
            washingRelatedCollectionsExists,
          )
        : locationsCollectionExists
          ? {
              collection: ASSETS_COLLECTION,
              field: 'location',
              related_collection: LOCATIONS_COLLECTION,
            }
          : undefined,
      addRelationToWashingRelated(
        ASSETS_COLLECTION,
        'assignee_washing_unit',
        'washing_unit',
        washingRelatedCollectionsExists,
      ),
      addRelationToWashingRelated(
        ASSETS_COLLECTION,
        'assignee_washing_location',
        'washing_location',
        washingRelatedCollectionsExists,
      ),
      addRelationToFranchise(ASSETS_COLLECTION, franchiseCollectionExists),
    ],
  };
}

export { ASSETS_COLLECTION, ERP_BOOTSTRAP_TAG };
