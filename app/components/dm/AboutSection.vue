<template>
  <section class="bg-[#0f0d0d] py-24">
    <div class="mx-auto max-w-300 px-6 text-center">
      <p
        class="mb-4 text-[0.75rem] font-semibold tracking-[0.3em] text-[#c89868] uppercase"
      >
        — Over Vleeswaren Vermeir —
      </p>
      <h2
        class="mb-4 font-['Playfair_Display',Georgia,serif] text-[clamp(2rem,4vw,3.25rem)] leading-[1.1] font-bold text-white"
      >
        <span class="block">Een familiebedrijf</span>
        <span
          class="mt-2 block font-['Dancing_Script',cursive] text-[1.1em] font-normal text-[#b8252a]"
          >van generatie op generatie</span
        >
      </h2>
      <p
        class="mx-auto mt-6 mb-16 max-w-150 text-[1.05rem] leading-[1.7] text-[#a89a8e]"
      >
        Van generatie op generatie is dit familiebedrijf altijd trouw gebleven
        aan zijn waarden welke streven naar 100% klanttevredenheid. Deze vormen
        dan ook de basis voor onze unieke en persoonlijke service.
      </p>
      <div
        class="mx-auto grid max-w-full grid-cols-3 gap-4 sm:grid-cols-5 lg:max-w-275"
      >
        <div
          v-for="sketch in sketches"
          :key="sketch.name"
          class="group cursor-pointer text-center text-[#a89a8e] transition-transform duration-300 hover:-translate-y-2"
        >
          <div class="mx-auto mb-6 flex h-40 w-45 items-center justify-center">
            <img
              :src="sketch.img"
              :alt="sketch.name"
              class="sketch-img h-full w-full object-contain transition-all duration-300 group-hover:-translate-y-1.5 group-hover:scale-105"
            />
          </div>
          <p
            class="m-0 text-[0.75rem] font-semibold tracking-[0.15em] uppercase transition-colors duration-300 group-hover:text-[#c89868]"
          >
            {{ sketch.name }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const sketches = [
  {
    name: "Kippenbout",
    img: "https://bubulla.like-themes.com/wp-content/uploads/2018/02/type_01-250x250.png",
  },
  {
    name: "Biefstuk",
    img: "https://bubulla.like-themes.com/wp-content/uploads/2018/02/type_02-250x250.png",
  },
  {
    name: "Worst",
    img: "https://bubulla.like-themes.com/wp-content/uploads/2018/02/type_03-250x250.png",
  },
  {
    name: "Rib",
    img: "https://bubulla.like-themes.com/wp-content/uploads/2018/02/type_04-250x250.png",
  },
  {
    name: "Ham",
    img: "https://bubulla.like-themes.com/wp-content/uploads/2018/02/type_08-250x250.png",
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
