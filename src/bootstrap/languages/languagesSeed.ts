import { LANGUAGE_COLLECTION, languagesSeedData } from "./constatns";
import { HookContext } from "./types";


export async function seedLanguagesIfEmpty(context: HookContext): Promise<void> {
    const { services, logger, database, getSchema } = context;
    const { ItemsService } = services;

    try {
        const schema = await getSchema({ database });

        const itemsService = new ItemsService(LANGUAGE_COLLECTION, {
            database,
            schema,
        });

        const existing = await itemsService.readByQuery({ limit: 1, fields: ['id'] });
        if (existing?.length > 0) {
            logger.info('[ERP bootstrap] Languages already seeded; skipping.');
            return;
        }

        if (existing.length === 0) {            
            await itemsService.createMany(languagesSeedData);

            logger.info('[ERP bootstrap] Added languages.');
        } else {
            logger.info('[ERP bootstrap] Languages already exist; skipping seed.');
        }

    } catch (error) {
        logger.error('[ERP bootstrap] Error adding languages:', error);
    }
}