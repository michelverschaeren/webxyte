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
          {{ category.name }}
        </h1>
        <p class="text-white/70 text-lg max-w-xl mx-auto">
          {{ category.productCount }} producten voor handelaars
        </p>
      </div>
    </div>

    <div class="max-w-300 mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Kruimelpad -->
      <nav aria-label="Kruimelpad" class="mb-8 text-sm text-(--color-text-muted)">
        <ol class="m-0 flex list-none flex-wrap gap-2 p-0">
          <li>
            <NuxtLink to="/" class="hover:text-(--color-accent)">Home</NuxtLink>
          </li>
          <li aria-hidden="true">›</li>
          <li aria-current="page" class="text-(--color-text)">
            {{ category.name }}
          </li>
        </ol>
      </nav>

      <div class="mb-12 max-w-200">
        <p class="text-[1.05rem] leading-[1.7] text-(--color-text-muted)">
          Vleeswaren Vermeir uit Zemst levert {{ category.productCount }}
          producten in de categorie {{ category.name }} aan handelaars in
          België. Bestellen kan via mail, fax, telefoon of online; uw
          bestelling wordt de dag nadien geleverd door onze eigen chauffeurs.
        </p>
        <NuxtLink
          :to="`/producten?category=${category.slug}`"
          class="mt-6 inline-block rounded-xl bg-[#c89868] px-8 py-[0.9rem] text-[0.8rem] font-semibold tracking-[0.15em] text-[#1a0a0a] uppercase no-underline transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#d8a878]"
          >Bestel uit {{ category.name }}</NuxtLink
        >
      </div>

      <!-- Onderlinge links: houdt alle categoriepagina's voor bezoekers en
           crawlers binnen twee kliks bereikbaar. -->
      <h2
        class="mb-4 font-['Playfair_Display',Georgia,serif] text-[1.6rem] font-bold text-(--color-text-strong)"
      >
        Ons volledige assortiment
      </h2>
      <ul class="m-0 flex list-none flex-wrap gap-3 p-0">
        <li v-for="other in otherCategories" :key="other.slug">
          <NuxtLink
            :to="`/assortiment/${other.slug}`"
            class="inline-block rounded-full border border-[#c89868]/40 px-4 py-1.5 text-[0.8rem] font-semibold tracking-[0.1em] text-(--color-accent) uppercase no-underline transition-colors hover:border-[#c89868] hover:bg-[#c89868] hover:text-[#1a0a0a]"
            >{{ other.name }}</NuxtLink
          >
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "main" });

// Bewust géén productlijst, fabrikanten of artikelnummers op deze publieke
// pagina: wie welk product levert is bedrijfsgevoelig. Die gegevens staan
// alleen in de bestelomgeving (/producten), die voor crawlers is afgesloten.
const route = useRoute();
const slug = String(route.params.slug);

const { data: categoryData } = await useFetch(`/api/categories/${slug}`);
if (!categoryData.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Categorie niet gevonden",
    fatal: true,
  });
}
const category = categoryData.value;

const { data: allCategories } = await useFetch("/api/categories");
const otherCategories = computed(() =>
  (allCategories.value ?? []).filter(
    (c) => c.slug !== slug && c.productCount > 0,
  ),
);

const categoryPath = `/assortiment/${slug}`;

useSeoMeta({
  title: `${category.name} — ${category.productCount} producten voor handelaars`,
  description: `${category.name}: ${category.productCount} producten van Vleeswaren Vermeir in Zemst. Levering aan handelaars in België door eigen chauffeurs.`,
});

useSchemaOrg([
  defineWebPage({ "@type": "CollectionPage", name: category.name }),
  defineBreadcrumb({
    itemListElement: [
      { name: "Home", item: "/" },
      { name: category.name, item: categoryPath },
    ],
  }),
]);
</script>
