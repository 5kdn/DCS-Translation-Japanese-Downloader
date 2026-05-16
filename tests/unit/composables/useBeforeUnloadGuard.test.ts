import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { useBeforeUnloadGuard } from '@/composables/useBeforeUnloadGuard';

describe('useBeforeUnloadGuard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('未保存変更ありかつダイアログ open のときだけ beforeunload を束縛する', async () => {
    const fakeWindow = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal('window', fakeWindow);
    const hasUnsavedChanges = ref(false);
    const isDialogOpen = ref(false);

    const scope = effectScope();
    scope.run(() => {
      useBeforeUnloadGuard(hasUnsavedChanges, isDialogOpen);
    });

    expect(fakeWindow.addEventListener).not.toHaveBeenCalledWith('beforeunload', expect.any(Function));

    isDialogOpen.value = true;
    hasUnsavedChanges.value = true;
    await nextTick();

    expect(fakeWindow.addEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    hasUnsavedChanges.value = false;
    await nextTick();

    expect(fakeWindow.removeEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    scope.stop();
  });

  it('有効時だけ beforeunload handler が preventDefault と returnValue を設定する', async () => {
    const handlers = new Map<string, EventListener>();
    const fakeWindow = {
      addEventListener: vi.fn((eventName: string, handler: EventListener) => {
        handlers.set(eventName, handler);
      }),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal('window', fakeWindow);
    const hasUnsavedChanges = ref(false);
    const isDialogOpen = ref(false);

    const scope = effectScope();
    scope.run(() => {
      useBeforeUnloadGuard(hasUnsavedChanges, isDialogOpen);
    });

    const inactiveEvent = {
      preventDefault: vi.fn(),
      returnValue: undefined as unknown,
    } as BeforeUnloadEvent;
    handlers.get('beforeunload')?.(inactiveEvent);

    expect(inactiveEvent.preventDefault).not.toHaveBeenCalled();
    expect(inactiveEvent.returnValue).toBeUndefined();

    isDialogOpen.value = true;
    hasUnsavedChanges.value = true;
    await nextTick();

    const activeEvent = {
      preventDefault: vi.fn(),
      returnValue: undefined as unknown,
    } as BeforeUnloadEvent;
    handlers.get('beforeunload')?.(activeEvent);

    expect(activeEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(activeEvent.returnValue).toBe('');

    scope.stop();
  });

  it('window が無い環境でも例外を送出しない', () => {
    vi.stubGlobal('window', undefined);

    expect(() => useBeforeUnloadGuard(ref(true), ref(true))).not.toThrow();
  });
});
