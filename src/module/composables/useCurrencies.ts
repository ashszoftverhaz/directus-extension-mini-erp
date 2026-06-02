import { getCurrencies } from '../api/currenciesApi';
import type { CurrencyListItem } from '../types/currencies';
import { usePaginatedList } from './usePaginatedList';

export function useCurrencies() {
	const { items: currencies, ...rest } = usePaginatedList<CurrencyListItem>(getCurrencies, {
		defaultSort: 'name',
		label: 'Currencies',
	});
	return { currencies, ...rest };
}
