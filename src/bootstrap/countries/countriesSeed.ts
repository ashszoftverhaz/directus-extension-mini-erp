import countriesSeed from '../../module/data/countries.json';
import { COUNTRIES_COLLECTION } from './countriesSchema';

type CountrySeedItem = {
  name: string;
  iso2: string;
  iso3?: string | null;
  numeric_code?: string | null;
  default_currency_code: string;
};

type CountriesSeedContext = {
  services: any;
  logger: any;
  database: any;
  getSchema: (options?: { database?: any }) => Promise<any>;
};

export async function seedCountriesIfEmpty(context: CountriesSeedContext): Promise<void> {
  const { services, logger, database, getSchema } = context;
  const { ItemsService } = services;

  const schema = await getSchema({ database });

  const countriesItemsService = new ItemsService(COUNTRIES_COLLECTION, {
    database,
    schema,
  });

  const currenciesItemsService = new ItemsService('currencies', {
    database,
    schema,
  });

  const seedItems = countriesSeed as CountrySeedItem[];

  if (!Array.isArray(seedItems) || seedItems.length === 0) {
    logger.warn('[ERP bootstrap] countries.json is empty; skipping seed.');
    return;
  }

  const existingCountries = await countriesItemsService.readByQuery({ limit: 1, fields: ['id'] });
  if (existingCountries?.length > 0) {
    logger.info('[ERP bootstrap] Countries already seeded; skipping.');
    return;
  }

  const existingCurrencies = await currenciesItemsService.readByQuery({
    fields: ['id', 'short_name'],
    limit: -1,
  });

  const currencyCodeToIdMap = new Map<string, string>();

  for (const existingCurrency of existingCurrencies ?? []) {
    const currencyCode = String(existingCurrency.short_name ?? '').toUpperCase();
    const currencyId = String(existingCurrency.id);

    if (!currencyCode) continue;
    if (!currencyId) continue;

    if (!currencyCodeToIdMap.has(currencyCode)) {
      currencyCodeToIdMap.set(currencyCode, currencyId);
    }
  }

  if (currencyCodeToIdMap.size === 0) {
    logger.warn(
      '[ERP bootstrap] No currencies found when seeding countries; skipping countries seed.',
    );
    return;
  }

  const validCountries: Array<{
    name: string;
    iso2: string;
    iso3: string | null;
    numeric_code: number | null;
    default_currency: string;
  }> = [];

  for (const seedItem of seedItems) {
    const currencyCode = String(seedItem.default_currency_code ?? '').toUpperCase();
    const defaultCurrencyId = currencyCodeToIdMap.get(currencyCode);

    if (!defaultCurrencyId) {
      logger.warn(
        `[ERP bootstrap] Skipping country "${seedItem.name}" because default_currency_code "${seedItem.default_currency_code}" does not match any existing currency.`,
      );
      continue;
    }

    let parsedNumericCode: number | null = null;

    if (seedItem.numeric_code != null) {
      const numericCodeAsNumber = parseInt(String(seedItem.numeric_code), 10);
      parsedNumericCode = Number.isFinite(numericCodeAsNumber) ? numericCodeAsNumber : null;
    }

    validCountries.push({
      name: seedItem.name,
      iso2: seedItem.iso2,
      iso3: seedItem.iso3 ?? null,
      numeric_code: parsedNumericCode,
      default_currency: defaultCurrencyId,
    });
  }

  if (validCountries.length === 0) {
    logger.warn(
      '[ERP bootstrap] No valid countries to seed after resolving default currencies; skipping.',
    );
    return;
  }

  logger.info(`[ERP bootstrap] Seeding ${validCountries.length} countries...`);

  const chunkSize = 200;

  for (let startIndex = 0; startIndex < validCountries.length; startIndex += chunkSize) {
    const countriesChunk = validCountries.slice(startIndex, startIndex + chunkSize);
    await countriesItemsService.createMany(countriesChunk);
  }

  logger.info('[ERP bootstrap] Countries seed finished.');
}
