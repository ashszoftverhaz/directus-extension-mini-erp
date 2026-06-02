export function createUuidPrimaryKeyField(database: any, sort: number): any {
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
    },
  };
}

export function createStringField(
  field: string,
  label: string,
  isRequired: boolean,
  sort: number,
  width: 'half' | 'full' = 'full',
): any {
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

export function createIntField(
  field: string,
  label: string,
  isRequired: boolean,
  sort: number,
  width: 'half' | 'full' = 'full',
): any {
  return {
    field,
    type: 'integer',
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

export function createDecimalField(
  field: string,
  label: string,
  isRequired: boolean,
  sort: number,
  width: 'half' | 'full' = 'full',
  precision: number = 10,
  scale: number = 2,
): any {
  return {
    field,
    type: 'decimal',
    schema: {
      is_nullable: !isRequired,
      numeric_precision: precision,
      numeric_scale: scale,
    },
    meta: {
      interface: 'input',
      required: isRequired,
      note: label,
      sort,
      width,
      options: { step: '0.01' },
    },
  };
}

export function createBooleanField(
  field: string,
  label: string,
  isRequired: boolean,
  defaultValue: boolean,
  sort: number,
): any {
  return {
    field,
    type: 'boolean',
    schema: { is_nullable: !isRequired, default_value: defaultValue },
    meta: {
      interface: 'boolean',
      required: isRequired,
      note: label,
      sort,
      width: 'full',
    },
  };
}

export function createDropdownField(
  field: string,
  label: string,
  isRequired: boolean,
  sort: number,
  options: Array<{ text: string; value: string; color?: string }>,
  defaultValue?: string,
  width: 'half' | 'full' = 'full',
): any {
  return {
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      special: null,
      required: isRequired,
      options: {
        choices: options,
      },
      note: label,
      width,
    },
    schema: { default_value: defaultValue, is_nullable: !isRequired },
    field,
    sort,
  };
}

export function createAutocompleteApiField(
  field: string,
  label: string,
  isRequired: boolean,
  sort: number,
  options: string,
  defaultValue?: string,
): any {
  return {
    field,
    type: 'string',
    schema: { is_nullable: !isRequired, default_value: defaultValue },
    meta: {
      interface: 'input-autocomplete-api',
      options,
      required: isRequired,
      note: label,
      sort,
      width: 'full',
    },
  };
}

export function createDateField(
  field: string,
  note: string,
  isRequired: boolean,
  sort: number,
  width: 'half' | 'full' = 'full',
): any {
  return {
    field,
    type: 'date',
    schema: { is_nullable: !isRequired },
    meta: {
      interface: 'datetime',
      required: isRequired,
      note,
      sort: sort,
      width,
      display: 'datetime',
    },
  };
}

// system “special” field, Directus takes care of inserting the date at the time of creation
export function createDateCreatedField(field: string, sort: number, hidden: boolean, width: 'half' | 'full' = 'full'): any {
  return {
      field,
      type: 'timestamp',
      meta: {
        special: ['date-created'],
        readonly: true,
        interface: 'datetime',
        display: 'datetime',
        options: { format: 'short', use24: true },
        display_options: { format: 'short', use24: true },
        hidden: hidden,
        sort,
        width,
      },
      schema: { is_nullable: true },
    };
}

// system “special” field, Directus takes care of inserting the user who created the record
// IMPORTANT: accountability must be enabled, in collection meta --> accountability: 'all'
export function createUserCreatedField(field: string, sort: number, hidden: boolean, width: 'half' | 'full' = 'full'): any {
  return {
      field,
      type: 'uuid',
      meta: {
        special: ['user-created'],
        readonly: true,
        interface: 'select-dropdown-m2o',
        options: { template: "{{first_name}} {{last_name}}"},
        display: 'user',
        display_options: { display: "name" },
        hidden: hidden,
        sort,
        width,
      },
      schema: { is_nullable: true },
    };
}

export function createM2OField(field: string, label: string, isRequired: boolean, sort: number, width: 'half' | 'full' = 'full', options?: any, conditions?: any,): any {
    return {
        field,
        type: 'uuid',
        schema: {
            is_nullable: !isRequired,
        },
        meta: {
            interface: 'select-dropdown-m2o',
            required: isRequired,
            sort,
            options: options ?? null,
            display: 'related-values',
            display_options: options ?? null,
            conditions: conditions ?? null,
            special: 'm2o',
            width,
            note: label,
        }
    };
}

export function createFileField(
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

export function createMultilineTextField(
  field: string,
  label: string,
  isRequired: boolean,
  sort: number,
  width: 'half' | 'full' = 'full',
): any {
  return {
    field,
    type: 'text',
    schema: { is_nullable: !isRequired },
    meta: {
      interface: 'input-multiline',
      required: isRequired,
      note: label,
      sort,
      width,
    },
  };
}
