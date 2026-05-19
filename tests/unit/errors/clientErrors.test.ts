import { describe, expect, it } from 'vitest';
import { ClientErrorCategoryObject, ClientOperationError, ClientResponseError, toClientError } from '@/errors/clientErrors';

describe('toClientError', () => {
  it('ClientResponseError は reason に応じて分類する', () => {
    const error = new ClientResponseError({
      context: 'test',
      operation: 'op',
      reason: 'success_false',
      problem: 'ng',
    });

    const result = toClientError('ctx', error);

    expect(result.category).toBe(ClientErrorCategoryObject.InvalidRequest);
  });

  it('ClientOperationError はステータスコードで分類する', () => {
    const error = new ClientOperationError({
      context: 'test',
      operation: 'op',
      cause: { responseStatusCode: 503, responseHeaders: {} },
    });

    const result = toClientError('ctx', error);

    expect(result.category).toBe(ClientErrorCategoryObject.InternalError);
  });

  it('ネットワーク相当の例外は Network に分類する', () => {
    const error = { name: 'TypeError', message: 'fetch failed' };

    const result = toClientError('ctx', error);

    expect(result.category).toBe(ClientErrorCategoryObject.Network);
  });

  it('分類不能な例外は Other に分類する', () => {
    const result = toClientError('ctx', { unexpected: true });

    expect(result.category).toBe(ClientErrorCategoryObject.Other);
  });
});
