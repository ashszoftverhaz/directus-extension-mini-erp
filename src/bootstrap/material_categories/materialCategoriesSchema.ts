import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import { CollectionData } from '../helpers/collectionHelper';
import {
  createDecimalField,
  createDropdownField,
  createStringField,
  createUuidPrimaryKeyField,
} from '../helpers/schemaHelpers';

const MATERIAL_CATEGORIES_COLLECTION = 'material_categories';
const ERP_BOOTSTRAP_TAG = 'In Material Categories, you can define the higher-level material needs required for your services, such as “Distilled Water,” while exact products are managed under Materials.';

const UNIT_CHOICES = [
  { text: 'g', value: 'g' },
  { text: 'kg', value: 'kg' },
  { text: 'ml', value: 'ml' },
  { text: 'l', value: 'l' },
  { text: 'piece', value: 'piece' },
  { text: 'box', value: 'box' },
  { text: 'pack', value: 'pack' },
];

function getDesiredFields(database: any) {
  const categoryNameField = createStringField(
    'material_category_name',
    'Material Category Name',
    true,
    2,
  );
  categoryNameField.meta.note =
    'The name of the material category (e.g., "Insect Spray", "Distilled Water"). Groups products with the same purpose together.';

  const shortNameField = createStringField('short_name', 'Short Name', true, 3, 'half');
  shortNameField.schema = { is_nullable: false, max_length: 3 };
  shortNameField.meta.note =
    '3-letter short name or code for this category (e.g., "INS" for Insect Spray, "DIS" for Distilled Water). Used in SKU generation.';
  shortNameField.meta.options = { ...shortNameField.meta.options, placeholder: 'e.g. INS' };

  const minimumValueField = createDecimalField('minimum_value', 'Minimum Value', false, 4);
  minimumValueField.meta.note =
    'Minimum value is given in the specific unit. Whenever the inventory of a washing station drops below this number in the given material category, an alert will be triggered.';

  const unitField = createDropdownField('unit', 'Unit', true, 5, UNIT_CHOICES, undefined, 'half');
  unitField.meta.note =
    'The unit of measurement for this category (e.g., ml, l, kg, g, piece). Used for inventory tracking and minimum value calculations.';

  return [
    createUuidPrimaryKeyField(database, 1),
    categoryNameField,
    shortNameField,
    minimumValueField,
    unitField,
  ];
}

export function getMaterialCategoriesSchema(database: any): CollectionData {
  return {
    collection: {
      collection: MATERIAL_CATEGORIES_COLLECTION,
      fields: getDesiredFields(database),
      meta: {
        icon: 'category',
        note: ERP_BOOTSTRAP_TAG,
        singleton: false,
        hidden: true,
        accountability: 'all',
        group: ERP_COLLECTION_GROUP_NAMES.InventoryManagement,
      },
      schema: { name: MATERIAL_CATEGORIES_COLLECTION },
    },
    fields: getDesiredFields(database),
    relations: [],
  };
}

export { MATERIAL_CATEGORIES_COLLECTION, ERP_BOOTSTRAP_TAG };
