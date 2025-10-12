import axios from "axios";
import type { DownloadZipFailueResponse, DownloadZipRequest, TreeItem, TreeResponse } from '@/type';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKGROUND_BASE_URL,
});

export const ApiClient = {
  get: async <T>(path: string, params?: Record<string, any>): Promise<T> =>
    (await api.get<T>(path, { params })).data,

  post: async <T>(path: string, body?: unknown): Promise<T> =>
    (await api.post<T>(path, body)).data,

  // ---- ここから個別API ----

  /**
   * /tree エンドポイントからツリー情報を取得する。
   * 文字列レスポンスの場合は JSON.parse で解析する。
   */
  Tree: async (): Promise<TreeItem[]> => {
    try {
      const res = await api.get('/tree');
      const raw = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;

      if (Array.isArray(raw)) {
        return raw as TreeItem[];
      }

      if (raw && typeof raw === 'object' && 'data' in raw) {
        const { success, data } = raw as TreeResponse;
        if (success === false) {
          throw new Error('ツリー情報の取得が失敗した。');
        }
        if (Array.isArray(data)) {
          return data;
        }
      }

      throw new TypeError('ツリー情報の形式が不正である。');
    } catch (err) {
      console.error('ApiClient.Tree error:', err);
      throw err;
    }
  },

  /**
   * /download-zip エンドポイントからファイルをダウンロードする。
   */
  DownloadZip: async (path: string, name: string): Promise<void> => {
    console.log("DownloadZip called");
    try {
      if (!path || path.trim().length === 0) {
        throw new Error('ダウンロード対象のパスが指定されていない。');
      }
      if (!name || name.trim().length === 0) {
        throw new Error('ダウンロードファイル名が指定されていない。');
      }

      const payload: DownloadZipRequest = { path };
      const response = await api.post<ArrayBuffer>('/download-zip', payload, {
        responseType: 'arraybuffer',
        validateStatus: (status) => status >= 200 && status < 500,
      });

      if (response.status >= 200 && response.status < 300) {
        const contentType = response.headers['content-type'] ?? 'application/zip';
        const fallbackName = (() => {
          const segments = path.split('/').map((segment) => segment.trim()).filter(Boolean);
          const last = segments.length > 0 ? segments[segments.length - 1] : undefined;
          return `${last ?? 'download'}.zip`;
        })();

        const filename = (() => {
          const sanitized = name.trim();
          if (sanitized.length > 0) {
            return sanitized.endsWith('.zip') ? sanitized : `${sanitized}.zip`;
          }

          const disposition = response.headers['content-disposition'];
          if (!disposition) {
            return fallbackName;
          }
          const utf8Match = disposition.match(/filename\*=(?:UTF-8'')?([^;]+)/i);
          if (utf8Match && utf8Match[1]) {
            const raw = utf8Match[1].trim().replace(/^['"]|['"]$/g, '');
            try {
              return decodeURIComponent(raw);
            } catch {
              return raw || fallbackName;
            }
          }
          const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
          if (asciiMatch && asciiMatch[1]) {
            return asciiMatch[1].trim() || fallbackName;
          }
          return fallbackName;
        })();

        const blob = new Blob([response.data], { type: contentType });
        const objectUrl = URL.createObjectURL(blob);
        try {
          const anchor = document.createElement('a');
          anchor.href = objectUrl;
          anchor.download = filename;
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
        return;
      }

      const buffer = new Uint8Array(response.data);
      const text = new TextDecoder('utf-8').decode(buffer);

      let failure: DownloadZipFailueResponse | undefined;
      try {
        failure = JSON.parse(text) as DownloadZipFailueResponse;
      } catch {
        throw new Error('ZIP ダウンロードに失敗した。レスポンスを解析できなかった。');
      }

      throw new Error(failure.message ?? 'ZIP ダウンロードに失敗した。');
    } catch (error) {
      console.error('ApiClient.DownloadZip error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(String(error));
    }
  }
};
