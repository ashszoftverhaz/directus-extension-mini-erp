<template>
  <ErpLayout title="Default settings" :getInfo="() => getCollectionInfo()">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>

    <template #title-icon>
      <VButton class="header-icon" rounded icon secondary disabled>
        <VIcon name="settings" />
      </VButton>
    </template>

    <template #title-actions> </template>

    <template #actions>
      <div class="header-items-indicator" aria-live="polite">
        {{ isLoading ? 'Loading...' : rangeText }}
      </div>
    </template>

    <div class="default-settings-page">
      <VProgressLinear
        indeterminate
        class="default-settings-loading"
        :style="{ visibility: isLoading ? 'visible' : 'hidden' }" />

      <VNotice v-if="isError" type="danger" class="default-settings-error">
        Failed to load settings.
        <VButton @click="refresh">Retry</VButton>
      </VNotice>

      <TableComponent
        summary="Settings name, Value, Notes"
        :is-loading="isLoading"
        :items="settings"
        row-key="id"
        :fields="settingsFields"
        :column-overrides="settingsColumnOverrides"
        :disabled="isLoading || !hasUpdatePermission"
        :sort="sortModel"
        @row-click="(row) => openEdit(row.id)"
        :show-empty="!isLoading && settings.length === 0"
        empty-text="There are no settings yet."
        empty-action-disabled>
        <template #cell-settings_name="{ value }">
          <span class="value">{{ value }}</span>
        </template>

        <template #cell-value="{ item, value }">
          <span class="value">
            {{ formattedValues[String(item.id)] ?? (value || '—') }}
          </span>
        </template>

        <template #cell-notes="{ value }">
          <span class="value notes">
            {{ value || '—' }}
          </span>
        </template>

        <template #footer>
          <TableFooter
            :page="page"
            :total-pages="totalPages"
            :items-per-page="itemsPerPageModel"
            :rows-per-page-options="DEFAULT_ROWS_PER_PAGE_OPTIONS"
            rows-per-page-label="Per Page"
            :disabled="isLoading"
            @update:page="onPageChange"
            @update:itemsPerPage="onItemsPerPageChange" />
        </template>
      </TableComponent>
    </div>
  </ErpLayout>
</template>

<script lang="ts" setup>
import ErpLayout from '../../layouts/ErpLayout.vue';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useApi, useStores } from '@directus/extensions-sdk';
import TableComponent from '../../components/table/TableComponent.vue';
import TableFooter from '../../components/table/TableFooter.vue';
import { DEFAULT_ROWS_PER_PAGE_OPTIONS } from '../../constants';
import { useSettings } from '../../composables/useSettings';
import { parseLocationSettingValue } from '../../utils/settingsFormat';
import { getCollectionInfo } from '../../api/settingsApi';

const router = useRouter();
const api = useApi();

const { settings, totalCount, isLoading, isError, refresh, page, itemsPerPage, sortBy } =
  useSettings();

  const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Default settings', to: '/erp/settings', disabled: 'false' },
];

const settingsFields = ['settings_name', 'value', 'notes'] as const;
const settingsColumnOverrides = {
  settings_name: { width: 'minmax(260px, 2fr)', label: 'Settings name' },
  value: { width: 'minmax(220px, 1.5fr)', label: 'Value' },
  notes: { width: 'minmax(260px, 2fr)', label: 'Notes' },
};

const totalPages = computed(() => {
  if (itemsPerPage.value <= 0) return 1;
  return Math.max(1, Math.ceil(totalCount.value / itemsPerPage.value));
});

const rangeText = computed(() => {
  if (totalCount.value === 0) return '0 items';

  const start = (page.value - 1) * itemsPerPage.value + 1;
  const rangeEnd = Math.min(page.value * itemsPerPage.value, totalCount.value);

  return `${start}-${rangeEnd} of ${totalCount.value} items`;
});

const sortModel = computed<{ key: string; order: 'asc' | 'desc' } | null>(() => {
  const current = sortBy.value?.[0];
  if (!current?.key) return null;
  return { key: current.key, order: current.order };
});

const formattedValues = ref<Record<string, string>>({});
const currencyLabelsByCode = ref<Record<string, string>>({});
const countryLabelsByCode = ref<Record<string, string>>({});


const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();
const hasUpdatePermission = computed(() => permissionsStore.hasPermission('erp_settings', 'update'));

async function computeFormattedValues() {
  const mapping: Record<string, string> = {};

  if (Object.keys(currencyLabelsByCode.value).length === 0) {
    try {
      const response = await api.get('/items/currencies', {
        params: {
          fields: ['short_name', 'name'],
          sort: ['name'],
          limit: -1,
          meta: ['total_count'],
        },
      });
      const rows = (response.data?.data ?? []) as { short_name: string; name: string }[];
      const map: Record<string, string> = {};
      for (const row of rows) {
        if (!row?.short_name || !row?.name) continue;
        const code = row.short_name.toUpperCase();
        map[code] = `${row.name} - ${code}`;
      }
      currencyLabelsByCode.value = map;
    } catch (error) {
      console.error('Failed to load currencies for settings table formatting', error);
    }
  }

  if (Object.keys(countryLabelsByCode.value).length === 0) {
    try {
      const response = await api.get('/items/countries', {
        params: {
          fields: ['iso2', 'name'],
          sort: ['name'],
          limit: -1,
          meta: ['total_count'],
        },
      });
      const rows = (response.data?.data ?? []) as { iso2: string | null; name: string }[];
      const map: Record<string, string> = {};
      for (const row of rows) {
        if (!row?.iso2 || !row?.name) continue;
        const code = row.iso2.toUpperCase();
        map[code] = `${row.name} - ${code}`;
      }
      countryLabelsByCode.value = map;
    } catch (error) {
      console.error('Failed to load countries for settings table formatting', error);
    }
  }

  for (const item of settings.value) {
    if (item.key === 'base_currency' && item.value) {
      const code = String(item.value).toUpperCase();
      const label = currencyLabelsByCode.value[code];
      if (label) {
        mapping[String(item.id)] = label;
        continue;
      }
    }

    if (item.key === 'base_country' && item.value) {
      const code = String(item.value).toUpperCase();
      const label = countryLabelsByCode.value[code];
      if (label) {
        mapping[String(item.id)] = label;
        continue;
      }
    }

    if (item.key === 'base_location' && item.value) {
      const parsed = parseLocationSettingValue(item.value);
      if (!parsed) continue;

      try {
        const response = await api.get(`/items/${parsed.collection}/${parsed.id}`, {
          params: {
            fields: ['id', 'name'],
          },
        });

        const loc = response.data?.data;
        if (!loc) continue;

        const name = loc.name as string | null | undefined;
        const label = name ?? '';

        if (label) {
          mapping[String(item.id)] = label;
        }
      } catch (error) {
        console.error('Failed to resolve base location for setting', item.id, error);
      }
    }
  }

  formattedValues.value = mapping;
}

const itemsPerPageModel = computed<number>({
  get() {
    return itemsPerPage.value;
  },
  set(nextItemsPerPageValue: any) {
    const parsedItemsPerPage =
      typeof nextItemsPerPageValue === 'number'
        ? nextItemsPerPageValue
        : typeof nextItemsPerPageValue === 'string'
          ? Number(nextItemsPerPageValue)
          : Number(nextItemsPerPageValue?.value ?? nextItemsPerPageValue);

    if (!Number.isFinite(parsedItemsPerPage) || parsedItemsPerPage <= 0) return;
    itemsPerPage.value = parsedItemsPerPage;
    page.value = 1;
  },
});

function onPageChange(nextPage: number) {
  if (!Number.isFinite(nextPage) || nextPage <= 0) return;
  page.value = nextPage;
}

function onItemsPerPageChange(nextItemsPerPage: number) {
  itemsPerPageModel.value = nextItemsPerPage;
}

function openEdit(id: string | number) {
  router.push(`/erp/settings/${id}`);
}

onMounted(() => {
  refresh();
});

watch(
  () => settings.value,
  () => {
    computeFormattedValues();
  },
  { immediate: true },
);
</script>

<style scoped>
.default-settings-page {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.default-settings-error {
  flex-shrink: 0;
  margin-bottom: 16px;
}

.default-settings-loading {
  flex-shrink: 0;
  margin-bottom: 8px;
}

.header-items-indicator {
  font-size: 15px;
  color: var(--theme--foreground-subdued);
  margin-inline-end: 8px;
  white-space: nowrap;
  align-items: center;
}

.value.notes {
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
