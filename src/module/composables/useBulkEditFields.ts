import { computed, unref, type ComputedRef, type MaybeRef } from 'vue';
import { useStores } from '@directus/extensions-sdk';

export function useBulkEditFields(
  collection: MaybeRef<string>,
  options?: {
    exclude?: string[];
    includeRelational?: boolean;
  }
): {
  rawFields: ComputedRef<any[]>;
  editableFields: ComputedRef<any[]>;
} {
  const { useFieldsStore } = useStores();
  const fieldsStore = useFieldsStore();

  const rawFields = computed<any[]>(() => {
    const c = unref(collection);
    if (!c) return [];

    return fieldsStore.getFieldsForCollection(c) ?? [];
  });

  const editableFields = computed<any[]>(() => {
    const DEFAULT_EXCLUDE = [
      'id',
      'date_created',
      'date_updated',
      'user_created',
      'user_updated',
    ];

    const exclude = new Set([...(options?.exclude ?? []), ...DEFAULT_EXCLUDE]);
    const filtered = rawFields.value.filter((f: any) => {
      const fieldName: string | undefined = f?.field;
      if (!fieldName) return false;
      if (exclude.has(fieldName)) return false;
      if (f?.schema?.is_primary_key) return false;
      if (f?.meta?.hidden) return false;
      if (f?.meta?.readonly) return false;
      const interfaceName = String(f?.meta?.interface || '');
      if (interfaceName.startsWith('presentation-')) return false;
      if (f?.type === 'alias') return false;
      const special: string[] = Array.isArray(f?.meta?.special) ? f.meta.special : [];
      const isRelational = special.some((s) => ['m2o', 'o2m', 'm2m', 'm2a', 'a2o', 'files'].includes(s));
      if (isRelational && options?.includeRelational !== true) return false;

      return true;
    });

    filtered.sort((itemA: any, itemB: any) => {
      const sortA = itemA?.meta?.sort ?? 9999;
      const sortB = itemB?.meta?.sort ?? 9999;
      return sortA - sortB;
    });

    return filtered;
  });

  return {
    rawFields,
    editableFields,
  };
}

