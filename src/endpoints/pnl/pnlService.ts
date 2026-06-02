import type { IncomeStatementResponseDto, PeriodGrouping } from './pnlTypes';
import { buildPeriods } from './pnlPeriodHelpers';
import {
  getAssetsForDepreciation,
  getBaseCurrencyCode,
  getExpensesInRange,
  getIncomesInRange,
} from './pnlRepository';
import { computeIncomeStatementRows } from './pnlCalculator';

/** Builds the Income Statement view for the given starting period and grouping */
export async function getIncomeStatementView(params: {
  services: any;
  schema: any;
  accountability: any;
  startingDate: Date;
  periodGrouping: PeriodGrouping;
}): Promise<IncomeStatementResponseDto> {
  const { services, schema, accountability, startingDate, periodGrouping } = params;

  const periods = buildPeriods(startingDate, periodGrouping);

  const overallStart = periods[0]!.startDate;
  const overallEnd = periods[periods.length - 1]!.endDate;

  const [baseCurrencyCode, incomes, expenses, assets] = await Promise.all([
    getBaseCurrencyCode(services, accountability, schema),
    getIncomesInRange(services, accountability, schema, overallStart, overallEnd),
    getExpensesInRange(services, accountability, schema, overallStart, overallEnd),
    getAssetsForDepreciation(services, accountability, schema, overallEnd),
    //getEmployees(services, accountability, schema),
  ]);

  const rows = computeIncomeStatementRows({
    incomes,
    expenses,
    assets,
    periods,
    periodGrouping,
  });

  return {
    baseCurrencyCode,
    periods: periods.map((p) => ({
      index: p.index,
      startDate: p.startDate.toISOString(),
      endDate: p.endDate.toISOString(),
      label: p.label,
    })),
    rows,
  };
}
