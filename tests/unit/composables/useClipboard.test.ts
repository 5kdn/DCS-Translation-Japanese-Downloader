// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyText } from '@/composables/useClipboard';

describe('useClipboard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Clipboard API が利用可能なら writeText を呼び出す', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText,
      },
    });

    await expect(copyText('Alpha')).resolves.toBeUndefined();
    expect(writeText).toHaveBeenCalledWith('Alpha');
  });

  it('Clipboard API が利用不可なら reject する', async () => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });

    await expect(copyText('Alpha')).rejects.toThrowError('Clipboard API is not available.');
  });
});
