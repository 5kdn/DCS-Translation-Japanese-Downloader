<script lang="ts" setup>
import { ref } from 'vue';
import raw_licenses from '@/assets/LICENSES/licenses.json' with { type: 'json' };

const _dialog = ref(false);
const _year = new Date().getFullYear();

interface RawLicenseEntry {
  licenses: string;
  repository: string;
  publisher: string;
  licenseText: string;
  name: string;
  version: string;
}

interface RawLicenseMap {
  [packageNameWithVersion: string]: RawLicenseEntry;
}

const _licenses = raw_licenses as RawLicenseMap;
</script>


<template lang="pug">
v-footer.text-center.d-flex.flex-column.ga-2.py-4.text-on-primary(color="primary")

  v-container#footer-content.d-flex.flex-row
    v-container#footer-us.d-flex.flex-column.ga-2
      p: a.footer-link(href="https://github.com/5kdn/DCS-Translation-Japanese" target='_blank') DCS-Translation-Japanese
      p: a.footer-link(href="https://github.com/5kdn/DCS-Translation-Japanese-Downloader" target='_blank') source code

    v-container#footer-other
      v-dialog(v-model="_dialog")
        template(#activator="{ props }")
          button#footer-license-link.linklike.cursor-pointer.text-decoration-underline(v-bind="props") third-party licenses
        v-sheet
          h2.text-center third-party licenses

          v-expansion-panels
            v-expansion-panel(v-for="item in Object.values(_licenses)" :key="item.name + '@' + item.version")
              v-expansion-panel-title
                strong {{ item.name }}@{{ item.version }}
                template(v-if="item.publisher") &nbsp;-&nbsp;{{ item.publisher }}
              v-expansion-panel-text

                template(v-if="item.repository")
                  a.mb-4.d-block(:href="item.repository" target="_blank" rel="noopener") {{ item.repository }}

                v-expansion-panels: v-expansion-panel
                  v-expansion-panel-title
                    p {{ item.licenses }}
                  v-expansion-panel-text
                    p.text-pre-wrap {{ item.licenseText }}

          v-btn(color="primary" block @click="_dialog = false") close


  v-container#footer-copy
    p {{ _year }}&nbsp;-&nbsp;<strong>5kdn</strong>
</template>

<style scoped lang="scss">
.footer-link {
  &,
  &:visited,
  &:active,
  &:focus {
    color: #fff;
  }
}
</style>
