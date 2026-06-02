import { createCollection } from "../helpers/collectionHelper";
import { addLicenseExpirationNotificationIfNotExists } from "./licenseExpirationNotificationSeed";
import { getNotificationContentSchema } from "./notificationContentScheema";
import { HookContext } from "./types";

export async function bootstrapNotificationContent(context: HookContext): Promise<void> {
  const { logger } = context;

  logger.info('[ERP bootstrap] Notification Content bootstrap started.');

  await createCollection(context, getNotificationContentSchema(context.database));
  await addLicenseExpirationNotificationIfNotExists(context);

  logger.info('[ERP bootstrap] Notification Content bootstrap finished.');
}