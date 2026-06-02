import type {
  IncomeStatementFrequency,
  IncomeStatementPeriod,
  IncomeStatementRow,
  IncomeStatementRowKey,
} from './incomeStatementTypes';
import type {
  NormalizedAsset,
  NormalizedExpense,
  NormalizedIncome,
} from './incomeStatementQueryHelpers';

type PeriodBuckets<T> = Map<number, T[]>;

function bucketByPeriodIndex<T extends { paymentDate: Date }>(
  items: T[],
  periods: IncomeStatementPeriod[],
): PeriodBuckets<T> {
  const buckets: PeriodBuckets<T> = new Map();

  for (const period of periods) {
    buckets.set(period.index, []);
  }

  for (const item of items) {
    const target = periods.find(
      (period) => item.paymentDate >= period.startDate && item.paymentDate < period.endDate,
    );
    if (!target) continue;
    const bucket = buckets.get(target.index);
    if (bucket) bucket.push(item);
  }

  return buckets;
}

function bucketAssetsByPeriod(
  assets: NormalizedAsset[],
  periods: IncomeStatementPeriod[],
): PeriodBuckets<NormalizedAsset> {
  const buckets: PeriodBuckets<NormalizedAsset> = new Map();
  for (const period of periods) {
    buckets.set(period.index, []);
  }

  for (const asset of assets) {
    for (const period of periods) {
      if (isAssetActiveInPeriod(asset, period)) {
        const bucket = buckets.get(period.index);
        if (bucket) bucket.push(asset);
      }
    }
  }

  return buckets;
}

function isAssetActiveInPeriod(asset: NormalizedAsset, period: IncomeStatementPeriod): boolean {
  const endDate = new Date(asset.purchaseDate.getTime());
  endDate.setUTCMonth(endDate.getUTCMonth() + asset.usefulLifeMonths);

  const periodStart = period.startDate;
  const periodEnd = period.endDate;

  return endDate > periodStart && asset.purchaseDate < periodEnd;
}

function monthsInPeriod(period: IncomeStatementPeriod, asset: NormalizedAsset): number {
  const start = new Date(Math.max(asset.purchaseDate.getTime(), period.startDate.getTime()));
  const end = new Date(
    Math.min(
      addMonths(asset.purchaseDate, asset.usefulLifeMonths).getTime(),
      period.endDate.getTime(),
    ),
  );

  let months = 0;
  let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const endCursor = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));

  while (cursor < endCursor) {
    months += 1;
    cursor = addMonths(cursor, 1);
  }

  return months;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

function safeDivide(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0)
    return null;
  return numerator / denominator;
}

export function buildEmptyRow(key: IncomeStatementRowKey, label: string): IncomeStatementRow {
  return {
    key,
    label,
    values: [],
  };
}

export function computeIncomeStatementRows(
  incomes: NormalizedIncome[],
  expenses: NormalizedExpense[],
  assets: NormalizedAsset[],
  periods: IncomeStatementPeriod[],
  frequency: IncomeStatementFrequency,
): IncomeStatementRow[] {
  const incomeBuckets = bucketByPeriodIndex(incomes, periods);
  const expenseBuckets = bucketByPeriodIndex(expenses, periods);
  const assetBuckets = bucketAssetsByPeriod(assets, periods);

  const serviceRow = buildEmptyRow('revenue_service', 'Service');
  const assetRevenueRow = buildEmptyRow('revenue_asset', 'Asset');
  const otherRevenueRow = buildEmptyRow('revenue_other', 'Other');
  const revenueRow = buildEmptyRow('revenue', 'Revenue');

  const cogsRow = buildEmptyRow('cost_of_goods_sold', 'Cost of goods sold');
  const employeeSalaryRow = buildEmptyRow('employee_salary', 'Employee salary');
  const employeeCommissionRow = buildEmptyRow('employee_commission', 'Employee commission');
  const materialsRow = buildEmptyRow('materials', 'Materials');

  const grossProfitRow = buildEmptyRow('gross_profit', 'Gross Profit');
  const grossMarginRow = buildEmptyRow('gross_margin', 'Gross Margin');

  const depreciationRow = buildEmptyRow('depreciation_amortization', 'Depreciation & amortization');
  const operationalRow = buildEmptyRow('operational_ga', 'Operational (G&A)');
  const interestRow = buildEmptyRow('interest', 'Interest');

  const operatingIncomeRow = buildEmptyRow('operating_income', 'Operating income');
  const totalTaxesRow = buildEmptyRow('total_taxes', 'Total Taxes');
  const netIncomeRow = buildEmptyRow('net_income', 'Net Income');

  const ebitdaRow = buildEmptyRow('ebitda', 'EBITDA');
  const ebitdaMarginRow = buildEmptyRow('ebitda_margin', 'EBITDA Margin');

  for (const period of periods) {
    const incomeItems = incomeBuckets.get(period.index) ?? [];
    const expenseItems = expenseBuckets.get(period.index) ?? [];
    const assetItems = assetBuckets.get(period.index) ?? [];

    const serviceRevenue = sumBy(
      incomeItems.filter((i) => i.incomeType === 'service'),
      (i) => i.amountInBase,
    );
    const assetRevenue = sumBy(
      incomeItems.filter((i) => i.incomeType === 'asset'),
      (i) => i.amountInBase,
    );
    const otherRevenue = sumBy(
      incomeItems.filter((i) => i.incomeType === 'other'),
      (i) => i.amountInBase,
    );

    const totalRevenue = serviceRevenue + assetRevenue + otherRevenue;

    const materialsCost = -sumBy(
      expenseItems.filter((e) => e.expenseType === 'inventory_change'),
      (e) => e.amountInBase,
    );

    const employeeCost = -sumBy(
      expenseItems.filter((e) => e.expenseType === 'employee'),
      (e) => e.amountInBase,
    );

    const employeeSalary = employeeCost;
    const employeeCommission = 0;

    const cogs = materialsCost;

    const grossProfit = totalRevenue + cogs + employeeSalary + employeeCommission;
    const grossMargin = safeDivide(grossProfit, totalRevenue);

    const depreciation = -computeDepreciationForPeriod(assetItems, period, frequency);

    const operationalCost = -sumBy(
      expenseItems.filter((e) => e.expenseType === 'operational_cost'),
      (e) => e.amountInBase,
    );

    const interestCost = -sumBy(
      expenseItems.filter((e) => e.expenseType === 'interest'),
      (e) => e.amountInBase,
    );

    const operatingIncome = grossProfit + depreciation + operationalCost + interestCost;

    const totalTaxes = -sumBy(
      expenseItems.filter((e) => e.expenseType === 'taxes'),
      (e) => e.amountInBase,
    );

    const netIncome = operatingIncome + totalTaxes;

    const ebitda = grossProfit + interestCost + totalTaxes + depreciation;
    const ebitdaMargin = safeDivide(ebitda, totalRevenue);

    serviceRow.values.push(serviceRevenue);
    assetRevenueRow.values.push(assetRevenue);
    otherRevenueRow.values.push(otherRevenue);
    revenueRow.values.push(totalRevenue);

    cogsRow.values.push(cogs);
    employeeSalaryRow.values.push(employeeSalary);
    employeeCommissionRow.values.push(employeeCommission);
    materialsRow.values.push(materialsCost);

    grossProfitRow.values.push(grossProfit);
    grossMarginRow.values.push(grossMargin ?? 0);

    depreciationRow.values.push(depreciation);
    operationalRow.values.push(operationalCost);
    interestRow.values.push(interestCost);

    operatingIncomeRow.values.push(operatingIncome);
    totalTaxesRow.values.push(totalTaxes);
    netIncomeRow.values.push(netIncome);

    ebitdaRow.values.push(ebitda);
    ebitdaMarginRow.values.push(ebitdaMargin ?? 0);
  }

  revenueRow.section = 'revenue';
  revenueRow.emphasized = true;

  cogsRow.section = 'costs';
  employeeSalaryRow.section = 'costs';
  employeeCommissionRow.section = 'costs';
  materialsRow.section = 'costs';

  grossProfitRow.section = 'gross_profit';
  grossProfitRow.emphasized = true;
  grossMarginRow.section = 'gross_profit';

  depreciationRow.section = 'gross_profit';
  operationalRow.section = 'gross_profit';
  interestRow.section = 'gross_profit';

  operatingIncomeRow.section = 'operating_income';
  operatingIncomeRow.emphasized = true;

  totalTaxesRow.section = 'operating_income';

  netIncomeRow.section = 'net_income';
  netIncomeRow.emphasized = true;

  ebitdaRow.section = 'ebitda';
  ebitdaRow.emphasized = true;
  ebitdaMarginRow.section = 'ebitda';

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

function sumBy<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((total, item) => total + (Number(selector(item)) || 0), 0);
}

function computeDepreciationForPeriod(
  assets: NormalizedAsset[],
  period: IncomeStatementPeriod,
  frequency: IncomeStatementFrequency,
): number {
  let total = 0;

  for (const asset of assets) {
    const totalMonths = asset.usefulLifeMonths;
    if (!totalMonths || totalMonths <= 0) continue;

    const monthlyDepreciation = asset.purchaseAmountInBase / totalMonths;

    let monthsCount: number;
    if (frequency === 'monthly') {
      monthsCount = 1;
    } else if (frequency === 'quarterly') {
      monthsCount = 3;
    } else {
      monthsCount = 12;
    }

    const activeMonths = monthsInPeriod(period, asset);
    const appliedMonths = Math.min(monthsCount, activeMonths);
    if (appliedMonths <= 0) continue;

    total += monthlyDepreciation * appliedMonths;
  }

  return total;
}
