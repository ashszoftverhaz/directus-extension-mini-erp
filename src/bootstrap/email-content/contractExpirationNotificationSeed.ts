import { EMAIL_CONTENT_COLLECTION, contractExpirationNotificationKey, contractExpirationNotifications } from './constants';
import type { HookContext } from './types';

export async function addContractExpirationNotificationIfNotExists(
  context: HookContext
): Promise<void> {
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
        key: { _eq: contractExpirationNotificationKey },
      },
    });

    if (existing.length === 0) {
      const languages = await database('languages').select('code', 'id');
      const contents = contractExpirationNotifications.map((content) => {
        return {
          key: contractExpirationNotificationKey,
          subject: content.subject,
          value: content.value,
          language: languages.find((l: any) => l.code === content.languageCode)?.id,
        };
      });

      await itemsService.createMany(contents);

      logger.info('[ERP bootstrap] Added contract expiration notification email contents.');
    } else {
      logger.info(
        '[ERP bootstrap] Contract expiration notification email content already exists; skipping seed.'
      );
    }
  } catch (error) {
    logger.error(
      '[ERP bootstrap] Error adding contract expiration notification email content:',
      error
    );
  }
}
