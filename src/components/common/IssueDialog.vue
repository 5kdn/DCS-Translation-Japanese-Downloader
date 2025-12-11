<script lang="ts" setup>
import type { ApiError } from '@microsoft/kiota-abstractions';
import { computed, ref, watch } from 'vue';
import { type CreateIssuePayload, createIssue } from '@/lib/client';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    path: string;
  }>(),
  {
    modelValue: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit'): void;
  (e: 'close'): void;
  (e: 'error', message: string): void;
}>();

const loading = ref(false);

const _dialogModel = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const tab = ref<'typo' | 'bug' | 'other'>('typo');
const form = ref({
  typo: { title: `[typo] ${props.path}`, lineHint: '', expect: '', notes: '<!-- 必要がなければ N/A としてください -->\nN/A' },
  bug: {
    title: `[bugs] ${props.path}`,
    expect: '',
    actual: '',
    environment: '',
    notes: '<!-- 必要がなければ N/A としてください -->\nN/A',
  },
  other: { title: `[others] ${props.path}`, message: '', notes: '<!-- 必要がなければ N/A としてください -->\nN/A' },
} satisfies Record<
  'typo' | 'bug' | 'other',
  {
    title: string;
    lineHint?: string;
    expect?: string;
    actual?: string;
    environment?: string;
    notes?: string;
    message?: string;
  }
>);

watch(
  () => props.path,
  (path) => {
    form.value.typo.title = `[typo] ${path}`;
    form.value.bug.title = `[bugs] ${path}`;
    form.value.other.title = `[others] ${path}`;
  },
  { immediate: true },
);

/**
 * @summary ダイアログを閉じる処理。
 */
const _closeDialog = (): void => {
  if (loading.value) return;
  emit('update:modelValue', false);
  emit('close');
};

const isFilled = (value: string | undefined): boolean => (value ?? '').trim().length > 0;

const _canSubmit = computed(() => {
  if (tab.value === 'typo') return isFilled(form.value.typo.lineHint) && isFilled(form.value.typo.expect);
  if (tab.value === 'bug')
    return isFilled(form.value.bug.expect) && isFilled(form.value.bug.actual) && isFilled(form.value.bug.environment);
  return isFilled(form.value.other.message);
});

const resolveErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object') {
    const fromServer =
      typeof (error as { messageEscaped?: string | null }).messageEscaped === 'string'
        ? (error as { messageEscaped: string }).messageEscaped
        : undefined;
    const statusCode =
      'responseStatusCode' in error && typeof (error as ApiError).responseStatusCode === 'number'
        ? (error as ApiError).responseStatusCode
        : undefined;
    const detail = fromServer ?? (error instanceof Error && error.message ? error.message : fallback);
    return statusCode ? `${detail}（HTTP ${statusCode}）` : detail;
  }
  return error instanceof Error && error.message ? error.message : fallback;
};

/**
 * @summary Issue を送信する処理。
 */
const _submitDialog = async (): Promise<void> => {
  if (loading.value) return;

  const title: string = form.value[tab.value].title;
  const message: string | undefined = (() => {
    if (tab.value === 'typo') {
      const typo = form.value.typo;
      return (
        `## 修正場所が分かる情報\n\n${typo.lineHint}\n\n` +
        `## 期待するテキスト\n\n${typo.expect}\n\n` +
        `## 備考\n\n${typo.notes}\n`
      );
    }
    if (tab.value === 'bug') {
      const bug = form.value.bug;
      return (
        `## 期待される動作\n\n${bug.expect}\n\n` +
        `## 実際の動作\n\n${bug.actual}\n\n` +
        `## 環境情報\n\n${bug.environment}\n\n` +
        `## 備考\n\n${bug.notes}`
      );
    }
    if (tab.value === 'other') {
      const other = form.value.other;
      return `## 内容\n${other.message}`;
    }
    return undefined;
  })();
  if (message === undefined) return;

  loading.value = true;
  try {
    const payload: CreateIssuePayload = {
      title,
      body: message,
    };
    await createIssue(payload);
    emit('submit');
    _closeDialog();
  } catch (err: unknown) {
    console.error(err);
    const message = resolveErrorMessage(err, 'Issue の送信に失敗しました');
    emit('error', message);
  } finally {
    loading.value = false;
    _closeDialog();
  }
};
</script>

<template lang="pug">
v-dialog(v-model='_dialogModel' :persistent='true')
  v-card
    v-card-title.dialog__title
      span.dialog__title-text 報告
      v-btn(icon='mdi-close' variant='text' density='comfortable' :disabled='loading' @click='_closeDialog')
    v-card-text
      v-tabs(v-model='tab' density='comfortable' align-tabs='center' grow mandatory color='primary')
        v-tab(value='typo') 誤字・脱字
        v-tab(value='bug') 不具合
        v-tab(value='other') その他
      v-window.pt-5.px-8(v-model='tab')
        v-window-item(value='typo')
          v-text-field(v-model='form.typo.title' label='タイトル' variant='outlined' density='comfortable' color='primary' base-color='primary' readonly)
          v-textarea(v-model='form.typo.lineHint' label='修正場所が分かる情報（行数や具体的なテキストなど）*' variant='outlined' density='comfortable' rows='3' auto-grow color='primary' base-color='primary' required)
          v-textarea(v-model='form.typo.expect' label='期待するテキスト*' variant='outlined' density='comfortable' rows='3' auto-grow color='primary' base-color='primary' required)
          v-textarea(v-model='form.typo.notes' label='備考' variant='outlined' density='comfortable' rows='2' auto-grow class='mt-2' color='primary' base-color='primary')

        v-window-item(value='bug')
          v-text-field(v-model='form.bug.title' label='タイトル' variant='outlined' density='comfortable' color='primary' base-color='primary' readonly)
          v-textarea(v-model='form.bug.expect' label='期待される動作*' variant='outlined' density='comfortable' rows='3' auto-grow color='primary' base-color='primary' required)
          v-textarea(v-model='form.bug.actual' label='実際の動作*' variant='outlined' density='comfortable' rows='3' auto-grow color='primary' base-color='primary' required)
          v-textarea(v-model='form.bug.environment' label='環境情報（OS、ブラウザなど）*' variant='outlined' density='comfortable' rows='2' auto-grow class='mt-4' color='primary' base-color='primary' required)
          v-textarea(v-model='form.bug.notes' label='備考' variant='outlined' density='comfortable' rows='2' auto-grow class='mt-2' color='primary' base-color='primary')

        v-window-item(value='other')
          v-text-field(v-model='form.other.title' label='タイトル' variant='outlined' density='comfortable' color='primary' base-color='primary' readonly)
          v-textarea(v-model='form.other.message' label='内容*' variant='outlined' density='comfortable' rows='5' auto-grow color='primary' base-color='primary' required)

    v-card-actions.dialog__actions
      v-btn(variant='tonal' :disabled='loading' @click='_closeDialog') 閉じる
      v-btn(color='primary' :loading='loading' :disabled='loading || !_canSubmit' @click='_submitDialog') 送信
</template>

<style lang="scss" scoped>
.dialog__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.dialog__title-text {
  font-weight: 600;
}

.dialog__text {
  margin: 0;
  white-space: pre-line;
}

.dialog__path {
  margin: 0.75rem 0 0.5rem;
  font-size: 0.9rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.dialog__actions {
  padding-inline: 1.5rem;
  padding-bottom: 1rem;
}
</style>
