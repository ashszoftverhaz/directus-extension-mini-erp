import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import { CollectionData } from '../helpers/collectionHelper';
import { createStringField, createUuidPrimaryKeyField } from '../helpers/schemaHelpers';

export const CONTRACT_TYPES_COLLECTION = 'contract_types';
const ERP_BOOTSTRAP_TAG = 'In Contract Types, you can define and manage the contract categories available in the system, such as Marketing, Finance, Procurement, or Operations.';

function getDesiredFields(database: any) {
    const contractTypeField = createStringField('contract_type', '', true, 2);
    contractTypeField.schema = {
        ...contractTypeField.schema ?? {},
        is_unique: true,
    };

    return [
        createUuidPrimaryKeyField(database, 1),
        contractTypeField,
        createStringField('description', '', false, 3),
    ];
}

export function getContractTypesSchema(database: any): CollectionData {
    return {
        collection: {
            collection: CONTRACT_TYPES_COLLECTION,
            fields: getDesiredFields(database),
            meta: {
                icon: 'contract',
                note: ERP_BOOTSTRAP_TAG,
                singleton: false,
                hidden: true,
                accountability: 'all',
                group: ERP_COLLECTION_GROUP_NAMES.Contracts,
            },
            schema: { name: CONTRACT_TYPES_COLLECTION },
        },
        fields: getDesiredFields(database),
        relations: [],
    };
}