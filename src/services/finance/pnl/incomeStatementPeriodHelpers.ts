import type { IncomeStatementFrequency, IncomeStatementPeriod } from './incomeStatementTypes';

function cloneAsDate(date: Date): Date {
  return new Date(date.getTime());
}

export function normalizeToMonthStart(date: Date): Date {
  const d = cloneAsDate(date);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function getQuarterIndex(date: Date): number {
  const month = date.getUTCMonth(); // 0-based
  return Math.floor(month / 3) + 1;
}

function addMonths(date: Date, months: number): Date {
  const d = cloneAsDate(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

function addYears(date: Date, years: number): Date {
  const d = cloneAsDate(date);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d;
}

export function buildPeriods(
  startingDate: Date,
  frequency: IncomeStatementFrequency,
  count = 3,
): IncomeStatementPeriod[] {
  const normalizedStart = normalizeToMonthStart(startingDate);

  const periods: IncomeStatementPeriod[] = [];

  for (let index = 0; index < count; index += 1) {
    let periodStart: Date;
    let periodEndExclusive: Date;

    if (frequency === 'monthly') {
      periodStart = addMonths(normalizedStart, index);
      periodEndExclusive = addMonths(periodStart, 1);
    } else if (frequency === 'quarterly') {
      const quarterStart = normalizeToQuarterStart(normalizedStart);
      periodStart = addMonths(quarterStart, index * 3);
      periodEndExclusive = addMonths(periodStart, 3);
    } else {
      const yearStart = normalizeToYearStart(normalizedStart);
      periodStart = addYears(yearStart, index);
      periodEndExclusive = addYears(periodStart, 1);
    }

    periods.push({
      index,
      startDate: periodStart,
      endDate: periodEndExclusive,
      label: formatPeriodLabel(periodStart, frequency),
    });
  }

  return periods;
}

export function normalizeToQuarterStart(date: Date): Date {
  const d = normalizeToMonthStart(date);
  const quarter = getQuarterIndex(d);
  const firstMonthOfQuarter = (quarter - 1) * 3;
  d.setUTCMonth(firstMonthOfQuarter);
  return d;
}

export function normalizeToYearStart(date: Date): Date {
  const d = normalizeToMonthStart(date);
  d.setUTCMonth(0);
  return d;
}

export function formatPeriodLabel(date: Date, frequency: IncomeStatementFrequency): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;

  if (frequency === 'monthly') {
    const paddedMonth = month.toString().padStart(2, '0');
    return `${year} ${paddedMonth}`;
  }

  if (frequency === 'quarterly') {
    const quarter = getQuarterIndex(date);
    return `${year} Q${quarter}`;
  }

  return `${year}`;
}
