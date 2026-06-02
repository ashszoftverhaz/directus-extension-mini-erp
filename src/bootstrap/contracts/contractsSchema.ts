import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import { CollectionData } from '../helpers/collectionHelper';
import { addRelationToFranchise, createFranchiseField } from '../helpers/franchiseHelper';
import { createDateField, createDropdownField, createFileField, createMultilineTextField, createUuidPrimaryKeyField } from '../helpers/schemaHelpers';

const CONTRACTS_COLLECTION = 'contracts';
const ERP_BOOTSTRAP_TAG = 'In the Contracts menu, you can create and manage all official business documents, including purchase orders, invoices, framework agreements, and other contracts.';

function getDesiredFields(database: any, franchiseCollectionExists: boolean): any[] {
    return [
        createUuidPrimaryKeyField(database, 1),
        createContractStatusField('status', '', false, 2, 'full', undefined, 'draft', true),
        createDateField('signed_at', '', true, 3, 'half'),
        createDateField('expiry_date', '', true, 4, 'half'),
        createContractTypeField(5),
        createEmailNotificationField(6),
        createFileField('upload_contract', 'Upload the whole contract together with the annexes, attachments.', true, 7, 'full'),
        createOtherPartyTypeField(8),
        createEmployeeField(9),
        createPartnerField(10),
        createJunctionField(11),
        createMultilineTextField('notes', 'Description', false, 12, 'full'),
        createContractIdField(13),
        createFranchiseField(franchiseCollectionExists, 14, false, { "template": "{{name}}" }),
    ];
}

export function getContractsSchema(database: any, franchiseCollectionExists: boolean): CollectionData {
    return {
        collection: {
            collection: CONTRACTS_COLLECTION,
            fields: getDesiredFields(database, franchiseCollectionExists),
            meta: {
                icon: 'contract',
                note: ERP_BOOTSTRAP_TAG,
                singleton: false,
                hidden: true,
                accountability: 'all',
                group: ERP_COLLECTION_GROUP_NAMES.Contracts,
            },
            schema: { name: CONTRACTS_COLLECTION },
        },
        fields: getDesiredFields(database, franchiseCollectionExists),
        relations: [
            {
                collection: 'contracts',
                field: 'contract_type',
                related_collection: 'contract_types',
            },
            {
                collection: 'contracts',
                field: 'upload_contract',
                related_collection: 'directus_files',
            },
                        {
                collection: 'contracts',
                field: 'employee',
                related_collection: 'employees',
            },
            {
                collection: 'contracts',
                field: 'partner',
                related_collection: 'partners',
            },
            addRelationToFranchise('contracts', franchiseCollectionExists),
        ],
    };
}

function createJunctionField(sort: number): any {
    return {
      field: 'related_contracts',
      type: 'alias',
      meta: {
        interface: 'list-m2m',
        special: ['m2m'],
        options: {"template":"{{related_contracts_id.contract_id}}  / {{related_contracts_id.status}}  /  {{related_contracts_id.contract_type.contract_type}}"},
        sort
      },    
    }
}

function createContractIdField(sort: number): any {
    return {
        field: 'contract_id',
        type: 'string',
        schema: {
            readonly: true,
            is_nullable: true,
            is_generated: true,
        },
        meta: {
            interface: 'input',
            required: false,
            sort,
            width: 'full',
            readonly: true,
            special: 'generated',
            note: 'Contract ID (generated)',
        },
    };
}

function createEmailNotificationField(sort: number): any {
    return {
        field: 'email_notification',
        type: 'json',
        schema: {
            is_nullable: true,
        },
        meta: {
            interface: 'tags',
            required: false,
            sort,
            options: { "placeholder": "I want an email X days in advance" },
            special: 'cast-json',
            width: 'half',
        }
    }
};

function createContractTypeField(sort: number): any {
    return {
        field: 'contract_type',
        type: 'uuid',
        schema: {
            is_nullable: false,
        },
        meta: {
            interface: 'select-dropdown-m2o',
            required: true,
            sort,
            options: { "template": "{{contract_type}}" },
            special: 'm2o',
            display: 'related-values',
            display_options: { "template": "{{contract_types.contract_type}}" },
            width: 'half',
        }
    };
}

function createOtherPartyTypeField(sort: number): any {
    return {
        field: 'other_party_type',
        type: 'string',
        meta: {
            interface: 'select-dropdown',
            special: null,
            options: {
                choices: [
                    { text: 'Partner', value: 'partner' },
                    { text: 'Employee', value: 'employee' },
                ],
                placeholder: 'Partner or Employee?',
            },
            note: '',
            required: true,
            sort,
            width: 'half',
        },
        schema: { is_nullable: true },
    };
}

function createEmployeeField(sort: number): any {
    return {
        field: 'employee',
        type: 'uuid',
        schema: {
            is_nullable: true,
        },
        meta: {
            interface: 'select-dropdown-m2o',
            required: false,
            sort,
            options: {"template":"{{account.first_name}} {{account.last_name}}"},
            conditions: [{"name":"Employee hidden when partner selected","rule":{"_and":[{"_or":[{"other_party_type":{"_nin":["partner","employee"]}},{"other_party_type":{"_eq":"partner"}}]}]},"hidden":true,"clear_hidden_value_on_save":true}],
            special: 'm2o',
            width: 'half',
        }
    };
}

function createPartnerField(sort: number): any {
    return {
        field: 'partner',
        type: 'uuid',
        schema: {
            is_nullable: true,
        },
        meta: {
            interface: 'select-dropdown-m2o',
            required: false,
            sort,
            options: {"template":"{{name}}"},
            conditions: [{"name":"Partner hidden when employee selected","rule":{"_and":[{"_or":[{"other_party_type":{"_eq":"employee"}},{"other_party_type":{"_nin":["partner","employee"]}}]}]},"hidden":true,"clear_hidden_value_on_save":true}],
            special: 'm2o',
            width: 'half',
        }
    };
}

type DropdownChoice = { text: string; value: string; color?: string };

const CONTRACT_STATUS_CHOICES: DropdownChoice[] = [
    { text: 'Draft', value: 'draft', color: '#7a7a7a' },
    { text: 'Active', value: 'active', color: '#2e7d32' },
    { text: 'Expired', value: 'expired', color: '#c62828' },
];

function createContractStatusField(
    field: string = 'status',
    note: string = '',
    required: boolean = false,
    sort: number,
    width: 'half' | 'full' = 'full',
    choices: DropdownChoice[] = CONTRACT_STATUS_CHOICES,
    defaultValue: string = 'draft',
    readonly: boolean = true,
): any {
    const base: any = createDropdownField(
        field,
        note,
        required,
        sort,
        choices,
        defaultValue,
        width,
    );

    // UI-level read-only, API enforcement is handled in the hook
    if (readonly) {
        base.meta = {
            ...(base.meta ?? {}),
            readonly: true,
        };
    }

    return base;
}