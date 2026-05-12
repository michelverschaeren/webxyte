<template>
  <section class="bg-site py-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-16 text-center">
        <span
          class="mb-3 inline-block text-sm font-semibold tracking-widest uppercase"
          style="color: var(--color-primary)"
          >Ons aanbod</span
        >
        <h2 class="text-site mb-4 text-4xl font-black sm:text-5xl">
          Meer dan 5000 producten
        </h2>
        <p class="text-muted mx-auto max-w-2xl text-lg">
          Doorzoekbaar per categorie — snel bestellen, snel geleverd.
        </p>
      </div>

      <!-- Category grid -->
      <div class="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <NuxtLink
          v-for="cat in featuredCategories"
          :key="cat.slug"
          :to="`/producten?category=${cat.slug}`"
          class="group border-site bg-surface flex flex-col items-center gap-3 rounded-2xl border p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        >
          <span class="text-4xl">{{ cat.emoji }}</span>
          <span
            class="text-site group-hover:text-primary text-sm font-semibold transition-colors"
            >{{ cat.name }}</span
          >
        </NuxtLink>
      </div>

      <!-- CTA row -->
      <div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
        <NuxtLink
          to="/producten"
          class="inline-flex items-center gap-2 rounded-xl px-8 py-4 font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          style="
            background: linear-gradient(
              135deg,
              var(--color-primary-dark),
              var(--color-primary)
            );
          "
        >
          Alle producten bekijken
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const featuredCategories = [
  { slug: "salamis", name: "Salami's", emoji: "🧄" },
  { slug: "hespen", name: "Hespen", emoji: "🐷" },
  { slug: "worstwaren", name: "Worstwaren", emoji: "🌭" },
  { slug: "kookwaren", name: "Kookwaren", emoji: "🍳" },
  { slug: "gevogelte", name: "Gevogelte", emoji: "🍗" },
  { slug: "kazen", name: "Kazen", emoji: "🧀" },
  { slug: "traiteur", name: "Traiteur", emoji: "🍱" },
  { slug: "diepvries", name: "Diepvries", emoji: "❄️" },
];
</script>
