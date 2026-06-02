import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import { CollectionData } from '../helpers/collectionHelper';
import { createStringField, createUuidPrimaryKeyField } from '../helpers/schemaHelpers';

export const TRANSACTION_CATEGORIES_COLLECTION = 'transaction_categories';
const ERP_BOOTSTRAP_TAG = 'In Transaction Categories, you can categorize transactions to make financial filtering and reporting easier, such as viewing all HR-related expenses.';

function getDesiredFields(database: any) {
    return [
        createUuidPrimaryKeyField(database, 1),
        createStringField('name', '', true, 2),
        createStringField('description', '', false, 3),
    ];
}

export function getTransactionCategoriesSchema(database: any): CollectionData {
    return {
        collection: {
            collection: TRANSACTION_CATEGORIES_COLLECTION,
            fields: getDesiredFields(database),
            meta: {
                icon: 'contract',
                note: ERP_BOOTSTRAP_TAG,
                singleton: false,
                hidden: true,
                accountability: 'all',
                group: ERP_COLLECTION_GROUP_NAMES.Finance,
            },
            schema: { name: TRANSACTION_CATEGORIES_COLLECTION },
        },
        fields: getDesiredFields(database),
        relations: [],
    };
}