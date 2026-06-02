/** Coerces unknown numeric-like values to number, falling back to 0 on NaN/undefined. */
export function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Converts an income amount to base currency using `base_currency_fx_rate`
 *
 * Semantics:
 * - `base_currency_fx_rate` is the rate returned by the external FX API:
 *   base = ERP base currency (e.g. EUR), symbol = income currency (e.g. HUF)
 * - Example: base=EUR, symbol=HUF -> rate = 392.83 (392.83 HUF for 1 EUR)
 * - Stored value is therefore "foreign per 1 base"
 *
 * Conversion convention:
 * - When the income `amount` is stored in foreign currency (e.g. HUF),
 *   the base amount is: `amount / base_currency_fx_rate`
 *
 * Fallbacks:
 * - If rate is 0, null, undefined, or unparsable, we fall back to returning `amount` as-is
 */
export function convertIncomeAmountToBaseCurrency(
  amount: unknown,
  baseCurrencyFxRate: unknown,
): number {
  const numericAmount = toNumber(amount);
  const rate = toNumber(baseCurrencyFxRate);

  if (numericAmount === 0) return 0;
  if (rate <= 0) return numericAmount;

  return numericAmount / rate;
}

/**
 * Converts an expense amount to base currency using `currency_rate`
 *
 * Semantics:
 * - `currency_rate` follows the same convention as `base_currency_fx_rate`:
 *   "foreign per 1 base"
 *
 * Conversion:
 * - Expense amount stored in foreign currency -> `amount / currency_rate`
 *
 * Fallbacks:
 * - If rate is 0, null, undefined, or unparsable, we fall back to returning `amount` as-is
 */
export function convertExpenseAmountToBaseCurrency(amount: unknown, currencyRate: unknown): number {
  const numericAmount = toNumber(amount);
  const rate = toNumber(currencyRate);

  if (numericAmount === 0) return 0;
  if (rate <= 0) return numericAmount;

  return numericAmount / rate;
}
