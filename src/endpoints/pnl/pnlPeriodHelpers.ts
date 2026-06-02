import type { PeriodGrouping } from './pnlTypes';

export type Period = {
  index: number;
  startDate: Date;
  endDate: Date; // exclusive
  label: string;
};

function clone(date: Date): Date {
  return new Date(date.getTime());
}

/** Normalizes a date to the first day of the month (UTC) */
export function normalizeToMonthStart(date: Date): Date {
  const d = clone(date);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Returns quarter index (1-4) for the given UTC date */
export function getQuarterIndex(date: Date): number {
  const month = date.getUTCMonth();
  return Math.floor(month / 3) + 1;
}

function addMonths(date: Date, months: number): Date {
  const d = clone(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

function addYears(date: Date, years: number): Date {
  const d = clone(date);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d;
}

/** Normalizes a date to the first month of its quarter (UTC) */
export function normalizeToQuarterStart(date: Date): Date {
  const d = normalizeToMonthStart(date);
  const quarter = getQuarterIndex(d);
  const firstMonthOfQuarter = (quarter - 1) * 3;
  d.setUTCMonth(firstMonthOfQuarter);
  return d;
}

/** Normalizes a date to January 1st of its year (UTC) */
export function normalizeToYearStart(date: Date): Date {
  const d = normalizeToMonthStart(date);
  d.setUTCMonth(0);
  return d;
}

/** Formats the period label shown in the Income Statement header */
export function formatPeriodLabel(date: Date, periodGrouping: PeriodGrouping): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;

  if (periodGrouping === 'monthly') {
    return `${year} ${month.toString().padStart(2, '0')}`;
  }

  if (periodGrouping === 'quarterly') {
    return `${year} Q${getQuarterIndex(date)}`;
  }

  return `${year}`;
}

/** Builds the 3 consecutive periods used by the Income Statement view */
export function buildPeriods(startingDate: Date, periodGrouping: PeriodGrouping): Period[] {
  const normalizedStart = normalizeToMonthStart(startingDate);
  const periods: Period[] = [];

  for (let index = 0; index < 3; index += 1) {
    let start: Date;
    let end: Date;

    if (periodGrouping === 'monthly') {
      start = addMonths(normalizedStart, index);
      end = addMonths(start, 1);
    } else if (periodGrouping === 'quarterly') {
      const qStart = normalizeToQuarterStart(normalizedStart);
      start = addMonths(qStart, index * 3);
      end = addMonths(start, 3);
    } else {
      const yStart = normalizeToYearStart(normalizedStart);
      start = addYears(yStart, index);
      end = addYears(start, 1);
    }

    periods.push({
      index,
      startDate: start,
      endDate: end,
      label: formatPeriodLabel(start, periodGrouping),
    });
  }

  return periods;
}
