import type { IncomeStatementRowDto, PeriodGrouping } from './pnlTypes';
import type { Period } from './pnlPeriodHelpers';
import type { AssetRow, ExpenseRow, IncomeRow } from './pnlDomainTypes';
import {
  convertExpenseAmountToBaseCurrency,
  convertIncomeAmountToBaseCurrency,
  toNumber,
} from './pnlCurrencyHelpers';

/** Parses an ISO date string into a Date (or returns null). */
function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Safe division helper for ratio rows (fallback 0). */
function safeDivide(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return 0;
  return numerator / denominator;
}

/** Returns the matching period index for a date, or null if outside. */
function getPeriodIndexForDate(date: Date, periods: Period[]): number | null {
  for (const period of periods) {
    if (date >= period.startDate && date < period.endDate) return period.index;
  }
  return null;
}

/** Adds months to a date. */
function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

/** Returns true if the asset is active in the given period. */
function isAssetActiveInPeriod(asset: AssetRow, period: Period): boolean {
  const purchaseDate = parseDate(asset.payment_due_date);
  const lifeMonths = toNumber(asset.useful_life_months);
  if (!purchaseDate || lifeMonths <= 0) return false;

  const endDate = addMonths(purchaseDate, lifeMonths);
  return endDate > period.startDate && purchaseDate < period.endDate;
}

/** Returns how many lifetime months overlap this period. */
function activeMonthsInPeriod(asset: AssetRow, period: Period): number {
  const purchaseDate = parseDate(asset.payment_due_date);
  const lifeMonths = toNumber(asset.useful_life_months);
  if (!purchaseDate || lifeMonths <= 0) return 0;

  const assetEnd = addMonths(purchaseDate, lifeMonths);
  const start = new Date(Math.max(purchaseDate.getTime(), period.startDate.getTime()));
  const end = new Date(Math.min(assetEnd.getTime(), period.endDate.getTime()));

  let months = 0;
  let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const endCursor = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));

  while (cursor < endCursor) {
    months += 1;
    cursor = addMonths(cursor, 1);
  }

  return months;
}

type PeriodSums = {
  revenueService: number[];
  revenueAsset: number[];
  revenueOther: number[];
  expenseInventoryChange: number[];
  expenseOperational: number[];
  expenseInterest: number[];
  expenseTaxes: number[];
  expenseEmployee: number[];
  depreciation: number[];
};

/** Creates zero-initialized per-period sums for the income statement. */
function createPeriodSums(periods: Period[]): PeriodSums {
  const length = periods.length;
  const zeros = () => Array.from({ length }, () => 0);

  return {
    revenueService: zeros(),
    revenueAsset: zeros(),
    revenueOther: zeros(),
    expenseInventoryChange: zeros(),
    expenseOperational: zeros(),
    expenseInterest: zeros(),
    expenseTaxes: zeros(),
    expenseEmployee: zeros(),
    depreciation: zeros(),
  };
}

/** Aggregates income rows into per-period revenue buckets (in base currency). */
function accumulateIncomes(incomes: IncomeRow[], periods: Period[], sums: PeriodSums): void {
  for (const income of incomes) {
    const date = parseDate(income.payment_date);
    if (!date) continue;

    const periodIndex = getPeriodIndexForDate(date, periods);
    if (periodIndex === null) continue;

    const amountInBase = convertIncomeAmountToBaseCurrency(
      income.amount,
      income.base_currency_fx_rate,
    );

    if (income.income_type === 'service') {
      sums.revenueService[periodIndex] = (sums.revenueService[periodIndex] ?? 0) + amountInBase;
    } else if (income.income_type === 'asset') {
      sums.revenueAsset[periodIndex] = (sums.revenueAsset[periodIndex] ?? 0) + amountInBase;
    } else {
      sums.revenueOther[periodIndex] = (sums.revenueOther[periodIndex] ?? 0) + amountInBase;
    }
  }
}

/** Aggregates expense rows into per-period cost buckets (in base currency). */
function accumulateExpenses(expenses: ExpenseRow[], periods: Period[], sums: PeriodSums): void {
  for (const expense of expenses) {
    const date = parseDate(expense.payment_date);
    if (!date) continue;

    const periodIndex = getPeriodIndexForDate(date, periods);
    if (periodIndex === null) continue;

    const amountInBase = convertExpenseAmountToBaseCurrency(expense.amount, expense.currency_rate);

    if (expense.expense_type === 'inventory_change') {
      sums.expenseInventoryChange[periodIndex] =
        (sums.expenseInventoryChange[periodIndex] ?? 0) + amountInBase;
    } else if (expense.expense_type === 'operational_cost') {
      sums.expenseOperational[periodIndex] =
        (sums.expenseOperational[periodIndex] ?? 0) + amountInBase;
    } else if (expense.expense_type === 'interest') {
      sums.expenseInterest[periodIndex] = (sums.expenseInterest[periodIndex] ?? 0) + amountInBase;
    } else if (expense.expense_type === 'taxes') {
      sums.expenseTaxes[periodIndex] = (sums.expenseTaxes[periodIndex] ?? 0) + amountInBase;
    } else if (expense.expense_type === 'employee') {
      sums.expenseEmployee[periodIndex] = (sums.expenseEmployee[periodIndex] ?? 0) + amountInBase;
    }
  }
}

/** Distributes depreciation for each asset across the periods based on useful life. */
function accumulateDepreciation(
  assets: AssetRow[],
  periods: Period[],
  _periodGrouping: PeriodGrouping,
  sums: PeriodSums,
): void {
  for (const asset of assets) {
    const purchaseDate = parseDate(asset.payment_due_date);
    const lifeMonths = toNumber(asset.useful_life_months);
    const purchaseAmount = toNumber(asset.purchase_amount);

    if (!purchaseDate || lifeMonths <= 0 || purchaseAmount === 0) continue;

    const monthlyDepreciation = purchaseAmount / lifeMonths;

    for (const period of periods) {
      if (!isAssetActiveInPeriod(asset, period)) continue;

      const activeMonths = activeMonthsInPeriod(asset, period);
      if (activeMonths <= 0) continue;

      const depreciationForPeriod = monthlyDepreciation * activeMonths;
      sums.depreciation[period.index] =
        (sums.depreciation[period.index] ?? 0) + depreciationForPeriod;
    }
  }
}

/** Computes revenue component sums (service/asset/other) for a period. */
function computeRevenueForPeriod(
  periodIndex: number,
  sums: PeriodSums,
): {
  serviceRevenue: number;
  assetRevenue: number;
  otherRevenue: number;
  totalRevenue: number;
} {
  const serviceRevenue = sums.revenueService[periodIndex] ?? 0;
  const assetRevenue = sums.revenueAsset[periodIndex] ?? 0;
  const otherRevenue = sums.revenueOther[periodIndex] ?? 0;
  return {
    serviceRevenue,
    assetRevenue,
    otherRevenue,
    totalRevenue: serviceRevenue + assetRevenue + otherRevenue,
  };
}

/** Computes inventory-based costs (COGS + Materials) for a period. */
function computeInventoryBasedCosts(
  periodIndex: number,
  sums: PeriodSums,
): {
  cogs: number;
  materials: number;
} {
  const inventoryChangeCost = -(sums.expenseInventoryChange[periodIndex] ?? 0);
  return {
    cogs: inventoryChangeCost,
    materials: inventoryChangeCost,
  };
}

/** Computes operational and financial cost components for a period. */
function computeOperationalAndFinancialCosts(
  periodIndex: number,
  sums: PeriodSums,
): {
  operationalCost: number;
  interestCost: number;
  taxCost: number;
} {
  const operationalCost = -(sums.expenseOperational[periodIndex] ?? 0);
  const interestCost = -(sums.expenseInterest[periodIndex] ?? 0);
  const taxCost = -(sums.expenseTaxes[periodIndex] ?? 0);
  return { operationalCost, interestCost, taxCost };
}

/** Computes employee cost components for a period. */
function computeEmployeeCosts(
  periodIndex: number,
  sums: PeriodSums,
): {
  employeeSalary: number;
  employeeCommission: number;
} {
  const employeeSalary = -(sums.expenseEmployee[periodIndex] ?? 0);
  const employeeCommission = 0;
  return { employeeSalary, employeeCommission };
}

/** Computes gross profit for a period. */
function computeGrossProfitForPeriod(params: {
  totalRevenue: number;
  cogs: number;
  employeeSalary: number;
  employeeCommission: number;
}): number {
  const { totalRevenue, cogs, employeeSalary, employeeCommission } = params;
  return totalRevenue + cogs + employeeSalary + employeeCommission;
}

/** Computes gross margin ratio for a period. */
function computeGrossMarginForPeriod(params: {
  grossProfit: number;
  totalRevenue: number;
}): number {
  const { grossProfit, totalRevenue } = params;
  return safeDivide(grossProfit, totalRevenue);
}

/** Computes depreciation amount for a period. */
function computeDepreciationForPeriod(periodIndex: number, sums: PeriodSums): number {
  return -(sums.depreciation[periodIndex] ?? 0);
}

/** Computes operating income for a period. */
function computeOperatingIncomeForPeriod(params: {
  grossProfit: number;
  depreciation: number;
  operationalCost: number;
  interestCost: number;
}): number {
  const { grossProfit, depreciation, operationalCost, interestCost } = params;
  return grossProfit + depreciation + operationalCost + interestCost;
}

/** Computes net income for a period. */
function computeNetIncomeForPeriod(params: { operatingIncome: number; taxCost: number }): number {
  const { operatingIncome, taxCost } = params;
  return operatingIncome + taxCost;
}

/** Computes EBITDA for a period. */
function computeEbitdaForPeriod(params: {
  grossProfit: number;
  interestCost: number;
  taxCost: number;
  depreciation: number;
}): number {
  const { grossProfit, interestCost, taxCost, depreciation } = params;
  return grossProfit + interestCost + taxCost + depreciation;
}

/** Computes EBITDA margin for a period. */
function computeEbitdaMarginForPeriod(params: { ebitda: number; totalRevenue: number }): number {
  const { ebitda, totalRevenue } = params;
  return safeDivide(ebitda, totalRevenue);
}

/** Computes the ordered Income Statement rows for the 3 periods */
export function computeIncomeStatementRows(params: {
  incomes: IncomeRow[];
  expenses: ExpenseRow[];
  assets: AssetRow[];
  periods: Period[];
  periodGrouping: PeriodGrouping;
}): IncomeStatementRowDto[] {
  const { incomes, expenses, assets, periods, periodGrouping } = params;

  const sums = createPeriodSums(periods);
  accumulateIncomes(incomes, periods, sums);
  accumulateExpenses(expenses, periods, sums);
  accumulateDepreciation(assets, periods, periodGrouping, sums);

  const rows: Record<string, IncomeStatementRowDto> = {};
  const ensureRow = (key: string, label: string, emphasized = false): IncomeStatementRowDto => {
    if (!rows[key]) rows[key] = { key, label, emphasized, values: [] };
    return rows[key]!;
  };

  const revenueRow = ensureRow('revenue', 'Revenue', true);
  const serviceRow = ensureRow('revenue_service', 'Service');
  const assetRevenueRow = ensureRow('revenue_asset', 'Asset');
  const otherRevenueRow = ensureRow('revenue_other', 'Other');

  const cogsRow = ensureRow('cost_of_goods_sold', 'Cost of goods sold');
  const employeeSalaryRow = ensureRow('employee_salary', 'Employee salary');
  const employeeCommissionRow = ensureRow('employee_commission', 'Employee commission');
  const materialsRow = ensureRow('materials', 'Materials');

  const grossProfitRow = ensureRow('gross_profit', 'Gross Profit', true);
  const grossMarginRow = ensureRow('gross_margin', 'Gross Margin');

  const depreciationRow = ensureRow('depreciation_amortization', 'Depreciation & amortization');
  const operationalRow = ensureRow('operational_ga', 'Operational (G&A)');
  const interestRow = ensureRow('interest', 'Interest');

  const operatingIncomeRow = ensureRow('operating_income', 'Operating income', true);
  const totalTaxesRow = ensureRow('total_taxes', 'Total Taxes');
  const netIncomeRow = ensureRow('net_income', 'Net Income', true);

  const ebitdaRow = ensureRow('ebitda', 'EBITDA', true);
  const ebitdaMarginRow = ensureRow('ebitda_margin', 'EBITDA Margin');

  for (const period of periods) {
    const i = period.index;

    const { serviceRevenue, assetRevenue, otherRevenue, totalRevenue } = computeRevenueForPeriod(
      i,
      sums,
    );
    const { cogs, materials } = computeInventoryBasedCosts(i, sums);
    const { operationalCost, interestCost, taxCost } = computeOperationalAndFinancialCosts(i, sums);
    const { employeeSalary, employeeCommission } = computeEmployeeCosts(i, sums);

    const grossProfit = computeGrossProfitForPeriod({
      totalRevenue,
      cogs,
      employeeSalary,
      employeeCommission,
    });
    const grossMargin = computeGrossMarginForPeriod({ grossProfit, totalRevenue });

    const depreciation = computeDepreciationForPeriod(i, sums);
    const operatingIncome = computeOperatingIncomeForPeriod({
      grossProfit,
      depreciation,
      operationalCost,
      interestCost,
    });
    const netIncome = computeNetIncomeForPeriod({ operatingIncome, taxCost });
    const ebitda = computeEbitdaForPeriod({ grossProfit, interestCost, taxCost, depreciation });
    const ebitdaMargin = computeEbitdaMarginForPeriod({ ebitda, totalRevenue });

    revenueRow.values.push(totalRevenue);
    serviceRow.values.push(serviceRevenue);
    assetRevenueRow.values.push(assetRevenue);
    otherRevenueRow.values.push(otherRevenue);

    cogsRow.values.push(cogs);
    employeeSalaryRow.values.push(employeeSalary);
    employeeCommissionRow.values.push(employeeCommission);
    materialsRow.values.push(materials);

    grossProfitRow.values.push(grossProfit);
    grossMarginRow.values.push(grossMargin);

    depreciationRow.values.push(depreciation);
    operationalRow.values.push(operationalCost);
    interestRow.values.push(interestCost);

    operatingIncomeRow.values.push(operatingIncome);
    totalTaxesRow.values.push(taxCost);
    netIncomeRow.values.push(netIncome);

    ebitdaRow.values.push(ebitda);
    ebitdaMarginRow.values.push(ebitdaMargin);
  }

  return [
    revenueRow,
    serviceRow,
    assetRevenueRow,
    otherRevenueRow,
    cogsRow,
    employeeSalaryRow,
    employeeCommissionRow,
    materialsRow,
    grossProfitRow,
    grossMarginRow,
    depreciationRow,
    operationalRow,
    interestRow,
    operatingIncomeRow,
    totalTaxesRow,
    netIncomeRow,
    ebitdaRow,
    ebitdaMarginRow,
  ];
}
