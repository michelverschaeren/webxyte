<template>
  <section class="bg-site py-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Section header -->
      <div class="mb-16 text-center">
        <span
          class="mb-3 inline-block text-sm font-semibold tracking-widest uppercase"
          style="color: var(--color-primary)"
          >Wie zijn wij</span
        >
        <h2 class="text-site mb-4 text-4xl font-black sm:text-5xl">
          Over Vleeswaren Vermeir
        </h2>
        <p class="text-muted mx-auto max-w-2xl text-lg">
          Een familiebedrijf dat al generaties lang kwaliteit en service hoog in
          het vaandel draagt.
        </p>
      </div>

      <!-- Cards grid -->
      <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div
          v-for="card in cards"
          :key="card.title"
          class="group border-site bg-surface rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          <!-- Icon -->
          <div
            class="mb-6 flex h-14 w-14 items-center justify-center rounded-xl text-white"
            style="
              background: linear-gradient(
                135deg,
                var(--color-primary),
                var(--color-primary-light)
              );
            "
          >
            <component :is="card.icon" class="h-7 w-7" />
          </div>
          <h3 class="text-site mb-3 text-xl font-bold">{{ card.title }}</h3>
          <p class="text-muted leading-relaxed">{{ card.text }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { defineComponent, h } from "vue";

const HeartIcon = defineComponent({
  render: () =>
    h(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        "stroke-width": "2",
      },
      [
        h("path", {
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
        }),
      ],
    ),
});
const UserIcon = defineComponent({
  render: () =>
    h(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        "stroke-width": "2",
      },
      [
        h("path", {
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
        }),
      ],
    ),
});
const GridIcon = defineComponent({
  render: () =>
    h(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        "stroke-width": "2",
      },
      [
        h("path", {
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          d: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
        }),
      ],
    ),
});

const cards = [
  {
    icon: HeartIcon,
    title: "Familiebedrijf",
    text: "Van generatie op generatie is dit familiebedrijf altijd trouw gebleven aan zijn waarden — 100% klanttevredenheid als fundament voor onze unieke en persoonlijke service.",
  },
  {
    icon: UserIcon,
    title: "Persoonlijke Service",
    text: "Als hecht familiebedrijf bouwen wij steeds een persoonlijke vertrouwensband op met onze klanten. U wordt bediend met de beste service en de kwalitatieve producten.",
  },
  {
    icon: GridIcon,
    title: "Uitgebreid Gamma",
    text: "Van fijne vleeswaren tot bereide gerechten, sauzen en verpakkingsmateriaal. Meer dan 5000 producten in 21 categorieën — alles op één plek.",
  },
];
</script>
