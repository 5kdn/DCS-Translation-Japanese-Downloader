const API_TIMEOUT_MS = 300_000;

/**
 * @summary RAW URL からバイナリ（ArrayBuffer）を取得する。
 * @description 指定 URL に対してタイムアウト付きでリクエストし、レスポンスボディを ArrayBuffer として返却する。
 * @param url 取得対象の RAW URL を指定する。
 * @returns 取得したバイナリデータを ArrayBuffer として返却する。
 * @throws HTTP ステータスが成功（`response.ok === true`）でない場合に例外を送出する。
 * @throws タイムアウトや中断により `fetch` が失敗した場合に例外が送出される。
 * @example
 * ```ts
 * const buffer = await fetchArrayBufferWithTimeout('https://example.com/file.bin');
 * ```
 */
export const fetchArrayBufferWithTimeout = async (url: string): Promise<ArrayBuffer> => {
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`ファイル取得に失敗しました（HTTP ${response.status}）`);
  }
  return response.arrayBuffer();
};

/**
 * @summary `fetch` にタイムアウトを付与して実行する。
 * @description 内部で `AbortController` を用いて一定時間後に中断し、`fetch` をタイムアウト対応にする。
 * @param input `fetch` の第1引数を指定する（URL 文字列または `Request`）。
 * @param init `fetch` の第2引数を指定する（`RequestInit`）。`signal` が指定されている場合はタイムアウト用の signal と結合する。
 * @returns `fetch` の `Response` を返却する。
 * @throws ネットワークエラー・中断・タイムアウト等により `fetch` が失敗した場合に例外が送出される。
 * @remarks タイムアウト時間は `API_TIMEOUT_MS` に従う。
 * @remarks `init.signal` を指定している場合でも、タイムアウト到達時は中断が伝播する。
 */
const fetchWithTimeout = async (
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
): ReturnType<typeof fetch> => {
  const { initWithSignal, cleanup } = createRequestInitWithTimeout(init);
  try {
    return await fetch(input, initWithSignal);
  } finally {
    cleanup();
  }
};

/**
 * @summary タイムアウト付きの `RequestInit` を生成する。
 * @description `AbortController` を用いてタイムアウト用の `signal` を生成し、必要に応じて既存の `init.signal` と結合する。
 * @param init `fetch` に渡す初期化オプションを指定する。
 * @returns `initWithSignal`（`signal` を含む `RequestInit`）と、リスナー解除・タイマー解除を行う `cleanup` を返却する。
 * @throws タイムアウト到達時に `AbortController.abort` が呼ばれ、以降の `fetch` で中断理由が伝播する。
 * @remarks 返却される `cleanup` は `fetch` の成否に関わらず呼び出すことを想定する。
 */
const createRequestInitWithTimeout = (
  init: RequestInit | undefined = {},
): { initWithSignal: RequestInit; cleanup: () => void } => {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(new Error('リクエストがタイムアウトしました。')), API_TIMEOUT_MS);

  /**
   * @summary タイムアウト用タイマーを解除する。
   */
  const cleanupTimeout = (): void => clearTimeout(timeoutId);
  if (!init.signal) {
    return { initWithSignal: { ...init, signal: timeoutController.signal }, cleanup: cleanupTimeout };
  }
  const { signal, cleanup: cleanupSignals } = combineSignals([init.signal, timeoutController.signal]);

  /**
   * @summary タイムアウトと signal 結合の後処理を行う。
   */
  const cleanup = (): void => {
    cleanupTimeout();
    cleanupSignals();
  };
  return { initWithSignal: { ...init, signal }, cleanup };
};

/**
 * @summary 複数の `AbortSignal` を1つに結合する。
 * @description いずれかの signal が abort された場合に、結合先の signal も同じ中断理由（`reason`）で abort する。
 * @param signals 結合対象の `AbortSignal` 配列を指定する。
 * @returns 結合された `signal` と、登録したイベントリスナーを解除する `cleanup` を返却する。
 * @remarks すでに abort 済みの signal が含まれる場合は、即座に結合先も abort する。
 * @remarks 返却される `cleanup` はメモリリーク防止のために呼び出すことを想定する。
 */
const combineSignals = (signals: AbortSignal[]): { signal: AbortSignal; cleanup: () => void } => {
  const controller = new AbortController();

  /**
   * @summary abort を受け取って結合先へ伝播する。
   * @param event abort イベントを指定する。
   */
  const onAbort = (event: Event): void => {
    const reason = (event.target as AbortSignal).reason;
    if (!controller.signal.aborted) controller.abort(reason);
  };
  for (const signal of signals) {
    if (signal.aborted && !controller.signal.aborted) {
      controller.abort(signal.reason);
      continue;
    }
    signal.addEventListener('abort', onAbort);
  }

  /**
   * @summary abort リスナーを解除する。
   */
  const cleanup = (): void => {
    signals.forEach((signal) => {
      signal.removeEventListener('abort', onAbort);
    });
  };
  return { signal: controller.signal, cleanup };
};
