<template>
  <VDrawer v-model="openModel" direction="right" @cancel="close">
    <template #title>
      <div class="header">
        <div class="header-title">
          <h1 class="type-title">Export P&amp;L</h1>
        </div>
      </div>
    </template>

    <template #actions>
      <VButton
        icon
        rounded
        :loading="isExporting"
        :disabled="!canExport || isExporting"
        @click.stop="exportCsv">
        <VIcon name="check" />
      </VButton>
    </template>

    <div class="drawer-content">
      <VNotice v-if="exportError" type="danger" class="notice">
        {{ exportError }}
      </VNotice>

      <VNotice v-else-if="exportSuccess" type="success" class="notice">
        {{ exportSuccess }}
      </VNotice>

      <VNotice v-else-if="!canExport" type="info" class="notice">
        {{ exportDisabledReason }}
      </VNotice>

      <VNotice v-else type="info" class="notice">
        Exports the currently displayed P&amp;L table into a CSV file.
      </VNotice>

      <div class="section">
        <h2 class="section-title">File</h2>

        <div class="field">
          <label class="field-label">Filename</label>
          <VInput
            v-model="fileName"
            :disabled="isExporting"
            placeholder="PnL_2026-01-01-2026-03-31_Monthly_EUR.csv" />
        </div>

        <div class="hint">Tip: you can include a date or currency code in the filename.</div>
      </div>

      <div class="section">
        <h2 class="section-title">Destination folder</h2>

        <div class="folder-section">
          <div class="folder-actions">
            <VButton secondary :disabled="!canPickFolder || isExporting" @click.stop="pickFolder">
              Choose folder
            </VButton>
          </div>

          <div class="folder-status">
            <VNotice v-if="folderUnsupported" type="info">
              Folder selection is not supported in this browser.
            </VNotice>
            <VNotice v-else-if="!folderHandle" type="info">No folder selected yet.</VNotice>
            <VNotice v-else type="success">
              Folder selected:
              <span class="folder-path">{{ folderFullPath || folderName }}</span>
              <span v-if="!folderFullPath" class="folder-path-hint">(full path not available)</span>
            </VNotice>
          </div>
        </div>
      </div>
    </div>
  </VDrawer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import {
  ensureCsvFileName,
  buildPnlCsvText,
  saveCsvToDirectoryHandle,
} from '../utils/pnlCsvExport';

type PeriodGrouping = 'monthly' | 'quarterly' | 'yearly';

type PnlExportPeriod = {
  index: number;
  label: string;
  startDate?: string;
  endDate?: string;
};

type PnlExportRow = {
  key: string;
  label: string;
  values: Array<number | null>;
  emphasized?: boolean;
};

const props = withDefaults(
  defineProps<{
    open: boolean;
    baseCurrencyCode: string | null;
    startingPeriod: string | null;
    periodGrouping: PeriodGrouping;
    periods: PnlExportPeriod[];
    rows: PnlExportRow[];
  }>(),
  {
    baseCurrencyCode: null,
    startingPeriod: null,
    periods: () => [],
    rows: () => [],
  },
);

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const openModel = computed<boolean>({
  get() {
    return props.open;
  },
  set(val: boolean) {
    emit('update:open', val);
  },
});

const isExporting = ref(false);
const exportError = ref<string>('');
const exportSuccess = ref<string>('');

const folderHandle = ref<FileSystemDirectoryHandle | null>(null);
const folderUnsupported = ref(false);
const folderName = ref<string>('');
const folderFullPath = ref<string>('');

const fileName = ref<string>('pnl_export.csv');

const isFolderPickerSupported = computed(
  () => typeof (window as any).showDirectoryPicker === 'function',
);
const canPickFolder = computed(() => isFolderPickerSupported.value);

const exportDisabledReason = computed(() => {
  if (props.rows.length === 0 || props.periods.length === 0) return 'No P&L data loaded yet.';

  if (!folderUnsupported.value && !folderHandle.value) {
    return 'Please choose a destination folder first.';
  }

  if (folderUnsupported.value) return 'Folder selection is not supported in this browser.';

  return '';
});

const canExport = computed(() => exportDisabledReason.value === '');

function close() {
  openModel.value = false;
}

function resetStateOnOpen() {
  exportError.value = '';
  exportSuccess.value = '';
  isExporting.value = false;
  folderHandle.value = null;
  folderName.value = '';
  folderFullPath.value = '';
  folderUnsupported.value = !isFolderPickerSupported.value;

  const baseCurrency = props.baseCurrencyCode ?? 'base';
  const grouping = props.periodGrouping ?? 'period';

  const groupingLabel = grouping.charAt(0).toUpperCase() + grouping.slice(1);
  const baseCurrencyLabel = baseCurrency === 'base' ? 'BASE' : baseCurrency;

  const { startDate, endDate } = getPeriodRangeForFileName();

  const dateRangePart =
    startDate && endDate
      ? `${startDate}-${endDate}`
      : formatStartingPeriodForFileName(props.startingPeriod);

  fileName.value = ensureCsvFileName(
    `PnL_${dateRangePart}_${groupingLabel}_${baseCurrencyLabel}.csv`,
  );
}

function formatStartingPeriodForFileName(value: string | null): string {
  const raw = (value ?? '').trim();
  if (!raw) return 'start';

  if (raw.includes('T')) {
    return raw.split('T', 1)[0] || 'start';
  }

  return raw.length >= 10 ? raw.slice(0, 10) : raw;
}

function getPeriodRangeForFileName(): { startDate: string | null; endDate: string | null } {
  const periods = props.periods ?? [];
  const first = periods[0];
  const last = periods[periods.length - 1];
  const firstStart = parseIsoToDateUtc(first?.startDate ?? props.startingPeriod);
  const lastEndExclusive = parseIsoToDateUtc(last?.endDate);
  const endInclusive = lastEndExclusive ? formatUtcYmd(subtractUtcDays(lastEndExclusive, 1)) : null;

  return {
    startDate: firstStart ? formatUtcYmd(firstStart) : null,
    endDate: endInclusive,
  };
}

function parseIsoToDateUtc(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function formatUtcYmd(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function subtractUtcDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() - days);
  return next;
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) resetStateOnOpen();
  },
  { immediate: true },
);

async function pickFolder() {
  exportError.value = '';
  exportSuccess.value = '';
  folderUnsupported.value = !isFolderPickerSupported.value;

  if (!isFolderPickerSupported.value) return;

  try {
    const handle = await (window as any).showDirectoryPicker();
    folderHandle.value = handle as FileSystemDirectoryHandle;
    folderName.value = handle?.name ? String(handle.name) : 'Selected folder';

    const maybeFullPath =
      (handle as any)?.path ||
      (handle as any)?.fullPath ||
      (handle as any)?.webkitRelativePath ||
      (handle as any)?.directoryPath;

    folderFullPath.value = maybeFullPath ? String(maybeFullPath) : folderName.value;
  } catch (e: any) {
    folderHandle.value = null;
    folderName.value = '';
    folderFullPath.value = '';
    exportError.value = e?.message
      ? `Folder selection failed: ${e.message}`
      : 'Folder selection cancelled.';
  }
}

function exportCsv(): void {
  exportError.value = '';
  exportSuccess.value = '';
  isExporting.value = true;

  try {
    const csvText = buildPnlCsvText({
      title: 'Income statement',
      startingPeriod: props.startingPeriod,
      periodGrouping: props.periodGrouping,
      baseCurrencyCode: props.baseCurrencyCode,
      periods: props.periods,
      rows: props.rows,
    });

    const finalizedFileName = ensureCsvFileName(fileName.value);

    if (folderUnsupported.value || !folderHandle.value) {
      exportError.value = 'Please choose a destination folder first.';
      isExporting.value = false;
      return;
    }

    void exportCsvToFolder({
      directoryHandle: folderHandle.value,
      fileName: finalizedFileName,
      csvText,
    });

    // exportCsvToFolder() will update exportSuccess/exportError and flip `isExporting` back.
  } catch (e: any) {
    console.error('Failed to export P&L CSV', e);
    exportError.value = e?.message ? `Export failed: ${e.message}` : 'Export failed.';
    isExporting.value = false;
  }
}

async function exportCsvToFolder(params: {
  directoryHandle: FileSystemDirectoryHandle;
  fileName: string;
  csvText: string;
}): Promise<void> {
  try {
    const savedFileName = await saveCsvToDirectoryHandle({
      directoryHandle: params.directoryHandle,
      fileName: params.fileName,
      csvText: params.csvText,
      uniqueFileName: true,
    });

    exportSuccess.value = `Saved CSV: ${savedFileName} → ${folderFullPath || folderName}`;
    window.setTimeout(() => close(), 1200);
  } catch (e: any) {
    console.error('Failed to export P&L CSV to folder', e);
    exportError.value = e?.message ? `Export failed: ${e.message}` : 'Export failed.';
  } finally {
    isExporting.value = false;
  }
}
</script>

<style scoped>
.drawer-content {
  padding: var(--content-padding);
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notice {
  margin-bottom: 4px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--theme--foreground-subdued);
  margin: 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--theme--foreground-subdued);
}

.hint {
  font-size: 12px;
  color: var(--theme--foreground-subdued);
  font-style: italic;
  margin-top: -6px;
}

.folder-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.folder-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.folder-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.unsupported {
  font-size: 12px;
  color: var(--theme--foreground-subdued);
}

.folder-path {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
}

.folder-path-hint {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: var(--theme--foreground-subdued);
}
</style>
