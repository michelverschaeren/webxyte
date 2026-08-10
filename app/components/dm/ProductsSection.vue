<template>
  <section class="py-24 bg-[#0f0d0d]">
    <div class="max-w-300 mx-auto px-6">
      <div class="text-center mb-12">
        <p
          class="uppercase tracking-[0.3em] text-[0.75rem] text-[#c89868] font-semibold mb-4"
        >
          — Uitgebreid gamma —
        </p>
        <h2
          class="font-['Playfair_Display',Georgia,serif] text-[clamp(2rem,4vw,3.25rem)] font-bold text-white mb-4 leading-[1.1]"
        >
          <span class="block">Van fijne vleeswaren tot</span>
          <span
            class="block font-['Dancing_Script',cursive] text-[#b8252a] font-normal text-[1.1em] mt-2"
            >bereide gerechten</span
          >
        </h2>
        <p
          class="max-w-150 mx-auto mt-6 text-[#a89a8e] leading-[1.7] text-[1.05rem]"
        >
          Van sauzen tot verpakkingsmateriaal. Bij Vleeswaren Vermeir kan u
          terecht voor ieder product en met al uw vragen betreffende die
          producten.
        </p>
      </div>

      <div class="grid grid-cols-3 sm:grid-cols-5 gap-4 sm:gap-6">
        <div
          v-for="category in categories"
          :key="category.name"
          class="group cursor-pointer text-center text-[#a89a8e] transition-transform duration-300 hover:-translate-y-2"
        >
          <div
            class="mx-auto mb-4 flex h-32 w-full items-center justify-center sm:h-40"
          >
            <img
              :src="category.img"
              :alt="category.name"
              loading="lazy"
              class="sketch-img h-full w-full object-contain transition-all duration-300 group-hover:-translate-y-1.5 group-hover:scale-105"
            />
          </div>
          <p
            class="m-0 text-[0.75rem] font-semibold tracking-[0.15em] uppercase transition-colors duration-300 group-hover:text-[#c89868]"
          >
            {{ category.name }}
          </p>
        </div>
      </div>

      <div class="text-center mt-12">
        <NuxtLink
          to="/producten"
          class="inline-block border-2 border-[#c89868] text-[#c89868] px-8 py-[0.9rem] no-underline font-semibold uppercase tracking-[0.15em] text-[0.8rem] hover:bg-[#c89868] hover:text-[#1a0a0a] transition-all duration-200"
          >Alle categorieën →</NuxtLink
        >
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const categories = [
  {
    name: "Salami",
    img: "images/categorie/salami.png",
  },
  {
    name: "Ham",
    img: "images/categorie/ham.png",
  },
  {
    name: "Kaas",
    img: "images/categorie/kaas.png",
  },
  {
    name: "Salades",
    img: "images/categorie/salades.png",
  },
  {
    name: "Bereide gerechten",
    img: "images/categorie/lasagne.png",
  },
];
</script>

<style scoped>
.sketch-img {
  filter: brightness(0) invert(1) opacity(0.8);
}
.group:hover .sketch-img {
  filter: brightness(0) saturate(100%) invert(72%) sepia(40%) saturate(400%)
    hue-rotate(10deg) opacity(1);
}
</style>
