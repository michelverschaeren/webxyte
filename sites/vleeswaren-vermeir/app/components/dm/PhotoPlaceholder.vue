<template>
  <!-- Tijdelijke plek voor een echte foto van de klant. Vervang dit component
       door een <NuxtImg> zodra de foto er is; afmetingen en afronding komen
       via de class van de ouder, zodat het kader hetzelfde blijft. -->
  <div
    role="img"
    :aria-label="label"
    class="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-(--color-accent)/40 bg-(--color-surface) p-6 text-center"
  >
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      class="h-10 w-10 text-(--color-accent)"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M3 8a2 2 0 012-2h2l1.5-2h7L17 6h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
      />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
    <p
      class="m-0 text-[0.75rem] font-semibold tracking-[0.2em] text-(--color-accent) uppercase"
    >
      Foto volgt
    </p>
    <p class="m-0 max-w-60 text-[0.9rem] leading-normal text-(--color-text-muted)">
      {{ label }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string }>();
</script>
