// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';
import MizTranslationDialog from '@/components/MizTranslationDialog.vue';

/**
 * @summary すべての子要素をそのまま描画する簡易ラッパーを生成する。
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
  for (const _index of [0, 1, 2]) {
    await Promise.resolve();
    await nextTick();
  }
};

const mountComponent = async (props?: { modelValue?: boolean; loadedFileName?: string; isLoading?: boolean }) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const onUpdateModelValue = vi.fn();

  const app = createApp(
    defineComponent({
      setup() {
        return () =>
          h(MizTranslationDialog, {
            modelValue: props?.modelValue ?? true,
            loadedFileName: props?.loadedFileName ?? 'mission.miz',
            isLoading: props?.isLoading ?? false,
            'onUpdate:modelValue': onUpdateModelValue,
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
      setup(props, { slots, attrs }) {
        return () => (props.modelValue ? h('div', attrs, slots.default?.()) : null);
      },
    }),
  );
  app.component('v-card', createWrapperComponent('VCardStub'));
  app.component('v-toolbar', createWrapperComponent('VToolbarStub'));
  app.component('v-toolbar-title', createWrapperComponent('VToolbarTitleStub'));
  app.component('v-spacer', createWrapperComponent('VSpacerStub'));
  app.component('v-card-text', createWrapperComponent('VCardTextStub'));
  app.component('v-container', createWrapperComponent('VContainerStub'));
  app.component(
    'v-btn',
    defineComponent({
      name: 'VBtnStub',
      props: {
        disabled: {
          type: Boolean,
          required: false,
          default: false,
        },
      },
      emits: ['click'],
      setup(props, { emit, slots, attrs }) {
        return () =>
          h(
            'button',
            {
              ...attrs,
              disabled: props.disabled,
              onClick: (event: MouseEvent) => emit('click', event),
            },
            slots.default?.(),
          );
      },
    }),
  );
  app.component(
    'v-alert',
    defineComponent({
      name: 'VAlertStub',
      props: {
        text: {
          type: String,
          required: false,
          default: '',
        },
      },
      setup(props, { slots, attrs }) {
        return () => h('div', attrs, props.text || slots.default?.());
      },
    }),
  );
  app.mount(container);
  await flushComponent();

  return { app, container, onUpdateModelValue };
};

describe('MizTranslationDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('表示時に読込ファイル名とプレースホルダーを表示する', async () => {
    const { app, container } = await mountComponent({ modelValue: true, loadedFileName: 'briefing.miz', isLoading: false });

    expect(container.textContent).toContain('MIZ 翻訳');
    expect(container.querySelector('[data-testid="miz-dialog-file-name"]')?.textContent).toBe('briefing.miz');
    expect(container.querySelector('[data-testid="miz-dialog-placeholder"]')?.textContent).toContain('Not Implemented');

    app.unmount();
  });

  it('読込中は loading 表示を優先する', async () => {
    const { app, container } = await mountComponent({ modelValue: true, isLoading: true });

    expect(container.querySelector('[data-testid="miz-dialog-loading"]')?.textContent).toContain('読み込み中');
    expect(container.querySelector('[data-testid="miz-dialog-placeholder"]')).toBeNull();

    app.unmount();
  });

  it('閉じる操作で update:modelValue(false) を通知する', async () => {
    const { app, container, onUpdateModelValue } = await mountComponent({ modelValue: true });
    const closeButton = container.querySelector('button[aria-label="MIZ 翻訳ダイアログを閉じる"]');

    closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    expect(onUpdateModelValue).toHaveBeenCalledWith(false);

    app.unmount();
  });
});
