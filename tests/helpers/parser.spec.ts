import { describe, expect, it } from 'vitest';

import { parseDate, parseNullableDate } from '../../src/helpers/parser';

describe('parseDate', () => {
  it('null/undefined/empty/whitespace は undefined を返す', () => {
    expect(parseDate(null)).toBeUndefined();
    expect(parseDate(undefined)).toBeUndefined();
    expect(parseDate('')).toBeUndefined();
    expect(parseDate('   ')).toBeUndefined();
  });

  it('不正な日付文字列は undefined を返す', () => {
    expect(parseDate('not-a-date')).toBeUndefined();
  });

  it('有効な ISO8601 文字列は Date を返す', () => {
    const value = '2024-05-01T12:34:56.000Z';
    const result = parseDate(value);

    expect(result).toBeInstanceOf(Date);
    expect(result?.toISOString()).toBe(value);
  });
});

describe('parseNullableDate', () => {
  it('null は null を返す', () => {
    expect(parseNullableDate(null)).toBeNull();
  });

  it('undefined は undefined を返す', () => {
    expect(parseNullableDate(undefined)).toBeUndefined();
  });

  it('不正な日付文字列は undefined を返す', () => {
    expect(parseNullableDate('invalid-date')).toBeUndefined();
  });

  it('有効な ISO8601 文字列は Date を返す', () => {
    const value = '2024-06-10T01:02:03.000Z';
    const result = parseNullableDate(value);

    expect(result).toBeInstanceOf(Date);
    expect(result?.toISOString()).toBe(value);
  });
});
