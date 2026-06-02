<template>
  <ErpLayout title="P&L View" 
    :getInfo="() => getCollectionInfo()"
    :exportAvailable="true"
    :exportButtonEnable="!isLoading && hasData" 
    :isExporting="false" 
    :omitExportDescription="true"
    @export="onExportClick">
    <template #headline>
      <VBreadcrumb :items="breadcrumbs" />
    </template>

    <template #title-icon>
      <VButton class="header-icon" rounded icon secondary disabled>
        <VIcon name="insights" />
      </VButton>
    </template>
    <div ref="pageEl" class="pnl-view-page">
      <div class="pnl-loading-wrapper">
        <VProgressLinear v-if="isLoading" indeterminate class="pnl-loading" />
      </div>

      <div class="pnl-header">
        <details class="pnl-filters-accordion">
          <summary class="pnl-filters-summary">Period setttings</summary>

          <div class="pnl-filters-row">
            <div class="pnl-filter-field">
              <label class="pnl-filter-label">Current period</label>
              <VForm
                v-model="filters"
                :fields="[currentPeriodField]"
                class="pnl-filter-input pnl-filter-form" />
              <div class="pnl-filter-note">Select the current period of the income statement.</div>
            </div>

            <div class="pnl-filter-field">
              <label class="pnl-filter-label">Period grouping</label>
              <VSelect
                v-model="periodGrouping"
                class="pnl-filter-input"
                :items="periodGroupingOptions"
                :clearable="false" />
              <div class="pnl-filter-note">
                Monthly, quarterly, or yearly periods end up to the "Current period".
              </div>
            </div>
          </div>
        </details>
      </div>

      <section class="pnl-table-section" v-if="hasData">
        <div class="pnl-table-wrapper">
          <table class="pnl-table">
            <thead class="pnl-table-thead">
              <tr>
                <th class="pnl-col-title">
                  Income statement in {{ baseCurrencyCode ?? 'Base currency' }}
                </th>
                <th v-for="period in periods" :key="period.index" class="pnl-col-period">
                  {{ period.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.key" :class="getRowClass(row)">
                <td :class="getColumnClass(row.key)">
                  <span>
                    {{ row.label }}
                  </span>
                </td>
                <td
                  v-for="(value, index) in row.values"
                  :key="`${row.key}-${index}`"
                  :class="getColumnValueClass(row.key)">
                  {{ formatCellValue(row.key, value) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <VNotice v-else type="info" class="pnl-empty-notice">
        No income statement data for the selected period.
      </VNotice>
    </div>

    <PnlExportDrawer
      v-model:open="exportDrawerOpen"
      :base-currency-code="baseCurrencyCode"
      :starting-period="startingPeriodIso"
      :period-grouping="periodGrouping"
      :periods="periods"
      :rows="rows" />
  </ErpLayout>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import ErpLayout from '../../layouts/ErpLayout.vue';
import PnlExportDrawer from '../../components/PnlExportDrawer.vue';
type PeriodGrouping = 'monthly' | 'quarterly' | 'yearly';

const api = useApi();

const breadcrumbs = [
  { name: 'ERP', to: '/erp', disabled: 'true' },
  { name: 'Incomes', to: '/erp/incomes', disabled: 'false' },
  { name: 'P&L View', to: '/erp/finance/pnl-view', disabled: 'true' },
];

const today = new Date();

function formatLocalYmd(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const filters = ref<{ current_period: string | null }>({
  current_period: formatLocalYmd(today),
});
const periodGrouping = ref<PeriodGrouping>('monthly');

const isLoading = ref(false);
const baseCurrencyCode = ref<string | null>(null);
const periods = ref<any[]>([]);
const rows = ref<any[]>([]);

const exportDrawerOpen = ref(false);

const periodGroupingOptions = [
  { text: 'Monthly', value: 'monthly' },
  { text: 'Quarterly', value: 'quarterly' },
  { text: 'Yearly', value: 'yearly' },
];

const hasData = computed(() => rows.value.length > 0);
const currentPeriodField = computed(() => ({
  field: 'current_period',
  type: 'date',
  meta: {
    interface: 'datetime',
    options: {
      enableTime: false,
      firstDay: 1,
    },
    width: 'full',
    required: false,
    name: 'Current period',
  },
}));

function parseCurrentPeriod(): Date {
  const value = filters.value.current_period;
  if (!value) return new Date();

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, yearStr, monthStr, dayStr] = dateOnlyMatch;
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);

    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return new Date();
    }

    const utc = new Date(Date.UTC(year, month - 1, day));
    if (!Number.isNaN(utc.getTime())) return utc;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()));
  }

  const prefixMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!prefixMatch) return new Date();

  const [, yearStr, monthStr, dayStr] = prefixMatch;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date();
  }

  const utc = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(utc.getTime())) return new Date();
  return utc;
}

function getGroupingMonths(grouping: PeriodGrouping): number {
  if (grouping === 'quarterly') return 3;
  if (grouping === 'yearly') return 12;
  return 1;
}

function subtractUtcMonths(date: Date, months: number): Date {
  const day = date.getUTCDate();
  const shifted = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - months, 1));
  const lastDayOfShiftedMonth = new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, 0),
  ).getUTCDate();

  shifted.setUTCDate(Math.min(day, lastDayOfShiftedMonth));
  return shifted;
}

const startingPeriodDate = computed(() => {
  const currentPeriod = parseCurrentPeriod();
  const monthsToSubtract = 2 * getGroupingMonths(periodGrouping.value);
  return subtractUtcMonths(currentPeriod, monthsToSubtract);
});

const startingPeriodIso = computed(() => startingPeriodDate.value.toISOString());

async function loadIncomeStatement(): Promise<void> {
  isLoading.value = true;
  try {
    const response = await api.get('/erp-pnl/income-statement', {
      params: {
        startingPeriod: startingPeriodIso.value,
        periodGrouping: periodGrouping.value,
      },
    });
    const result = response.data;
    baseCurrencyCode.value = result.baseCurrencyCode;
    periods.value = result.periods;
    rows.value = result.rows;
  } catch (error) {
    console.error('Failed to load income statement', error);
    baseCurrencyCode.value = null;
    periods.value = [];
    rows.value = [];
  } finally {
    isLoading.value = false;
  }
}

const totalSumKeys = ['revenue', 'gross_profit', 'operating_income', 'net_income', 'ebitda'];
const sumKeys = ['cost_of_goods_sold', 'depreciation_amortization', 'operational_ga', 'interest', 'total_taxes'];

function getRowClass(row: any): string { 
  if (totalSumKeys.includes(row.key)) return 'pnl-row-total-sum';
  if (sumKeys.includes(row.key)) return 'pnl-row-sum';
  return 'pnl-row-item';
}

function getColumnClass(rowKey: string): string {
  return totalSumKeys.includes(rowKey) || sumKeys.includes(rowKey) ? 'pnl-col-sum' : 'pnl-col-item';
}

function getColumnValueClass(rowKey: string): string {
  return totalSumKeys.includes(rowKey) || sumKeys.includes(rowKey) ? 'pnl-col-value' : 'pnl-col-value-small';
}

function formatCellValue(rowKey: string, value: number | null): string {
  if (!Number.isFinite(value ?? 0)) return '-';

  if (rowKey === 'gross_margin' || rowKey === 'ebitda_margin') {
    const ratio = value ?? 0;
    if (ratio <= 0) return '0%';
    return `${Math.round(ratio * 100)}%`;
  }

  const amount = value ?? 0;
  if (amount === 0) return '0';

  const sign = amount < 0 ? '-' : '';
  const absolute = Math.abs(amount);
  const formatted = absolute.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${sign} ${formatted}`;
}

function onExportClick(): void {
  if (!hasData.value) return;
  exportDrawerOpen.value = true;
}

function getCollectionInfo(): Promise<string> {
  return Promise.resolve('In the P&L View, you can get an overview of your company’s financial performance using financial statement-ready values from the ERP module.');
}

watch(
  () => [filters.value.current_period, periodGrouping.value],
  () => {
    void loadIncomeStatement();
  },
);

onMounted(() => {
  void loadIncomeStatement();
});
</script>

<style scoped>
.pnl-view-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.pnl-loading-wrapper {
  height: 4px;
  margin: 8px 32px 0;
}

.pnl-loading {
  flex-shrink: 0;
}

.pnl-header {
  margin: 0px 32px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pnl-filters-accordion {
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: 12px;
  background-color: var(--theme--background);
}

.pnl-filters-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 12px;
  cursor: pointer;
  list-style: none;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 700;
  font-family: var(--theme--font-family);
  background-color: var(--theme--background-subdued);
}

.pnl-filters-summary::-webkit-details-marker {
  display: none;
}

.pnl-filters-summary::after {
  content: '';
  width: 6px;
  height: 6px;
  border-right: 2px solid var(--theme--foreground-subdued);
  border-bottom: 2px solid var(--theme--foreground-subdued);
  transform: rotate(45deg);
  transform-origin: center;
  transition: transform var(--fast) var(--transition);
  color: var(--theme--foreground-subdued);
}

.pnl-filters-accordion[open] .pnl-filters-summary {
  border-bottom: var(--theme--border-width) solid var(--theme--border-color-subdued);
}

.pnl-filters-accordion[open] .pnl-filters-summary::after {
  transform: rotate(-135deg);
}

.pnl-filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  padding: 16px;
}

.pnl-filter-field {
  flex: 1;
  min-width: 260px;
}

.pnl-filter-label {
  display: block;
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 600;
  font-family: var(--theme--font-family);
}

.pnl-filter-input {
  width: 100%;
}

:global(.pnl-filter-form .field-label),
:global(.pnl-filter-form .field-label.type-label),
:global(.pnl-filter-form .v-menu-activator .field-label) {
  display: none !important;
}

.pnl-filter-note {
  margin-top: 6px;
  font-size: 13px;
  font-style: italic;
  color: var(--theme--foreground-subdued);
}

.pnl-table-section {
  margin: 0 32px 32px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
}

.pnl-table-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.pnl-table-wrapper {
  border-radius: 12px;
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  background-color: var(--theme--background);
  overflow: auto;
  max-width: 100%;
  flex: 1;
  min-height: 0;
  max-height: calc(100vh - 238px);
}

.pnl-table {
  width: 100%;
  border-collapse: collapse;
}

.pnl-table-thead {
  position: sticky;
  top: 0;
  z-index: 1;
  width: 999px;
  height: 58px;
  opacity: 1;
  transform: rotate(0deg);
  border-bottom: 1px solid var(--theme--border-subdued);
  padding: 16px 40px 16px 16px;
  background-color: var(--theme--background-subdued);
}

.pnl-col-title {
  text-align: left;
  padding: 16px 40px 16px 16px;
  font-family: Inter, sans-serif;
  font-style: normal;
  font-weight: 500;
  font-size: 20px;
  line-height: 130%;
  letter-spacing: 0;
  vertical-align: bottom;
  border-bottom: 1px solid var(--theme--border-subdued);
  background-color: var(--theme--background-subdued);
}

.pnl-col-period {
  text-align: right;
  padding: 16px 40px 16px 16px;
  font-family: Inter, sans-serif;
  font-style: normal;
  font-weight: 500;
  font-size: 20px;
  line-height: 130%;
  letter-spacing: 0;
  vertical-align: bottom;
  border-bottom: 1px solid var(--theme--border-subdued);
  background-color: var(--theme--background-subdued);
  white-space: nowrap;
}

/* Total sum style */
.pnl-row-total-sum {
  height: 40px;
  border-top: 1px solid var(--theme--border-color-subdued);
  font-family: Inter, sans-serif;
  font-weight: 700;
  font-style: normal;
  font-size: 15px;
  line-height: 130%;
}

/* Sum style */
.pnl-row-sum {  
  font-weight: 400;
  height: 40px;
  font-family: Inter, sans-serif;
  font-style: normal;
  font-size: 15px;
  line-height: 130%;
}

/* Item style */
.pnl-row-item {
  height: 40px;
  font-family: Inter, sans-serif;
  font-weight: 400;
  font-style: normal;
  font-size: 15px;
  line-height: 130%;
}

.pnl-col-item {
  padding: 12px 40px 12px 40px;
}

.pnl-col-sum {
  padding: 12px 40px 12px 16px;
}

.pnl-col-value {
  padding: 12px 40px 12px 16px;
  text-align: right;
}

.pnl-col-value-small {
  padding: 12px 40px 12px 16px;
  text-align: right;
  font-size: 13px;
  color: var(--theme--foreground-subdued);
}

.pnl-empty-notice {
  margin: 24px 32px;
}
</style>
