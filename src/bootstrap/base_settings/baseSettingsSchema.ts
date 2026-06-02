import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import { CollectionData } from '../helpers/collectionHelper';
import {
  createMultilineTextField,
  createStringField,
  createUuidPrimaryKeyField,
} from '../helpers/schemaHelpers';

const BASE_SETTINGS_COLLECTION = 'erp_settings';
const BASE_SETTINGS_GROUP = 'ERP_settings';
const ERP_BOOTSTRAP_TAG = 'ERP_BOOTSTRAP:base_settings';

function getDesiredFields(database: any) {
  const settingsNameField = createStringField('settings_name', 'Settings name', true, 2);
  settingsNameField.meta.note =
    'Human readable name of the setting (e.g. Base currency, Frequent currencies).';

  const internalKeyField = createStringField('key', 'Internal key', true, 3, 'half');
  internalKeyField.meta.hidden = true;
  internalKeyField.meta.readonly = true;
  internalKeyField.meta.note =
    'Technical key of the setting (e.g. base_currency, frequent_currencies).';

  const valueField = createStringField('value', 'Value', false, 4);
  valueField.meta.note =
    'Stored value for this setting. For currencies and countries use stable codes (e.g. HUF, EUR, HU). For multiple values (e.g. frequent currencies) store a comma-separated list.';

  const notesField = createMultilineTextField('notes', 'Notes', false, 10);
  notesField.meta.note = 'Optional notes for this setting. Editable only by global administrators.';

  return [
    createUuidPrimaryKeyField(database, 1),
    settingsNameField,
    internalKeyField,
    valueField,
    notesField,
  ];
}

export function getBaseSettingsSchema(database: any): CollectionData {
  const fields = getDesiredFields(database);

  return {
    collection: {
      collection: BASE_SETTINGS_COLLECTION,
      fields,
      meta: {
        icon: 'settings',
        note: ERP_BOOTSTRAP_TAG,
        singleton: false,
        hidden: true,
        accountability: 'all',
        group: ERP_COLLECTION_GROUP_NAMES.Settings,
      },
      schema: { name: BASE_SETTINGS_COLLECTION },
    },
    fields,
    relations: [],
  };
}

export { BASE_SETTINGS_COLLECTION, BASE_SETTINGS_GROUP, ERP_BOOTSTRAP_TAG };
