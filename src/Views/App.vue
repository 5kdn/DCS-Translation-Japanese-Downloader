<script setup lang="ts">
import { ref } from 'vue'
import { listFilesInDir } from '@/Services/github'
import { download } from '@/Services/download'
import Button from '@/Views/parts/Button.vue'
import DownloadItem from '@/Views/parts/DownloadItem.vue'

const downloadAllFlg = ref(true)
const aircrafts = ref([] as string[])
const dlcCampaigns = ref([] as string[])
try{
  (async () => {
    aircrafts.value = await listFilesInDir('DCSWorld/Mods/aircraft')
    dlcCampaigns.value = await listFilesInDir('DCSWorld/Mods/campaigns')
  })()
}
catch(err){
  alert(err)
}

const onClickDownloadAll = async () => {
  const url = 'https://github.com/5kdn/DCS-Translation-Japanese/archive/refs/heads/master.zip'
  const fname = 'DCS-Translation-Japanese.zip'
  downloadAllFlg.value = false
  try {
    await download(url, fname)
  } catch(err){
    console.log(err)
    alert('ダウンロードに失敗しました')
  }finally{
    downloadAllFlg.value = true
  }
}
</script>


<template lang="pug">
v-container#app-wrapper.pt-10
  h1.text-h1.text-center DCS Transition Japanese
  v-divider

  h2.text-h2.mt-10.mb-5 All files
  Button(:primary='true', label='DL' :disable='!downloadAllFlg' @click='onClickDownloadAll')


  h2.text-h2.mt-10.mb-5 Aircrafts
  v-list
    v-list-item(v-for="file in aircrafts" :key="file")
      DownloadItem(:path="file")

  h2.text-h2.mt-10.mb-5 DLC Campaigns
  v-list
    v-list-item(v-for="file in dlcCampaigns" :key="file")
      DownloadItem(:path="file")
</template>

<style lang="scss" scoped>
#app-wrapper {
  max-width: min(80svw, 1200px);
}
</style>