<template>
  <NuxtRouteAnnouncer />
  <div class="app-content" :class="{ 'app-content--locked': locked }" :inert="locked || undefined">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
  <UnderConstructionGate />
</template>

<script setup lang="ts">
const { locked } = useSiteLock();

watch(
  locked,
  (isLocked) => {
    if (!import.meta.client) return;
    document.documentElement.style.overflow = isLocked ? "hidden" : "";
    document.body.style.overflow = isLocked ? "hidden" : "";
  },
  { immediate: true },
);
</script>

<style>
.app-content--locked {
  filter: blur(8px);
  pointer-events: none;
  user-select: none;
}
</style>
