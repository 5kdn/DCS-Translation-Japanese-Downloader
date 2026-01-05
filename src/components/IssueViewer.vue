<script lang="ts" setup>
import DOMPurify from 'dompurify';
import markdownit from 'markdown-it';
import taskLists from 'markdown-it-task-lists';
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
import { toErrorMessageForDisplay } from '@/errors/errorMessage';
import { fetchIssues, type ListIssueRequest } from '@/lib/client';
import type { IssueItem } from '@/types/type';

defineOptions({
  components: {
    Button: defineAsyncComponent(() => import('./common/Button.vue')),
  },
});

const isLoading = ref(false);
const isDialogOpen = ref(false);
const errorMessage = ref<string | null>(null);
const fetchedIssues = ref<IssueItem[]>([]);

const md = markdownit({
  breaks: false,
  linkify: false,
  typographer: false,
  html: true,
}).use(taskLists, { enabled: true, label: true, labelAfter: true });
md.renderer.rules.link_open = (): string => '';
md.renderer.rules.link_close = (): string => '';

/**
 * @summary APIエラーを表示用メッセージに変換する。
 * @param error APIクライアントから受け取るエラーオブジェクトを受け取る。
 * @returns 画面表示向けのエラーメッセージ文字列を返す。
 */
const toErrorMessage = (error: unknown): string => toErrorMessageForDisplay(error);

/**
 * @summary issue.message を Markdown から HTML に変換して返却する。
 * @param message Markdown文字列を指定する。
 * @returns サニタイズ済みHTML文字列を返却する。
 * @remarks message が空のときは既定文言を返却する。
 */
const renderIssueMessage = (message: string | null | undefined): string => {
  const fallbackMessage = '詳細を取得できませんでした。';
  const markdownSource = message?.trim() ? message : fallbackMessage;
  const renderedHtml = md.render(markdownSource);
  return DOMPurify.sanitize(renderedHtml, { USE_PROFILES: { html: true } });
};

const _issues = computed<IssueItem[]>((): IssueItem[] => fetchedIssues.value);
const _count = computed((): number => _issues.value.length);

const _issuesWithSafeHtml = computed(
  (): Array<IssueItem & { safeHtml: string }> =>
    _issues.value.map((issue: IssueItem): IssueItem & { safeHtml: string } => ({
      ...issue,
      safeHtml: renderIssueMessage(issue.body),
    })),
);

/**
 * @summary Issue一覧を取得する。
 */
const getIssues = async (): Promise<void> => {
  if (isLoading.value) {
    console.info('ロード処理中のため中止します。');
    return;
  }

  console.info('Issue 一覧を取得する。');
  isLoading.value = true;
  errorMessage.value = null;

  try {
    const request: ListIssueRequest = { state: 'open' };
    fetchedIssues.value = await fetchIssues(request);
    console.info('Issue 一覧を取得した。');
  } catch (err: unknown) {
    const msg = toErrorMessage(err);
    console.error(err);
    errorMessage.value = msg;
  } finally {
    isLoading.value = false;
  }
};

/**
 * @summary 指定されたIssue URLへ遷移する。
 * @param url 遷移先のIssue URLを指定する。
 */
const _NavToIssuePage = (url: string | undefined): void => {
  if (url === undefined) {
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * @summary Issueダイアログの開閉を切り替える。
 */
const _toggleIssueDialog = (): void => {
  if (isLoading.value) return;
  isDialogOpen.value = !isDialogOpen.value;
};

onMounted(async (): Promise<void> => {
  await getIssues();
});
</script>

<template lang="pug">
v-badge#show-issue-dialog.me-4(location="top right" color="error" :content="_count" :model-value="_count > 0")
  slot(:toggle="_toggleIssueDialog" :is-loading="isLoading" :count="_count")

v-dialog(v-model="isDialogOpen" eager max-width="min(900px, 90vw)")
  v-card
    v-card-title.d-flex.align-center
      | Issues
      v-spacer
      v-btn(icon="mdi-close" variant="text" @click="isDialogOpen = false")
    v-card-text
      v-alert.my-2(type="info" variant="tonal" v-if="isLoading") 読み込み中です...
      v-alert.my-2(type="error" variant="tonal" v-if="errorMessage") {{ errorMessage }}
      v-container.issue-viewer.overflow-y-auto
        v-expansion-panels
          v-expansion-panel(v-for='issue in _issuesWithSafeHtml' :key="issue.issueUrl")
            div.issue-header.d-flex.flex-column
              v-expansion-panel-title.d-flex.flex-row.flex-0-0.justify-space-between.align-center
                p.text-h5.text-break.flex-grow-1 {{ issue.title }}
                Button.ms-4(label='Go' @click.stop='_NavToIssuePage(issue.issueUrl)')
            v-expansion-panel-text
              div.markdown-body.pa-4.ma-4.border-thin.rounded.border-primary.bg-grey-lighten-4.text-break(v-html='issue.safeHtml')

          //- 公開されている Issue が無いときのデフォルト表示
          v-expansion-panel(v-if='_issuesWithSafeHtml.length === 0')
            v-expansion-panel-title
              p.text-h5.text-break 現在公開されている報告はありません。
    v-card-actions
      v-spacer
      v-btn(variant="tonal" @click="isDialogOpen = false") 閉じる
</template>

<style lang="scss" scoped>
.issue-viewer {
  max-height: 70vh;
  overscroll-behavior: contain;
}

:deep(.markdown-body) {
  ul, ol {
    // Vuetify の global reset（`* { margin: 0; padding: 0; }`）で消えるインデントを復元する。
    padding-left: 1.25rem;
    margin: 0.5rem 0;
  }

  li {
    margin: 0.25rem 0;
  }

  li.task-list-item {
    // タスクリストはマーカーではなくチェックボックスが先頭に来るので、箇条書きは消す。
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
