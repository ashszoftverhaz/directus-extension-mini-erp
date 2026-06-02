import { getBillingInformations } from '../api/billingInformationApi';
import type { BillingInformationListItem } from '../types/billingInformations';
import { usePaginatedList } from './usePaginatedList';

export function useBillingInformations() {
	const { items: billingInformations, ...rest } = usePaginatedList<BillingInformationListItem>(
		getBillingInformations,
		{ defaultSort: 'id', label: 'BillingInformations' },
	);
	return { billingInformations, ...rest };
}
