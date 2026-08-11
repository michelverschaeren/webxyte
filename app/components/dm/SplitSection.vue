<template>
  <section
    class="relative overflow-hidden bg-(--color-bg) py-14 md:py-20"
  >
    <!-- Subtle decorative glow -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-[#b8252a]/20 blur-3xl"
    />
    <div
      aria-hidden="true"
      class="pointer-events-none absolute -right-32 -bottom-32 h-80 w-80 rounded-full bg-[#b8252a]/10 blur-3xl"
    />

    <div class="relative mx-auto max-w-6xl px-6">
      <div
        class="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16"
      >
        <!-- Left: Tagline + copy + stat -->
        <div class="text-(--color-text-strong)">
          <span
            class="inline-block font-['Dancing_Script',cursive] text-2xl text-[#b8252a] md:text-3xl"
          >
            enkel
          </span>
          <h2
            class="mt-1 font-['Playfair_Display',serif] text-5xl leading-[0.95] font-black tracking-tight md:text-6xl"
          >
            VERS
            <span
              class="font-['Dancing_Script',cursive] font-semibold text-(--color-text) italic"
            >
              vlees
            </span>
          </h2>

          <p
            class="mt-6 max-w-md text-[0.95rem] leading-relaxed text-(--color-text-muted)"
          >
            Wekelijks worden nieuwe, verse producten aangeleverd door onze
            diverse leveranciers — zo bieden we onze klanten steeds
            kwaliteitsvolle producten aan.
          </p>

          <div class="mt-8 flex items-center gap-5">
            <div
              class="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full bg-[#b8252a] text-white shadow-lg shadow-[#b8252a]/30"
            >
              <span
                class="font-['Playfair_Display',serif] text-2xl leading-none font-black"
              >
                3<sup class="text-[0.55em]">e</sup>
              </span>
            </div>
            <p class="text-[0.7rem] tracking-[0.2em] text-(--color-text) uppercase">
              generatie<br >
              <span class="text-[#b8252a]">familiebedrijf</span>
            </p>
          </div>
        </div>

        <!-- Right: compact photo mosaic -->
        <div class="grid h-64 grid-cols-3 grid-rows-2 gap-2 md:h-72">
          <div
            class="group relative col-span-2 row-span-2 overflow-hidden rounded-xl bg-(--color-surface)"
          >
            <img
              src="https://images.unsplash.com/photo-1551028150-64b9f398f678?auto=format&fit=crop&w=900&q=80"
              alt="Verse steak"
              loading="lazy"
              class="block h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            >
            <div
              class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-3"
            >
              <span class="font-['Dancing_Script',cursive] text-lg text-white">
                ambachtelijk
              </span>
            </div>
          </div>
          <div class="group relative overflow-hidden rounded-xl bg-(--color-surface)">
            <img
              src="https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=400&q=80"
              alt="Gegrilde steak"
              loading="lazy"
              class="block h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            >
          </div>
          <div class="group relative overflow-hidden rounded-xl bg-(--color-surface)">
            <img
              src="https://images.unsplash.com/photo-1432139509613-5c4255815697?auto=format&fit=crop&w=400&q=80"
              alt="Vlees product"
              loading="lazy"
              class="block h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            >
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
