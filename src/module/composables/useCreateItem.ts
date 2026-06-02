import { computed, ref } from 'vue';
import { useApi, useStores } from '@directus/extensions-sdk';

export function useCreateItem(
  collection: string,
  options?: {
    successMessage?: string;
    /** Field names to exclude from the create payload (e.g. display-only fields) */
    excludeFields?: string[];
  }
) {
  const api = useApi();
  const { usePermissionsStore } = useStores();
  const permissionsStore = usePermissionsStore();

  const formData = ref<Record<string, unknown>>({});
  const saving = ref(false);
  const errorMessage = ref('');
  const successMessage = ref('');

  const hasPermission = computed(() => permissionsStore.hasPermission(collection, 'create'));
  const canSubmit = computed(() => Object.keys(formData.value).length > 0);

  function resetNotices() {
    errorMessage.value = '';
    successMessage.value = '';
  }

  function resetForm() {
    formData.value = {};
  }

  async function save(): Promise<boolean> {
    resetNotices();

    if (!hasPermission.value) {
      errorMessage.value = `You do not have permissions to create ${collection}.`;
      return false;
    }

    if (!canSubmit.value) {
      errorMessage.value = 'Please fill in the required fields.';
      return false;
    }

    saving.value = true;
    try {
      const payload = options?.excludeFields?.length
        ? Object.fromEntries(
            Object.entries(formData.value).filter(([key]) => !options!.excludeFields!.includes(key)),
          )
        : formData.value;
      await api.post(`/items/${collection}`, payload);
      successMessage.value = options?.successMessage ?? 'Saved.';
      return true;
    } catch (e: any) {
      console.error(`Failed to create ${collection}`, e);
      errorMessage.value = e?.response?.data?.errors?.[0]?.message ?? 'Save failed.';
      return false;
    } finally {
      saving.value = false;
    }
  }

  async function saveAndStay() {
    await save();
  }

  async function saveAndCreateNew() {
    const ok = await save();
    if (ok) resetForm();
  }

  function discardAllChanges() {
    if (saving.value) return;
    resetNotices();
    resetForm();
  }

  return {
    formData,
    saving,
    errorMessage,
    successMessage,
    hasPermission,
    canSubmit,
    resetNotices,
    resetForm,
    save,
    saveAndStay,
    saveAndCreateNew,
    discardAllChanges,
  };
}

