import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';

type CapturedOptions = {
  fetch?: typeof fetch;
};

const originalFetch = globalThis.fetch;
const captured: { baseUrl?: string; options?: CapturedOptions } = {};
const mockClient = { mocked: true } as const;
const mockHc = vi.fn((baseUrl: string, options?: CapturedOptions) => {
  captured.baseUrl = baseUrl;
  captured.options = options;
  return mockClient;
});

vi.mock('hono/client', () => ({
  hc: mockHc,
}));

describe('apiClient', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    localStorage.clear();
    captured.baseUrl = undefined;
    captured.options = undefined;
    globalThis.fetch = originalFetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  test('環境変数のベースURLとカスタムfetchをhcに渡す', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com');
    const { apiClient } = await import('@/lib/api/client');

    expect(apiClient).toBe(mockClient);
    expect(mockHc).toHaveBeenCalledOnce();
    expect(captured.baseUrl).toBe('https://api.example.com');
    expect(typeof captured.options?.fetch).toBe('function');
  });

  test('トークンが存在するとAuthorizationヘッダを付与する', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com');
    await import('@/lib/api/client');
    const customFetch = captured.options?.fetch;
    if (!customFetch) throw new Error('custom fetchが取得できない');

    const fetchSpy = vi.fn(async (request: Request) => {
      return new Response('ok', { status: 200, headers: request.headers });
    });
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    localStorage.setItem('token', 'abc123');

    const res = await customFetch('https://api.example.com/data', {
      headers: { 'X-Test': '1' },
    });

    expect(fetchSpy).toHaveBeenCalledOnce();
    const forwardedRequest = fetchSpy.mock.calls[0]?.[0] as Request;
    expect(forwardedRequest.headers.get('Authorization')).toBe('Bearer abc123');
    expect(forwardedRequest.headers.get('X-Test')).toBe('1');
    expect(res.status).toBe(200);
  });

  test('401応答を検知すると警告を出す', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com');
    await import('@/lib/api/client');
    const customFetch = captured.options?.fetch;
    if (!customFetch) throw new Error('custom fetchが取得できない');

    const fetchSpy = vi.fn(async () => new Response(null, { status: 401 }));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    localStorage.removeItem('token');

    await customFetch('https://api.example.com/data');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const forwardedRequest = fetchSpy.mock.calls[0]?.[0] as Request;
    expect(forwardedRequest.headers.get('Authorization')).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith('Unauthorized: 401');
    warnSpy.mockRestore();
  });
});
