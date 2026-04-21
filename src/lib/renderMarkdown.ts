import DOMPurify from 'dompurify';
import markdownit from 'markdown-it';
import taskLists from 'markdown-it-task-lists';

const md = markdownit({
  breaks: false,
  linkify: false,
  typographer: false,
  html: true,
}).use(taskLists, { enabled: true, label: true, labelAfter: true });

md.renderer.rules.link_open = (): string => '';
md.renderer.rules.link_close = (): string => '';

/**
 * @summary Markdown文字列をサニタイズ済みHTMLへ変換する。
 * @param markdownSource 変換対象のMarkdown文字列を指定する。
 * @param fallbackMessage 文字列が空のときに使う既定文言を指定する。
 * @returns サニタイズ済みHTML文字列を返す。
 */
export const renderMarkdown = (
  markdownSource: string | null | undefined,
  fallbackMessage = '詳細を取得できませんでした。',
): string => {
  const normalizedMarkdown = markdownSource?.trim() ? markdownSource : fallbackMessage;
  return DOMPurify.sanitize(md.render(normalizedMarkdown), { USE_PROFILES: { html: true } });
};
