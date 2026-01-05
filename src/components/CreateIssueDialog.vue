<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { toErrorMessageForDisplay } from '@/errors/errorMessage';
import { type CreateIssueItem, type CreateIssueRequest, fetchCreateIssue } from '@/lib/client';

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
  (e: 'submit', items?: CreateIssueItem[]): void;
  (e: 'close'): void;
  (e: 'error', message: string): void;
}>();

const loading = ref(false);

const _dialogModel = computed({
  get: (): boolean => props.modelValue,
  set: (value: boolean): void => emit('update:modelValue', value),
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
  (path: string): void => {
    form.value.typo.title = `[typo] ${path}`;
    form.value.bug.title = `[bugs] ${path}`;
    form.value.other.title = `[others] ${path}`;
  },
  { immediate: true },
);

/**
 * @summary ダイアログを閉じる処理を行う。
 * @returns void を返す。
 */
const _closeDialog = (): void => {
  if (loading.value) return;
  emit('update:modelValue', false);
  emit('close');
};

/**
 * @summary 入力値が空ではないか判定する。
 * @param value 判定対象の文字列を指定する。
 * @returns 空でなければ true を返す。
 */
const isFilled = (value: string | undefined): boolean => (value ?? '').trim().length > 0;

const _canSubmit = computed((): boolean => {
  if (tab.value === 'typo') return isFilled(form.value.typo.lineHint) && isFilled(form.value.typo.expect);
  if (tab.value === 'bug')
    return isFilled(form.value.bug.expect) && isFilled(form.value.bug.actual) && isFilled(form.value.bug.environment);
  return isFilled(form.value.other.message);
});

/**
 * @summary エラー内容から表示メッセージを解決する。
 * @param error 例外オブジェクトを指定する。
 * @returns 表示用のエラーメッセージを返す。
 */
const resolveErrorMessage = (error: unknown): string => toErrorMessageForDisplay(error);

/**
 * @summary タブ種別から Issue ラベルを解決する。
 * @param tabValue 現在のタブ種別を指定する。
 * @returns 付与するラベル一覧を返す。
 */
const resolveLabels = (tabValue: 'typo' | 'bug' | 'other'): string[] => {
  if (tabValue === 'typo') return ['translation', 'typo'];
  if (tabValue === 'bug') return ['translation', 'bugs'];
  return ['translation'];
};

/**
 * @summary Issue を送信する処理を行う。
 * @returns Promise<void> を返す。
 */
const _submitDialog = async (): Promise<void> => {
  if (loading.value) return;

  const title: string = form.value[tab.value].title;
  const message: string | undefined = ((): string | undefined => {
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
  let isSuccess = false;
  try {
    const request: CreateIssueRequest = {
      title,
      body: message,
      labels: resolveLabels(tab.value),
    };
    const items = await fetchCreateIssue(request);
    emit('submit', items);
    isSuccess = true;
  } catch (err: unknown) {
    console.error(err);
    const message = resolveErrorMessage(err);
    emit('error', message);
  } finally {
    loading.value = false;
    if (isSuccess) _closeDialog();
  }
};
</script>

<template lang="pug">
v-dialog(v-model='_dialogModel' :persistent='true')
  v-card
    v-card-title.d-flex.align-center.justify-space-between.ga-2
      span.font-weight-medium 報告
      v-btn(icon='mdi-close' variant='text' density='comfortable' :disabled='loading' @click='_closeDialog')
    v-card-text
      v-tabs(v-model='tab' density='comfortable' align-tabs='center' grow mandatory color='primary')
        v-tab(value='typo') 誤字・脱字
        v-tab(value='bug') 不具合
        v-tab(value='other') その他
      v-window.pt-5.px-8(v-model='tab')
        v-window-item(value='typo')
          v-text-field(v-model='form.typo.title' name='issue-typo-title' label='タイトル' variant='outlined' density='comfortable' color='primary' base-color='primary' readonly)
          v-textarea(v-model='form.typo.lineHint' name='issue-typo-line-hint' label='修正場所が分かる情報（行数や具体的なテキストなど）*' variant='outlined' density='comfortable' rows='3' auto-grow color='primary' base-color='primary' required)
          v-textarea(v-model='form.typo.expect' name='issue-typo-expect' label='期待するテキスト*' variant='outlined' density='comfortable' rows='3' auto-grow color='primary' base-color='primary' required)
          v-textarea(v-model='form.typo.notes' name='issue-typo-notes' label='備考' variant='outlined' density='comfortable' rows='2' auto-grow class='mt-2' color='primary' base-color='primary')

        v-window-item(value='bug')
          v-text-field(v-model='form.bug.title' name='issue-bug-title' label='タイトル' variant='outlined' density='comfortable' color='primary' base-color='primary' readonly)
          v-textarea(v-model='form.bug.expect' name='issue-bug-expect' label='期待される動作*' variant='outlined' density='comfortable' rows='3' auto-grow color='primary' base-color='primary' required)
          v-textarea(v-model='form.bug.actual' name='issue-bug-actual' label='実際の動作*' variant='outlined' density='comfortable' rows='3' auto-grow color='primary' base-color='primary' required)
          v-textarea(v-model='form.bug.environment' name='issue-bug-environment' label='環境情報（OS、ブラウザなど）*' variant='outlined' density='comfortable' rows='2' auto-grow class='mt-4' color='primary' base-color='primary' required)
          v-textarea(v-model='form.bug.notes' name='issue-bug-notes' label='備考' variant='outlined' density='comfortable' rows='2' auto-grow class='mt-2' color='primary' base-color='primary')

        v-window-item(value='other')
          v-text-field(v-model='form.other.title' name='issue-other-title' label='タイトル' variant='outlined' density='comfortable' color='primary' base-color='primary' readonly)
          v-textarea(v-model='form.other.message' name='issue-other-message' label='内容*' variant='outlined' density='comfortable' rows='5' auto-grow color='primary' base-color='primary' required)

    v-card-actions.px-6.pb-4
      v-btn(variant='tonal' :disabled='loading' @click='_closeDialog') 閉じる
      v-btn(color='primary' :loading='loading' :disabled='loading || !_canSubmit' @click='_submitDialog') 送信
</template>
