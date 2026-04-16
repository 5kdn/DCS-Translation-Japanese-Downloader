<script setup lang="ts">
import type { UploadDialogSubmitResult } from '@/features/upload/uploadDialogSubmit';

defineProps<{
  result: UploadDialogSubmitResult | null;
}>();
</script>

<template lang="pug">
div.pt-2(v-if="result !== null")
  v-alert.mb-4.text-pre-wrap(
    :type="result.isSuccess ? 'success' : 'error'"
    variant="tonal"
  ) {{ result.message }}

  v-card(variant="tonal")
    v-card-text
      p.text-title-medium.font-weight-medium 送信結果
      p.text-medium-emphasis {{ `ステータス: ${result.isSuccess ? '成功' : '失敗'}` }}
      p.text-medium-emphasis(v-if="result.prUrl")
        | PR URL:
        a(:href="result.prUrl" target="_blank" rel="noopener noreferrer") {{ result.prUrl }}
      div(v-if="result.note")
        p.text-title-small.font-weight-medium.mt-4 補足
        p.mt-2.text-pre-wrap.text-break {{ result.note }}
  v-alert.mt-4(v-if="result.isSuccess" type="info" variant="tonal")
    p アップロードされたファイルは、ファイルパスなどの内容を確認した後に正式に取り込まれます。
    p 取り込み完了まで数日かかる場合があります。
</template>
