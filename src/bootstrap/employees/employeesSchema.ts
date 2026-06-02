import { Relation } from '@directus/types';
import { CollectionData } from '../helpers/collectionHelper';
import {
  createDecimalField,
  createDropdownField,
  createIntField,
  createStringField,
  createUuidPrimaryKeyField,
} from '../helpers/schemaHelpers';
import { CURRENCIES_COLLECTION } from '../currencies/currenciesSchema';
import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';

const EMPLOYEES_COLLECTION = 'employees';
const ERP_BOOTSTRAP_TAG = 'In Employees, you can manage your company’s employee records, including salary details, salary-related taxes, and service-based commissions.';

export function getEmployeesSchema(database: any): CollectionData {
  return {
    collection: {
      collection: EMPLOYEES_COLLECTION,
      fields: getFields(database),
      meta: {
        icon: 'person_play',
        note: ERP_BOOTSTRAP_TAG,
        singleton: false,
        hidden: true,
        accountability: 'all',
        group: ERP_COLLECTION_GROUP_NAMES.Employees,
      },
      schema: { name: EMPLOYEES_COLLECTION },
    },
    fields: getFields(database),
    relations: getRelations(),
  };
}

function getFields(database: any): any {
  return [
    createUuidPrimaryKeyField(database, 1),
    getAccountField(2),
    getEmploymentStartDateField(3),
    createStringField('position', 'Position', false, 4, 'half'),
    createDropdownField(
      'seniority',
      'Seniority',
      false,
      5,
      [
        { text: 'Junior', value: 'junior' },
        { text: 'Medior', value: 'medior' },
        { text: 'Senior', value: 'senior' },
      ],
      undefined,
      'half',
    ),
    createIntField('compensation_amount', 'Net salary per month', true, 6, 'half'),
    getCurrencyField(7),
    createDropdownField(
      'compensation_type',
      'Compensation type',
      true,
      8,
      [
        { text: 'Fix', value: 'fix' },
        { text: 'Fix per wash', value: 'fix_per_wash' },
        { text: 'Percent per wash', value: 'percent_per_wash' },
      ],
      'fix',
      'half',
    ),
    createDecimalField('commission_amount', 'Commission amount', false, 9, 'half'),
    getGrossSalaryPerMonthField(10),
  ];
}

function getRelations(): Array<Partial<Relation>> {
  return [
    {
      collection: EMPLOYEES_COLLECTION,
      field: 'account',
      related_collection: 'directus_users',
      schema: null,
      meta: {
        many_collection: EMPLOYEES_COLLECTION,
        many_field: 'account',
        one_collection: 'directus_users',
        one_field: null,
        one_collection_field: null,
        one_allowed_collections: null,
        one_deselect_action: 'nullify',
        junction_field: null,
        sort_field: null,
        system: false,
      } as any,
    },
    {
      collection: EMPLOYEES_COLLECTION,
      field: 'currency',
      related_collection: CURRENCIES_COLLECTION,
      schema: null,
      meta: {
        many_collection: EMPLOYEES_COLLECTION,
        many_field: 'currency',
        one_collection: CURRENCIES_COLLECTION,
        one_field: null,
        one_collection_field: null,
        one_allowed_collections: null,
        one_deselect_action: 'nullify',
        junction_field: null,
        sort_field: null,
        system: false,
      } as any,
    },
  ];
}

function getAccountField(sort: number): any {
  return {
    field: 'account',
    type: 'uuid',
    schema: { is_nullable: false },
    meta: {
      interface: 'select-dropdown-m2o',
      special: ['m2o'],
      required: true,
      sort: sort,
      width: 'full',
      options: { template: '{{first_name}} {{last_name}}' },
      display: 'related-values',
      display_options: { template: '{{first_name}} {{last_name}}' },
    },
  };
}

function getEmploymentStartDateField(sort: number): any {
  return {
    field: 'employment_start_date',
    type: 'dateTime',
    schema: { is_nullable: true },
    meta: {
      interface: 'datetime',
      sort: sort,
      width: 'half',
      note: 'Employment start',
    },
  };
}

function getCurrencyField(sort: number): any {
  return {
    field: 'currency',
    type: 'uuid',
    schema: { is_nullable: true },
    meta: {
      interface: 'select-dropdown-m2o',
      special: ['m2o'],
      required: false,
      sort: sort,
      width: 'half',
      note: 'Currency',
      options: { template: '{{short_name}} - {{name}}' },
      display: 'related-values',
      display_options: { template: '{{short_name}} - {{name}}' },
    },
  };
}

function getGrossSalaryPerMonthField(sort: number): any {
  return {
    field: 'gross_salary_per_month',
    type: 'decimal',
    schema: {
      is_nullable: true,
      numeric_precision: 10,
      numeric_scale: 2,
    },
    meta: {
      interface: 'input',
      required: false,
      sort,
      width: 'half',
      note: 'Gross salary / month',
      readonly: true,
      options: { step: '0.01' },
    },
  };
}
