<template>
  <footer
    class="border-t border-(--color-border)"
    style="background: var(--color-surface-strong)"
  >
    <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 gap-10 md:grid-cols-3">
        <!-- Brand -->
        <div>
          <div class="mb-4 flex items-center gap-3">
            <img
              src="/images/logo-dark.png"
              alt="Vleeswaren Vermeir logo"
              class="only-dark h-9 w-9 rounded-lg object-contain"
            >
            <img
              src="/images/logo-light.png"
              alt="Vleeswaren Vermeir logo"
              class="only-light h-9 w-9 rounded-lg object-contain"
            >
            <span class="text-lg font-bold text-(--color-text-strong)"
              >Vleeswaren <span class="text-(--color-accent)">Vermeir BV</span></span
            >
          </div>
          <p class="text-sm leading-relaxed text-(--color-text-muted)">
            Van generatie op generatie een familiebedrijf met oog voor
            kwaliteit, versheid en persoonlijke service.
          </p>
        </div>

        <!-- Contact -->
        <div>
          <h3
            class="mb-4 text-[0.7rem] font-semibold tracking-[0.2em] text-(--color-accent) uppercase"
          >
            Contact
          </h3>
          <ul class="space-y-2 text-sm text-(--color-text-muted)">
            <li class="flex items-start gap-2">
              <svg
                class="mt-0.5 h-4 w-4 shrink-0 text-(--color-accent)"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Schoolstraat 51, 1980 Zemst
            </li>
            <li class="flex items-center gap-2">
              <svg
                class="h-4 w-4 shrink-0 text-(--color-accent)"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              015 / 61 15 39
            </li>
            <li class="flex items-center gap-2">
              <svg
                class="h-4 w-4 shrink-0 text-(--color-accent)"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              vleeswarenvermeir@telenet.be
            </li>
          </ul>
        </div>

        <!-- Links -->
        <div>
          <h3
            class="mb-4 text-[0.7rem] font-semibold tracking-[0.2em] text-(--color-accent) uppercase"
          >
            Navigatie
          </h3>
          <ul class="space-y-2 text-sm">
            <li v-for="link in links" :key="link.to">
              <NuxtLink
                :to="link.to"
                class="text-(--color-text-muted) transition-colors hover:text-(--color-text-strong)"
                >{{ link.label }}</NuxtLink
              >
            </li>
          </ul>
        </div>
      </div>

      <div
        class="mt-10 flex flex-col items-center justify-between gap-3 border-t border-(--color-border) pt-6 text-xs text-(--color-text-muted) sm:flex-row"
      >
        <span
          >© {{ new Date().getFullYear() }} Vleeswaren Vermeir. Alle rechten
          voorbehouden.</span
        >
        <span>Schoolstraat 51 · 1980 Zemst · België</span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const links = [
  { to: "/", label: "Home" },
  { to: "/producten", label: "Producten & Bestellen" },
  { to: "/contact", label: "Contact" },
];
</script>
