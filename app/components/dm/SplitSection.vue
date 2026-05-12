<template>
  <section>
    <div class="grid min-h-100 grid-cols-1 md:min-h-150 md:grid-cols-2">
      <!-- Left: full image with text overlay -->
      <div class="group relative min-h-150 overflow-hidden bg-[#1a1414]">
        <img
          src="https://images.unsplash.com/photo-1551028150-64b9f398f678?auto=format&fit=crop&w=1200&q=80"
          alt="Verse steak"
          class="block h-full w-full object-cover transition-transform duration-600 group-hover:scale-105"
        />
        <div
          class="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div
            class="text-center font-['Dancing_Script',cursive] text-white [text-shadow:0_4px_20px_rgba(0,0,0,0.6)]"
          >
            <span
              class="block -translate-x-2.5 -rotate-6 text-[clamp(2rem,4vw,3.5rem)] leading-none font-semibold"
              >enkel</span
            >
            <span
              class="my-[0.15em] block font-['Playfair_Display',serif] text-[clamp(3rem,6vw,5rem)] font-black tracking-[0.08em] text-white"
              >VERS</span
            >
            <span
              class="block translate-x-2.5 rotate-6 text-[clamp(2rem,4vw,3.5rem)] leading-none font-semibold"
              >vlees</span
            >
          </div>
        </div>
      </div>

      <!-- Right: stacked images + stat -->
      <div class="flex flex-col">
        <div class="group relative flex-1 overflow-hidden bg-[#1a1414]">
          <img
            src="https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=80"
            alt="Gegrilde steak"
            class="block h-full w-full object-cover transition-transform duration-600 group-hover:scale-105"
          />
          <div
            class="absolute inset-0 flex items-end p-8"
            style="
              background: linear-gradient(
                to top,
                rgba(15, 13, 13, 0.95) 0%,
                rgba(15, 13, 13, 0.5) 60%,
                transparent 100%
              );
            "
          >
            <p
              class="m-0 max-w-80 text-[0.95rem] leading-normal text-[#e8e2dc] italic"
            >
              Wekelijks worden nieuwe, verse producten aangeleverd door onze
              diverse leveranciers — zo bieden we onze klanten steeds
              kwaliteitsvolle producten aan.
            </p>
          </div>
        </div>
        <div class="grid min-h-50 grid-cols-2">
          <div
            class="flex flex-col items-center justify-center bg-[#b8252a] p-4 text-white"
          >
            <p
              class="m-0 font-['Playfair_Display',serif] text-[4rem] leading-none font-black"
            >
              3<sup class="text-[0.4em]">e</sup>
            </p>
            <p
              class="m-0 mt-2 text-center text-[0.75rem] tracking-[0.15em] uppercase"
            >
              generatie<br />familiebedrijf
            </p>
          </div>
          <div class="group relative min-h-70 overflow-hidden bg-[#1a1414]">
            <img
              src="https://images.unsplash.com/photo-1432139509613-5c4255815697?auto=format&fit=crop&w=600&q=80"
              alt="Vlees product"
              class="block h-full w-full object-cover transition-transform duration-600 group-hover:scale-105"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
