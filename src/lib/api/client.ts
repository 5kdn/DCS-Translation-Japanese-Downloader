import { hc } from 'hono/client';
import type { AppType, ClientContract } from '@/types/server';

/**
 * Fetch ラッパ関数
 * 認証トークンや共通ヘッダを付与し、401 を検出した場合に処理を挟む
 */
const customFetch: typeof fetch = async (input, init) => {
  const req = new Request(input, init);
  const headers = new Headers(req.headers);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(new Request(req, { headers }));
  if (res.status === 401) {
    console.warn('Unauthorized: 401');
  }
  return res;
};

/**
 * Hono クライアントインスタンス
 * VITE_API_BASE_URL を基点として型安全に API 呼び出し可能
 */
/**
 * APIクライアントを生成して共通設定を適用する。
 */
export const apiClient: ClientContract = hc<AppType>(import.meta.env.VITE_API_BASE_URL, {
  fetch: customFetch,
}) as unknown as ClientContract;
