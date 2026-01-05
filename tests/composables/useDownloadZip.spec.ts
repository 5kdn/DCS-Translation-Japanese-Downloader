import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDownloadZip } from '@/composables/useDownloadZip';
import type { DownloadFilePathResponse } from '@/lib/client';
import { fetchArrayBufferWithTimeout } from '@/lib/httpClient';

type MockZip = {
  file: ReturnType<typeof vi.fn>;
  generateAsync: ReturnType<typeof vi.fn>;
};

let lastZipInstance: MockZip | null = null;
let resolvedZip: Blob = {} as Blob;

vi.mock('jszip', () => ({
  default: class {
    file = vi.fn();
    generateAsync = vi.fn().mockImplementation(async () => resolvedZip);

    constructor() {
      lastZipInstance = this as unknown as MockZip;
    }
  },
}));

vi.mock('@/lib/httpClient', () => ({
  fetchArrayBufferWithTimeout: vi.fn(),
}));

describe('useDownloadZip', () => {
  const fetchArrayBufferWithTimeoutMock = vi.mocked(fetchArrayBufferWithTimeout);

  beforeEach(() => {
    vi.clearAllMocks();
    lastZipInstance = null;
    resolvedZip = {} as Blob;
  });

  it('対象をZIPにまとめる', async () => {
    resolvedZip = { tag: 'zip' } as unknown as Blob;
    fetchArrayBufferWithTimeoutMock.mockResolvedValue(new ArrayBuffer(2));

    const { createZipFromTargets } = useDownloadZip({ maxConcurrentDownloads: 2 });
    const targets: DownloadFilePathResponse = [
      { url: 'https://example.com/a', path: 'dir/a.txt' },
      { url: 'https://example.com/b', path: 'dir/b.txt' },
    ];

    const result = await createZipFromTargets(targets);

    expect(result).toBe(resolvedZip);
    expect(fetchArrayBufferWithTimeoutMock).toHaveBeenCalledTimes(2);
    expect(fetchArrayBufferWithTimeoutMock).toHaveBeenNthCalledWith(1, 'https://example.com/a');
    expect(fetchArrayBufferWithTimeoutMock).toHaveBeenNthCalledWith(2, 'https://example.com/b');
    expect(lastZipInstance?.file).toHaveBeenNthCalledWith(1, 'dir/a.txt', expect.any(ArrayBuffer));
    expect(lastZipInstance?.file).toHaveBeenNthCalledWith(2, 'dir/b.txt', expect.any(ArrayBuffer));
    expect(lastZipInstance?.generateAsync).toHaveBeenCalledWith({ type: 'blob' });
  });

  it('URLが不正な場合は例外を送出する', async () => {
    const { createZipFromTargets } = useDownloadZip();
    const targets = [{ url: '', path: 'dir/a.txt' }] as DownloadFilePathResponse;

    await expect(createZipFromTargets(targets)).rejects.toThrow('ダウンロードURLが不正');
    expect(fetchArrayBufferWithTimeoutMock).not.toHaveBeenCalled();
  });

  it('ZIP内パスが不正な場合は例外を送出する', async () => {
    const { createZipFromTargets } = useDownloadZip();
    const targets = [{ url: 'https://example.com/a', path: '' }] as DownloadFilePathResponse;

    await expect(createZipFromTargets(targets)).rejects.toThrow('ZIP内パスが不正');
    expect(fetchArrayBufferWithTimeoutMock).not.toHaveBeenCalled();
  });
});
