<script lang="ts" setup>
import { computed, ref } from 'vue';
import raw_licenses from '@/assets/LICENSES/licenses.json';

const _dialog = ref(false);
const _year = new Date().getFullYear();

interface RawLicenseEntry {
  licenses: string;
  repository?: string;
  publisher?: string;
  email?: string;
  path: string;
  licenseFile: string;
  private?: boolean;
}

interface RawLicenseMap {
  [packageNameWithVersion: string]: RawLicenseEntry;
}

const resolveLicenseHref = (licenseFilePath: string): string => {
  const match = licenseFilePath.match(/public[\\/](.+)$/i);
  const base = import.meta.env.BASE_URL ?? '/';
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;

  const captured = match?.[1];

  if (!captured) {
    return '';
  }

  return `${normalizedBase}/${captured.replace(/\\/g, '/')}`;
};

interface License {
  packageName: string;
  license: string;
  repository?: string;
  publisher?: string;
  email?: string;
  path: string;
  licenseFile: string;
  licenseHref: string;
  private?: boolean;
}

const _licenses = computed<License[]>(() => {
  const map = raw_licenses as unknown as RawLicenseMap;

  const licenses = Object.entries(map).reduce<License[]>((acc, [pkgWithVer, entry]) => {
    if (!entry) {
      return acc;
    }

    const licenseFile = entry.licenseFile ?? '';
    const licenseHref = licenseFile ? resolveLicenseHref(licenseFile) : '';

    acc.push({
      packageName: pkgWithVer,
      license: entry.licenses,
      repository: entry.repository,
      publisher: entry.publisher,
      email: entry.email,
      path: entry.path,
      licenseFile,
      private: entry.private,
      licenseHref,
    });

    return acc;
  }, []);

  return licenses.sort((a, b) => a.packageName.localeCompare(b.packageName));
});
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
          v-card(v-for="item in _licenses" :key="item.packageName")
            v-card-title
              strong {{ item.packageName }}
              template(v-if="item.publisher") &nbsp;-&nbsp;{{ item.publisher }}
            v-card-subtitle
              template(v-if="item.licenseHref"): a(:href="item.licenseHref" target="_blank" rel="noopener") {{ item.license }}
              template(v-else) {{ item.license }}
            v-card-text
              p(v-if="item.repository")
                template(v-if="item.repository"): a(:href="item.repository" target="_blank" rel="noopener") {{ item.repository }}
                template(v-else) {{ item.repository }}
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
</style>
