<script lang="ts" setup>
import { computed, ref } from 'vue';
import Button from './Button.vue'
import { downloadRepoDirAsZip } from '@/Services/github'

const isEnable = ref(true)

const props = defineProps<{
  path: string;
}>()

const title = computed(()=>{
  return props.path.split("/").pop() ?? "!! undefined !!"
})

const ButtonClickCommand = async () => {
  try{
    isEnable.value = false
    await downloadRepoDirAsZip(props.path)
  } catch(err) {
    console.error(err)
    alert("ファイルダウンロードに失敗しました")
  } finally {
    isEnable.value = true
  }
}

</script>

<template lang="pug">
v-container#wrapper.d-flex.align-center.rounded
  div.text-area(style="min-width:0")
    p.d-print-block {{ title }}
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