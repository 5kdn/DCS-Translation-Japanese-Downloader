import { hc } from 'hono/client';
import type { AppType } from '@/types/server';

/**
 * Fetch ラッパ関数
 * 認証トークンや共通ヘッダを付与し、401 を検出した場合に処理を挟む
 */
const customFetch: typeof fetch = async (input, init) => {
  const token = localStorage.getItem('token');
  const headers = {
    ...init?.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(input, { ...init, headers });

  if (res.status === 401) {
    // トークン再取得やログアウト処理をここで実装
    console.warn('Unauthorized: 401');
  }

  return res;
};

/**
 * Hono クライアントインスタンス
 * VITE_API_BASE_URL を基点として型安全に API 呼び出し可能
 */
export const apiClient = hc<AppType>(import.meta.env.VITE_API_BASE_URL, {
  fetch: customFetch,
});
