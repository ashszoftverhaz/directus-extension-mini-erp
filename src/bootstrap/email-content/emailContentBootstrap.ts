import { createCollection } from '../helpers/collectionHelper';
import { getEmailContentSchema } from './emailContentScheema';
import { addLicenseExpirationNotificationIfNotExists } from './licenseExpirationNotificationSeed';
import { addContractExpirationNotificationIfNotExists } from './contractExpirationNotificationSeed';
import type { HookContext } from './types';

export async function bootstrapEmailContent(context: HookContext): Promise<void> {
  const { logger } = context;

  logger.info('[ERP bootstrap] Email Content bootstrap started.');

  await createCollection(context, getEmailContentSchema(context.database));
  await addLicenseExpirationNotificationIfNotExists(context);
  await addContractExpirationNotificationIfNotExists(context);

  logger.info('[ERP bootstrap] Email Content bootstrap finished.');
}