import { BASE_SETTINGS_COLLECTION } from './baseSettingsSchema';

type BaseSettingsSeedContext = {
  services: any;
  logger: any;
  database: any;
  getSchema: (options?: { database?: any }) => Promise<any>;
};

export async function seedBaseSettingsIfEmpty(context: BaseSettingsSeedContext): Promise<void> {
  const { services, logger, database, getSchema } = context;
  const { ItemsService } = services;

  const schema = await getSchema({ database });

  const itemsService = new ItemsService(BASE_SETTINGS_COLLECTION, {
    database,
    schema,
  });

  const existing = await itemsService.readByQuery({ limit: 1, fields: ['id'] });
  if (existing?.length > 0) {
    logger.info('[ERP bootstrap] Base settings already seeded; skipping.');
    return;
  }

  logger.info('[ERP bootstrap] Seeding base settings...');

  await itemsService.createMany([
    {
      key: 'base_currency',
      settings_name: 'Base currency',
      value: null,
      notes: 'Used to set the base currency of the company for financial statements.',
    },
    {
      key: 'base_location',
      settings_name: 'Base location',
      value: null,
      notes: 'You can choose the default location for the ERP.',
    },
    {
      key: 'base_country',
      settings_name: 'Base country',
      value: null,
      notes: 'Select the country your business is in.',
    },
  ]);

  logger.info('[ERP bootstrap] Base settings seed finished.');
}
