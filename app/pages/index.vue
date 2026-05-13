<template>
  <div class="overflow-x-hidden bg-[#0f0d0d] text-[#e8e2dc]">
    <DmHeroSection />
    <div class="relative z-10 bg-[#0f0d0d]">
      <DmAboutSection />
      <DmSplitSection />
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
