import type { DateOnly } from './products.models';

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function isDateOnly(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}

export function todayDateOnly(date = new Date()): DateOnly {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function revisionDateFor(releaseDate: string): DateOnly {
  if (!isDateOnly(releaseDate)) return '';

  const year = Number(releaseDate.slice(0, 4)) + 1;
  const month = Number(releaseDate.slice(5, 7));
  const day = Math.min(Number(releaseDate.slice(8, 10)), daysInMonth(year, month));
  return `${String(year).padStart(4, '0')}-${releaseDate.slice(5, 7)}-${String(day).padStart(2, '0')}`;
}
