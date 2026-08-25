<template>
  <div class="bg-site text-site flex min-h-screen flex-col">
    <main class="flex-1">
      <slot />
    </main>
    <TheFooter />
    <SavedListsPanel />
  </div>
</template>

<script setup lang="ts"></script>
