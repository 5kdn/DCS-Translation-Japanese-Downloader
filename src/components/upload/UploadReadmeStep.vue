<script setup lang="ts">
import { computed, ref } from 'vue';
import type { UploadReadmeSource } from '@/features/upload/uploadDialogReadme';
import { renderMarkdown } from '@/lib/renderMarkdown';

const props = defineProps<{
  mode: 'existing' | 'create';
  readmePath: string;
  rawUrl: string | null;
  source: UploadReadmeSource;
  initialText: string;
  noticeMessage?: string | null;
}>();

const _editedText = defineModel<string>('editedText', { required: true });

const emit = defineEmits<{
  continueWithoutChanges: [];
  requestCreate: [];
  reset: [];
}>();

const _renderedHtml = computed((): string => renderMarkdown(props.initialText));
const _createMessage = computed((): string => {
  if (props.source === 'repository') return '既存の README_Translation.md を必要に応じて修正してください。';
  return 'テンプレートを編集し、README_Translation.md を作成してください。';
});
const _isDownloadingExistingReadme = ref(false);
const _isDownloadingDraftReadme = ref(false);

/**
 * @summary 指定内容を README_Translation.md としてダウンロードする。
 * @param content ダウンロード対象本文を指定する。
 */
const downloadReadmeText = (content: string): void => {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = 'README_Translation.md';
  anchor.click();
  URL.revokeObjectURL(objectUrl);
};

/**
 * @summary README入力値を初期値へ戻す要求を親へ通知する。
 */
const _reset = (): void => {
  emit('reset');
};

/**
 * @summary 既存READMEを直接ダウンロードする。
 * @returns Promise<void> を返す。
 */
const _downloadExistingReadme = async (): Promise<void> => {
  if (props.rawUrl === null || _isDownloadingExistingReadme.value) return;

  _isDownloadingExistingReadme.value = true;
  try {
    const response = await fetch(props.rawUrl);
    if (!response.ok) {
      throw new Error(`README_Translation.md の取得に失敗しました。(${response.status} ${response.statusText})`);
    }
    downloadReadmeText(await response.text());
  } finally {
    _isDownloadingExistingReadme.value = false;
  }
};

/**
 * @summary 編集中READMEを直接ダウンロードする。
 */
const _downloadDraftReadme = (): void => {
  if (_isDownloadingDraftReadme.value) return;
  _isDownloadingDraftReadme.value = true;
  try {
    downloadReadmeText(_editedText.value);
  } finally {
    _isDownloadingDraftReadme.value = false;
  }
};
</script>

<template lang="pug">
div.pt-2
  v-card(variant="tonal")
    v-card-text.py-0
      p.text-medium-emphasis 対象パス: {{ readmePath }}

  template(v-if="mode === 'existing'")
    v-alert.mt-4(type="info" variant="tonal")
      p リポジトリに既存の README_Translation.md があります。
      p 変更がある場合は修正したものをアップロードしてください。
    v-card
      v-card-text
        div.markdown-body(v-html="_renderedHtml")
    .d-flex.flex-wrap.ga-3.mt-4
      v-btn(
        color="secondary"
        variant="tonal"
        prepend-icon="mdi-download"
        :disabled="rawUrl === null"
        :loading="_isDownloadingExistingReadme"
        @click="_downloadExistingReadme"
      ) ダウンロード

  template(v-else)
    v-alert.mt-4(v-if="noticeMessage" type="warning" variant="tonal")
      p.mb-0 {{ noticeMessage }}
    v-alert.mt-4(type="info" variant="tonal")
      p.mb-0 {{ _createMessage }}
    v-textarea(
      v-model="_editedText"
      class="mt-4"
      name="upload-readme-text"
      label="README_Translation.md"
      variant="outlined"
      density="comfortable"
      rows="14"
      auto-grow
      color="primary"
      base-color="primary"
      spellcheck="false"
    )
    .d-flex.flex-wrap
      v-btn(
        color="secondary"
        variant="tonal"
        prepend-icon="mdi-download"
        :loading="_isDownloadingDraftReadme"
        @click="_downloadDraftReadme"
      ) ダウンロード
      v-btn(variant="text" @click="_reset") リセット
</template>

<style lang="scss" scoped>
:deep(.markdown-body) {
  ul, ol {
    padding-left: 1.25rem;
    margin: 0.5rem 0;
  }

  li {
    margin: 0.25rem 0;
  }

  li.task-list-item {
    list-style: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  input.task-list-item-checkbox {
    flex: 0 0 auto;
    margin-top: 0;
  }

  label.task-list-item-label {
    flex: 1 1 auto;
    margin: 0;
    line-height: 1.4;
  }
}
</style>
