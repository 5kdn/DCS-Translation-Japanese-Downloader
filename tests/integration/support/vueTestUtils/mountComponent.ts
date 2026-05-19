import { mount, type VueWrapper } from '@vue/test-utils';
import type { Component, ComponentPublicInstance } from 'vue';
import { createIntegrationMountGlobalOptions, type IntegrationMountOptions } from './mountConfig';

type MountableComponent = Component;

export type IntegrationWrapper = VueWrapper<ComponentPublicInstance>;

export type MountedIntegrationComponent = {
  cleanup: () => void;
  container: HTMLDivElement;
  wrapper: IntegrationWrapper;
};

/**
 * Integration テスト向けにコンポーネントを mount する。
 * @param component mount 対象の Vue コンポーネントを指定する。
 * @param options props、slots、global 設定を指定する。
 * @returns wrapper と cleanup 手段を返す。
 */
export const mountIntegrationComponent = <TComponent extends MountableComponent>(
  component: TComponent,
  options: IntegrationMountOptions = {},
): MountedIntegrationComponent => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const wrapper = mount(component as never, {
    attachTo: options.attachTo ?? container,
    props: (options.props ?? undefined) as never,
    slots: options.slots as never,
    global: createIntegrationMountGlobalOptions(options.global),
  }) as unknown as IntegrationWrapper;

  const cleanup = (): void => {
    wrapper.unmount();
    container.remove();
  };

  return {
    cleanup,
    container,
    wrapper,
  };
};
