import { describe, expect, it } from 'vitest';
import { normalizeDatePickerValue } from '@/helpers/datePicker';

const createDatePickerAdapter = () => {
  return {
    date: (value?: unknown): Date | null => {
      if (value === null || value === undefined || value === '') {
        return null;
      }

      if (value instanceof Date) {
        return value;
      }

      if (typeof value === 'string' || typeof value === 'number') {
        return new Date(value);
      }

      return null;
    },
    isValid: (date: unknown): boolean => {
      return date instanceof Date && !Number.isNaN(date.getTime());
    },
    parseISO: (date: string): Date => {
      return new Date(date);
    },
    toJsDate: (value: Date): Date => {
      return value;
    },
  };
};

describe('normalizeDatePickerValue', () => {
  const dateAdapter = createDatePickerAdapter();

  it('Date をそのまま返す', () => {
    const value = new Date('2026-05-10T00:00:00Z');

    expect(normalizeDatePickerValue(value, dateAdapter)?.toISOString()).toBe('2026-05-10T00:00:00.000Z');
  });

  it('ISO 文字列を Date へ変換する', () => {
    expect(normalizeDatePickerValue('2026-05-10', dateAdapter)?.toISOString()).toBe('2026-05-10T00:00:00.000Z');
  });

  it('配列で渡された先頭要素を変換する', () => {
    expect(normalizeDatePickerValue(['2026-05-10'], dateAdapter)?.toISOString()).toBe('2026-05-10T00:00:00.000Z');
  });

  it('空値または不正値は null を返す', () => {
    expect(normalizeDatePickerValue(null, dateAdapter)).toBeNull();
    expect(normalizeDatePickerValue('', dateAdapter)).toBeNull();
    expect(normalizeDatePickerValue('invalid-date', dateAdapter)).toBeNull();
    expect(normalizeDatePickerValue(new Date('invalid'), dateAdapter)).toBeNull();
  });
});
