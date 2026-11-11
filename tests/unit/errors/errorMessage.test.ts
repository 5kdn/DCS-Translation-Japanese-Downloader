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

  it.each([
    [409, 'ブランチが競合'],
    [422, '入力内容に不整合'],
    [429, 'Retry-After'],
  ])('v2の%sを具体的に通知する', (status, expected) => {
    const error = new ClientError({
      category: status === 429 ? ClientErrorCategoryObject.Throttling : ClientErrorCategoryObject.InvalidRequest,
      context: 'create',
      cause: {
        responseStatusCode: status,
        responseHeaders: { 'Retry-After': ['60'] },
        type: 'about:blank',
        title: 'Request failed',
        status,
        detail: '確認が必要です。',
        instance: '/v2/prs',
        code: 'VALIDATION_ERROR',
      },
    });
    expect(error).toMatchObject({
      status,
      type: 'about:blank',
      title: 'Request failed',
      detail: '確認が必要です。',
      instance: '/v2/prs',
      code: 'VALIDATION_ERROR',
    });
    expect(toErrorMessageForDisplay(error)).toContain(expected);
    expect(toErrorMessageForDisplay(error)).toContain('確認が必要です。');
    if (status === 429) expect(toErrorMessageForDisplay(error)).toContain('60');
  });

  it('不明な例外は Other の表示名を返す', () => {
    expect(toErrorMessageForDisplay('unknown')).toBe(getClientErrorCategoryLabel(ClientErrorCategoryObject.Other));
  });
});
