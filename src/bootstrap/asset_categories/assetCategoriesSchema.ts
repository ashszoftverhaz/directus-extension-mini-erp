import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import { CollectionData } from '../helpers/collectionHelper';
import {
  createDropdownField,
  createStringField,
  createUuidPrimaryKeyField,
} from '../helpers/schemaHelpers';

const ASSET_CATEGORIES_COLLECTION = 'asset_categories';
const ERP_BOOTSTRAP_TAG = 'In Asset Categories, you can organize your company’s assets into clear groups for easier tracking and reporting.';

const CATEGORY_TYPE_CHOICES = [
  { text: 'Vehicle', value: 'vehicle' },
  { text: 'Tool', value: 'tool' },
  { text: 'IT equipment', value: 'it_equipment' },
  { text: 'Other', value: 'other' },
];

function getDesiredFields(database: any) {
  const categoryNameField = createStringField(
    'asset_category_name',
    'Asset Category Name',
    true,
    2,
  );
  categoryNameField.meta.note =
    'The name of the asset category (e.g., "Vehicle", "Tool"). Groups assets with the same purpose together.';

  const shortNameField = createStringField('short_name', 'Short Name', true, 3, 'half');
  shortNameField.schema = { is_nullable: false, max_length: 8 };
  shortNameField.meta.note =
    'Short code or prefix for this category (e.g., "VEH" for Vehicles). Used in asset code generation.';
  shortNameField.meta.options = {
    ...(shortNameField.meta.options ?? {}),
    placeholder: 'e.g. VEH',
  };

  const categoryTypeField = createDropdownField(
    'category_type',
    'Category Type',
    true,
    4,
    CATEGORY_TYPE_CHOICES,
    'other',
    'half',
  );
  categoryTypeField.meta.note =
    'Determines how this category behaves in the system (e.g., "vehicle" enables vehicle-specific fields on assets).';

  const notesField = createStringField('notes', 'Notes', false, 5, 'full');
  notesField.meta.note = 'Additional notes or description for this asset category.';

  return [
    createUuidPrimaryKeyField(database, 1),
    categoryNameField,
    shortNameField,
    categoryTypeField,
    notesField,
  ];
}

export function getAssetCategoriesSchema(database: any): CollectionData {
  const fields = getDesiredFields(database);

  return {
    collection: {
      collection: ASSET_CATEGORIES_COLLECTION,
      fields,
      meta: {
        icon: 'list_alt',
        note: ERP_BOOTSTRAP_TAG,
        singleton: false,
        hidden: true,
        accountability: 'all',
        group: ERP_COLLECTION_GROUP_NAMES.Assets,
      },
      schema: { name: ASSET_CATEGORIES_COLLECTION },
    },
    fields,
    relations: [],
  };
}

export { ASSET_CATEGORIES_COLLECTION, ERP_BOOTSTRAP_TAG };
