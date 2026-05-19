import { defineComponent, h } from 'vue';

/**
 * 既定 slot をそのまま描画する薄い Vuetify wrapper stub を作成する。
 * @param name stub 名を指定する。
 * @returns wrapper stub コンポーネントを返す。
 */
export const createWrapperStub = (name: string) => {
  return defineComponent({
    name,
    setup(_, { attrs, slots }) {
      return () => h('div', attrs, slots.default?.());
    },
  });
};

/**
 * disabled と loading を反映する v-btn 向け stub を作成する。
 * @returns v-btn 向け stub コンポーネントを返す。
 */
export const createButtonStub = () => {
  return defineComponent({
    name: 'VBtnStub',
    props: {
      disabled: {
        type: Boolean,
        required: false,
        default: false,
      },
      loading: {
        type: Boolean,
        required: false,
        default: false,
      },
    },
    emits: ['click'],
    setup(props, { attrs, emit, slots }) {
      return () =>
        h(
          'button',
          {
            ...attrs,
            disabled: props.disabled,
            'data-loading': props.loading ? 'true' : 'false',
            onClick: (event: MouseEvent) => {
              if (props.disabled) return;
              const attrClick = attrs.onClick;
              if (typeof attrClick === 'function') {
                attrClick(event);
              }
              emit('click', event);
            },
          },
          slots.default?.(),
        );
    },
  });
};

/**
 * activator slot と既定 slot を展開する v-tooltip 向け stub を作成する。
 * @returns v-tooltip 向け stub コンポーネントを返す。
 */
export const createTooltipStub = () => {
  return defineComponent({
    name: 'VTooltipStub',
    setup(_, { slots }) {
      return () => h('div', [slots.activator?.({ props: {} }), slots.default?.()]);
    },
  });
};

/**
 * text prop または既定 slot を描画する v-alert 向け stub を作成する。
 * @returns v-alert 向け stub コンポーネントを返す。
 */
export const createAlertStub = () => {
  return defineComponent({
    name: 'VAlertStub',
    props: {
      text: {
        type: String,
        required: false,
        default: '',
      },
    },
    setup(props, { attrs, slots }) {
      return () => h('div', attrs, props.text || slots.default?.());
    },
  });
};

/**
 * checkbox 入力を描画する v-checkbox 向け stub を作成する。
 * @returns v-checkbox 向け stub コンポーネントを返す。
 */
export const createCheckboxStub = () => {
  return defineComponent({
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
    emits: ['update:modelValue', 'update:model-value'],
    setup(props, { attrs, emit }) {
      return () =>
        h('label', [
          h('input', {
            ...attrs,
            type: 'checkbox',
            checked: props.modelValue,
            onChange: (event: Event) => {
              const checked = (event.target as HTMLInputElement).checked;
              emit('update:modelValue', checked);
              emit('update:model-value', checked);
            },
          }),
          h('span', props.label),
        ]);
    },
  });
};

/**
 * textarea 入力を描画する v-textarea 向け stub を作成する。
 * @returns v-textarea 向け stub コンポーネントを返す。
 */
export const createTextareaStub = () => {
  return defineComponent({
    name: 'VTextareaStub',
    props: {
      modelValue: {
        type: String,
        required: true,
      },
      readonly: {
        type: Boolean,
        required: false,
        default: false,
      },
      rows: {
        type: [Number, String],
        required: false,
        default: 3,
      },
    },
    emits: ['update:modelValue', 'update:model-value'],
    setup(props, { attrs, emit }) {
      return () =>
        h('div', { ...attrs, class: ['translation-field', attrs.class] }, [
          h('textarea', {
            value: props.modelValue,
            readOnly: props.readonly,
            rows: props.rows,
            onInput: (event: Event) => {
              const value = (event.target as HTMLTextAreaElement).value;
              emit('update:modelValue', value);
              emit('update:model-value', value);
            },
          }),
        ]);
    },
  });
};

/**
 * modelValue が true のときだけ内容を描画する v-dialog 向け stub を作成する。
 * @returns v-dialog 向け stub コンポーネントを返す。
 */
export const createDialogStub = () => {
  return defineComponent({
    name: 'VDialogStub',
    props: {
      modelValue: {
        type: Boolean,
        required: true,
      },
    },
    setup(props, { attrs, slots }) {
      return () => (props.modelValue ? h('div', attrs, slots.default?.()) : null);
    },
  });
};
