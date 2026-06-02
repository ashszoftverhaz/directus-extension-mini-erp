import { computed, onMounted, ref, watch } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import type { DrivingLicenceListItem } from '../types/drivingLicences';
import { exportCollectionItems } from '../utils/collectionDataExport';

type SortItem = { key: string; order: 'asc' | 'desc' };

const exportDrivingLicencesFields: Record<string, string> = {
  'category': 'Category',
  'validity': 'Validity',
  'issuer_country.name': 'Issuer Country',
  'isinternational': 'International',
  'employee.first_name': 'Employee\'s First Name',
  'employee.last_name': 'Employee\'s Last Name',
  'employee.email': 'Employee\'s Email',
};

const SORT_KEY_TO_DIRECTUS_SORT: Record<string, string> = {
  category: 'category',
  validity: 'validity',
  issuerCountry: 'issuer_country',
  international: 'isinternational',
  employee: 'employee.last_name',
};

export function useDrivingLicences() {
  const api = useApi();

  const drivingLicences = ref<DrivingLicenceListItem[]>([]);
  const totalCount = ref(0);
  const isLoading = ref(false);
  const isError = ref(false);

  const page = ref(1);
  const itemsPerPage = ref(25);
  const sortBy = ref<SortItem[]>([{ key: 'category', order: 'asc' }]);

  const searchText = ref('');
  const searchQuery = ref('');

  let searchTimeout: ReturnType<typeof setTimeout> | null = null;
  watch(searchText, (newValue) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery.value = newValue;
      page.value = 1;
    }, 300);
  });

  const sortForApi = computed(() => {
    if (sortBy.value.length === 0) return ['category'];

    return sortBy.value.map((sort) => {
      const directusField = SORT_KEY_TO_DIRECTUS_SORT[sort.key] ?? sort.key;
      const prefix = sort.order === 'desc' ? '-' : '';
      return `${prefix}${directusField}`;
    });
  });

  watch([page, itemsPerPage, sortForApi, searchQuery], () => {
    refresh();
  });

  async function refresh() {
    isLoading.value = true;
    isError.value = false;

    try {
      const query = searchQuery.value.trim();

      const params: Record<string, any> = {
        fields: [
          'id',
          'category',
          'validity',
          'issuer_country.id',
          'issuer_country.name',
          'isinternational',
          'employee.id',
          'employee.first_name',
          'employee.last_name',
          'employee.email',
        ],
        page: page.value,
        limit: itemsPerPage.value,
        meta: 'total_count',
        sort: sortForApi.value,
      };

      if (query) {
        params.filter = {
          _or: [
            { category: { _icontains: query } },
            { issuer_country: { name: { _icontains: query } } },
            { employee: { first_name: { _icontains: query } } },
            { employee: { last_name: { _icontains: query } } },
            { employee: { email: { _icontains: query } } },
          ],
        };
      }

      const response = await api.get('/items/driverslicences', { params });
      const data = response?.data?.data ?? [];

      drivingLicences.value = data.map((row: any): DrivingLicenceListItem => {
        const employeeName = [row.employee?.first_name, row.employee?.last_name].filter(Boolean).join(' ');
        return {
          id: String(row.id),
          category: row.category ?? '',
          validity: row.validity ?? '',
          issuerCountry: row.issuer_country ?? '',
          international: Boolean(row.isinternational),
          employee: employeeName || row.employee?.email || '',
        };
      });

      totalCount.value = response?.data?.meta?.total_count ?? 0;
    } catch (error) {
      console.error('[DrivingLicences] Failed to load driving licences', error);
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  onMounted(refresh);

  return {
    drivingLicences,
    totalCount,
    isLoading,
    isError,
    refresh,
    page,
    itemsPerPage,
    sortBy,
    searchText,
  };
}

export async function exportDrivingLicences(api: any, ids: Array<string | number>): Promise<void> {
  await exportCollectionItems(api, ids, 'driverslicences', exportDrivingLicencesFields);
}

export async function getCollectionInfo(api: any): Promise<string> {
  try {
    const response = await api.get(`/collections/driverslicences`, {
      params: {
        fields: ['meta.note'],
      },
    });

    return response?.data?.data?.meta?.note ?? '';
  } catch (error) {
    console.warn(`Failed to load note for collection "driverslicences"`, error);
    return '';
  }
}
