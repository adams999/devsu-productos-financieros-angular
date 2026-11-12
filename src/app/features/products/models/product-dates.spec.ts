import { isDateOnly, revisionDateFor, todayDateOnly } from './product-dates';

describe('product calendar dates', () => {
  it('accepts real calendar dates and rejects impossible dates', () => {
    expect(isDateOnly('2024-02-29')).toBe(true);
    expect(isDateOnly('2025-02-29')).toBe(false);
    expect(isDateOnly('2000-02-29')).toBe(true);
    expect(isDateOnly('1900-02-29')).toBe(false);
    expect(isDateOnly('2025-13-01')).toBe(false);
    expect(isDateOnly('2025-04-31')).toBe(false);
    expect(isDateOnly('2025-2-01')).toBe(false);
    expect(isDateOnly('0000-01-01')).toBe(false);
  });

  it('adds one calendar year and clamps leap day to February 28', () => {
    expect(revisionDateFor('2024-02-29')).toBe('2025-02-28');
    expect(revisionDateFor('2026-11-10')).toBe('2027-11-10');
    expect(revisionDateFor('invalid')).toBe('');
  });

  it('formats the local calendar day without converting through UTC', () => {
    expect(todayDateOnly(new Date(2026, 10, 10, 23, 50))).toBe('2026-11-10');
  });
});
