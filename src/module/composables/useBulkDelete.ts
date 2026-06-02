import { computed, ref } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import { extractDirectusError } from '../utils/extractDirectusError';

export function useBulkDelete() {
  const api = useApi();

  const isDeleting = ref(false);
  const error = ref<unknown>(null);
  const hasError = computed(() => error.value != null);
  const errorMessage = computed(() => extractDirectusError(error.value, 'Bulk delete failed.'));

  function resetError() {
    error.value = null;
  }

  async function bulkDeleteItems(collection: string, keys: Array<string | number>): Promise<void> {
    if (!collection) throw new Error('collection is required');
    if (!Array.isArray(keys) || keys.length === 0) return;

    isDeleting.value = true;
    resetError();

    try {
      await api.delete(`/items/${collection}`, {
        data: {
          keys,
        },
      });
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      isDeleting.value = false;
    }
  }

  return {
    isDeleting,
    error,
    hasError,
    errorMessage,
    resetError,
    bulkDeleteItems,
  };
}

