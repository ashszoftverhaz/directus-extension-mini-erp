import { EMAIL_CONTENT_COLLECTION, licenseExpirationNotificationKey, licenseExpirationNotifications } from "./constants";
import { HookContext } from "./types";


export async function addLicenseExpirationNotificationIfNotExists(context: HookContext): Promise<void> {
  const { services, logger, database, getSchema } = context;
  const { ItemsService } = services;

  try {
    const schema = await getSchema({ database });

    const itemsService = new ItemsService(EMAIL_CONTENT_COLLECTION, {
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
          subject: content.subject,
          value: content.value,
          language: languages.find((l: any) => l.code === content.languageCode)?.id
        }
      }); 

      await itemsService.createMany(contents);

      logger.info('[ERP bootstrap] Added license expiration notification email contents.');
    } else {
      logger.info('[ERP bootstrap] License expiration notification email content already exists; skipping seed.');
    }
  } catch (error) {
    logger.error('[ERP bootstrap] Error adding license expiration notification email content:', error);
  }
}