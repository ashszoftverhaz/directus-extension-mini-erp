import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import { CollectionData } from '../helpers/collectionHelper';
import { createStringField, createUuidPrimaryKeyField } from '../helpers/schemaHelpers';
import { NOTIFICATION_CONTENT_COLLECTION, ERP_BOOTSTRAP_TAG } from './constants';

function getDesiredFields(database: any) {
  return [
    createUuidPrimaryKeyField(database, 1),
    createStringField('key', '', false, 2),
    createStringField('title', '', false, 3),
    createStringField('body', '', false, 4),
    {
      field: 'language',
      type: 'uuid',
      meta: {
        interface: 'select-dropdown-m2o',
        required: false,
        sort: 5,
        width: 'full',
      },
      schema: { is_nullable: true, max_length: 36 },
    },
  ];
}

export function getNotificationContentSchema(database: any): CollectionData {
  return {
    collection: {
      collection: NOTIFICATION_CONTENT_COLLECTION,
      fields: getDesiredFields(database),
      meta: {
        icon: 'edit_notifications',
        note: ERP_BOOTSTRAP_TAG,
        singleton: false,
        hidden: false,
        accountability: 'all',
        group: ERP_COLLECTION_GROUP_NAMES.Settings,
      },
      schema: { name: NOTIFICATION_CONTENT_COLLECTION },
    },
    fields: getDesiredFields(database),
    relations: [
      {
        collection: NOTIFICATION_CONTENT_COLLECTION,
        field: 'language',
        related_collection: 'languages',
      },
    ],
  };
}