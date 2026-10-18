<template>
  <!-- Enkel buiten productie (NUXT_PUBLIC_DATABASE_ENV): een balk bovenaan met
       een tab, zodat nooit twijfel bestaat op welke database je werkt.
       z-150: boven de vaste site-header (.dm-fixed-wrap, 100) en de
       beheerzijbalk (80), onder panelen en dialogen (190+). Klikt niet in de weg. -->
  <div
    v-if="databaseEnv"
    class="pointer-events-none fixed inset-x-0 top-0 z-150 flex flex-col items-center print:hidden"
    aria-hidden="true"
  >
    <div class="h-1 w-full bg-amber-500" />
    <div
      class="rounded-b-lg bg-amber-500 px-3 py-0.5 text-[11px] font-semibold tracking-wider text-white uppercase shadow-sm"
    >
      {{ databaseEnv }} · testdatabase
    </div>
  </div>
</template>

<script setup lang="ts">
const databaseEnv = useRuntimeConfig().public.databaseEnv as string;
</script>
