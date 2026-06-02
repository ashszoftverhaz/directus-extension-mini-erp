import { getTrainings } from '../api/trainingsApi';
import { TrainingListItem } from '../types/trainings';
import { usePaginatedList } from './usePaginatedList';

export function useTrainings() {
	const { items: trainings, ...rest } = usePaginatedList<TrainingListItem>(
		getTrainings,
		{ defaultSort: 'name', label: 'Trainings' },
	);
	return { trainings, ...rest };
}
