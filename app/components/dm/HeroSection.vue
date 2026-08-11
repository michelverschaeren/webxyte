<template>
  <div>
    <section
      ref="heroRef"
      class="relative -mt-26.5 flex min-h-screen flex-col overflow-hidden pt-26.5"
    >
      <div
        class="hero-bg absolute inset-0 z-0"
        :style="{ opacity: bgOpacity }"
      ></div>

      <!-- Decorative leaves -->
      <span class="hero-leaf hl-1">
        <svg
          viewBox="0 0 60 80"
          fill="none"
          stroke="#fff"
          stroke-width="1.2"
          opacity="0.55"
        >
          <path
            d="M30 75C15 55 5 35 15 15c5-10 15-12 15-12s10 2 15 12c10 20 0 40-15 60z"
          />
          <path d="M30 75V20M20 35c5 2 8 6 10 10M40 35c-5 2-8 6-10 10" />
        </svg>
      </span>
      <span class="hero-leaf hl-2">
        <svg
          viewBox="0 0 60 80"
          fill="none"
          stroke="#fff"
          stroke-width="1.2"
          opacity="0.4"
        >
          <path
            d="M30 75C15 55 5 35 15 15c5-10 15-12 15-12s10 2 15 12c10 20 0 40-15 60z"
          />
          <path d="M30 75V20M20 35c5 2 8 6 10 10M40 35c-5 2-8 6-10 10" />
        </svg>
      </span>
      <span class="hero-leaf hl-3">
        <svg
          viewBox="0 0 60 80"
          fill="none"
          stroke="#fff"
          stroke-width="1.2"
          opacity="0.35"
        >
          <path
            d="M30 75C15 55 5 35 15 15c5-10 15-12 15-12s10 2 15 12c10 20 0 40-15 60z"
          />
          <path d="M30 75V20" />
        </svg>
      </span>
      <span class="hero-leaf hl-4">
        <svg
          viewBox="0 0 60 80"
          fill="none"
          stroke="#fff"
          stroke-width="1.2"
          opacity="0.3"
        >
          <path
            d="M30 75C15 55 5 35 15 15c5-10 15-12 15-12s10 2 15 12c10 20 0 40-15 60z"
          />
        </svg>
      </span>

      <!-- Hero text + image -->
      <div class="relative z-2 flex flex-1 flex-col items-center px-4 pt-62">
        <div
          class="relative z-2 flex w-full flex-1 justify-center"
          :style="{ opacity: bgOpacity }"
        >
          <img
            class="block h-full w-full object-cover filter-[drop-shadow(0_30px_60px_rgba(0,0,0,0.7))]"
            src="/images/hero6.png"
            alt="Verse vleeswaren Vermeir"
          />
        </div>
      </div>
    </section>

    <!-- Fixed title overlay — stays centered on viewport while background scrolls/fades -->
    <div
      class="pointer-events-none fixed inset-0 z-5 flex flex-col items-center justify-center px-4"
      :style="{
        opacity: textOpacity,
        visibility: textOpacity <= 0.01 ? 'hidden' : 'visible',
      }"
    >
      <div class="w-full text-center leading-none">
        <span
          class="inline-block font-['Playfair_Display',Georgia,serif] text-[clamp(3.5rem,11vw,9rem)] leading-none font-black tracking-[0.04em] text-white uppercase [text-shadow:0_2px_4px_rgba(0,0,0,0.95),0_6px_30px_rgba(0,0,0,0.85),0_12px_60px_rgba(0,0,0,0.7)]"
          >VLEESWAREN</span
        >
      </div>
      <div class="mt-[0.1em] w-full text-center leading-none">
        <span
          class="inline-block font-['Dancing_Script',cursive] text-[clamp(3rem,9vw,7rem)] leading-[1.1] font-bold text-(--color-accent) [text-shadow:0_2px_4px_rgba(0,0,0,0.95),0_6px_30px_rgba(0,0,0,0.85),0_12px_60px_rgba(0,0,0,0.7)]"
          >Vermeir</span
        >
      </div>
    </div>

    <!-- Feature strip -->
    <div class="relative z-10 -mt-16">
      <div
        class="feature-strip-gradient mx-auto grid max-w-275 grid-cols-2 gap-px md:grid-cols-4"
      >
        <div
          v-for="feat in features"
          :key="feat.label"
          class="group relative flex items-center gap-3 border-r border-white/10 px-3 py-5 text-white transition-colors duration-300 last:border-r-0 even:border-r-0 hover:bg-black/20 md:gap-5 md:px-6 md:py-7 md:even:border-r"
        >
          <div
            v-html="feat.icon"
            class="h-9.5 w-9.5 shrink-0 text-(--color-accent) [&>svg]:h-full [&>svg]:w-full [&>svg]:stroke-current"
          ></div>
          <p
            class="m-0 text-[0.72rem] leading-[1.4] tracking-[0.06em] wrap-break-word uppercase md:text-[0.82rem]"
          >
            {{ feat.sub
            }}<strong class="block text-[0.9rem] font-bold text-white">{{
              feat.label
            }}</strong>
          </p>
          <span
            class="absolute right-0 bottom-0 left-0 h-0.75 origin-left scale-x-0 bg-[#c89868] transition-transform duration-300 group-hover:scale-x-100"
          ></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

const heroRef = ref<HTMLElement | null>(null);
const scrollY = ref(0);
const heroHeight = ref(0);

const updateHeroHeight = () => {
  heroHeight.value = heroRef.value?.offsetHeight ?? window.innerHeight;
};
const onScroll = () => {
  scrollY.value = window.scrollY || window.pageYOffset || 0;
};

onMounted(() => {
  updateHeroHeight();
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateHeroHeight);
});
onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", updateHeroHeight);
});

// Background (gradient + product image) fades out faster
const bgOpacity = computed(() => {
  const h = heroHeight.value || 1;
  return Math.max(0, Math.min(1, 1 - scrollY.value / (h * 0.55)));
});
// Title text holds longer, then fades out before next section fully covers it
const textOpacity = computed(() => {
  const h = heroHeight.value || 1;
  return Math.max(0, Math.min(1, 1 - scrollY.value / (h * 0.85)));
});

const features = [
  {
    label: "familiebedrijf",
    sub: "Hecht ",
    icon: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 28c0-10 8-18 20-18s20 8 20 18v8c0 12-8 20-20 20s-20-8-20-20v-8z"/><path d="M22 36c0-4 4-8 10-8s10 4 10 8"/></svg>`,
  },
  {
    label: "vertrouwensband",
    sub: "Persoonlijke ",
    icon: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 22l18-10 18 10v20l-18 10-18-10V22z"/><path d="M14 22l18 10 18-10M32 32v20"/></svg>`,
  },
  {
    label: "bestelling & levering",
    sub: "Flexibele ",
    icon: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><rect x="12" y="14" width="40" height="36" rx="2"/><path d="M20 24h24M20 32h24M20 40h14"/><circle cx="48" cy="44" r="6"/><path d="M48 50v6M44 54l4-4 4 4"/></svg>`,
  },
  {
    label: "productgamma",
    sub: "Uitgebreid ",
    icon: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12l8 8-20 20-8-8z" transform="translate(20 8)"/><path d="M44 28l12 12-8 8-12-12z"/></svg>`,
  },
];
</script>

<style scoped>
.hero-bg {
  background: radial-gradient(
    ellipse at 50% 40%,
    var(--gradient-banner-1) 0%,
    var(--gradient-banner-2) 45%,
    var(--gradient-banner-3) 100%
  );
}
.hero-bg::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 100%,
    color-mix(in srgb, var(--color-bg) 90%, transparent) 0%,
    transparent 55%
  );
}
.hero-leaf {
  position: absolute;
  z-index: 1;
  pointer-events: none;
}
.hl-1 {
  top: 12%;
  left: 7%;
  width: 55px;
  transform: rotate(-20deg);
}
.hl-2 {
  top: 18%;
  right: 8%;
  width: 50px;
  transform: rotate(30deg) scaleX(-1);
}
.hl-3 {
  bottom: 28%;
  left: 4%;
  width: 38px;
  transform: rotate(10deg);
}
.hl-4 {
  bottom: 22%;
  right: 5%;
  width: 32px;
  transform: rotate(-15deg) scaleX(-1);
}
.feature-strip-gradient {
  background: linear-gradient(
    90deg,
    var(--gradient-banner-2) 0%,
    var(--gradient-banner-1) 40%,
    var(--color-primary-hover) 100%
  );
}
</style>
