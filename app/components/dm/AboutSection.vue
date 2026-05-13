<template>
  <section class="py-24">
    <div class="mx-auto max-w-300 px-6">
      <div
        class="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20"
      >
        <!-- Photo of the owners -->
        <div class="relative">
          <div
            class="relative overflow-hidden rounded-lg shadow-2xl shadow-black/40"
          >
            <img
              src="https://images.unsplash.com/photo-1605522561233-768ad7a8fabf?auto=format&fit=crop&w=900&q=80"
              alt="De eigenaars van Vleeswaren Vermeir"
              loading="lazy"
              class="block aspect-4/5 h-full w-full object-cover"
            />
            <div
              class="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0f0d0d]/60 via-transparent to-transparent"
            ></div>
          </div>
          <!-- Decorative accent -->
          <div
            aria-hidden="true"
            class="absolute -bottom-5 -left-5 -z-10 h-32 w-32 rounded-lg border-2 border-[#b8252a]/60 hidden lg:block"
          ></div>
          <div
            aria-hidden="true"
            class="absolute -top-5 -right-5 -z-10 h-24 w-24 rounded-lg bg-[#c89868]/15 hidden lg:block"
          ></div>
          <!-- Caption badge -->
          <div
            class="absolute bottom-4 left-4 rounded bg-[#0f0d0d]/85 px-4 py-2 backdrop-blur-sm"
          >
            <p
              class="m-0 font-['Dancing_Script',cursive] text-lg text-[#c89868]"
            >
              familie Vermeir
            </p>
          </div>
        </div>

        <!-- Text content -->
        <div class="text-center lg:text-left">
          <p
            class="mb-4 text-[0.75rem] font-semibold tracking-[0.3em] text-[#c89868] uppercase"
          >
            — Over Vleeswaren Vermeir —
          </p>
          <h2
            class="mb-4 font-['Playfair_Display',Georgia,serif] text-[clamp(2rem,4vw,3.25rem)] leading-[1.1] font-bold text-white"
          >
            <span class="block">Een familiebedrijf</span>
            <span
              class="mt-2 block font-['Dancing_Script',cursive] text-[1.1em] font-normal text-[#b8252a]"
              >van generatie op generatie</span
            >
          </h2>
          <p
            class="mt-6 max-w-150 text-[1.05rem] leading-[1.7] text-[#a89a8e] lg:mx-0 mx-auto"
          >
            Van generatie op generatie is dit familiebedrijf altijd trouw
            gebleven aan zijn waarden welke streven naar 100% klanttevredenheid.
            Deze vormen dan ook de basis voor onze unieke en persoonlijke
            service.
          </p>

          <div
            class="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start"
          >
            <span
              class="rounded-full border border-[#c89868]/40 px-4 py-1.5 text-[0.75rem] font-semibold tracking-[0.15em] text-[#c89868] uppercase"
            >
              Sinds 1958
            </span>
            <span
              class="rounded-full border border-[#c89868]/40 px-4 py-1.5 text-[0.75rem] font-semibold tracking-[0.15em] text-[#c89868] uppercase"
            >
              3ᵉ generatie
            </span>
            <span
              class="rounded-full border border-[#c89868]/40 px-4 py-1.5 text-[0.75rem] font-semibold tracking-[0.15em] text-[#c89868] uppercase"
            >
              Ambachtelijk
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts"></script>
