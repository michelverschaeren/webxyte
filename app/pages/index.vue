<template>
  <div class="grain-bg overflow-x-hidden bg-[#0f0d0d] text-[#e8e2dc]">
    <DmHeroSection />
    <DmAboutSection />
    <DmSplitSection />
    <DmQualitySection />
    <DmDeliverySection />
    <DmProductsSection />
    <DmStepsSection />
    <DmNewsletterSection />
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

<style scoped>
.grain-bg {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
}
</style>
