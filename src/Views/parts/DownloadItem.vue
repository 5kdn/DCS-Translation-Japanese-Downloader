<script lang="ts" setup>
import { computed, ref } from 'vue';
import Button from './Button.vue';
import { ApiClient } from '@/Services/apiClient'

const isEnable = ref(true);

const props = defineProps<{
  title: string;
  path: string;
}>()

const ButtonClickCommand = async () => {
  isEnable.value = false;
  console.log(`title: ${props.title}`)
  console.log(`path: ${props.path}`)
  try{
    await ApiClient.DownloadZip(props.path, props.title);
  } catch(err) {
    console.error(err);
    alert("ファイルダウンロードに失敗しました");
  } finally {
    isEnable.value = true;
  }
}

</script>

<template lang="pug">
v-container#wrapper.d-flex.align-center.rounded
  div.text-area(style="min-width:0")
    p.d-print-block {{ props.title }}
  v-spacer
  div#button-wrapper.ml-1
    Button(label='DL' size='small' :disable="!isEnable" @click='ButtonClickCommand')
</template>

<style lang="scss" scoped>
.d-print-block {
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

#wrapper {
  transition: background 0.1s;
  &:hover {
    background: rgb(var(--v-theme-secondary));
  }
}
</style>
