import { getPartners } from '../api/partnersApi';
import type { PartnerListItem } from '../types/partners';
import { usePaginatedList } from './usePaginatedList';

export function usePartners() {
	const { items: partners, ...rest } = usePaginatedList<PartnerListItem>(getPartners, {
		defaultSort: 'name',
		label: 'Partners',
	});
	return { partners, ...rest };
}
