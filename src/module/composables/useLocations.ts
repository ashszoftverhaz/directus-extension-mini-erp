
import { getLocations } from '../api/locationsApi';
import { LocationsListItem } from '../types/locations';
import { usePaginatedList } from './usePaginatedList';

export function useLocations() {
  const { items: locations, ...rest } = usePaginatedList<LocationsListItem>(
    getLocations,
    {
      defaultSort: 'name',
      label: 'Locations',
    },
  );

  return { locations, ...rest };
}
