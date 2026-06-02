import defaultContractTypes from '../../module/data/contractTypes.json';
import { BootstrapContext } from '../types';
import { CONTRACT_TYPES_COLLECTION } from './contractTypesSchema';

type ContractTypeSeedItem = {
  contract_type: string;
  description: string;
};

export async function seedContractTypesIfEmpty(context: Omit<BootstrapContext, 'accountability'>): Promise<void> {
  const { services, logger, database, getSchema } = context;
  const { ItemsService } = services;

  const schema = await getSchema({ database });

  const itemsService = new ItemsService(CONTRACT_TYPES_COLLECTION, {
    database,
    schema,
  });

  const seedItems = defaultContractTypes as ContractTypeSeedItem[];
  if (!Array.isArray(seedItems) || seedItems.length === 0) {
    logger.warn('[ERP bootstrap] contractTypes.json is empty; skipping seed.');
    return;
  }

  const existing = await itemsService.readByQuery({ limit: 1, fields: ['id'] });
  if (existing?.length > 0) {
    logger.info('[ERP bootstrap] Contract types already seeded; skipping.');
    return;
  }

  logger.info(`[ERP bootstrap] Seeding ${seedItems.length} contract types...`);

  const chunkSize = 200;
  for (let index = 0; index < seedItems.length; index += chunkSize) {
    const chunk = seedItems.slice(index, index + chunkSize).map((item) => ({
      contract_type: item.contract_type,
      description: item.description,
    }));

    await itemsService.createMany(chunk);
  }

  logger.info('[ERP bootstrap] Contract types seed finished.');
}
