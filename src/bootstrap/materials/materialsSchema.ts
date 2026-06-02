import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import { CollectionData } from '../helpers/collectionHelper';
import {
  createDecimalField,
  createStringField,
  createUuidPrimaryKeyField,
} from '../helpers/schemaHelpers';

const MATERIALS_COLLECTION = 'materials';
const ERP_BOOTSTRAP_TAG = 'In Materials, you can manage the exact products that may be used to deliver your services, such as a specific brand and size of distilled water.';

function getDesiredFields(database: any) {
  const nameOfProductField = createStringField('name_of_product', 'Name of Product', true, 2);
  nameOfProductField.meta.note =
    'The name or description of the product (e.g., "Insect Spray 300ml", "Distilled Water 5L").';

  const materialCategoryField = createMaterialCategoryField(3);
  materialCategoryField.meta.note =
    'The category or type of this product (e.g., "Insect Spray", "Distilled Water"). Groups products with the same purpose together.';

  const skuField = createStringField('sku', 'SKU', false, 4);
  skuField.meta.note =
    'Stock Keeping Unit - A unique, auto-generated identifier code for inventory management.';
  skuField.meta.readonly = true;

  const packageSizeField = createDecimalField('package_size', 'Package Size', false, 5);
  packageSizeField.meta.note =
    'The size or quantity of the product package (e.g., 300, 600, 5). Used together with the unit from the material category.';

  const brandField = createStringField('brand', 'Brand', false, 6);
  brandField.meta.note = 'The manufacturer or brand name of the product.';

  return [
    createUuidPrimaryKeyField(database, 1),
    nameOfProductField,
    materialCategoryField,
    skuField,
    packageSizeField,
    brandField,
  ];
}

function createMaterialCategoryField(sort: number): any {
  return {
    field: 'material_category',
    type: 'uuid',
    schema: {
      is_nullable: true,
    },
    meta: {
      interface: 'select-dropdown-m2o',
      required: false,
      sort,
      options: { template: '{{material_category_name}}' },
      special: 'm2o',
      display: 'related-values',
      display_options: { template: '{{material_categories.material_category_name}}' },
      width: 'half',
    },
  };
}

export function getMaterialsSchema(database: any): CollectionData {
  return {
    collection: {
      collection: MATERIALS_COLLECTION,
      fields: getDesiredFields(database),
      meta: {
        icon: 'inventory_2',
        note: ERP_BOOTSTRAP_TAG,
        singleton: false,
        hidden: true,
        accountability: 'all',
        group: ERP_COLLECTION_GROUP_NAMES.InventoryManagement,
      },
      schema: { name: MATERIALS_COLLECTION },
    },
    fields: getDesiredFields(database),
    relations: [
      {
        collection: 'materials',
        field: 'material_category',
        related_collection: 'material_categories',
      },
    ],
  };
}

export { MATERIALS_COLLECTION, ERP_BOOTSTRAP_TAG };
