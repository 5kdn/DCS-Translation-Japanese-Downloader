<script>
export default {
  props: {
    themeName: String,
  },
};
</script>

<template>
  <v-app :theme="themeName">
    <v-main>
      <slot name="story"></slot>
    </v-main>
  </v-app>
</template>