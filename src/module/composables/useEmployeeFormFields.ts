import { computed, type Ref } from 'vue';

function byKey(arr: any[], key: string) {
  return (arr ?? []).find((f: any) => String(f?.field ?? '') === key);
}

function cleanMeta(original: any) {
  const meta = { ...original };
  delete meta.sort;
  delete meta.group;
  return meta;
}

export function useEmployeeFormFields(options: {
  userFields: Ref<any[]>;
  employeeFields: Ref<any[]>;
  includeUserAccountFields?: boolean;
}) {
  const { userFields, employeeFields, includeUserAccountFields = false } = options;

  const generalFieldData = computed(() => {
    const user = userFields.value ?? [];
    const employee = employeeFields.value ?? [];

    const fields = [];

    // Row 1: first_name - last_name
    const firstName = byKey(user, 'first_name');
    if (firstName) {
      fields.push({
        ...firstName,
        name: 'First name',
        meta: { ...cleanMeta(firstName.meta), required: true, width: 'half', sort: 1 },
      });
    }

    const lastName = byKey(user, 'last_name');
    if (lastName) {
      fields.push({
        ...lastName,
        name: 'Last name',
        meta: { ...cleanMeta(lastName.meta), required: true, width: 'half', sort: 2 },
      });
    }

    // Row 2: email - password
    const email = byKey(user, 'email');
    if (email) {
      fields.push({
        ...email,
        name: 'Email',
        meta: { ...cleanMeta(email.meta), required: true, width: 'half', sort: 3 },
      });
    }

    const password = byKey(user, 'password');
    if (password) {
      fields.push({
        ...password,
        name: 'Password',
        meta: {
          ...cleanMeta(password.meta),
          required: false,
          width: 'half',
          sort: 4,
          note: includeUserAccountFields
            ? 'Optional. Leave empty to invite the user instead.'
            : 'Leave empty to keep current password',
          options: {
            ...(password.meta?.options ?? {}),
            placeholder: includeUserAccountFields
              ? 'Optional – leave empty to invite'
              : 'Leave empty to keep current',
          },
        },
      });
    }

    // Row 3: position
    const role = byKey(user, 'role');
    if (role) {
      const roleMeta = cleanMeta(role.meta);
      roleMeta.special = null;
      fields.push({
        ...role,
        name: 'Position',
        special: null,
        meta: { ...roleMeta, required: true, width: 'full', sort: 5 },
      });
    }

    // Row 4: seniority - employment_start_date
    const seniority = byKey(employee, 'seniority');
    if (seniority) {
      fields.push({
        ...seniority,
        name: 'Seniority',
        meta: { ...cleanMeta(seniority.meta), width: 'half', sort: 6 },
      });
    }

    // Row 4 (continued): employment_start_date
    const employmentStart = byKey(employee, 'employment_start_date');
    if (employmentStart) {
      fields.push({
        ...employmentStart,
        name: 'Employment start',
        meta: { ...cleanMeta(employmentStart.meta), width: 'half', sort: 7 },
      });
    }

    return fields.sort((a: any, b: any) => (a.meta?.sort ?? 999) - (b.meta?.sort ?? 999));
  });

  const salaryFieldData = computed(() => {
    const employee = employeeFields.value ?? [];
    const fields = [];

    const compensation = byKey(employee, 'compensation_amount');
    if (compensation) {
      fields.push({
        ...compensation,
        name: 'Net salary / month',
        meta: { 
          ...cleanMeta(compensation.meta), 
          width: 'half', 
          sort: 1, 
          interface: 'formatted-number', },
      });
    }

    const currency = byKey(employee, 'currency');
    if (currency) {
      fields.push({
        ...currency,
        name: 'Currency',
        meta: { ...cleanMeta(currency.meta), width: 'half', sort: 2 },
      });
    }

    const salaryTaxesApplied = byKey(employee, 'salary_taxes_applied');
    if (salaryTaxesApplied) {
      fields.push({
        ...salaryTaxesApplied,
        name: 'Taxes applied',
        meta: { ...cleanMeta(salaryTaxesApplied.meta), width: 'half', sort: 3 },
      });
    }

    const grossSalaryPerMonth = byKey(employee, 'gross_salary_per_month');
    if (grossSalaryPerMonth) {
      fields.push({
        ...grossSalaryPerMonth,
        name: 'Gross salary / month',
        meta: { ...cleanMeta(grossSalaryPerMonth.meta), width: 'half', sort: 4, readonly: true, interface: 'formatted-number' },
      });
    }

    return fields.sort((a: any, b: any) => (a.meta?.sort ?? 999) - (b.meta?.sort ?? 999));
  });

  const commissionFieldData = computed(() => {
    const employee = employeeFields.value ?? [];
    const fields = [];

    const compensationType = byKey(employee, 'compensation_type');
    if (compensationType) {
      fields.push({
        ...compensationType,
        name: 'Commission type',
        meta: { ...cleanMeta(compensationType.meta), width: 'half', sort: 1 },
      });
    }

    const commissionAmount = byKey(employee, 'commission_amount');
    if (commissionAmount) {
      fields.push({
        ...commissionAmount,
        name: 'Commission amount',
        meta: { ...cleanMeta(commissionAmount.meta), width: 'half', sort: 2 },
      });
    }

    const commissionTaxesApplied = byKey(employee, 'commission_taxes_applied');
    if (commissionTaxesApplied) {
      fields.push({
        ...commissionTaxesApplied,
        name: 'Taxes applied',
        meta: { ...cleanMeta(commissionTaxesApplied.meta), width: 'full', sort: 3 },
      });
    }

    return fields.sort((a: any, b: any) => (a.meta?.sort ?? 999) - (b.meta?.sort ?? 999));
  });

  const trainingsFieldData = computed(() => {
    const training = byKey(employeeFields.value ?? [], 'participated_in');
    
    return training ? [training] : [];
  });

  return {
    generalFieldData,
    salaryFieldData,
    commissionFieldData,
    trainingsFieldData,
  };
}
