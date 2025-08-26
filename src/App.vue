<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
// biome-ignore lint/correctness/noUnusedVariables: Templateで使用している
const Footer = defineAsyncComponent(() => import('./components/Footer.vue'));
</script>


<template lang="pug">
v-container#app-wrapper.pt-10
  h1.text-h1.text-center DCS Translation Japanese
  v-divider
v-container
  Footer
</template>


<style lang="scss" scoped>
#app-wrapper {
  max-width: min(80svw, 1200px);
}
</style>
