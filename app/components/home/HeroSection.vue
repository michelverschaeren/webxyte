<template>
  <section
    class="relative flex min-h-screen items-center justify-center overflow-hidden"
  >
    <!-- Background gradient -->
    <div
      class="absolute inset-0 z-0"
      :style="`background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 50%, var(--color-primary-light) 100%);`"
    />

    <!-- Decorative pattern overlay -->
    <div
      class="absolute inset-0 z-0 opacity-10"
      style="
        background-image: url(&quot;data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E&quot;);
      "
    />

    <!-- Gradient overlay bottom -->
    <div
      class="absolute right-0 bottom-0 left-0 z-0 h-40"
      style="background: linear-gradient(to top, var(--color-bg), transparent)"
    />

    <!-- Content -->
    <div
      class="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8"
    >
      <!-- Tag line -->
      <div
        class="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"
        style="
          background: rgba(255, 255, 255, 0.15);
          color: var(--color-accent-light);
          border: 1px solid rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(8px);
        "
      >
        <span
          class="inline-block h-2 w-2 animate-pulse rounded-full bg-current"
        />
        Familiebedrijf · Zemst · Vlaanderen
      </div>

      <!-- Main headline -->
      <h1
        class="mb-6 text-5xl leading-tight font-black tracking-tight text-white sm:text-6xl lg:text-7xl"
      >
        Vleeswaren van<br />
        <span :style="`color: var(--color-accent-light);`"
          >uitzonderlijke kwaliteit</span
        >
      </h1>

      <p
        class="mx-auto mb-10 max-w-2xl text-xl leading-relaxed font-light text-white/80 sm:text-2xl"
      >
        Van generatie op generatie leveren wij het beste gamma vleeswaren,
        rechtstreeks bij u als handelaar.
      </p>

      <!-- CTA buttons -->
      <div class="flex flex-col justify-center gap-4 sm:flex-row">
        <NuxtLink
          to="/producten"
          class="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
          style="
            background-color: var(--color-accent);
            color: var(--color-primary-dark);
          "
        >
          Ontdek ons gamma
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
        <NuxtLink
          to="/contact"
          class="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
          style="
            background: rgba(255, 255, 255, 0.15);
            border: 1.5px solid rgba(255, 255, 255, 0.4);
            backdrop-filter: blur(8px);
          "
        >
          Contacteer ons
        </NuxtLink>
      </div>

      <!-- Stats row -->
      <div class="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-6">
        <div v-for="stat in stats" :key="stat.label" class="text-center">
          <div class="mb-1 text-3xl font-black text-white">
            {{ stat.value }}
          </div>
          <div class="text-sm text-white/60">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <!-- Scroll indicator -->
    <div
      class="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bounce"
    >
      <svg
        class="h-6 w-6 text-white/50"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </div>
  </section>
</template>

<script setup lang="ts">
const stats = [
  { value: "5000+", label: "Producten" },
  { value: "21", label: "Categorieën" },
  { value: "3e gen.", label: "Familiebedrijf" },
];
</script>
