<template>
  <section
    class="relative overflow-hidden py-20 text-center"
    style="
      background: linear-gradient(
        135deg,
        var(--gradient-banner-3) 0%,
        var(--gradient-banner-2) 40%,
        var(--gradient-banner-1) 100%
      );
    "
  >
    <div
      class="pointer-events-none absolute inset-0"
      style="
        background: radial-gradient(
          ellipse at 50% 50%,
          rgba(200, 152, 104, 0.08),
          transparent 70%
        );
      "
    />
    <div class="relative z-1 mx-auto max-w-300 px-6">
      <h2
        class="m-0 mb-4 font-['Playfair_Display',Georgia,serif] text-[clamp(1.6rem,3vw,2.4rem)] leading-[1.2] font-bold text-white"
      >
        Wij staan u
        <span
          class="font-['Dancing_Script',cursive] text-[1.1em] text-(--color-accent)"
          >heel de dag graag te woord</span
        >
      </h2>
      <p
        class="mx-auto -mt-1 mb-8 max-w-130 text-[0.95rem] leading-normal text-white/80"
      >
        Bestel online wanneer het u past, of bel, mail of stuur een
        WhatsApp-bericht — wij zorgen voor de rest.
      </p>
      <div class="flex flex-wrap justify-center gap-4">
        <a
          :href="`tel:${COMPANY.phoneIntl.replace(/\s/g, '')}`"
          class="inline-block rounded-xl bg-[#c89868] px-8 py-[0.9rem] text-[0.8rem] font-semibold tracking-[0.15em] text-[#1a0a0a] uppercase no-underline transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#d8a878]"
          >Bel {{ COMPANY.phone }}</a
        >
        <NuxtLink
          to="/contact"
          class="inline-block rounded-xl border-2 border-white/60 px-8 py-[0.9rem] text-[0.8rem] font-semibold tracking-[0.15em] text-white uppercase no-underline transition-all duration-200 hover:bg-white hover:text-[#1a0a0a]"
          >Alle contactgegevens</NuxtLink
        >
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { COMPANY } from "#shared/company";
</script>
