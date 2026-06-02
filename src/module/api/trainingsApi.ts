import type { useApi } from '@directus/extensions-sdk';

import type { DirectusItemsResponse } from '../types/apiTypes';
import { GetTrainingsOptions, GetTrainingsResult, TrainingListItem } from '../types/trainings';
import { exportCollectionItems } from '../utils/collectionDataExport';

type ApiClient = ReturnType<typeof useApi>;

const exportTrainingFields: Record<string, string> = {
  'name': 'Name',
  'description': 'Description',
  'notes': 'Notes'
};

export async function getTrainings(
  api: ApiClient,
  options: GetTrainingsOptions = {}
): Promise<GetTrainingsResult> {
  const response = await api.get<DirectusItemsResponse<TrainingListItem[]>>(
    '/items/trainings',
    {
      params: {
        fields: ['id', 'name', 'description'],
        sort: options.sort ?? ['name'],
        limit: options.limit ?? -1, 
        offset: options.offset ?? 0,
        ...(options.search ? { search: options.search } : {}),
        meta: ['total_count', 'filter_count'], 
      },
    }
  );

  return {
    data: response.data?.data ?? [],
    total: response.data?.meta?.total_count ?? 0,
  };
}

export async function exportTrainings(api: ApiClient, ids: Array<string | number>): Promise<void> {
  await exportCollectionItems(api, ids, 'trainings', exportTrainingFields);
}

export async function getCollectionInfo(api: ApiClient): Promise<string> {
  try {
    const response = await api.get(`/collections/trainings`, {
      params: {
        fields: ['meta.note'],
      },
    });

    return response?.data?.data?.meta?.note ?? '';
  } catch (error) {
    console.warn(`Failed to load note for collection "trainings"`, error);
    return '';
  }
}
