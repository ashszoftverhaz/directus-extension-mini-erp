import { usePaginatedList } from './usePaginatedList';
import type { AssetListItem, GetAssetsOptions } from '../types/assets';
import { getAssets } from '../api/assetsApi';
import { useStores, useApi } from '@directus/extensions-sdk';
import type { ListFetchOptions } from '../types/list';

export function useAssets() {
  const { useCollectionsStore } = useStores();
  const collectionsStore = useCollectionsStore();

  const fetchAssets = async (
    apiClient: ReturnType<typeof useApi>,
    options: ListFetchOptions,
  ): Promise<{ data: AssetListItem[]; total: number }> => {
    const hasWashingUnitCollection = collectionsStore.collections.some(
      (collection: any) => collection.collection === 'washing_unit',
    );
    const hasWashingLocationCollection = collectionsStore.collections.some(
      (collection: any) => collection.collection === 'washing_location',
    );

    const extendedOptions: GetAssetsOptions = {
      limit: options.limit,
      offset: options.offset,
      sort: options.sort,
      search: options.search,
      filter: options.filter,
      includeWashingUnitFields: hasWashingUnitCollection,
      includeWashingLocationFields: hasWashingLocationCollection,
    };

    return getAssets(apiClient as any, extendedOptions);
  };

  const {
    items: assets,
    filter,
    ...rest
  } = usePaginatedList<AssetListItem>(fetchAssets as any, {
    defaultSort: 'code',
    label: 'Assets',
    autoLoad: false,
  });

  return {
    assets,
    filter,
    ...rest,
  };
}
