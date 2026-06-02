import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import { CollectionData } from '../helpers/collectionHelper';
import { createDropdownField, createStringField, createUuidPrimaryKeyField } from '../helpers/schemaHelpers';
import { ERP_BOOTSTRAP_TAG, LANGUAGE_COLLECTION } from './constatns';

function getDesiredFields(database: any) {
    return [
        createUuidPrimaryKeyField(database, 1),
        createStringField('code', '', true, 2),
        createStringField('name', '', true, 3),
        createDropdownField(
            'direction',
            '',
            false,
            4,
            [
                { text: 'ltr', value: 'ltr' },
                { text: 'rtl', value: 'rtl' },
            ],
            undefined,
        ),
    ];
}

export function getLanguagesSchema(database: any): CollectionData {
    return {
        collection: {
            collection: LANGUAGE_COLLECTION,
            fields: getDesiredFields(database),
            meta: {
                icon: 'language',
                note: ERP_BOOTSTRAP_TAG,
                singleton: false,
                hidden: false,
                accountability: 'all',
                group: ERP_COLLECTION_GROUP_NAMES.Settings,
            },
            schema: { name: LANGUAGE_COLLECTION },
        },
        fields: getDesiredFields(database),
        relations: [],
    };
}
