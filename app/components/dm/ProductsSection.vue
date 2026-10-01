<template>
  <section class="py-24 bg-(--color-bg)">
    <div class="max-w-300 mx-auto px-6">
      <div class="text-center mb-12">
        <p
          class="uppercase tracking-[0.3em] text-[0.8rem] text-(--color-accent) font-semibold mb-4"
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
          class="max-w-150 mx-auto mt-6 text-(--color-text-muted) leading-[1.7] text-[1.125rem]"
        >
          Van sauzen tot verpakkingsmateriaal. Bij Vleeswaren Vermeir kan u
          terecht voor ieder product en met al uw vragen betreffende die
          producten.
        </p>
      </div>

      <!-- Eén rij: 6 kolommen op desktop, 3+3 op kleinere schermen. -->
      <div class="grid grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
        <NuxtLink
          v-for="category in categories"
          :key="category.slug"
          :to="`/assortiment/${category.slug}`"
          class="group cursor-pointer text-center text-(--color-text-muted) transition-transform duration-300 hover:-translate-y-2"
        >
          <div
            class="relative mx-auto mb-4 flex h-32 w-full items-center justify-center sm:h-40"
          >
            <!-- Getoond op ~105px (mobiel) tot 160px; `sizes` houdt de srcset
                 daar strak op. -->
            <NuxtImg
              :src="category.img"
              :alt="category.name"
              loading="lazy"
              format="webp"
              sizes="105px sm:160px"
              class="photo-framed relative aspect-square h-auto w-full max-w-32 rounded-3xl object-cover transition-all duration-300 group-hover:-translate-y-1.5 group-hover:scale-105 sm:max-w-40"
            />
          </div>
          <p
            class="m-0 text-[0.8rem] font-semibold tracking-[0.15em] uppercase transition-colors duration-300 group-hover:text-(--color-accent)"
          >
            {{ category.name }}
          </p>
        </NuxtLink>
      </div>

      <div class="text-center mt-12">
        <NuxtLink
          to="/producten"
          class="inline-block rounded-xl border-2 border-[#c89868] text-(--color-accent) px-8 py-[0.9rem] no-underline font-semibold uppercase tracking-[0.15em] text-[0.85rem] hover:bg-[#c89868] hover:text-[#1a0a0a] transition-all duration-200"
          >Alle categorieën →</NuxtLink
        >
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Absolute paden: relatieve src'en braken zodra deze sectie op een geneste
// route zou staan, en @nuxt/image vereist ze sowieso. `slug` moet bestaan
// als categorie in de database (/assortiment/[slug]).
const categories = [
  { name: "Salami", slug: "salamis", img: "/images/categorie/new/Salami.png" },
  { name: "Hesp", slug: "hespen", img: "/images/categorie/new/Hesp.png" },
  { name: "Kaas", slug: "kazen", img: "/images/categorie/kazen.jpg" },
  { name: "Paté", slug: "pates", img: "/images/categorie/new/pate.png" },
  { name: "Salades", slug: "salades", img: "/images/categorie/salades.jpg" },
  {
    name: "Bereide gerechten",
    slug: "traiteur",
    img: "/images/categorie/traiteur.jpg",
  },
];
</script>

<style scoped>
/* Foto met eigen achtergrond, afgerond vierkant. De ring eerst: de donkere
   leisteen op zo'n foto loopt anders naadloos over in de donkere paginakleur.
   Donker thema: rode gloed als box-shadow; licht thema: bronzen ring met een
   gewone donkere schaduw, die op crème wél leest. */
.photo-framed {
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--color-primary) 60%, transparent),
    0 0 18px color-mix(in srgb, var(--color-primary) 45%, transparent),
    0 14px 22px color-mix(in srgb, var(--color-primary) 30%, transparent);
}
.group:hover .photo-framed {
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--color-primary) 90%, transparent),
    0 0 24px color-mix(in srgb, var(--color-primary) 68%, transparent),
    0 16px 26px color-mix(in srgb, var(--color-primary) 45%, transparent);
}
:root[data-theme="light"] .photo-framed,
:root[data-theme="light"] .group:hover .photo-framed {
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--color-accent) 45%, transparent),
    0 12px 16px rgb(0 0 0 / 0.22);
}
</style>
