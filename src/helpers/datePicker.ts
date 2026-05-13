type DatePickerAdapter<TDate> = {
  date(value?: unknown): TDate | null;
  isValid(date: unknown): boolean;
  parseISO(date: string): TDate;
  toJsDate(value: TDate): Date;
};

/**
 * @summary 日付ピッカーの値を Date へ正規化する。
 * @param value 日付ピッカーが返した値を指定する。
 * @param dateAdapter 日付変換に使用するアダプターを指定する。
 * @returns 正規化済みの Date または null を返す。
 */
export const normalizeDatePickerValue = <TDate>(value: unknown, dateAdapter: DatePickerAdapter<TDate>): Date | null => {
  const normalizedValue = Array.isArray(value) ? (value[0] ?? null) : value;

  if (normalizedValue === null || normalizedValue === undefined || normalizedValue === '') {
    return null;
  }

  if (normalizedValue instanceof Date) {
    return Number.isNaN(normalizedValue.getTime()) ? null : normalizedValue;
  }

  if (typeof normalizedValue === 'string') {
    const parsedValue = dateAdapter.parseISO(normalizedValue);
    return dateAdapter.isValid(parsedValue) ? dateAdapter.toJsDate(parsedValue) : null;
  }

  const adaptedValue = dateAdapter.date(normalizedValue);
  if (adaptedValue === null || !dateAdapter.isValid(adaptedValue)) {
    return null;
  }

  return dateAdapter.toJsDate(adaptedValue);
};
