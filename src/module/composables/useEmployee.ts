import { nextTick, onMounted, ref, watch } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import { useRoute } from 'vue-router';

type AccountPreview = {
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: unknown;
  roleName?: string;
};

export function useEmployee() {
  const api = useApi();
  const route = useRoute();

  const formData = ref<Record<string, unknown>>({});
  const initialFormData = ref<Record<string, unknown> | null>(null);
  const licenses = ref<any[]>([]);

  const accountPreview = ref<AccountPreview | null>(null);

  const isLoading = ref(true);
  const errorMessage = ref('');

  async function refresh() {
    errorMessage.value = '';
    isLoading.value = true;
    initialFormData.value = null;

    const id = route.params.id as string | undefined;
    if (!id) {
      errorMessage.value = 'Missing employee id.';
      isLoading.value = false;
      return;
    }

    try {
      const response = await api.get(`/items/employees/${id}`, {
        params: {
          fields: [
            '*',
            'account.id',
            'account.first_name',
            'account.last_name',
            'account.email',
            'account.role',
            'account.role.id',
            'account.role.name',
            'currency.id',
            'salary_taxes_applied.id',
            'salary_taxes_applied.employees_id',
            'salary_taxes_applied.taxes_id.id',
            'salary_taxes_applied.taxes_id.tax_type',
            'salary_taxes_applied.taxes_id.tax_value',
            'commission_taxes_applied.id',
            'commission_taxes_applied.employees_id',
            'commission_taxes_applied.taxes_id.id',
            'commission_taxes_applied.taxes_id.tax_type',
            'commission_taxes_applied.taxes_id.tax_value',
            'participated_in.id',
            'participated_in.employees_id',
            'participated_in.trainings_id.*',
          ],
        },
      });

      const item = response?.data?.data ?? {};
      const account = (item as any)?.account;
      const accountObj = account && typeof account === 'object' ? account : null;

      const roleObj = accountObj?.role;
      const roleName = roleObj && typeof roleObj === 'object' && 'name' in roleObj
        ? String(roleObj.name)
        : undefined;

      accountPreview.value = accountObj
        ? {
          first_name: accountObj?.first_name,
          last_name: accountObj?.last_name,
          email: accountObj?.email,
          role: accountObj?.role,
          roleName,
        }
        : null;

      const accountId = typeof accountObj?.id === 'string' ? accountObj.id : account;
      formData.value = { ...item, account: accountId };

      if (accountId != null) {
        const drivingLicenses = await api.get(`/items/driverslicences`, {
          params: {
            filter: {
              employee: {
                _eq: accountId,
              },
            },
            sort: ['validity']
          },
        });
        licenses.value = drivingLicenses?.data?.data ?? [];
      }

      await nextTick();
      initialFormData.value = JSON.parse(JSON.stringify(formData.value));
    } catch (loadError: any) {
      console.error('Failed to load employee', loadError);
      errorMessage.value = loadError?.response?.data?.errors?.[0]?.message ?? 'Load failed.';
    } finally {
      isLoading.value = false;
    }
  }

  onMounted(refresh);
  watch(() => route.params.id, refresh);

  return {
    formData,
    initialFormData,
    accountPreview,
    isLoading,
    errorMessage,
    refresh,
    licenses,
  };
}

