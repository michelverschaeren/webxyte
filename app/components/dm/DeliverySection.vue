<template>
  <section
    class="overflow-hidden py-24"
    style="
      background: linear-gradient(
        135deg,
        var(--color-surface-strong) 0%,
        var(--color-surface) 100%
      );
    "
  >
    <div
      class="mx-auto grid max-w-300 grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16"
    >
      <!-- Left: text -->
      <div>
        <p
          class="mb-4 text-[0.75rem] font-semibold tracking-[0.3em] text-(--color-accent) uppercase"
        >
          — Levering —
        </p>
        <h2
          class="mb-6 font-['Playfair_Display',serif] text-[clamp(2.5rem,5vw,4rem)] leading-[1.05] font-bold text-(--color-text-strong)"
        >
          Onze eigen<br />
          <span
            class="font-['Dancing_Script',cursive] font-normal text-[#b8252a]"
            >in-huis chauffeurs</span
          >
        </h2>
        <p class="mb-8 text-[1.05rem] leading-[1.7] text-(--color-text-muted)">
          Uw bestelling wordt afgeleverd door één van onze eigen chauffeurs.
          Indien u problemen heeft met uw bestelling, staan zij u bij in het
          zoeken naar een oplossing op maat. Ontbreekt er een artikel? Wij
          zorgen ervoor dat dit dezelfde week wordt nageleverd.
        </p>
        <NuxtLink
          to="/producten"
          class="inline-block bg-[#c89868] px-8 py-[0.9rem] text-[0.8rem] font-semibold tracking-[0.15em] text-[#1a0a0a] uppercase no-underline transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#d8a878]"
          >Bekijk ons gamma</NuxtLink
        >
      </div>

      <!-- Right: image composition -->
      <div class="relative min-h-75 lg:min-h-125">
        <div
          class="absolute bottom-[30%] left-0 hidden h-50 w-[60%] bg-[#b8252a] lg:block"
        ></div>
        <img
          src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=800&q=80"
          alt="Onze chauffeur"
          class="h-75 w-full rounded-lg object-cover grayscale-[.2] lg:absolute lg:top-0 lg:right-0 lg:z-1 lg:h-125 lg:w-9/10"
        />
      </div>
    </div>
  </section>
</template>
