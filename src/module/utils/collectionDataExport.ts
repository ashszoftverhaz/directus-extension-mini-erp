import { useApi } from '@directus/extensions-sdk';

type ApiClient = ReturnType<typeof useApi>;

export async function exportCollectionItems(
  api: ApiClient,
  ids: Array<string | number>,
  collection: string,
  exportFields: Record<string, string>,
): Promise<void> {
  try {
    const contractFields = Object.keys(exportFields).join(',');
    const response = await api.get(`/items/${collection}`, {
      params: {
        fields: [contractFields],
        filter: {
          id: {
            _in: ids,
          },
        },
        export: 'csv',
      },
      responseType: 'blob',
      headers: {
        Accept: 'text/csv',
      },
    });

    if (!(response.data instanceof Blob)) {
      throw new Error('Failed to export contracts');
    }

    const processedBlob = await applyHeaderMapToCsvBlob(response.data, exportFields);

    const fileName = getDownloadFileName(collection, response.headers?.['content-disposition']);
    triggerBlobDownload(processedBlob, fileName);
  } catch (error) {
    console.error(`Error exporting ${collection} items: ${error}`);
    throw error instanceof Error ? error : new Error('An unknown error occurred during export');
  }
}

async function applyHeaderMapToCsvBlob(
  blob: Blob,
  exportHeaderMap: Record<string, string>,
): Promise<Blob> {
  const text = await blob.text();
  if (!text) return blob;

  const hasBom = text.charCodeAt(0) === 0xfeff;
  const content = hasBom ? text.slice(1) : text;
  const firstLineBreakIndex = content.search(/\r?\n/);

  if (firstLineBreakIndex < 0) return blob;

  const headerLine = content.slice(0, firstLineBreakIndex);
  const body = content.slice(firstLineBreakIndex);
  const parsedHeaders = parseCsvHeaderLine(headerLine);
  const mappedHeaders = parsedHeaders.map((header) => exportHeaderMap[header] ?? header);
  const mappedHeaderLine = mappedHeaders.map(escapeCsvValue).join(',');
  const mappedCsv = `${hasBom ? '\uFEFF' : ''}${mappedHeaderLine}${body}`;

  return new Blob([mappedCsv], { type: 'text/csv;charset=utf-8;' });
}

function parseCsvHeaderLine(headerLine: string): string[] {
  const columns: string[] = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < headerLine.length; i += 1) {
    const char = headerLine[i];

    if (char === '"') {
      if (inQuotes && headerLine[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }

      continue;
    }

    if (char === ',' && !inQuotes) {
      columns.push(value);
      value = '';
      continue;
    }

    value += char;
  }

  columns.push(value);

  return columns;
}

function escapeCsvValue(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return /[",\r\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

function getDownloadFileName(collection: string, contentDisposition?: string): string {
  const baseName = collection || 'export';

  if (!contentDisposition) {
    return `${baseName}-export-${new Date().toISOString().slice(0, 10)}.csv`;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (fileNameMatch?.[1]) {
    return fileNameMatch[1];
  }

  return `${baseName}-export-${new Date().toISOString().slice(0, 10)}.csv`;
}

function triggerBlobDownload(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}
