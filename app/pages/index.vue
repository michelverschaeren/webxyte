<template>
  <div
    class="overflow-x-hidden bg-(--color-bg) text-(--color-text)"
  >
    <!-- De hero is een afbeelding met logo en heeft dus geen tekstkop; zonder
         deze h1 zou de homepage voor zoekmachines en AI-engines geen
         hoofdonderwerp hebben. Visueel verborgen, wel gewoon leesbaar. -->
    <h1 class="sr-only">
      Vleeswaren Vermeir — vleeswaren voor handelaars in België
    </h1>
    <DmHeroSection />
    <div class="relative z-10 bg-(--color-bg)">
      <DmAboutSection />
      <DmQualitySection />
      <DmDeliverySection />
      <DmProductsSection />
      <DmStepsSection />
      <DmNewsletterSection />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "main" });

useSeoMeta({
  // Zonder merknaam: de titelsjabloon van @nuxtjs/seo plakt er zelf
  // " | Vleeswaren Vermeir" achter, wat de merknaam anders twee keer toonde.
  title: "Kwaliteitsvolle vleeswaren voor handelaars in België",
  description:
    "Vleeswaren Vermeir levert meer dan 5000 vleeswaren aan handelaars in België. Familiebedrijf in Zemst met persoonlijke service en breed gamma.",
});
</script>

<style scoped></style>
