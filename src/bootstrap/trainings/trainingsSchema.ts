import { ERP_COLLECTION_GROUP_NAMES } from "../collection_groups/collectionGroupsData";
import { CollectionData } from "../helpers/collectionHelper";
import { createStringField, createUuidPrimaryKeyField } from "../helpers/schemaHelpers";

const TRAININGS_COLLECTION = 'trainings';
const ERP_BOOTSTRAP_TAG = 'In Trainings, you can define the trainings your employees can or must complete, and assign them to employees when a service requires specific training.';

function getDesiredFields(database: any) {
    return [
        createUuidPrimaryKeyField(database, 1),
        createStringField('name', '', true, 2),
        createStringField('description', '', false, 3),
    ];
}

export function getTrainingsSchema(database: any): CollectionData {
    return {
        collection: {
            collection: TRAININGS_COLLECTION,
            fields: getDesiredFields(database),
            meta: {
                icon: 'school',
                note: ERP_BOOTSTRAP_TAG,
                singleton: false,
                hidden: true,
                accountability: 'all',
                group: ERP_COLLECTION_GROUP_NAMES.Employees,
            },
            schema: { name: TRAININGS_COLLECTION },
        },
        fields: getDesiredFields(database),
        relations: [],
    };
}