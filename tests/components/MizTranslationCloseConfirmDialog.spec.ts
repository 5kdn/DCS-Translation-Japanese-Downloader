// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';
import MizTranslationCloseConfirmDialog from '@/components/MizTranslationCloseConfirmDialog.vue';

/**
 * @summary 子要素をそのまま描画する簡易ラッパーを生成する。
 * @param name コンポーネント名を指定する。
 * @returns ラッパーコンポーネントを返す。
 */
const createWrapperComponent = (name: string) =>
  defineComponent({
    name,
    setup(_, { slots, attrs }) {
      return () => h('div', attrs, slots.default?.());
    },
  });

/**
 * @summary 非同期描画の完了を待機する。
 */
const flushComponent = async (): Promise<void> => {
  for (const _index of [0, 1, 2, 3]) {
    await Promise.resolve();
    await nextTick();
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }
};

const mountComponent = async (modelValue = true) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const onUpdateModelValue = vi.fn();
  const onConfirm = vi.fn();

  const app = createApp(
    defineComponent({
      setup() {
        return () =>
          h(MizTranslationCloseConfirmDialog, {
            modelValue,
            'onUpdate:modelValue': onUpdateModelValue,
            onConfirm,
          });
      },
    }),
  );

  app.component(
    'v-dialog',
    defineComponent({
      name: 'VDialogStub',
      props: {
        modelValue: {
          type: Boolean,
          required: true,
        },
      },
      setup(props, { slots, attrs, emit }) {
        return () =>
          props.modelValue
            ? h('div', { ...attrs, 'data-testid': attrs['data-testid'] }, [
                h(
                  'button',
                  {
                    type: 'button',
                    'data-testid': 'miz-close-confirm-overlay-close',
                    onClick: () => emit('update:modelValue', false),
                  },
                  'overlay close',
                ),
                slots.default?.(),
              ])
            : null;
      },
    }),
  );
  app.component('v-card', createWrapperComponent('VCardStub'));
  app.component('v-card-title', createWrapperComponent('VCardTitleStub'));
  app.component('v-card-text', createWrapperComponent('VCardTextStub'));
  app.component('v-card-actions', createWrapperComponent('VCardActionsStub'));
  app.component(
    'v-btn',
    defineComponent({
      name: 'VBtnStub',
      emits: ['click'],
      setup(_, { emit, slots, attrs }) {
        return () =>
          h(
            'button',
            {
              ...attrs,
              onClick: (event: MouseEvent) => emit('click', event),
            },
            slots.default?.(),
          );
      },
    }),
  );

  app.mount(container);
  await flushComponent();

  return {
    app,
    container,
    onUpdateModelValue,
    onConfirm,
  };
};

describe('MizTranslationCloseConfirmDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('確認文言と操作ボタンを表示する', async () => {
    const { app, container } = await mountComponent(true);

    expect(container.querySelector('[data-testid="miz-close-confirm-dialog"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="miz-close-confirm-message"]')?.textContent).toContain(
      '未保存の変更があります。保存していない変更は失われます。閉じますか？',
    );
    expect(container.querySelector('[data-testid="miz-close-confirm-cancel"]')?.textContent).toContain('キャンセル');
    expect(container.querySelector('[data-testid="miz-close-confirm-submit"]')?.textContent).toContain('閉じる');

    app.unmount();
  });

  it('閉じる操作で confirm を通知する', async () => {
    const { app, container, onConfirm, onUpdateModelValue } = await mountComponent(true);

    container
      .querySelector('[data-testid="miz-close-confirm-submit"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onUpdateModelValue).not.toHaveBeenCalled();

    app.unmount();
  });

  it('キャンセル操作で update:modelValue(false) を通知する', async () => {
    const { app, container, onUpdateModelValue, onConfirm } = await mountComponent(true);

    container
      .querySelector('[data-testid="miz-close-confirm-cancel"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    expect(onUpdateModelValue).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();

    app.unmount();
  });

  it('ダイアログ自体の閉じる操作でも update:modelValue(false) を通知する', async () => {
    const { app, container, onUpdateModelValue, onConfirm } = await mountComponent(true);

    container
      .querySelector('[data-testid="miz-close-confirm-overlay-close"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    expect(onUpdateModelValue).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();

    app.unmount();
  });
});
