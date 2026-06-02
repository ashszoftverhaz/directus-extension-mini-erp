import { computed, type ComputedRef, type Ref } from 'vue';

export type SortOrder = 'asc' | 'desc';

export type TableColumn = {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  resizable?: boolean;
  align?: 'left' | 'center' | 'right';
  minWidth?: number;
};

function formatColumnKey(key: string) {
  const withSpaces = key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim();

  return withSpaces
    .split(/\s+/g)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function useTableColumns(options: {
  columns: Ref<TableColumn[] | undefined>;
  fields: Ref<readonly string[] | undefined>;
  columnOverrides: Ref<Record<string, Partial<TableColumn>> | undefined>;
  defaultColumnWidth: Ref<string>;
  defaultSortable: Ref<boolean>;
  defaultResizable: Ref<boolean>;
  columnWidths: Ref<Record<string, number | null>>;
}) {
  const resolvedColumns = computed<TableColumn[]>(() => {
    const base =
      options.columns.value?.length
        ? options.columns.value
        : (options.fields.value ?? []).map(
            (key): TableColumn => ({
              key,
              label: formatColumnKey(key),
              width: undefined,
              sortable: undefined,
              resizable: undefined,
              align: undefined,
              minWidth: undefined,
            })
          );

    const overrides = options.columnOverrides.value ?? {};

    return base.map((col) => {
      const override = overrides[col.key] ?? {};
      const label = (override.label ?? col.label ?? formatColumnKey(col.key)) as string;

      return {
        key: col.key,
        label,
        width: override.width ?? col.width ?? options.defaultColumnWidth.value,
        sortable: override.sortable ?? col.sortable ?? options.defaultSortable.value,
        resizable: override.resizable ?? col.resizable ?? options.defaultResizable.value,
        align: override.align ?? col.align,
        minWidth: override.minWidth ?? col.minWidth,
      };
    });
  });

  function widthForColumn(column: TableColumn) {
    const resized = options.columnWidths.value[column.key];
    if (column.resizable && typeof resized === 'number') return `${resized}px`;
    return column.width ?? options.defaultColumnWidth.value;
  }

  return {
    resolvedColumns: resolvedColumns as ComputedRef<TableColumn[]>,
    widthForColumn,
  };
}

