import { computed, ref } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import { extractDirectusError } from '../utils/extractDirectusError';

export function useBulkUpdate() {
  const api = useApi();

  const isSaving = ref(false);
  const error = ref<unknown>(null);
  const hasError = computed(() => error.value != null);
  const errorMessage = computed(() => extractDirectusError(error.value, 'Bulk update failed.'));

  function resetError() {
    error.value = null;
  }



  // TODO Surface API validation errors for the user
  async function bulkUpdateItems<Keys extends Array<string | number>, Data extends Record<string, any>>(
    collection: string,
    keys: Keys,
    data: Data
  ): Promise<void> {
    if (!collection) throw new Error('collection is required');
    if (!Array.isArray(keys) || keys.length === 0) return;

    isSaving.value = true;
    resetError();

    try {
      await api.patch(`/items/${collection}`, {
        keys,
        data,
      });
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      isSaving.value = false;
    }
  }

  return {
    isSaving,
    error,
    hasError,
    errorMessage,
    resetError,
    bulkUpdateItems,
  };
}

