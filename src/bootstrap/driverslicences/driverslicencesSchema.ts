import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import { CollectionData } from '../helpers/collectionHelper';
import { createM2OField } from '../helpers/schemaHelpers';

export const DRIVERSLICENCES_COLLECTION = 'driverslicences';
const ERP_BOOTSTRAP_TAG = 'In Driving Licenses, you can store and manage employee driving license information for services that require employees to drive.';

function getDesiredFields(database: any) {
  return [
    createUuidPrimaryKeyField(database, 1),
    createStringField('category', 'Category', true, 2, 'half'),
    createDateField('validity', 'Validity', false, 3, 'half'),
    createM2OField('issuer_country', 'Issuer Country', false, 4, 'half', {
      template: '{{name}}'
    }),
    createBooleanField('isinternational', 'Is International', false, false, 5, 'half'),
    createFileField('front_of_licence_image', 'Front of Licence Image', false, 6, 'half'),
    createFileField('back_of_licence_image', 'Back of Licence Image', false, 7, 'half'),
    createDividerField('driverslicences_divider', 'Additional Details', 8),
    createUserRelationField('employee', 'Employee', false, 9),
  ];
}

export function getDrivingLicencesSchema(database: any): CollectionData {
  const fields = getDesiredFields(database);

  return {
    collection: {
      collection: DRIVERSLICENCES_COLLECTION,
      fields,
      meta: {
        icon: 'card_membership',
        note: ERP_BOOTSTRAP_TAG,
        singleton: false,
        hidden: true,
        accountability: 'all',
        group: ERP_COLLECTION_GROUP_NAMES.Employees,
      },
      schema: { name: DRIVERSLICENCES_COLLECTION },
    },
    fields,
    relations: [
      {
        collection: DRIVERSLICENCES_COLLECTION,
        field: 'front_of_licence_image',
        related_collection: 'directus_files',
      },
      {
        collection: DRIVERSLICENCES_COLLECTION,
        field: 'back_of_licence_image',
        related_collection: 'directus_files',
      },
      {
        collection: DRIVERSLICENCES_COLLECTION,
        field: 'employee',
        related_collection: 'directus_users',
      },
      {
        collection: DRIVERSLICENCES_COLLECTION,
        field: 'issuer_country',
        related_collection: 'countries',
      },
    ],
  };
}

function createUuidPrimaryKeyField(database: any, sort: number) {
  return {
    field: 'id',
    type: 'uuid',
    schema: {
      is_primary_key: true,
      is_nullable: false,
      default_value:
        database?.client?.config?.client === 'pg' ? database.raw('gen_random_uuid()') : undefined,
    },
    meta: {
      hidden: true,
      readonly: true,
      interface: 'input',
      sort,
      width: 'full',
      special: ['uuid'],
      system: true,
    },
  };
}

function createStringField(
  field: string,
  label: string,
  isRequired: boolean,
  sort: number,
  width: 'full' | 'half' = 'full',
) {
  return {
    field,
    type: 'string',
    schema: { is_nullable: !isRequired },
    meta: {
      interface: 'input',
      required: isRequired,
      note: label,
      sort,
      width,
    },
  };
}

function createDateField(
  field: string,
  label: string,
  isRequired: boolean,
  sort: number,
  width: 'full' | 'half' = 'full',
) {
  return {
    field,
    type: 'date',
    schema: { is_nullable: !isRequired },
    meta: {
      interface: 'datetime',
      required: isRequired,
      note: label,
      sort,
      width,
      display: 'datetime',
    },
  };
}

function createBooleanField(
  field: string,
  label: string,
  isRequired: boolean,
  defaultValue: boolean,
  sort: number,
  width: 'full' | 'half' = 'full',
) {
  return {
    field,
    type: 'boolean',
    schema: { is_nullable: !isRequired, default_value: defaultValue },
    meta: {
      interface: 'boolean',
      required: isRequired,
      note: label,
      sort,
      width,
    },
  };
}

function createFileField(
  field: string,
  label: string,
  isRequired: boolean,
  sort: number,
  width: 'full' | 'half' = 'full',
) {
  return {
    field,
    type: 'uuid',
    schema: { is_nullable: !isRequired },
    meta: {
      interface: 'file',
      special: ['file'],
      required: isRequired,
      note: label,
      sort,
      width,
    },
  };
}

function createUserRelationField(
  field: string,
  label: string,
  isRequired: boolean,
  sort: number,
  width: 'full' | 'half' = 'full',
) {
  return {
    field,
    type: 'uuid',
    schema: { is_nullable: !isRequired },
    meta: {
      interface: 'select-dropdown-m2o',
      required: isRequired,
      note: label,
      sort,
      width,
      special: 'm2o',
      display: 'user',
      options: {
        template: '{{first_name}} {{last_name}}',
        enableLink: true,
      },
    },
  };
}

function createDividerField(field: string, label: string, sort: number) {
  return {
    field,
    type: 'alias',
    schema: null,
    meta: {
      interface: 'presentation-divider',
      options: {
        title: label,
      },
      sort,
      width: 'full',
    },
  };
}
