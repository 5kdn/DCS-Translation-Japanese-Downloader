// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';
import type { Plugin } from 'vue';
import { defineComponent, h, inject } from 'vue';
import { mountIntegrationComponent } from '../../integration/support/vueTestUtils/mountComponent';

describe('mountIntegrationComponent', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('props を渡して mount できる', () => {
    const component = defineComponent({
      name: 'MountPropsComponent',
      props: {
        count: {
          type: Number,
          required: true,
        },
      },
      setup(props) {
        return () => h('div', { 'data-count': String(props.count) });
      },
    });

    const { cleanup, wrapper } = mountIntegrationComponent(component, {
      props: {
        count: 3,
      },
    });

    expect(wrapper.attributes('data-count')).toBe('3');

    cleanup();
  });

  it('global stubs を反映できる', () => {
    const childComponent = defineComponent({
      name: 'ChildComponent',
      setup() {
        return () => h('div', { 'data-testid': 'child-component' });
      },
    });

    const component = defineComponent({
      name: 'ParentComponent',
      setup() {
        return () => h(childComponent);
      },
    });

    const { cleanup, wrapper } = mountIntegrationComponent(component, {
      global: {
        stubs: {
          ChildComponent: defineComponent({
            name: 'ChildComponentStub',
            setup() {
              return () => h('div', { 'data-testid': 'child-component-stub' });
            },
          }),
        },
      },
    });

    expect(wrapper.find('[data-testid="child-component"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="child-component-stub"]').exists()).toBe(true);

    cleanup();
  });

  it('plugin による provide を反映できる', () => {
    const plugin: Plugin = {
      install(app) {
        app.provide('integration-token', 'from-plugin');
      },
    };

    const component = defineComponent({
      name: 'InjectedComponent',
      setup() {
        const injectedValue = inject<string>('integration-token', 'missing');

        return () => h('div', { 'data-token': injectedValue });
      },
    });

    const { cleanup, wrapper } = mountIntegrationComponent(component, {
      global: {
        plugins: [plugin],
      },
    });

    expect(wrapper.attributes('data-token')).toBe('from-plugin');

    cleanup();
  });

  it('cleanup で unmount と container の除去を行う', () => {
    const component = defineComponent({
      name: 'CleanupComponent',
      setup() {
        return () => h('div', { 'data-testid': 'cleanup-component' });
      },
    });

    const { cleanup, container, wrapper } = mountIntegrationComponent(component);

    expect(document.body.contains(container)).toBe(true);
    expect(wrapper.find('[data-testid="cleanup-component"]').exists()).toBe(true);

    cleanup();

    expect(document.body.contains(container)).toBe(false);
  });
});
