import type { MountingOptions } from '@vue/test-utils';
import { mergeMountStubs } from './mountStubs';

type BaseMountingOptions = MountingOptions<unknown>;
type GlobalMountOptions = NonNullable<BaseMountingOptions['global']>;
type SlotDictionary = NonNullable<BaseMountingOptions['slots']>;

export type IntegrationMountGlobalOptions = Pick<
  GlobalMountOptions,
  'components' | 'directives' | 'mocks' | 'plugins' | 'provide' | 'stubs'
>;

export type IntegrationMountOptions = {
  attachTo?: Element | string;
  props?: Record<string, unknown> | null;
  slots?: SlotDictionary;
  global?: IntegrationMountGlobalOptions;
};

/**
 * Integration テスト向けの global mount 設定を組み立てる。
 * @param global テスト固有の global 設定を指定する。
 * @returns mount に渡す global 設定を返す。
 */
export const createIntegrationMountGlobalOptions = (global?: IntegrationMountGlobalOptions): GlobalMountOptions => {
  return {
    components: { ...(global?.components ?? {}) },
    directives: { ...(global?.directives ?? {}) },
    mocks: { ...(global?.mocks ?? {}) },
    plugins: [...(global?.plugins ?? [])],
    provide: { ...(global?.provide ?? {}) },
    stubs: mergeMountStubs(undefined, global?.stubs),
  };
};
