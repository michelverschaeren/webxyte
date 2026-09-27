<template>
  <div>
    <section
      ref="heroRef"
      class="relative -mt-26.5 flex min-h-[55vh] flex-col overflow-hidden pt-26.5"
    >
      <div
        class="hero-bg absolute inset-0 z-0"
        :style="{ opacity: bgOpacity }"
      />

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

      <!-- Hero image -->
      <div
        class="relative z-2 flex flex-1 flex-col items-center justify-center px-4 pt-26 pb-10 md:pt-0 md:pb-0"
      >
        <div
          class="relative z-2 mx-auto flex w-full max-w-205 justify-center"
          :style="{ opacity: bgOpacity }"
        >
          <!-- Dit is het LCP-element. `sizes` moet de syntaxis van @nuxt/image
               volgen; de rauwe media query die hier stond werd stil genegeerd,
               waardoor mobiel altijd de 1640w-variant van 362 kB binnenhaalde.
               Let op: een vw-waarde heeft een breakpoint-prefix nodig, anders
               kent de module de schermbreedte niet en genereert ze varianten
               van 1 en 2 pixel breed. `sm:` is daarbij de kleinste die telt —
               een `xs:`-prefix wordt genegeerd. -->
          <NuxtImg
            class="block h-auto w-full max-w-205 object-contain filter-[drop-shadow(0_20px_40px_rgba(0,0,0,0.5))]"
            src="/images/herobanner-big.png"
            alt="Vleeswaren Vermeir"
            width="1200"
            height="306"
            format="webp"
            quality="90"
            sizes="sm:100vw md:820px"
            preload
          />
        </div>
      </div>
    </section>

    <!-- Feature strip -->
    <div class="relative z-10 -mt-6 md:-mt-16">
      <div
        class="feature-strip-gradient mx-auto grid max-w-275 grid-cols-2 gap-px md:grid-cols-4"
      >
        <div
          v-for="feat in features"
          :key="feat.label"
          class="group relative flex items-center gap-2 border-r border-white/10 px-2 py-2.5 text-white transition-colors duration-300 last:border-r-0 even:border-r-0 hover:bg-black/20 md:gap-4 md:px-5 md:py-5 md:even:border-r"
        >
          <div
            class="h-6 w-6 shrink-0 text-(--color-accent) [&>svg]:h-full [&>svg]:w-full [&>svg]:stroke-current md:h-8 md:w-8"
            v-html="feat.icon"
          />
          <p
            class="m-0 text-[0.58rem] leading-[1.3] tracking-[0.06em] wrap-break-word uppercase md:text-[0.78rem]"
          >
            {{ feat.sub
            }}<strong class="block text-[0.72rem] font-bold text-white md:text-[0.85rem]">{{
              feat.label
            }}</strong>
          </p>
          <span
            class="absolute right-0 bottom-0 left-0 h-0.75 origin-left scale-x-0 bg-[#c89868] transition-transform duration-300 group-hover:scale-x-100"
          />
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

// Background (gradient + hero image) fades out faster
const bgOpacity = computed(() => {
  const h = heroHeight.value || 1;
  return Math.max(0, Math.min(1, 1 - scrollY.value / (h * 0.55)));
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
    label: "online bestellen",
    sub: "Vlot ",
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
/* In licht thema is --color-bg crème/wit, waardoor deze fade als een witte
   gloed over de rode banner lag. Alleen in donker thema is de kleur donker
   genoeg om als vloeiende overgang naar de pagina-achtergrond te werken. */
:root[data-theme="light"] .hero-bg::after {
  background: none;
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
