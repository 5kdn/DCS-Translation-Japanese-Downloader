<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    themeName: String,
  },
});
</script>

<template>
  <v-app :theme="themeName">
    <v-main>
      <slot name="story"></slot>
    </v-main>
  </v-app>
</template>