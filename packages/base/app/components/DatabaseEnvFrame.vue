<script setup lang="ts">
// Set NUXT_PUBLIC_DATABASE_ENV=development locally and on Vercel Preview;
// leave it empty in production so visitors never see this.
const databaseEnv = useRuntimeConfig().public.databaseEnv as string
</script>

<template>
  <!-- Outside production only: a bar along the top with a tab, so there is
       never doubt which database you are working on. z-70: above a sticky
       header (z-50), below dialogs. Never blocks a click. If the site has a
       fixed header with a higher z-index, raise this above it. -->
  <div
    v-if="databaseEnv"
    class="pointer-events-none fixed inset-x-0 top-0 z-70 flex flex-col items-center print:hidden"
    aria-hidden="true"
  >
    <div class="h-1 w-full bg-amber-500" />
    <div class="rounded-b-lg bg-amber-500 px-3 py-0.5 text-[11px] font-semibold tracking-wider text-white uppercase shadow-sm">
      {{ databaseEnv }} · testdatabase
    </div>
  </div>
</template>
