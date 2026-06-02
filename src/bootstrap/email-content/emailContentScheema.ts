import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import { CollectionData } from '../helpers/collectionHelper';
import { createStringField, createUuidPrimaryKeyField } from '../helpers/schemaHelpers';
import { EMAIL_CONTENT_COLLECTION, ERP_BOOTSTRAP_TAG } from './constants';

function getDesiredFields(database: any) {
  return [
    createUuidPrimaryKeyField(database, 1),
    createStringField('key', '', false, 2),
    createStringField('subject', '', false, 3),
    {
      field: 'value',
      type: 'text',
      meta: {
        interface: 'input-rich-text-html',
        required: false,
        sort: 4,
        width: 'full',
        options: {"toolbar":["bold","italic","underline","h1","h2","h3","alignleft","aligncenter","alignright","alignjustify","numlist","bullist","forecolor","backcolor","removeformat","blockquote","customLink","customImage","customMedia","hr","code","fullscreen"]}
      },
      schema: { is_nullable: true },
    },
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

export function getEmailContentSchema(database: any): CollectionData {
  return {
    collection: {
      collection: EMAIL_CONTENT_COLLECTION,
      fields: getDesiredFields(database),
      meta: {
        icon: 'attach_email',
        note: ERP_BOOTSTRAP_TAG,
        singleton: false,
        hidden: false,
        accountability: 'all',
        group: ERP_COLLECTION_GROUP_NAMES.Settings,
      },
      schema: { name: EMAIL_CONTENT_COLLECTION },
    },
    fields: getDesiredFields(database),
    relations: [
      {
        collection: EMAIL_CONTENT_COLLECTION,
        field: 'language',
        related_collection: 'languages',
      },
    ],
  };
}