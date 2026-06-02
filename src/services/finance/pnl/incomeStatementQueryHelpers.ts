import type { useApi } from '@directus/extensions-sdk';
import type { IncomeStatementPeriod } from './incomeStatementTypes';
import type { DirectusItemsResponse } from '../../../module/types/apiTypes';

type ApiClient = ReturnType<typeof useApi>;

type IncomeItem = {
  id: string;
  payment_date: string | null;
  amount: number;
  income_type: 'service' | 'asset' | 'other';
  currency: { id: string } | string | null;
  base_currency_fx_rate: number | null;
};

type ExpenseItem = {
  id: string;
  payment_date: string | null;
  amount: number;
  expense_type:
    | 'asset'
    | 'inventory_change'
    | 'operational_cost'
    | 'employee'
    | 'interest'
    | 'taxes';
  currency: { id: string } | string | null;
  currency_rate: number | null;
};

type AssetItem = {
  id: string;
  purchase_amount: number;
  purchase_currency: { id: string } | string | null;
  useful_life_months: number | null;
  payment_due_date: string | null;
};

export type NormalizedIncome = {
  id: string;
  paymentDate: Date;
  amountInBase: number;
  incomeType: IncomeItem['income_type'];
};

export type NormalizedExpense = {
  id: string;
  paymentDate: Date;
  amountInBase: number;
  expenseType: ExpenseItem['expense_type'];
};

export type NormalizedAsset = {
  id: string;
  purchaseDate: Date;
  purchaseAmountInBase: number;
  usefulLifeMonths: number;
};

type ExchangeRateGetter = (api: ApiClient, date: Date, toCurrencyId: string) => Promise<number>;

function parseIsoDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getCurrencyId(value: ExpenseItem['currency'] | IncomeItem['currency']): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value.id ?? null;
}

function getAssetCurrencyId(value: AssetItem['purchase_currency']): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value.id ?? null;
}

export async function fetchIncomesForPeriods(
  api: ApiClient,
  periods: IncomeStatementPeriod[],
  getExchangeRate: ExchangeRateGetter,
): Promise<NormalizedIncome[]> {
  if (periods.length === 0) return [];

  const overallStart = periods[0]!.startDate;
  const overallEnd = periods[periods.length - 1]!.endDate;

  const response = await api.get<DirectusItemsResponse<IncomeItem[]>>('/items/incomes', {
    params: {
      fields: [
        'id',
        'payment_date',
        'amount',
        'income_type',
        'currency.id',
        'base_currency_fx_rate',
      ],
      filter: {
        payment_date: {
          _gte: overallStart.toISOString(),
          _lt: overallEnd.toISOString(),
        },
      },
      limit: -1,
    },
  });

  const rawItems = response.data?.data ?? [];
  const normalized: NormalizedIncome[] = [];

  const fxCache = new Map<string, number>();

  for (const item of rawItems) {
    const paymentDate = parseIsoDate(item.payment_date);
    if (!paymentDate) continue;

    const currencyId = getCurrencyId(item.currency);
    const baseRate = item.base_currency_fx_rate;

    let rate = baseRate ?? null;

    if (!rate && currencyId) {
      const cacheKey = `${paymentDate.toISOString().slice(0, 10)}|${currencyId}`;
      const cached = fxCache.get(cacheKey);
      if (cached) {
        rate = cached;
      } else {
        // TODO Maybe batch requests here?
        rate = await getExchangeRate(api, paymentDate, currencyId);
        fxCache.set(cacheKey, rate);
      }
    }

    const finalRate = rate ?? 1;
    const amountInBase = Number(item.amount ?? 0) * finalRate;

    normalized.push({
      id: item.id,
      paymentDate,
      amountInBase,
      incomeType: item.income_type,
    });
  }

  return normalized;
}

export async function fetchExpensesForPeriods(
  api: ApiClient,
  periods: IncomeStatementPeriod[],
  getExchangeRate: ExchangeRateGetter,
): Promise<NormalizedExpense[]> {
  if (periods.length === 0) return [];

  const overallStart = periods[0]!.startDate;
  const overallEnd = periods[periods.length - 1]!.endDate;

  const response = await api.get<DirectusItemsResponse<ExpenseItem[]>>('/items/expenses', {
    params: {
      fields: ['id', 'payment_date', 'amount', 'expense_type', 'currency.id', 'currency_rate'],
      filter: {
        payment_date: {
          _gte: overallStart.toISOString(),
          _lt: overallEnd.toISOString(),
        },
      },
      limit: -1,
    },
  });

  const rawItems = response.data?.data ?? [];
  const normalized: NormalizedExpense[] = [];
  const fxCache = new Map<string, number>();

  for (const item of rawItems) {
    const paymentDate = parseIsoDate(item.payment_date);
    if (!paymentDate) continue;

    const currencyId = getCurrencyId(item.currency);
    const baseRate = item.currency_rate;

    let rate = baseRate ?? null;

    if (!rate && currencyId) {
      const cacheKey = `${paymentDate.toISOString().slice(0, 10)}|${currencyId}`;
      const cached = fxCache.get(cacheKey);
      if (cached) {
        rate = cached;
      } else {
        rate = await getExchangeRate(api, paymentDate, currencyId);
        fxCache.set(cacheKey, rate);
      }
    }

    const finalRate = rate ?? 1;
    const amountInBase = Number(item.amount ?? 0) * finalRate;

    normalized.push({
      id: item.id,
      paymentDate,
      amountInBase,
      expenseType: item.expense_type,
    });
  }

  return normalized;
}

export async function fetchAssetsForDepreciation(
  api: ApiClient,
  periods: IncomeStatementPeriod[],
  getExchangeRate: ExchangeRateGetter,
): Promise<NormalizedAsset[]> {
  if (periods.length === 0) return [];

  const overallEnd = periods[periods.length - 1]!.endDate;

  const response = await api.get<DirectusItemsResponse<AssetItem[]>>('/items/assets', {
    params: {
      fields: [
        'id',
        'purchase_amount',
        'purchase_currency.id',
        'useful_life_months',
        'payment_due_date',
      ],
      filter: {
        payment_due_date: {
          _lte: overallEnd.toISOString(),
        },
      },
      limit: -1,
    },
  });

  const rawItems = response.data?.data ?? [];
  const normalized: NormalizedAsset[] = [];
  const fxCache = new Map<string, number>();

  for (const item of rawItems) {
    if (!item.useful_life_months || item.useful_life_months <= 0) continue;

    const purchaseDate = parseIsoDate(item.payment_due_date);
    if (!purchaseDate) continue;

    const currencyId = getAssetCurrencyId(item.purchase_currency);

    let rate: number | null = null;

    if (currencyId) {
      const cacheKey = `${purchaseDate.toISOString().slice(0, 10)}|${currencyId}`;
      const cached = fxCache.get(cacheKey);
      if (cached) {
        rate = cached;
      } else {
        rate = await getExchangeRate(api, purchaseDate, currencyId);
        fxCache.set(cacheKey, rate);
      }
    }

    const finalRate = rate ?? 1;
    const purchaseAmountInBase = Number(item.purchase_amount ?? 0) * finalRate;

    normalized.push({
      id: item.id,
      purchaseDate,
      purchaseAmountInBase,
      usefulLifeMonths: item.useful_life_months,
    });
  }

  return normalized;
}
