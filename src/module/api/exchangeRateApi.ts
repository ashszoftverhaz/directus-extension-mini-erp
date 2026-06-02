import { getCurrencyCode } from './currenciesApi';
import { getBaseCurrency } from './settingsApi';
import type { useApi } from '@directus/extensions-sdk';

type ApiClient = ReturnType<typeof useApi>;

export async function getExchangeRate(
  api: ApiClient,
  date: Date,
  toCurrencyId: string,
): Promise<number> {
  try {
    const fromCurrency = await getBaseCurrency(api);
    const toCurrency = await getCurrencyCode(api, toCurrencyId);

    if (fromCurrency === toCurrency) {
      return 1;
    }

    const response = await fetch(
      `https://api.frankfurter.dev/v1/${date.toISOString().split('T')[0]}?base=${fromCurrency}&symbols=${toCurrency}`,
    );
    const data = await response.json();
    return data.rates[toCurrency];
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    throw new Error('Could not fetch exchange rate');
  }
}
