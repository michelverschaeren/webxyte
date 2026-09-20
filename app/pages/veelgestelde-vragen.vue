<template>
  <div class="bg-(--color-bg) text-(--color-text) min-h-screen">
    <!-- Page header -->
    <div
      class="relative pt-32 pb-10 sm:pt-46.5 sm:pb-20 px-4 overflow-hidden"
      style="
        background: radial-gradient(
          ellipse at 50% 40%,
          var(--gradient-banner-1) 0%,
          var(--gradient-banner-2) 45%,
          var(--gradient-banner-3) 100%
        );
      "
    >
      <div class="relative z-1 max-w-300 mx-auto text-center">
        <h1
          class="font-['Playfair_Display',Georgia,serif] text-[clamp(2.5rem,6vw,5rem)] font-black text-white leading-[1.05] mb-4"
        >
          Veelgestelde vragen
        </h1>
        <p class="text-white/70 text-lg max-w-xl mx-auto">
          Alles over bestellen en levering bij Vleeswaren Vermeir.
        </p>
      </div>
    </div>

    <div class="max-w-200 mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <!-- Bewust zichtbare tekst i.p.v. een dichtgeklapt accordeon: wat niet
           op de pagina staat, mag ook niet in de FAQPage-markup. -->
      <dl class="m-0 divide-y divide-(--color-border)">
        <div v-for="item in FAQ" :key="item.question" class="py-6">
          <dt
            class="mb-2 font-['Playfair_Display',Georgia,serif] text-[1.25rem] font-bold text-(--color-text-strong)"
          >
            {{ item.question }}
          </dt>
          <dd class="m-0 leading-[1.7] text-(--color-text-muted)">
            {{ item.answer }}
          </dd>
        </div>
      </dl>

      <div class="mt-10 flex flex-wrap gap-4">
        <NuxtLink
          to="/contact"
          class="inline-block rounded-xl bg-[#c89868] px-8 py-[0.9rem] text-[0.8rem] font-semibold tracking-[0.15em] text-[#1a0a0a] uppercase no-underline transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#d8a878]"
          >Nog een vraag? Contacteer ons</NuxtLink
        >
        <NuxtLink
          to="/producten"
          class="inline-block rounded-xl border-2 border-[#c89868] px-8 py-[0.9rem] text-[0.8rem] font-semibold tracking-[0.15em] text-(--color-accent) uppercase no-underline transition-all duration-200 hover:bg-[#c89868] hover:text-[#1a0a0a]"
          >Bekijk ons gamma</NuxtLink
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FAQ } from "#shared/company";

definePageMeta({ layout: "main" });

useSeoMeta({
  title: "Veelgestelde vragen over bestellen en levering",
  description:
    "Hoe bestelt u bij Vleeswaren Vermeir, wanneer wordt er geleverd en wat als er een artikel ontbreekt? Antwoorden voor handelaars in België.",
});

useSchemaOrg([
  defineWebPage({ "@type": "FAQPage", name: "Veelgestelde vragen" }),
  ...FAQ.map((item) =>
    defineQuestion({ name: item.question, acceptedAnswer: item.answer }),
  ),
]);
</script>
