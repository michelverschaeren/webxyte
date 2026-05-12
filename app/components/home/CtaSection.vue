<template>
  <section class="relative overflow-hidden py-20">
    <!-- Background -->
    <div
      class="absolute inset-0"
      style="
        background: linear-gradient(
          135deg,
          var(--color-primary-dark) 0%,
          var(--color-primary) 100%
        );
      "
    />
    <div
      class="absolute inset-0 opacity-10"
      style="
        background-image: url(&quot;data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='2'/%3E%3Ccircle cx='23' cy='23' r='2'/%3E%3C/g%3E%3C/svg%3E&quot;);
      "
    />

    <div
      class="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8"
    >
      <h2 class="mb-4 text-4xl font-black text-white sm:text-5xl">
        Klaar om te bestellen?
      </h2>
      <p class="mx-auto mb-10 max-w-xl text-xl text-white/75">
        Doorzoek ons volledige gamma, voeg producten toe aan uw bestellijst en
        bespaar tijd bij elke bestelling.
      </p>
      <div class="flex flex-col justify-center gap-4 sm:flex-row">
        <NuxtLink
          to="/producten"
          class="inline-flex items-center gap-2 rounded-xl px-8 py-4 font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
          style="
            background-color: var(--color-accent);
            color: var(--color-primary-dark);
          "
        >
          Start uw bestelling
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
          class="inline-flex items-center gap-2 rounded-xl px-8 py-4 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
          style="
            background: rgba(255, 255, 255, 0.15);
            border: 1.5px solid rgba(255, 255, 255, 0.4);
          "
        >
          Contacteer ons
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
