type FetchRequestInfo = {
  url: string;
  method: string;
  bodyText: string | null;
};

type FetchMockMatcher = (request: FetchRequestInfo, input: RequestInfo | URL, init?: RequestInit) => boolean | Promise<boolean>;

type FetchMockHandler = (
  request: FetchRequestInfo,
  input: RequestInfo | URL,
  init?: RequestInit,
) => Response | Promise<Response>;

type FetchMockLayer = {
  id: symbol;
  match: FetchMockMatcher;
  handle: FetchMockHandler;
};

type FetchMockDispatcherState = {
  baseFetch: typeof fetch;
  layers: FetchMockLayer[];
  dispatcher: typeof fetch;
};

const FETCH_MOCK_STATE_KEY = Symbol.for('storybook.fetchMockState');

/**
 * @summary RequestInfo から URL、HTTP メソッド、本文文字列を読み取る。
 * @param input fetch に渡される入力値を指定する。
 * @param init fetch に渡される初期化オプションを指定する。
 * @returns 判定に使う簡易リクエスト情報を返す。
 */
export const readRequestInfo = async (input: RequestInfo | URL, init?: RequestInit): Promise<FetchRequestInfo> => {
  if (input instanceof Request) {
    const method = (init?.method ?? input.method ?? 'GET').toUpperCase();
    const bodyText = init?.body === undefined ? await readBodyText(input.clone()) : await readBodyText(init.body);
    return {
      url: input.url,
      method,
      bodyText,
    };
  }

  return {
    url: typeof input === 'string' ? input : input.href,
    method: (init?.method ?? 'GET').toUpperCase(),
    bodyText: await readBodyText(init?.body),
  };
};

/**
 * @summary JSON レスポンスを生成する。
 * @param payload 返却する JSON データを指定する。
 * @param init Response 初期化オプションを指定する。
 * @returns JSON レスポンスを返す。
 */
export const createJsonResponse = (payload: unknown, init?: ResponseInit): Response => {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return new Response(JSON.stringify(payload), {
    ...init,
    headers,
  });
};

/**
 * @summary 条件に一致する fetch 通信だけを差し替える。
 * @param options 一致条件と応答生成処理を指定する。
 * @returns モック解除関数を返す。
 */
export const installFetchMock = (options: { match: FetchMockMatcher; handle: FetchMockHandler }): { restore: () => void } => {
  const state = ensureFetchMockDispatcherState();
  const layer: FetchMockLayer = {
    id: Symbol('fetchMockLayer'),
    match: options.match,
    handle: options.handle,
  };
  state.layers.push(layer);

  return {
    restore: (): void => {
      const layerIndex = state.layers.findIndex((targetLayer: FetchMockLayer): boolean => targetLayer.id === layer.id);
      if (layerIndex >= 0) {
        state.layers.splice(layerIndex, 1);
      }

      if (state.layers.length === 0) {
        teardownFetchMockDispatcherState(state);
      }
    },
  };
};

/**
 * @summary fetch モック用ディスパッチャー状態を返す。
 * @returns ディスパッチャー状態を返す。
 */
const ensureFetchMockDispatcherState = (): FetchMockDispatcherState => {
  const globalScope = globalThis as typeof globalThis & {
    [FETCH_MOCK_STATE_KEY]?: FetchMockDispatcherState;
  };
  const currentState = globalScope[FETCH_MOCK_STATE_KEY];
  if (currentState !== undefined && globalThis.fetch === currentState.dispatcher) {
    return currentState;
  }

  const baseFetch = globalThis.fetch?.bind(globalThis);
  if (baseFetch === undefined) {
    throw new Error('globalThis.fetch が利用できません。');
  }

  const nextState: FetchMockDispatcherState = {
    baseFetch,
    layers: [],
    dispatcher: (async (): Promise<Response> => {
      throw new Error('fetch モックディスパッチャーが初期化されていません。');
    }) as typeof fetch,
  };

  nextState.dispatcher = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = await readRequestInfo(input, init);
    for (let index = nextState.layers.length - 1; index >= 0; index -= 1) {
      const layer = nextState.layers[index];
      if (layer === undefined) continue;
      if (await layer.match(request, input, init)) {
        return layer.handle(request, input, init);
      }
    }
    return nextState.baseFetch(input, init);
  }) as typeof fetch;

  globalThis.fetch = nextState.dispatcher;
  globalScope[FETCH_MOCK_STATE_KEY] = nextState;
  return nextState;
};

/**
 * @summary fetch モック用ディスパッチャー状態を破棄する。
 * @param state 破棄対象の状態を指定する。
 */
const teardownFetchMockDispatcherState = (state: FetchMockDispatcherState): void => {
  const globalScope = globalThis as typeof globalThis & {
    [FETCH_MOCK_STATE_KEY]?: FetchMockDispatcherState;
  };

  if (globalThis.fetch === state.dispatcher) {
    globalThis.fetch = state.baseFetch;
  }

  if (globalScope[FETCH_MOCK_STATE_KEY] === state) {
    delete globalScope[FETCH_MOCK_STATE_KEY];
  }
};

/**
 * @summary fetch 本文を文字列へ変換する。
 * @param body 変換対象本文を指定する。
 * @returns 文字列化した本文を返す。
 */
const readBodyText = async (body: BodyInit | Request | null | undefined): Promise<string | null> => {
  if (body === null || body === undefined) return null;
  if (typeof body === 'string') return body;
  if (body instanceof URLSearchParams) return body.toString();
  if (body instanceof Request) return body.text();
  if (body instanceof Blob) return body.text();
  if (body instanceof FormData) {
    return Array.from(body.entries())
      .map(([key, value]) => `${key}=${typeof value === 'string' ? value : value.name}`)
      .join('&');
  }
  if (body instanceof ArrayBuffer) return new TextDecoder().decode(body);
  if (ArrayBuffer.isView(body)) return new TextDecoder().decode(body);
  return String(body);
};
