export type PnlExportPeriod = {
  index: number;
  label: string;
};

export type PnlExportRow = {
  key: string;
  label: string;
  values: Array<number | null>;
  emphasized?: boolean;
};

export type PnlCsvExportContext = {
  title: string;
  startingPeriod: string | null;
  periodGrouping: 'monthly' | 'quarterly' | 'yearly';
  baseCurrencyCode: string | null;
  periods: PnlExportPeriod[];
  rows: PnlExportRow[];
};

const CSV_DELIMITER = ';';

function escapeCsvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  const needsQuoting =
    escaped.includes('\n') ||
    escaped.includes('\r') ||
    escaped.includes(CSV_DELIMITER) ||
    escaped.includes('"');
  return needsQuoting ? `"${escaped}"` : escaped;
}

function formatPnlAmountForCsv(value: number | null): string {
  if (value == null) return '0';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '-';
  if (amount === 0) return '0';

  const sign = amount < 0 ? '-' : '';
  const absolute = Math.abs(amount);

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(absolute);

  return `${sign}${formatted}`;
}

function formatPnlRatioForCsv(value: number | null): string {
  if (value == null) return '0%';
  const ratio = Number(value);
  if (!Number.isFinite(ratio) || ratio <= 0) return '0%';
  return `${Math.round(ratio * 100)}%`;
}

function formatPnlCellValueForCsv(rowKey: string, value: number | null): string {
  if (rowKey === 'gross_margin' || rowKey === 'ebitda_margin') return formatPnlRatioForCsv(value);
  return formatPnlAmountForCsv(value);
}

function toCsvLine(cells: Array<string | number | null | undefined>): string {
  return cells.map((c) => (c == null ? '' : escapeCsvCell(String(c)))).join(CSV_DELIMITER);
}

function normalizeFileNameBase(fileNameBase: string): string {
  const trimmed = fileNameBase.trim();
  if (!trimmed) return 'pnl_export';

  return trimmed.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_');
}

export function buildPnlCsvText(context: PnlCsvExportContext): string {
  const titleLine = context.title || 'Income statement';
  const currencyLine = context.baseCurrencyCode ? ` (${context.baseCurrencyCode})` : '';

  const periodLabels = context.periods.map((p) => p.label);
  const headerCells = ['Line item', ...periodLabels];

  const dataLines = context.rows.map((row) => {
    const valueCells = row.values.map((value) => formatPnlCellValueForCsv(row.key, value));
    return [row.label, ...valueCells];
  });

  const startingPeriodValue = context.startingPeriod ?? '';

  return [
    toCsvLine([`${titleLine}${currencyLine}`]),
    '',
    toCsvLine(['Starting period', startingPeriodValue]),
    toCsvLine(['Period grouping', context.periodGrouping]),
    '',
    toCsvLine(headerCells),
    ...dataLines.map((cells) => toCsvLine(cells)),
    '',
  ]
    .join('\r\n')
    .concat('\r\n');
}

export function ensureCsvFileName(fileNameBase: string): string {
  const base = normalizeFileNameBase(fileNameBase);
  return base.toLowerCase().endsWith('.csv') ? base : `${base}.csv`;
}

export function downloadCsvFile(fileName: string, csvText: string): void {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' });
  const msSaveOrOpenBlob = (navigator as any)?.msSaveOrOpenBlob;
  if (typeof msSaveOrOpenBlob === 'function') {
    msSaveOrOpenBlob(blob, fileName);
    return;
  }

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  link.style.display = 'none';

  document.body.appendChild(link);

  link.click();
  link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

  window.setTimeout(() => {
    if (link.parentNode) link.parentNode.removeChild(link);
    URL.revokeObjectURL(url);
  }, 8000);
}

export async function saveCsvToDirectoryHandle(params: {
  directoryHandle: FileSystemDirectoryHandle;
  fileName: string;
  csvText: string;
  uniqueFileName?: boolean;
}): Promise<string> {
  const { directoryHandle, fileName, csvText, uniqueFileName } = params;

  const resolvedFileName = await resolveUniqueFileName({
    directoryHandle,
    baseFileName: fileName,
    uniqueFileName: Boolean(uniqueFileName),
  });

  const fileHandle = await directoryHandle.getFileHandle(resolvedFileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(csvText);
  await writable.close();

  return resolvedFileName;
}

function splitFileName(fileName: string): { base: string; ext: string } {
  const match = fileName.match(/^(.*?)(\.[^.]+)?$/);
  const base = (match?.[1] ?? fileName).trim();
  const ext = match?.[2] ?? '';
  return { base, ext };
}

async function fileExists(
  directoryHandle: FileSystemDirectoryHandle,
  fileName: string,
): Promise<boolean> {
  try {
    await directoryHandle.getFileHandle(fileName, { create: false });
    return true;
  } catch {
    return false;
  }
}

async function resolveUniqueFileName(params: {
  directoryHandle: FileSystemDirectoryHandle;
  baseFileName: string;
  uniqueFileName: boolean;
}): Promise<string> {
  const { directoryHandle, baseFileName, uniqueFileName } = params;
  if (!uniqueFileName) return baseFileName;

  const { base, ext } = splitFileName(baseFileName);
  const exists = await fileExists(directoryHandle, baseFileName);
  if (!exists) return baseFileName;

  for (let i = 1; i < 5000; i += 1) {
    const candidate = `${base}_${i}${ext}`;
    // eslint-disable-next-line no-await-in-loop
    if (!(await fileExists(directoryHandle, candidate))) return candidate;
  }

  return `${base}_${Date.now()}${ext}`;
}
