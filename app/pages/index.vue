<template>
  <div
    class="overflow-x-hidden bg-(--color-bg) text-(--color-text)"
  >
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
  title: "Vleeswaren Vermeir — Kwaliteitsvolle vleeswaren voor handelaars",
  description:
    "Vleeswaren Vermeir levert meer dan 5000 vleeswaren aan handelaars in België. Familiebedrijf in Zemst met persoonlijke service en breed gamma.",
});
</script>

<style scoped></style>
