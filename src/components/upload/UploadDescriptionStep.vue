<script setup lang="ts">
import type { UploadChangeType, UploadTargetType } from '@/features/upload/uploadDialogDomain';

defineProps<{
  targetType: UploadTargetType | null;
  targetName: string;
  fileEntryCount: number;
  uploadChangeTypes: readonly UploadChangeType[];
}>();

const _selectedChangeTypes = defineModel<UploadChangeType[]>('selectedChangeTypes', { required: true });
const _overview = defineModel<string>('overview', { required: true });
const _changeDetails = defineModel<string>('changeDetails', { required: true });
const _notes = defineModel<string>('notes', { required: true });
const _hasConfirmedNoPersonalInformation = defineModel<boolean>('hasConfirmedNoPersonalInformation', { required: true });
const _hasAgreedDistributionPolicy = defineModel<boolean>('hasAgreedDistributionPolicy', { required: true });
</script>

<template lang="pug">
div.pt-2
  p.text-title-small.font-weight-medium 選択内容
  v-card(variant="tonal")
    v-card-text.py-2
      p.text-medium-emphasis.my-0 対象の種類: {{ targetType }}
      p.text-medium-emphasis.my-0 対象名: {{ targetName }}
      p.text-medium-emphasis.my-0 ファイル数: {{ fileEntryCount }}
  p.text-title-small.font-weight-medium 変更点
  .d-flex.flex-wrap.ga-2.mb-2
    v-checkbox(
      v-for="option in uploadChangeTypes"
      :key="option"
      v-model="_selectedChangeTypes"
      :label="option"
      :value="option"
      color="primary"
      hide-details
      density="comfortable"
    )
  v-text-field(
    v-model="_overview"
    name="upload-overview"
    label="概要"
    placeholder="この変更の目的・背景を簡潔に書いてください"
    variant="outlined"
    density="comfortable"
    color="primary"
    base-color="primary"
    required
  )
  v-textarea(
    v-model="_changeDetails"
    name="upload-change-details"
    label="変更内容"
    variant="outlined"
    density="comfortable"
    rows="5"
    auto-grow
    color="primary"
    base-color="primary"
    required
  )
  v-textarea(
    v-model="_notes"
    name="upload-notes"
    label="留意点"
    variant="outlined"
    density="comfortable"
    rows="4"
    auto-grow
    color="primary"
    base-color="primary"
    required
  )
  p.text-title-small.font-weight-medium.mt-2 確認事項
  v-checkbox(
    v-model="_hasConfirmedNoPersonalInformation"
    color="primary"
    hide-details
    density="comfortable"
  )
    template(#label)
      span アップロードするファイルに個人情報は含まれていません
  v-checkbox(
    v-model="_hasAgreedDistributionPolicy"
    color="primary"
    hide-details
    density="comfortable"
  )
    template(#label)
      span
        | 5kdn/DCS-Translation-Japanese リポジトリの
        a(
          href="https://github.com/5kdn/DCS-Translation-Japanese/blob/master/DISTRIBUTION_POLICY.md"
          target="_blank"
          rel="noopener noreferrer"
          @click.stop
        ) 流通制御ポリシー
        | に同意します
</template>

<style scoped lang="scss">
.step-section-surface {
  padding: 1rem 1.25rem;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  background-color: rgba(var(--v-theme-on-surface), 0.02);
}
</style>
