import { computeIncomeStatementRows } from '../endpoints/pnl/pnlCalculator';
import { buildPeriods } from '../endpoints/pnl/pnlPeriodHelpers';
import type { AssetRow, ExpenseRow, IncomeRow } from '../endpoints/pnl/pnlDomainTypes';
import type { IncomeStatementRowDto, PeriodGrouping } from '../endpoints/pnl/pnlTypes';

function getRow(rows: IncomeStatementRowDto[], key: string): IncomeStatementRowDto {
  const row = rows.find((candidate) => candidate.key === key);
  if (!row) throw new Error(`Missing row for key: ${key}`);
  return row;
}

function normalizeValues(values: Array<number | null>): Array<number | null> {
  return values.map((value) => {
    if (typeof value === 'number' && Object.is(value, -0)) return 0;
    return value;
  });
}

describe('computeIncomeStatementRows', () => {
  const periodGrouping: PeriodGrouping = 'monthly';
  const periods = buildPeriods(new Date('2025-01-01T00:00:00.000Z'), periodGrouping);

  it('computes a complete income statement (revenue, costs, depreciation, margins)', () => {
    const incomes: IncomeRow[] = [
      {
        id: 'inc_service_jan',
        payment_date: '2025-01-15T00:00:00.000Z',
        income_type: 'service',
        amount: 800, // base = 800 / 400
        base_currency_fx_rate: 400,
      },
      {
        id: 'inc_asset_feb',
        payment_date: '2025-02-10T00:00:00.000Z',
        income_type: 'asset',
        amount: 1200, // base = 1200 / 600
        base_currency_fx_rate: 600,
      },
      {
        id: 'inc_other_mar_rate0_fallback',
        payment_date: '2025-03-05T00:00:00.000Z',
        income_type: 'other',
        amount: 1000, // rate <= 0 => fallback to raw numeric amount
        base_currency_fx_rate: 0,
      },
      {
        id: 'inc_null_date_is_skipped',
        payment_date: null,
        income_type: 'service',
        amount: 999,
        base_currency_fx_rate: 1,
      },
      {
        id: 'inc_invalid_date_is_skipped',
        payment_date: 'not-a-date',
        income_type: 'service',
        amount: 999,
        base_currency_fx_rate: 1,
      },
    ];

    const expenses: ExpenseRow[] = [
      {
        id: 'exp_inventory_jan',
        payment_date: '2025-01-20T00:00:00.000Z',
        expense_type: 'inventory_change',
        amount: 400, // base = 400 / 200
        currency_rate: 200,
      },
      {
        id: 'exp_operational_feb',
        payment_date: '2025-02-12T00:00:00.000Z',
        expense_type: 'operational_cost',
        amount: 300, // base = 300 / 100
        currency_rate: 100,
      },
      {
        id: 'exp_interest_feb',
        payment_date: '2025-02-15T00:00:00.000Z',
        expense_type: 'interest',
        amount: 100, // base = 100 / 50
        currency_rate: 50,
      },
      {
        id: 'exp_taxes_mar_rate0_fallback',
        payment_date: '2025-03-09T00:00:00.000Z',
        expense_type: 'taxes',
        amount: 250, // rate <= 0 => fallback to raw numeric amount
        currency_rate: 0,
      },
      {
        id: 'exp_employee_mar',
        payment_date: '2025-03-11T00:00:00.000Z',
        expense_type: 'employee',
        amount: 600, // base = 600 / 300
        currency_rate: 300,
      },
      {
        id: 'exp_invalid_date_is_skipped',
        payment_date: null,
        expense_type: 'operational_cost',
        amount: 123,
        currency_rate: 1,
      },
    ];

    const assets: AssetRow[] = [
      {
        id: 'asset_depr_3_months_mid_month_start',
        payment_due_date: '2025-01-15T00:00:00.000Z',
        purchase_amount: 1200,
        useful_life_months: 3,
      },
      {
        id: 'asset_depr_single_month_exact_boundary',
        payment_due_date: '2025-02-01T00:00:00.000Z',
        purchase_amount: 300,
        useful_life_months: 1,
      },
      {
        id: 'asset_skipped_no_life',
        payment_due_date: '2025-01-10T00:00:00.000Z',
        purchase_amount: 999,
        useful_life_months: 0,
      },
      {
        id: 'asset_skipped_null_purchase_date',
        payment_due_date: null,
        purchase_amount: 999,
        useful_life_months: 12,
      },
    ];

    const rows = computeIncomeStatementRows({
      incomes,
      expenses,
      assets,
      periods,
      periodGrouping,
    });

    expect(rows).toHaveLength(18);
    for (const row of rows) {
      expect(row.values).toHaveLength(periods.length);
    }

    // Revenue
    expect(getRow(rows, 'revenue').values).toEqual([2, 2, 1000]);
    expect(getRow(rows, 'revenue_service').values).toEqual([2, 0, 0]);
    expect(getRow(rows, 'revenue_asset').values).toEqual([0, 2, 0]);
    expect(getRow(rows, 'revenue_other').values).toEqual([0, 0, 1000]);

    // Costs and employee
    expect(normalizeValues(getRow(rows, 'cost_of_goods_sold').values)).toEqual([-2, 0, 0]);
    expect(normalizeValues(getRow(rows, 'materials').values)).toEqual([-2, 0, 0]);
    expect(normalizeValues(getRow(rows, 'employee_salary').values)).toEqual([0, 0, -2]);
    expect(normalizeValues(getRow(rows, 'employee_commission').values)).toEqual([0, 0, 0]);

    // Gross profit & margin
    expect(getRow(rows, 'gross_profit').values).toEqual([0, 2, 998]);
    expect(normalizeValues(getRow(rows, 'gross_margin').values)[0]).toBe(0);
    expect(normalizeValues(getRow(rows, 'gross_margin').values)[1]).toBe(1);
    expect(normalizeValues(getRow(rows, 'gross_margin').values)[2]!).toBeCloseTo(0.998, 8);

    // Depreciation + operating income building blocks
    expect(normalizeValues(getRow(rows, 'depreciation_amortization').values)).toEqual([
      -400, -700, -400,
    ]);
    expect(normalizeValues(getRow(rows, 'operational_ga').values)).toEqual([0, -3, 0]);
    expect(normalizeValues(getRow(rows, 'interest').values)).toEqual([0, -2, 0]);

    // Final lines
    expect(normalizeValues(getRow(rows, 'operating_income').values)).toEqual([-400, -703, 598]);
    expect(normalizeValues(getRow(rows, 'total_taxes').values)).toEqual([0, 0, -250]);
    expect(normalizeValues(getRow(rows, 'net_income').values)).toEqual([-400, -703, 348]);
    expect(normalizeValues(getRow(rows, 'ebitda').values)).toEqual([-400, -700, 348]);

    const ebitdaMarginValues = normalizeValues(getRow(rows, 'ebitda_margin').values);
    expect(ebitdaMarginValues).toEqual([-200, -350, ebitdaMarginValues[2]!]);
    expect(ebitdaMarginValues[2]!).toBeCloseTo(0.348, 8);

    // Emphasis flags (UI metadata)
    expect(getRow(rows, 'revenue').emphasized).toBe(true);
    expect(getRow(rows, 'gross_profit').emphasized).toBe(true);
    expect(getRow(rows, 'operating_income').emphasized).toBe(true);
    expect(getRow(rows, 'net_income').emphasized).toBe(true);
    expect(getRow(rows, 'ebitda').emphasized).toBe(true);
  });

  describe('numeric-like inputs (toNumber + conversion fallbacks)', () => {
    it('handles strings for amounts/rates and treats unparsable numbers as 0', () => {
      const rows = computeIncomeStatementRows({
        incomes: [
          {
            id: 'inc_numeric_string',
            payment_date: '2025-01-15T00:00:00.000Z',
            income_type: 'service',
            amount: '800',
            base_currency_fx_rate: '400', // base = 2
          },
          {
            id: 'inc_unparsable_amount',
            payment_date: '2025-01-20T00:00:00.000Z',
            income_type: 'service',
            amount: 'not-a-number',
            base_currency_fx_rate: '10',
          },
        ],
        expenses: [
          {
            id: 'exp_inventory_numeric_string',
            payment_date: '2025-01-20T00:00:00.000Z',
            expense_type: 'inventory_change',
            amount: '400',
            currency_rate: '200', // base = 2 => cogs = -2
          },
          {
            id: 'exp_taxes_unparsable_amount',
            payment_date: '2025-01-21T00:00:00.000Z',
            expense_type: 'taxes',
            amount: 'definitely-not-a-number',
            currency_rate: '100',
          },
        ],
        assets: [
          {
            id: 'asset_depr_numeric_strings',
            payment_due_date: '2025-01-15T00:00:00.000Z',
            purchase_amount: '1200',
            useful_life_months: '2', // monthly depreciation = 600
          },
          {
            id: 'asset_depr_unparsable_purchase_amount_skipped',
            payment_due_date: '2025-01-15T00:00:00.000Z',
            purchase_amount: 'not-a-number',
            useful_life_months: '3',
          },
        ],
        periods,
        periodGrouping,
      });

      expect(getRow(rows, 'revenue_service').values).toEqual([2, 0, 0]);
      expect(normalizeValues(getRow(rows, 'cost_of_goods_sold').values)).toEqual([-2, 0, 0]);

      // With the overlap-month logic: asset runs Jan15-Mar15 (life=2 months) => 1 month in Jan and 1 in Feb.
      expect(normalizeValues(getRow(rows, 'depreciation_amortization').values)).toEqual([
        -600, -600, 0,
      ]);
    });
  });

  describe('period boundaries and date parsing', () => {
    it('includes amounts on period start and excludes amounts on period end', () => {
      const boundaryIncomes: IncomeRow[] = [
        {
          id: 'inc_start_jan',
          payment_date: '2025-01-01T00:00:00.000Z',
          income_type: 'service',
          amount: 100,
          base_currency_fx_rate: 10, // base = 10
        },
        {
          id: 'inc_end_jan_included_in_feb',
          payment_date: '2025-02-01T00:00:00.000Z',
          income_type: 'service',
          amount: 200,
          base_currency_fx_rate: 20, // base = 10
        },
        {
          id: 'inc_end_feb_included_in_mar',
          payment_date: '2025-03-01T00:00:00.000Z',
          income_type: 'service',
          amount: 300,
          base_currency_fx_rate: 30, // base = 10
        },
      ];

      const boundaryExpenses: ExpenseRow[] = [
        {
          id: 'exp_start_jan',
          payment_date: '2025-01-01T00:00:00.000Z',
          expense_type: 'inventory_change',
          amount: 50,
          currency_rate: 10, // base = 5 => cogs = -5
        },
        {
          id: 'exp_end_jan_included_in_feb',
          payment_date: '2025-02-01T00:00:00.000Z',
          expense_type: 'inventory_change',
          amount: 70,
          currency_rate: 10, // base = 7 => cogs = -7
        },
        {
          id: 'exp_end_feb_included_in_mar',
          payment_date: '2025-03-01T00:00:00.000Z',
          expense_type: 'inventory_change',
          amount: 90,
          currency_rate: 10, // base = 9 => cogs = -9
        },
      ];

      const rows = computeIncomeStatementRows({
        incomes: boundaryIncomes,
        expenses: boundaryExpenses,
        assets: [],
        periods,
        periodGrouping,
      });

      expect(getRow(rows, 'revenue_service').values).toEqual([10, 10, 10]);
      expect(normalizeValues(getRow(rows, 'cost_of_goods_sold').values)).toEqual([-5, -7, -9]);
      expect(normalizeValues(getRow(rows, 'materials').values)).toEqual([-5, -7, -9]);
    });

    it('skips rows with null or invalid payment dates', () => {
      const rows = computeIncomeStatementRows({
        incomes: [
          {
            id: 'inc_null',
            payment_date: null,
            income_type: 'service',
            amount: 100,
            base_currency_fx_rate: 1,
          },
          {
            id: 'inc_invalid_date',
            payment_date: 'definitely-not-a-date',
            income_type: 'service',
            amount: 100,
            base_currency_fx_rate: 1,
          },
        ],
        expenses: [
          {
            id: 'exp_null',
            payment_date: null,
            expense_type: 'inventory_change',
            amount: 100,
            currency_rate: 1,
          },
          {
            id: 'exp_invalid_date',
            payment_date: 'invalid-date',
            expense_type: 'taxes',
            amount: 100,
            currency_rate: 1,
          },
        ],
        assets: [
          {
            id: 'asset_null_due',
            payment_due_date: null,
            purchase_amount: 1000,
            useful_life_months: 12,
          },
          {
            id: 'asset_invalid_due',
            payment_due_date: 'bad-date',
            purchase_amount: 1000,
            useful_life_months: 12,
          },
        ],
        periods,
        periodGrouping,
      });

      const allKeys = [
        'revenue',
        'revenue_service',
        'revenue_asset',
        'revenue_other',
        'cost_of_goods_sold',
        'employee_salary',
        'employee_commission',
        'materials',
        'gross_profit',
        'gross_margin',
        'depreciation_amortization',
        'operational_ga',
        'interest',
        'operating_income',
        'total_taxes',
        'net_income',
        'ebitda',
        'ebitda_margin',
      ];

      for (const key of allKeys) {
        expect(normalizeValues(getRow(rows, key).values)).toEqual([0, 0, 0]);
      }
    });
  });

  describe('depreciation allocation', () => {
    it('allocates depreciation across months overlapping the asset lifetime', () => {
      const rows = computeIncomeStatementRows({
        incomes: [],
        expenses: [],
        assets: [
          {
            id: 'asset_3_months_mid_month_start',
            payment_due_date: '2025-01-15T00:00:00.000Z',
            purchase_amount: 1200,
            useful_life_months: 3,
          },
        ],
        periods,
        periodGrouping,
      });

      // Their month-overlap logic counts 1 month for each of Jan, Feb, Mar here.
      expect(normalizeValues(getRow(rows, 'depreciation_amortization').values)).toEqual([
        -400, -400, -400,
      ]);
    });

    it('does not depreciate in a period when overlap-months resolve to 0', () => {
      const rows = computeIncomeStatementRows({
        incomes: [],
        expenses: [],
        assets: [
          {
            id: 'asset_life_ends_mid_feb',
            payment_due_date: '2025-01-15T00:00:00.000Z',
            purchase_amount: 1000,
            useful_life_months: 1,
          },
        ],
        periods,
        periodGrouping,
      });

      // Asset ends mid-Feb (assetEnd = 2025-02-15). The overlap algorithm counts 0 full months in Feb.
      expect(normalizeValues(getRow(rows, 'depreciation_amortization').values)).toEqual([
        -1000, 0, 0,
      ]);
      expect(normalizeValues(getRow(rows, 'operating_income').values)).toEqual([-1000, 0, 0]);
    });
  });

  describe('margins safeDivide edge cases', () => {
    it('returns 0 margins when totalRevenue is 0', () => {
      const rows = computeIncomeStatementRows({
        incomes: [],
        expenses: [
          {
            id: 'exp_inventory_jan',
            payment_date: '2025-01-20T00:00:00.000Z',
            expense_type: 'inventory_change',
            amount: 100,
            currency_rate: 100, // base = 1 => cogs = -1
          },
        ],
        assets: [],
        periods,
        periodGrouping,
      });

      expect(normalizeValues(getRow(rows, 'total_taxes').values)).toEqual([0, 0, 0]);
      expect(normalizeValues(getRow(rows, 'gross_profit').values)).toEqual([-1, 0, 0]);
      expect(normalizeValues(getRow(rows, 'gross_margin').values)).toEqual([0, 0, 0]);
      expect(normalizeValues(getRow(rows, 'ebitda_margin').values)).toEqual([0, 0, 0]);
    });

    it('returns 0 margins when numerator/denominator are not finite', () => {
      const rows = computeIncomeStatementRows({
        incomes: [
          {
            id: 'inc_infinite_revenue',
            payment_date: '2025-01-20T00:00:00.000Z',
            income_type: 'service',
            amount: Infinity,
            base_currency_fx_rate: 1,
          },
        ],
        expenses: [],
        assets: [],
        periods,
        periodGrouping,
      });

      expect(getRow(rows, 'revenue').values[0]!).toBe(Infinity);
      expect(normalizeValues(getRow(rows, 'gross_margin').values)).toEqual([0, 0, 0]);
      expect(normalizeValues(getRow(rows, 'ebitda_margin').values)).toEqual([0, 0, 0]);
    });
  });
});
