import currenciesSeed from '../../module/data/currencies.json';
import { CURRENCIES_COLLECTION } from './currenciesSchema';

type CurrencySeedItem = {
  short_name: string;
  name: string;
  symbol?: string | null;
  numeric_code?: number | null;
  minor_units?: number | null;
};

type CurrenciesSeedContext = {
  services: any;
  logger: any;
  database: any;
  getSchema: (options?: { database?: any }) => Promise<any>;
};

export async function seedCurrenciesIfEmpty(context: CurrenciesSeedContext): Promise<void> {
  const { services, logger, database, getSchema } = context;
  const { ItemsService } = services;

  const schema = await getSchema({ database });

  const itemsService = new ItemsService(CURRENCIES_COLLECTION, {
    database,
    schema,
  });

  const seedItems = currenciesSeed as CurrencySeedItem[];
  if (!Array.isArray(seedItems) || seedItems.length === 0) {
    logger.warn('[ERP bootstrap] currencies.json is empty; skipping seed.');
    return;
  }

  const existing = await itemsService.readByQuery({ limit: 1, fields: ['id'] });
  if (existing?.length > 0) {
    logger.info('[ERP bootstrap] Currencies already seeded; skipping.');
    return;
  }

  logger.info(`[ERP bootstrap] Seeding ${seedItems.length} currencies...`);

  const chunkSize = 200;
  for (let index = 0; index < seedItems.length; index += chunkSize) {
    const chunk = seedItems.slice(index, index + chunkSize).map((item) => ({
      short_name: item.short_name,
      name: item.name,
      symbol: item.symbol ?? null,
      numeric_code: item.numeric_code ?? null,
      minor_units: item.minor_units ?? null,
      is_active: true,
    }));

    await itemsService.createMany(chunk);
  }

  logger.info('[ERP bootstrap] Currency seed finished.');
}
