// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';
import MizTranslationFilterPanel from '@/components/MizTranslationFilterPanel.vue';

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

const mountComponent = async (props?: Partial<InstanceType<typeof MizTranslationFilterPanel>['$props']>) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const onShowEnabled = vi.fn();
  const onShowDisabled = vi.fn();
  const onShowOnlyUntranslated = vi.fn();
  const onHideNonTranslatable = vi.fn();
  const onHideEmptySourceText = vi.fn();

  const app = createApp(
    defineComponent({
      setup() {
        return () =>
          h(MizTranslationFilterPanel, {
            showEnabled: props?.showEnabled ?? true,
            showDisabled: props?.showDisabled ?? true,
            showOnlyUntranslated: props?.showOnlyUntranslated ?? false,
            hideNonTranslatable: props?.hideNonTranslatable ?? true,
            hideEmptySourceText: props?.hideEmptySourceText ?? true,
            visibleEntryCount: props?.visibleEntryCount ?? 1,
            totalEntryCount: props?.totalEntryCount ?? 3,
            'onUpdate:show-enabled': onShowEnabled,
            'onUpdate:show-disabled': onShowDisabled,
            'onUpdate:show-only-untranslated': onShowOnlyUntranslated,
            'onUpdate:hide-non-translatable': onHideNonTranslatable,
            'onUpdate:hide-empty-source-text': onHideEmptySourceText,
          });
      },
    }),
  );

  app.component(
    'v-checkbox',
    defineComponent({
      name: 'VCheckboxStub',
      props: {
        modelValue: {
          type: Boolean,
          required: true,
        },
        label: {
          type: String,
          required: false,
          default: '',
        },
      },
      emits: ['update:modelValue'],
      setup(props, { emit, attrs }) {
        return () =>
          h('label', { ...attrs }, [
            h('input', {
              type: 'checkbox',
              checked: props.modelValue,
              onChange: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).checked),
            }),
            h('span', props.label),
          ]);
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
  app.component('v-chip', createWrapperComponent('VChipStub'));
  app.component(
    'v-btn',
    defineComponent({
      name: 'VBtnStub',
      emits: ['click'],
      setup(_, { emit, attrs, slots }) {
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
  app.component(
    'v-tooltip',
    defineComponent({
      name: 'VTooltipStub',
      setup(_, { slots }) {
        return () => h('div', [slots.activator?.({ props: {} }), slots.default?.()]);
      },
    }),
  );
  app.mount(container);
  await flushComponent();

  return {
    app,
    container,
    onShowEnabled,
    onShowDisabled,
    onShowOnlyUntranslated,
    onHideNonTranslatable,
    onHideEmptySourceText,
  };
};

describe('MizTranslationFilterPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('件数表示と主要フィルター要素を描画する', async () => {
    const { app, container } = await mountComponent({ visibleEntryCount: 2, totalEntryCount: 5 });

    expect(container.textContent).toContain('表示 2 / 5 件');
    expect(container.querySelector('[data-testid="miz-filter-show-enabled"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="miz-filter-show-disabled"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="miz-filter-show-only-untranslated"]')).not.toBeNull();

    app.unmount();
  });

  it('各フィルター更新を親へ通知する', async () => {
    const {
      app,
      container,
      onShowEnabled,
      onShowDisabled,
      onShowOnlyUntranslated,
      onHideNonTranslatable,
      onHideEmptySourceText,
    } = await mountComponent();

    (container.querySelector('[data-testid="miz-filter-show-enabled"] input') as HTMLInputElement).click();
    (container.querySelector('[data-testid="miz-filter-show-disabled"] input') as HTMLInputElement).click();
    (container.querySelector('[data-testid="miz-filter-show-only-untranslated"] input') as HTMLInputElement).click();
    (container.querySelector('[data-testid="miz-filter-hide-non-translatable"] input') as HTMLInputElement).click();
    (container.querySelector('[data-testid="miz-filter-hide-empty-source-text"] input') as HTMLInputElement).click();
    await flushComponent();

    expect(onShowEnabled).toHaveBeenCalledWith(false);
    expect(onShowDisabled).toHaveBeenCalledWith(false);
    expect(onShowOnlyUntranslated).toHaveBeenCalledWith(true);
    expect(onHideNonTranslatable).toHaveBeenCalledWith(false);
    expect(onHideEmptySourceText).toHaveBeenCalledWith(false);

    app.unmount();
  });

  it('tooltip に仕様文言を表示する', async () => {
    const { app, container } = await mountComponent();

    expect(container.querySelector('[data-testid="miz-filter-hide-non-translatable-tooltip-text"]')?.textContent).toBe(
      `翻訳対象外であると思われる以下の項目を非表示にします
  - キーが DictKey_ から始まらない
  - キーが DictKey_WptName_* に当てはまる
  - キーが DictKey_ActionComment_* に当てはまる
  - キーが DictKey_GroupName_* に当てはまる
  - キーが DictKey_UnitName_* に当てはまる`,
    );
    expect(container.querySelector('[data-testid="miz-filter-hide-empty-source-text-tooltip-text"]')?.textContent).toBe(
      '原文が空の文字列である項目を非表示にします',
    );

    app.unmount();
  });
});
