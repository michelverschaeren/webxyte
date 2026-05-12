<template>
  <div class="bg-site text-site flex min-h-screen flex-col">
    <main class="flex-1">
      <slot />
    </main>
    <TheFooter />
    <CartDrawer />
    <SavedListsPanel />
    <ListEditorModal />
  </div>
</template>

<script setup lang="ts">
const { currentTheme } = useTheme();

onMounted(() => {
  const attr = currentTheme.value === "premium-red" ? "" : currentTheme.value;
  document.documentElement.setAttribute("data-theme", attr);
});
</script>
