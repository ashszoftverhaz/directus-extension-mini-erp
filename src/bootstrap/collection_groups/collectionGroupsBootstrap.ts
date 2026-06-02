import { createCollectionGroupIfNotExists } from "../helpers/collectionHelper";
import { BootstrapContext } from "../types";
import { ERP_COLLECTION_GROUPS } from "./collectionGroupsData";

export async function bootstrapCollectionGroups(context: BootstrapContext): Promise<void> {
    const { logger } = context;
    logger.info(`[ERP bootstrap] Collection Groups bootstrap started.`);

    for (const collectionGroup of ERP_COLLECTION_GROUPS) {
        await createCollectionGroupIfNotExists(context, collectionGroup);
    }

    logger.info(`[ERP bootstrap] Collection Groups bootstrap finished.`);
}