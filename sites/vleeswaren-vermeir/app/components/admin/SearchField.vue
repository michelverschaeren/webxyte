<template>
  <label class="relative block">
    <span class="sr-only">{{ placeholder }}</span>
    <svg
      class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-(--color-text-muted)"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
    <input
      v-model="model"
      type="search"
      :name="name"
      :placeholder="placeholder"
      autocomplete="off"
      data-protonpass-ignore="true"
      data-1p-ignore
      data-lpignore="true"
      class="adm-input w-full pl-9"
    >
  </label>
</template>

<script setup lang="ts">
/** Zoekveld met vergrootglas voor de toolbar van een tabelkaart. */
defineProps<{ placeholder: string; name?: string }>();
const model = defineModel<string>({ required: true });
</script>
