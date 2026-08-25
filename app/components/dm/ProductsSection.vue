<template>
  <section class="py-24 bg-(--color-bg)">
    <div class="max-w-300 mx-auto px-6">
      <div class="text-center mb-12">
        <p
          class="uppercase tracking-[0.3em] text-[0.75rem] text-(--color-accent) font-semibold mb-4"
        >
          — Uitgebreid gamma —
        </p>
        <h2
          class="font-['Playfair_Display',Georgia,serif] text-[clamp(2rem,4vw,3.25rem)] font-bold text-(--color-text-strong) mb-4 leading-[1.1]"
        >
          <span class="block">Van fijne vleeswaren tot</span>
          <span
            class="block font-['Dancing_Script',cursive] text-[#b8252a] font-normal text-[1.1em] mt-2"
            >bereide gerechten</span
          >
        </h2>
        <p
          class="max-w-150 mx-auto mt-6 text-(--color-text-muted) leading-[1.7] text-[1.05rem]"
        >
          Van sauzen tot verpakkingsmateriaal. Bij Vleeswaren Vermeir kan u
          terecht voor ieder product en met al uw vragen betreffende die
          producten.
        </p>
      </div>

      <div class="grid grid-cols-3 sm:grid-cols-5 gap-4 sm:gap-6">
        <NuxtLink
          v-for="category in categories"
          :key="category.name"
          :to="`/producten?category=${category.slug}`"
          class="group cursor-pointer text-center text-(--color-text-muted) transition-transform duration-300 hover:-translate-y-2"
        >
          <div
            class="mx-auto mb-4 flex h-32 w-full items-center justify-center sm:h-40"
          >
            <!-- Getoond op ~105px (mobiel, 3 kolommen) tot ~215px (5 kolommen);
                 `sizes` houdt de srcset daar strak op, i.p.v. de rauwe PNG's
                 van 270 kB–3,5 MB die hier vroeger stonden. -->
            <NuxtImg
              :src="category.img"
              :alt="category.name"
              loading="lazy"
              format="webp"
              sizes="110px sm:220px"
              class="sketch-img h-full w-full object-contain transition-all duration-300 group-hover:-translate-y-1.5 group-hover:scale-105"
            />
          </div>
          <p
            class="m-0 text-[0.75rem] font-semibold tracking-[0.15em] uppercase transition-colors duration-300 group-hover:text-(--color-accent)"
          >
            {{ category.name }}
          </p>
        </NuxtLink>
      </div>

      <div class="text-center mt-12">
        <NuxtLink
          to="/producten"
          class="inline-block rounded-xl border-2 border-[#c89868] text-(--color-accent) px-8 py-[0.9rem] no-underline font-semibold uppercase tracking-[0.15em] text-[0.8rem] hover:bg-[#c89868] hover:text-[#1a0a0a] transition-all duration-200"
          >Alle categorieën →</NuxtLink
        >
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Absolute paden: relatieve src'en ("images/…") braken zodra deze sectie op
// een geneste route zou staan, en @nuxt/image vereist ze sowieso.
const categories = [
  {
    name: "Salami",
    img: "/images/categorie/salami.png",
    slug: "salamis",
  },
  {
    name: "Ham",
    img: "/images/categorie/ham.png",
    slug: "hespen",
  },
  {
    name: "Kaas",
    img: "/images/categorie/kaas.png",
    slug: "kazen",
  },
  {
    name: "Salades",
    img: "/images/categorie/salades.png",
    slug: "salades",
  },
  {
    name: "Bereide gerechten",
    img: "/images/categorie/lasagne.png",
    slug: "traiteur",
  },
];
</script>

<style scoped>
.sketch-img {
  filter: brightness(0) invert(1) opacity(0.8);
}
:root[data-theme="light"] .sketch-img {
  filter: brightness(0) opacity(0.6);
}
.group:hover .sketch-img {
  filter: brightness(0) saturate(100%) invert(72%) sepia(40%) saturate(400%)
    hue-rotate(10deg) opacity(1);
}
</style>
