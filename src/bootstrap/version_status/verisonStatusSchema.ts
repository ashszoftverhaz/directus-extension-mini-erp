import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import { CollectionData } from '../helpers/collectionHelper';
import {
  createBigIntegerField,
  createStringField,
  createUuidPrimaryKeyField,
} from '../helpers/schemaHelpers';

const VERSION_STATUS_COLLECTION = 'erp_version_status';
const ERP_BOOTSTRAP_TAG = 'It stores the last checked time and the latest available version of the ERP bundle to determine if an update is needed.';

function getDesiredFields(database: any) {
  return [
    createUuidPrimaryKeyField(database, 1),
    createBigIntegerField('last_version_check_time', '', false, 2),
    createStringField('latest_version', '', false, 3),
  ];
}

export function getVersionStatusSchema(database: any): CollectionData {
  const fields = getDesiredFields(database);

  return {
    collection: {
      collection: VERSION_STATUS_COLLECTION,
      fields,
      meta: {
        icon: 'update',
        note: ERP_BOOTSTRAP_TAG,
        singleton: true,
        hidden: true,
        accountability: 'all',
        group: ERP_COLLECTION_GROUP_NAMES.Settings,
      },
      schema: { name: VERSION_STATUS_COLLECTION },
    },
    fields,
    relations: [],
  };
}

export { VERSION_STATUS_COLLECTION, ERP_BOOTSTRAP_TAG };
