<template>
  <section class="py-24">
    <div class="mx-auto max-w-300 px-6">
      <div
        class="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20"
      >
        <!-- Familiefoto. Het kader volgt de 4:3-verhouding van de foto zelf:
             in een staand kader vallen de buitenste personen weg. -->
        <div class="relative">
          <div
            class="relative overflow-hidden rounded-lg shadow-2xl shadow-black/40"
          >
            <NuxtImg
              src="/images/site/familiefoto.jpeg"
              alt="De familie achter Vleeswaren Vermeir"
              width="2048"
              height="1538"
              loading="lazy"
              format="webp"
              quality="75"
              sizes="sm:100vw lg:540px"
              class="aspect-4/3 w-full rounded-lg object-cover"
            />
          </div>
          <!-- Decorative accent -->
          <div
            aria-hidden="true"
            class="absolute -bottom-5 -left-5 -z-10 h-32 w-32 rounded-lg border-2 border-[#b8252a]/60 hidden lg:block"
          />
          <div
            aria-hidden="true"
            class="absolute -top-5 -right-5 -z-10 h-24 w-24 rounded-lg bg-[#c89868]/15 hidden lg:block"
          />
          <!-- Caption badge -->
          <div
            class="absolute bottom-4 left-4 rounded bg-[#0f0d0d]/85 px-4 py-2 backdrop-blur-sm"
          >
            <p
              class="m-0 font-['Dancing_Script',cursive] text-[1.2rem] text-(--color-accent)"
            >
              het team van Vermeir
            </p>
          </div>
        </div>

        <!-- Text content -->
        <div class="text-center lg:text-left">
          <p
            class="mb-4 text-[0.8rem] font-semibold tracking-[0.3em] text-(--color-accent) uppercase"
          >
            — Over Vleeswaren Vermeir —
          </p>
          <h2
            class="mb-4 font-['Playfair_Display',Georgia,serif] text-[clamp(2rem,4vw,3.25rem)] leading-[1.1] font-bold text-(--color-text-strong)"
          >
            <span class="block">Een familiebedrijf</span>
            <span
              class="mt-2 block font-['Dancing_Script',cursive] text-[1.1em] font-normal text-[#b8252a]"
              >van generatie op generatie</span
            >
          </h2>
          <p
            class="mt-6 max-w-150 text-[1.125rem] leading-[1.7] text-(--color-text-muted) lg:mx-0 mx-auto"
          >
            Sinds {{ COMPANY.foundingYear }} levert Vleeswaren Vermeir
            vleeswaren aan handelaars in België. Vandaag staat de derde
            generatie aan het roer, samen met een klein en hecht team.
          </p>
          <p
            class="mt-4 max-w-150 text-[1.125rem] leading-[1.7] text-(--color-text-muted) lg:mx-0 mx-auto"
          >
            Ons gamma telt meer dan {{ COMPANY.productCount }} producten: van
            fijne vleeswaren, kaas en salades tot bereide gerechten, sauzen en
            verpakkingsmateriaal. U bestelt, onze eigen chauffeurs leveren de
            dag nadien — en voor elke vraag over onze producten kan u bij ons
            terecht.
          </p>
          <p
            class="mt-4 max-w-150 text-[1.125rem] leading-[1.7] text-(--color-text-muted) lg:mx-0 mx-auto"
          >
            Van generatie op generatie bleven onze waarden dezelfde: streven
            naar 100% klanttevredenheid, met een persoonlijke service als
            basis.
          </p>

          <div
            class="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start"
          >
            <span
              class="rounded-full border border-[#c89868]/40 px-4 py-1.5 text-[0.8rem] font-semibold tracking-[0.15em] text-(--color-accent) uppercase"
            >
              Sinds {{ COMPANY.foundingYear }}
            </span>
            <span
              class="rounded-full border border-[#c89868]/40 px-4 py-1.5 text-[0.8rem] font-semibold tracking-[0.15em] text-(--color-accent) uppercase"
            >
              3ᵉ generatie
            </span>
            <span
              class="rounded-full border border-[#c89868]/40 px-4 py-1.5 text-[0.8rem] font-semibold tracking-[0.15em] text-(--color-accent) uppercase"
            >
              {{ COMPANY.productCount }}+ producten
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { COMPANY } from "#shared/company";
</script>
