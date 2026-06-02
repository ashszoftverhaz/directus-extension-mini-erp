import { computed, onMounted, ref, watch } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import type { ListFetchOptions, ListFetchResult } from '../types/list';

type ApiClient = ReturnType<typeof useApi>;

type FetchFn<T> = (api: ApiClient, options: ListFetchOptions) => Promise<ListFetchResult<T>>;

interface UsePaginatedListOptions {
  defaultSort: string;
  label?: string;
  autoLoad?: boolean;
}

export interface UsePaginatedListReturn<T> {
  items: import('vue').Ref<T[]>;
  totalCount: import('vue').Ref<number>;
  searchText: import('vue').Ref<string>;
  isLoading: import('vue').Ref<boolean>;
  isError: import('vue').Ref<boolean>;
  errorDetails: import('vue').Ref<{
    message: string;
    stack?: string;
    response?: any;
    timestamp: string;
  } | null>;
  refresh: () => Promise<void>;
  page: import('vue').Ref<number>;
  itemsPerPage: import('vue').Ref<number>;
  sortBy: import('vue').Ref<{ key: string; order: 'asc' | 'desc' }[]>;
  filter: import('vue').Ref<Record<string, any>>;
}

export function usePaginatedList<T>(
  fetchFn: FetchFn<T>,
  options: UsePaginatedListOptions,
): UsePaginatedListReturn<T> {
  const directusApi = useApi();

  // state
  const items = ref<T[]>([]) as import('vue').Ref<T[]>;
  const totalCount = ref(0);
  const isLoading = ref(false);
  const isError = ref(false);
  const errorDetails = ref<{
    message: string;
    stack?: string;
    response?: any;
    timestamp: string;
  } | null>(null);

  // Pagination state
  const page = ref(1);
  const itemsPerPage = ref(25);
  const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([
    { key: options.defaultSort, order: 'asc' },
  ]);

  // UI state
  const searchText = ref('');

  // Debounced search
  const searchQuery = ref('');

  const filter = ref<Record<string, any>>({});

  let searchTimeout: ReturnType<typeof setTimeout> | null = null;
  watch(searchText, (newValue) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery.value = newValue;
      page.value = 1;
    }, 300);
  });

  const sortForApi = computed(() => {
    if (sortBy.value.length === 0) return [options.defaultSort];

    return sortBy.value.map((sort) => {
      const prefix = sort.order === 'desc' ? '-' : '';
      return `${prefix}${sort.key}`;
    });
  });

  watch([page, itemsPerPage, sortForApi, searchQuery, () => filter.value], () => {
    refresh();
  });

  async function refresh(): Promise<void> {
    isLoading.value = true;
    isError.value = false;

    try {
      const offset = (page.value - 1) * itemsPerPage.value;
      const result = await fetchFn(directusApi, {
        limit: itemsPerPage.value,
        offset,
        search: searchQuery.value.trim() || undefined,
        sort: sortForApi.value,
        filter: filter.value || undefined,
      } as ListFetchOptions);

      items.value = result.data;
      totalCount.value = result.total;
    } catch (error: any) {
      console.error(`[${options.label ?? 'PaginatedList'}] Failed to load data`, error);
      isError.value = true;
      errorDetails.value = {
        message: error?.message || 'Unknown error occurred',
        stack: error?.stack,
        response: error?.response?.data || error?.response,
        timestamp: new Date().toISOString(),
      };
    } finally {
      isLoading.value = false;
    }
  }

  // lifecycle
  if (options.autoLoad !== false) {
    onMounted(refresh);
  }

  return {
    items,
    totalCount,
    searchText,
    isLoading,
    isError,
    errorDetails,
    refresh,
    page,
    itemsPerPage,
    sortBy,
    filter,
  };
}
