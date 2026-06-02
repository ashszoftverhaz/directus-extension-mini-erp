import { onBeforeUnmount, type Ref } from 'vue';
import type { TableColumn } from './useTableColumns';

export function useTableResize(options: {
  resolvedColumns: Readonly<Ref<TableColumn[]>>;
  disabled: Ref<boolean | undefined>;
  minResizableWidth: Ref<number>;
  columnWidths: Ref<Record<string, number | null>>;
}) {
  let activeResize: { key: string; startX: number; startWidth: number; minWidth: number } | null = null;

  function onResizeMove(mouseEvent: MouseEvent) {
    if (!activeResize) return;
    const deltaX = mouseEvent.clientX - activeResize.startX;
    const nextColumnWidth = Math.max(activeResize.minWidth, activeResize.startWidth + deltaX);
    options.columnWidths.value = { ...options.columnWidths.value, [activeResize.key]: Math.round(nextColumnWidth) };
  }

  function stopResize() {
    activeResize = null;
    window.removeEventListener('mousemove', onResizeMove);
    window.removeEventListener('mouseup', stopResize);
  }

  function startResize(columnKey: string, mouseEvent: MouseEvent) {
    if (options.disabled.value) return;

    const thElement = (mouseEvent.target as HTMLElement | null)?.closest('th') as HTMLElement | null;
    if (!thElement) return;

    const column = options.resolvedColumns.value.find((c) => c.key === columnKey);
    if (!column?.resizable) return;

    activeResize = {
      key: columnKey,
      startX: mouseEvent.clientX,
      startWidth: thElement.getBoundingClientRect().width,
      minWidth: column.minWidth ?? options.minResizableWidth.value,
    };
    window.addEventListener('mousemove', onResizeMove);
    window.addEventListener('mouseup', stopResize);
  }

  onBeforeUnmount(() => stopResize());

  return {
    startResize,
    stopResize,
  };
}

