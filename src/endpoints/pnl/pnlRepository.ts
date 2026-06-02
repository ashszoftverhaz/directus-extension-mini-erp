import type {
  AssetRow,
  BaseCurrencySettingRow,
  EmployeeRow,
  ExpenseRow,
  IncomeRow,
} from './pnlDomainTypes';

/** Reads `erp_settings.base_currency` and returns its uppercased code (e.g. "HUF") */
export async function getBaseCurrencyCode(
  services: any,
  accountability: any,
  schema: any,
): Promise<string | null> {
  const { ItemsService } = services;
  const erpSettingsService = new ItemsService('erp_settings', {
    schema,
    accountability,
  });

  const result = (await erpSettingsService.readByQuery({
    filter: { key: { _eq: 'base_currency' } },
    limit: 1,
  })) as BaseCurrencySettingRow[];

  const value = result?.[0]?.value?.trim();
  return value ? value.toUpperCase() : null;
}

/** Returns incomes within the given time range (start inclusive, end exclusive) */
export async function getIncomesInRange(
  services: any,
  accountability: any,
  schema: any,
  start: Date,
  end: Date,
): Promise<IncomeRow[]> {
  const { ItemsService } = services;
  const incomesService = new ItemsService('incomes', {
    schema,
    accountability,
  });
  return incomesService.readByQuery({
    filter: {
      payment_date: {
        _gte: start.toISOString(),
        _lt: end.toISOString(),
      },
    },
    fields: ['id', 'payment_date', 'income_type', 'amount', 'base_currency_fx_rate'],
  }) as Promise<IncomeRow[]>;
}

/** Returns expenses within the given time range (start inclusive, end exclusive) */
export async function getExpensesInRange(
  services: any,
  accountability: any,
  schema: any,
  start: Date,
  end: Date,
): Promise<ExpenseRow[]> {
  const { ItemsService } = services;
  const expensesService = new ItemsService('expenses', {
    schema,
    accountability,
  });
  return expensesService.readByQuery({
    filter: {
      payment_date: {
        _gte: start.toISOString(),
        _lt: end.toISOString(),
      },
    },
    fields: ['id', 'payment_date', 'expense_type', 'amount', 'currency_rate'],
  }) as Promise<ExpenseRow[]>;
}

/** Returns assets up to the overall end date (used for depreciation calculation) */
export async function getAssetsForDepreciation(
  services: any,
  accountability: any,
  schema: any,
  end: Date): Promise<AssetRow[]> {
  const { ItemsService } = services;
  const assetsService = new ItemsService('assets', {
    schema,
    accountability,
  });

  type AssetWithExpensesRow = {
    id: string;
    payment_due_date: string | null;
    useful_life_months: unknown;
    expenses?: Array<{
      expenses_id?: {
        expense_type?: string | null;
        amount?: unknown;
        currency_rate?: unknown;
      };
    }>;
  };

  const rows = (await assetsService.readByQuery({
    fields: [
      'id',
      'payment_due_date',
      'useful_life_months',
      'expenses.expenses_id.expense_type',
      'expenses.expenses_id.amount',
      'expenses.expenses_id.currency_rate',
    ],
    filter: {
      payment_due_date: {
        _nnull: true,
        _lt: end.toISOString(),
      },
      // Filter through relation (expenses_assets -> expenses)
      expenses: {
        expenses_id: {
          expense_type: {
            _eq: 'asset',
          },
        },
      },
    },
  })) as AssetWithExpensesRow[];

  return rows.map((asset) => {
    const purchase_amount = (asset.expenses ?? []).reduce((sum, relation) => {
      const expense = relation.expenses_id;
      if (!expense || expense.expense_type !== 'asset') return sum;

      const amount = Number(expense.amount);
      const currencyRate = Number(expense.currency_rate);

      if (!Number.isFinite(amount) || !Number.isFinite(currencyRate) || currencyRate === 0) {
        return sum;
      }

      return sum + amount / currencyRate;
    }, 0);

    return {
      id: asset.id,
      payment_due_date: asset.payment_due_date,
      useful_life_months: asset.useful_life_months,
      purchase_amount,
    };
  });
}

/** Returns employees used for salary/commission projection in the income statement */
export async function getEmployees(
  services: any,
  accountability: any,
  schema: any,
): Promise<EmployeeRow[]> {
  const { ItemsService } = services;
  const employeesService = new ItemsService('employees', {
    schema,
    accountability,
  });
  return employeesService.readByQuery({
    fields: ['id', 'employment_start_date', 'compensation_amount', 'commission_amount'],
  }) as Promise<EmployeeRow[]>;
}
