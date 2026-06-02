import { NOTIFICATION_CONTENT_COLLECTION, licenseExpirationNotificationKey, licenseExpirationNotifications } from "./constants";
import { HookContext } from "./types";


export async function addLicenseExpirationNotificationIfNotExists(context: HookContext): Promise<void> {
  const { services, logger, database, getSchema } = context;
  const { ItemsService } = services;

  try {
    const schema = await getSchema({ database });

    const itemsService = new ItemsService(NOTIFICATION_CONTENT_COLLECTION, {
      database,
      schema,
    });
    
    const existing = await itemsService.readByQuery({
      filter: {
        key: { _eq: licenseExpirationNotificationKey },
      },
    });

    if (existing.length === 0) {
      const languages = await database("languages").select("code", "id");
      const contents = licenseExpirationNotifications.map((content) => {
        return {
          key: licenseExpirationNotificationKey,
          title: content.title,
          body: content.body,
          language: languages.find((l: any) => l.code === content.languageCode)?.id
        }
      }); 

      await itemsService.createMany(contents);

      logger.info('[ERP bootstrap] Added license expiration notification notification contents.');
    } else {
      logger.info('[ERP bootstrap] License expiration notification notification content already exists; skipping seed.');
    }
  } catch (error) {
    logger.error('[ERP bootstrap] Error adding license expiration notification notification content:', error);
  }
}