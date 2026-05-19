import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { mswServer } from '../support/mswServer';

let consoleInfoSpy: ReturnType<typeof vi.spyOn> | undefined;

beforeAll(() => {
  mswServer.listen({ onUnhandledRequest: 'error' });
  consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
});

afterEach(() => {
  mswServer.resetHandlers();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

afterAll(() => {
  consoleInfoSpy?.mockRestore();
  mswServer.close();
});
