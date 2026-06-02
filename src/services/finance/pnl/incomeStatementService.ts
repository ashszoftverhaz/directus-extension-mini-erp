import type { useApi } from '@directus/extensions-sdk';
import { getBaseCurrencyCode } from '../../../module/utils/baseCurrencyPreference';
import type { IncomeStatementFilters, IncomeStatementResult } from './incomeStatementTypes';
import { buildPeriods } from './incomeStatementPeriodHelpers';
import {
  fetchAssetsForDepreciation,
  fetchExpensesForPeriods,
  fetchIncomesForPeriods,
} from './incomeStatementQueryHelpers';
import { computeIncomeStatementRows } from './incomeStatementCalculationHelpers';
import { getExchangeRate } from '../../../module/api/exchangeRateApi';

type ApiClient = ReturnType<typeof useApi>;

export async function getIncomeStatement(
  api: ApiClient,
  filters: IncomeStatementFilters,
): Promise<IncomeStatementResult> {
  const periods = buildPeriods(filters.startingDate, filters.frequency, 3);

  const [baseCurrencyCode, incomes, expenses, assets] = await Promise.all([
    getBaseCurrencyCode(api),
    fetchIncomesForPeriods(api, periods, getExchangeRate),
    fetchExpensesForPeriods(api, periods, getExchangeRate),
    fetchAssetsForDepreciation(api, periods, getExchangeRate),
  ]);

  const rows = computeIncomeStatementRows(incomes, expenses, assets, periods, filters.frequency);

  return {
    periods,
    rows,
    baseCurrencyCode,
  };
}
