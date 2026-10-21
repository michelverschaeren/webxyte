<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <DatabaseEnvFrame />
</template>

<script setup lang="ts">
const { theme } = useTheme();
useHead({ htmlAttrs: { "data-theme": theme } });
</script>
