// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';

function createDropZoneStub() {
  return defineComponent({
    name: 'DropZoneStub',
    inheritAttrs: true,
    props: {
      isDragOver: {
        type: Boolean,
        required: true,
      },
      isLoading: {
        type: Boolean,
        required: false,
        default: false,
      },
      headline: {
        type: String,
        required: true,
      },
      buttonLabel: {
        type: String,
        required: true,
      },
    },
    emits: ['action', 'dragenter', 'dragover', 'dragleave', 'drop'],
    setup(props, { emit, attrs }) {
      /**
       * @summary drag enter イベントを親へ通知する。
       */
      const emitDragEnter = (): void => {
        emit('dragenter', new Event('dragenter'));
      };

      /**
       * @summary drag over イベントを親へ通知する。
       */
      const emitDragOver = (): void => {
        emit('dragover', new Event('dragover'));
      };

      /**
       * @summary drag leave イベントを親へ通知する。
       */
      const emitDragLeave = (): void => {
        emit('dragleave');
      };

      /**
       * @summary drop イベントを親へ通知する。
       * @param event 発火した drop event を指定する。
       */
      const emitDrop = (event: Event): void => {
        emit('drop', event);
      };

      /**
       * @summary アクション押下を親へ通知する。
       */
      const emitAction = (): void => {
        emit('action');
      };

      return () =>
        h(
          'div',
          {
            ...attrs,
            class: ['drop-zone', props.isDragOver ? 'drop-zone--active elevation-3' : ''],
            onDragenter: emitDragEnter,
            onDragover: emitDragOver,
            onDragleave: emitDragLeave,
            onDrop: emitDrop,
          },
          [
            h('div', props.headline),
            h('div', 'または'),
            h(
              'button',
              {
                'data-testid': 'miz-select-button',
                disabled: props.isLoading,
                onClick: emitAction,
              },
              props.buttonLabel,
            ),
          ],
        );
    },
  });
}

vi.mock('@/components/common/DropZone.vue', () => {
  return {
    __esModule: true,
    default: createDropZoneStub(),
  };
});

vi.mock('/src/components/common/DropZone.vue', () => {
  return {
    __esModule: true,
    default: createDropZoneStub(),
  };
});

import MizTranslationEntrySection from '@/components/MizTranslationEntrySection.vue';

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
  for (const _index of [0, 1, 2, 3]) {
    await Promise.resolve();
    await nextTick();
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }
};

const mountComponent = async (props?: { isLoading?: boolean; errorMessage?: string | null }) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const onSelectMiz = vi.fn();
  const onClearError = vi.fn();

  const app = createApp(
    defineComponent({
      setup() {
        return () =>
          h(MizTranslationEntrySection, {
            isLoading: props?.isLoading ?? false,
            errorMessage: props?.errorMessage ?? null,
            onSelectMiz,
            onClearError,
          });
      },
    }),
  );

  app.component('v-card', createWrapperComponent('VCardStub'));
  app.component('v-icon', createWrapperComponent('VIconStub'));
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

  return { app, container, onSelectMiz, onClearError };
};

describe('MizTranslationEntrySection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('.miz 以外の選択を拒否してエラーを表示する', async () => {
    const { app, container, onSelectMiz } = await mountComponent();
    const input = container.querySelector('[data-testid="miz-file-input"]') as HTMLInputElement;
    const invalidFile = new File(['zip'], 'mission.zip', { type: 'application/zip' });

    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [invalidFile],
    });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await flushComponent();

    expect(onSelectMiz).not.toHaveBeenCalled();
    expect(container.querySelector('[data-testid="miz-entry-error"]')?.textContent).toContain('.miz');

    app.unmount();
  });

  it('単一の .miz 選択で親へ通知し、既存エラーをクリアする', async () => {
    const { app, container, onSelectMiz, onClearError } = await mountComponent({ errorMessage: 'server error' });
    const input = container.querySelector('[data-testid="miz-file-input"]') as HTMLInputElement;
    const mizFile = new File(['zip'], 'mission.miz', { type: 'application/zip' });

    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [mizFile],
    });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await flushComponent();

    expect(onClearError).toHaveBeenCalledTimes(1);
    expect(onSelectMiz).toHaveBeenCalledWith(mizFile);

    app.unmount();
  });

  it('UploadDropzone と同系統の主文言と操作ボタンを表示する', async () => {
    const { app, container } = await mountComponent();

    expect(container.querySelector('.miz-translation-panel')).not.toBeNull();
    expect(container.textContent).toContain(
      'MIZ ファイルから `l10n/DEFAULT/dictionary` を読み込み、翻訳編集ダイアログを開きます。',
    );
    expect(container.textContent).toContain('MIZ ファイルをドロップする');
    expect(container.textContent).toContain('または');
    expect(container.textContent).toContain('MIZ ファイルを選択');

    app.unmount();
  });

  it('drag and drop でも .miz 選択を親へ通知する', async () => {
    const { app, container, onSelectMiz, onClearError } = await mountComponent();
    const dropzone = container.querySelector('[data-testid="miz-dropzone"]');
    const mizFile = new File(['zip'], 'drop.miz', { type: 'application/zip' });
    const dropEvent = new Event('drop', { bubbles: true });

    Object.defineProperty(dropEvent, 'dataTransfer', {
      configurable: true,
      value: {
        files: [mizFile],
      },
    });

    dropzone?.dispatchEvent(dropEvent);
    await flushComponent();

    expect(onClearError).toHaveBeenCalledTimes(1);
    expect(onSelectMiz).toHaveBeenCalledWith(mizFile);

    app.unmount();
  });

  it('drag over 中は active class を付与する', async () => {
    const { app, container } = await mountComponent();
    const dropzone = container.querySelector('[data-testid="miz-dropzone"]');

    dropzone?.dispatchEvent(new Event('dragenter', { bubbles: true }));
    await flushComponent();

    expect(dropzone?.className).toContain('drop-zone--active');

    dropzone?.dispatchEvent(new Event('dragleave', { bubbles: true }));
    await flushComponent();

    expect(dropzone?.className).not.toContain('drop-zone--active');

    app.unmount();
  });
});
