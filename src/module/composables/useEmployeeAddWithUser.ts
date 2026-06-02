import { computed, ref } from 'vue';
import { useApi, useStores } from '@directus/extensions-sdk';
import { extractDirectusError } from '../utils/extractDirectusError';

type UserBaseFormData = {
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: unknown;
  /**
   * Optional:
   * - If provided, we create the user directly via `POST /users` (no email needed).
   * - If omitted, we invite the user via `POST /users/invite` (requires email service).
   */
  password?: string;
};

type EmployeeFormData = Record<string, unknown>;

function asTrimmedString(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

function extractIdString(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  if (!value || typeof value !== 'object') return '';

  const v = value as any;
  if (typeof v?.id === 'string' || typeof v?.id === 'number') return String(v.id).trim();
  if (typeof v?.value === 'string' || typeof v?.value === 'number') return String(v.value).trim();

  return '';
}

function pickIdFromDirectusResponse(response: any): string | null {
  const direct = response?.data?.data;
  if (typeof direct?.id === 'string' && direct.id) return direct.id;
  if (Array.isArray(direct) && typeof direct?.[0]?.id === 'string') return direct[0].id;
  if (typeof response?.data?.id === 'string') return response.data.id;
  return null;
}

export function useEmployeeAddWithUser() {
  const api = useApi();
  const { usePermissionsStore } = useStores();
  const permissionsStore = usePermissionsStore();

  const userFormData = ref<UserBaseFormData>({});
  const employeeFormData = ref<EmployeeFormData>({});

  const saving = ref(false);
  const errorMessage = ref('');
  const successMessage = ref('');

  const hasEmployeeCreatePermission = computed(() => permissionsStore.hasPermission('employees', 'create'));
  const hasUserCreatePermission = computed(() => permissionsStore.hasPermission('directus_users', 'create'));

  const hasPermission = computed(() => {
    return hasEmployeeCreatePermission.value && hasUserCreatePermission.value;
  });

  const requiredFieldsFilled = computed(() => {
    const email = asTrimmedString(userFormData.value.email);
    const role = extractIdString(userFormData.value.role);
    const first = asTrimmedString(userFormData.value.first_name);
    const last = asTrimmedString(userFormData.value.last_name);

    const compensationAmount = employeeFormData.value?.compensation_amount;
    const compensationType = extractIdString(employeeFormData.value?.compensation_type);

    const hasBaseUserData = Boolean(email) && Boolean(role) && (Boolean(first) || Boolean(last));
    const hasCompAmount =
      compensationAmount !== undefined &&
      compensationAmount !== null &&
      asTrimmedString(compensationAmount) !== '';
    const hasCompType = Boolean(compensationType) || employeeFormData.value?.compensation_type == null;
    const hasEmployeeData = hasCompAmount && hasCompType;

    return hasBaseUserData && hasEmployeeData;
  });

  const canSubmit = computed(() => requiredFieldsFilled.value && !saving.value);

  function resetNotices() {
    errorMessage.value = '';
    successMessage.value = '';
  }

  function resetForms() {
    userFormData.value = {};
    employeeFormData.value = {};
  }

  function discardAllChanges() {
    if (saving.value) return;
    resetNotices();
    resetForms();
  }

  async function createOrInviteUser(): Promise<string> {
    const email = asTrimmedString(userFormData.value.email);
    const password = asTrimmedString(userFormData.value.password);
    const role = extractIdString(userFormData.value.role);
    const first_name_raw = asTrimmedString(userFormData.value.first_name);
    const last_name_raw = asTrimmedString(userFormData.value.last_name);
    const first_name = first_name_raw || undefined;
    const last_name = last_name_raw || undefined;

    if (password) {
      const response = await api.post('/users', { email, password, role, first_name, last_name });
      const id = pickIdFromDirectusResponse(response);
      if (!id) throw new Error('User created, but missing id in response.');
      return id;
    }

    const response = await api.post('/users/invite', { email, role });
    let id = pickIdFromDirectusResponse(response);

    if (!id) {
      try {
        const lookup = await api.get('/users', {
          params: {
            filter: { email: { _eq: email } },
            limit: 1,
            fields: ['id'],
          },
        });

        const data = lookup?.data?.data;
        const candidate = Array.isArray(data) ? data[0] : data;
        if (candidate?.id) {
          id = String(candidate.id);
        }
      } catch {
        // ignore – we'll surface a clear error below if we still have no id
      }
    }

    if (!id) throw new Error('User invited, but could not resolve user id.');

    if (first_name_raw || last_name_raw) {
      await api.patch(`/users/${id}`, {
        first_name,
        last_name,
      });
    }

    return id;
  }

  async function createEmployee(userId: string): Promise<string> {
    const payload = { ...(employeeFormData.value ?? {}) } as Record<string, unknown>;
    delete payload.id;
    delete payload.account;

    const compensationType = extractIdString(payload.compensation_type);
    if (!compensationType) payload.compensation_type = 'fix';
    else payload.compensation_type = compensationType;

    const response = await api.post('/items/employees', { ...payload, account: userId });
    const id = pickIdFromDirectusResponse(response);
    if (!id) throw new Error('Employee created, but missing id in response.');
    return id;
  }

  async function upsertDrivingLicenses(licenses: any[], accountId: string) {
    for (const license of licenses) {
      if (license?.id == null) {
        await api.post('/items/driverslicences', { ...license, employee: accountId });
        continue;
      }

      const update = { ...license, employee: accountId };
      delete update.id;
      await api.patch(`/items/driverslicences/${license.id}`, update);
    }
  }

  async function save(licenses: any[] = []): Promise<{ userId: string; employeeId: string } | null> {
    resetNotices();

    if (!hasPermission.value) {
      errorMessage.value = 'You do not have permissions to create employees and users.';
      return null;
    }

    if (!requiredFieldsFilled.value) {
      errorMessage.value = 'Please fill in the required fields.';
      return null;
    }

    saving.value = true;
    try {
      const userId = await createOrInviteUser();
      const employeeId = await createEmployee(userId);
      await upsertDrivingLicenses(licenses, userId);

      successMessage.value = 'Employee saved.';
      return { userId, employeeId };
    } catch (e) {
      console.error('Failed to create employee with user', e);
      const fallback = asTrimmedString(userFormData.value.password)
        ? 'Save failed.'
        : 'Save failed. If invitations are not configured, provide a password to create the user directly.';
      errorMessage.value = extractDirectusError(e, fallback);
      return null;
    } finally {
      saving.value = false;
    }
  }

  return {
    userFormData,
    employeeFormData,
    saving,
    errorMessage,
    successMessage,
    hasPermission,
    canSubmit,
    resetNotices,
    resetForms,
    discardAllChanges,
    save,
  };
}

