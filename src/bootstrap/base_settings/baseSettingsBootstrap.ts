import { createCollection } from '../helpers/collectionHelper';
import type { BootstrapContext } from '../types';
import { getBaseSettingsSchema } from './baseSettingsSchema';
import { seedBaseSettingsIfEmpty } from './baseSettingsSeed';

type BaseSettingsContext = Pick<
  BootstrapContext,
  'services' | 'logger' | 'database' | 'getSchema' | 'accountability'
>;

export async function bootstrapBaseSettings(context: BaseSettingsContext): Promise<void> {
  const { logger } = context;

  logger.info('[ERP bootstrap] Base Settings bootstrap started.');

  await createCollection(context, getBaseSettingsSchema(context.database));
  await seedBaseSettingsIfEmpty(context);

  logger.info('[ERP bootstrap] Base Settings bootstrap finished.');
}
