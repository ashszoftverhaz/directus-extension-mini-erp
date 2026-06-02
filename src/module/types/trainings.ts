export type TrainingsDto = {
  id: string;
  name: string;
  description: string | null;
};

export type TrainingListItem = Pick<
  TrainingsDto,
  'id' | 'name' | 'description'
>;

import type { ListFetchOptions, ListFetchResult } from './list';

export type GetTrainingsOptions = ListFetchOptions;
export type GetTrainingsResult = ListFetchResult<TrainingListItem>;