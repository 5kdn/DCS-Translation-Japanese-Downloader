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
v-footer.text-center.d-flex.flex-column.ga-2.py-4.footer-text(color="primary")

  v-container#footer-content.d-flex.flex-row
    v-container#footer-us
      p: a(href="https://github.com/5kdn/DCS-Translation-Japanese") DCS-Translation-Japanese
      p: a(href="https://github.com/5kdn/DCS-Translation-Japanese-Downloader") source code

    v-container#footer-other
      v-dialog(v-model="_dialog")
        template(#activator="{ props }")
          p
            button#footer-license-link.linklike( v-bind="props") third-party licenses
        v-sheet
          h2.text-center third-party licenses
          v-card(v-for="item in Object.values(_licenses)" :key="item.name + '@' + item.version")
            v-card-title
              strong {{ item.name }}@{{ item.version }}
              template(v-if="item.publisher") &nbsp;-&nbsp;{{ item.publisher }}
            v-card-subtitle(v-if="item.repository")
              template(v-if="item.repository"): a(:href="item.repository" target="_blank" rel="noopener") {{ item.repository }}
            v-card-text
              v-expansion-panels
                v-expansion-panel.license-text(:title="item.licenses" :text="item.licenseText")

          v-btn(color="primary" block @click="_dialog = false") close


  v-container#footer-copy
    p {{ _year }}&nbsp;-&nbsp;<strong>5kdn</strong>
</template>

<style scoped lang="scss">
.footer-text,
.footer-text * {
  color: var(--v-theme-on-primary);
}

#footer-license-link {
  cursor: pointer;
  text-decoration: underline;
}

.license-text {
  white-space: pre-wrap;
}
</style>
