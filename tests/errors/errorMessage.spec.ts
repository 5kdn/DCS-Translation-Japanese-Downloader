import { describe, expect, it } from 'vitest';
import { ClientError, ClientErrorCategoryObject, getClientErrorCategoryLabel } from '@/errors/clientErrors';
import { toErrorMessageForDisplay } from '@/errors/errorMessage';

describe('toErrorMessageForDisplay', () => {
  it('ClientError のカテゴリ表示名を返す', () => {
    const error = new ClientError({ category: ClientErrorCategoryObject.Throttling, context: 'ctx' });

    expect(toErrorMessageForDisplay(error)).toBe(getClientErrorCategoryLabel(ClientErrorCategoryObject.Throttling));
  });

  it('ネットワークエラー相当は Network の表示名を返す', () => {
    const error = { name: 'TypeError', message: 'NetworkError when attempting to fetch resource.' };

    expect(toErrorMessageForDisplay(error)).toBe(getClientErrorCategoryLabel(ClientErrorCategoryObject.Network));
  });

  it('ステータスコードからカテゴリ表示名を返す', () => {
    const error = { responseStatusCode: 429, responseHeaders: {} };

    expect(toErrorMessageForDisplay(error)).toBe(getClientErrorCategoryLabel(ClientErrorCategoryObject.Throttling));
  });

  it('不明な例外は Other の表示名を返す', () => {
    expect(toErrorMessageForDisplay('unknown')).toBe(getClientErrorCategoryLabel(ClientErrorCategoryObject.Other));
  });
});
