// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import MizTranslationFilterPanel from '@/components/mizTranslation/MizTranslationFilterPanel.vue';
import { mountIntegrationComponent } from '../../support/vueTestUtils/mountComponent';
import {
  createAlertStub,
  createButtonStub,
  createCheckboxStub,
  createTooltipStub,
  createWrapperStub,
} from '../../support/vueTestUtils/vuetifyStubs';

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
  const onShowEnabled = vi.fn();
  const onShowDisabled = vi.fn();
  const onShowOnlyUntranslated = vi.fn();
  const onHideNonTranslatable = vi.fn();
  const onHideEmptySourceText = vi.fn();

  const { cleanup, wrapper } = mountIntegrationComponent(MizTranslationFilterPanel, {
    props: {
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
    },
    global: {
      components: {
        'v-checkbox': createCheckboxStub(),
        'v-alert': createAlertStub(),
        'v-chip': createWrapperStub('VChipStub'),
        'v-btn': createButtonStub(),
        'v-tooltip': createTooltipStub(),
      },
    },
  });
  await flushComponent();

  return {
    cleanup,
    wrapper,
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

  it('各フィルター更新を親へ通知する', async () => {
    const {
      cleanup,
      wrapper,
      onShowEnabled,
      onShowDisabled,
      onShowOnlyUntranslated,
      onHideNonTranslatable,
      onHideEmptySourceText,
    } = await mountComponent();

    await wrapper.get('[data-testid="miz-filter-show-enabled"] input').setValue(false);
    await wrapper.get('[data-testid="miz-filter-show-disabled"] input').setValue(false);
    await wrapper.get('[data-testid="miz-filter-show-only-untranslated"] input').setValue(true);
    await wrapper.get('[data-testid="miz-filter-hide-non-translatable"] input').setValue(false);
    await wrapper.get('[data-testid="miz-filter-hide-empty-source-text"] input').setValue(false);
    await flushComponent();

    expect(onShowEnabled).toHaveBeenCalledWith(false);
    expect(onShowDisabled).toHaveBeenCalledWith(false);
    expect(onShowOnlyUntranslated).toHaveBeenCalledWith(true);
    expect(onHideNonTranslatable).toHaveBeenCalledWith(false);
    expect(onHideEmptySourceText).toHaveBeenCalledWith(false);

    cleanup();
  });
});
