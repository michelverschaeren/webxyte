<template>
  <section
    class="overflow-hidden py-24"
    style="background: linear-gradient(135deg, var(--color-surface-strong) 0%, var(--color-surface) 100%)"
  >
    <div
      class="mx-auto grid max-w-300 grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16"
    >
      <!-- Tekst -->
      <div>
        <p
          class="mb-4 text-[0.8rem] font-semibold tracking-[0.3em] text-(--color-accent) uppercase"
        >
          — Online bestellen —
        </p>
        <h2
          class="mb-6 font-['Playfair_Display',Georgia,serif] text-[clamp(2rem,4vw,3.25rem)] leading-[1.1] font-bold text-(--color-text-strong)"
        >
          <span class="block">Bestellen wanneer</span>
          <span
            class="mt-2 block font-['Dancing_Script',cursive] text-[1.1em] font-normal text-[#b8252a]"
            >het u uitkomt</span
          >
        </h2>
        <p class="mb-6 text-[1.125rem] leading-[1.7] text-(--color-text-muted)">
          Met uw klantenaccount bestelt u op elk moment van de dag, ook 's
          avonds of in het weekend. Uw bestelling komt rechtstreeks bij ons
          binnen, zonder misverstanden over artikels of aantallen.
        </p>

        <ul class="my-8 list-none p-0">
          <li
            v-for="point in points"
            :key="point.title"
            class="flex items-start gap-4 border-b border-(--color-border) py-4 last:border-b-0"
          >
            <span
              aria-hidden="true"
              class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#c89868] text-[0.85rem] text-(--color-accent)"
              >✓</span
            >
            <div>
              <h3
                class="m-0 mb-1 text-[1.05rem] tracking-widest text-(--color-text-strong) uppercase"
              >
                {{ point.title }}
              </h3>
              <p
                class="m-0 text-[0.95rem] leading-normal text-(--color-text-muted)"
              >
                {{ point.text }}
              </p>
            </div>
          </li>
        </ul>

        <div class="flex flex-wrap gap-4">
          <button
            type="button"
            class="inline-block cursor-pointer rounded-xl border-0 bg-[#c89868] px-8 py-[0.9rem] text-[0.85rem] font-semibold tracking-[0.15em] text-[#1a0a0a] uppercase transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#d8a878]"
            @click="authModal.open()"
          >
            Inloggen
          </button>
          <NuxtLink
            to="/contact"
            class="inline-block rounded-xl border-2 border-[#c89868] px-8 py-[0.9rem] text-[0.85rem] font-semibold tracking-[0.15em] text-(--color-accent) uppercase no-underline transition-all duration-200 hover:bg-[#c89868] hover:text-[#1a0a0a]"
            >Login aanvragen</NuxtLink
          >
        </div>
        <p class="mt-6 text-[0.95rem] leading-[1.6] text-(--color-text-muted)">
          Liever persoonlijk? Bellen, mailen of een WhatsApp-bericht blijft
          altijd mogelijk. Online bestellen helpt ons wel om uw bestelling
          sneller en foutloos te verwerken.
        </p>
      </div>

      <!-- Illustratie van het bestelscherm. Bewust in HTML i.p.v. een echte
           screenshot: die zou productnamen en fabrikanten publiek zetten, en
           de catalogus mag niet crawlbaar zijn. Vervang je dit toch door een
           screenshot, gebruik dan enkel generieke productnamen. -->
      <div
        role="img"
        aria-label="Voorbeeld van het online bestelscherm met een bewaarde bestellijst"
        class="overflow-hidden rounded-xl border border-(--color-border-strong) bg-(--color-bg) shadow-[0_30px_60px_rgba(0,0,0,0.35)]"
      >
        <div
          aria-hidden="true"
          class="flex items-center gap-2 border-b border-(--color-border) bg-(--color-surface) px-4 py-3"
        >
          <span class="h-2.5 w-2.5 rounded-full bg-(--color-text-muted)/40" />
          <span class="h-2.5 w-2.5 rounded-full bg-(--color-text-muted)/40" />
          <span class="h-2.5 w-2.5 rounded-full bg-(--color-text-muted)/40" />
          <span
            class="ml-3 truncate rounded bg-(--color-bg) px-3 py-1 text-[0.75rem] text-(--color-text-muted)"
            >Mijn bestellijsten</span
          >
        </div>
        <div aria-hidden="true" class="p-5 sm:p-6">
          <p
            class="m-0 text-[0.75rem] font-semibold tracking-[0.2em] text-(--color-accent) uppercase"
          >
            Bestellijst
          </p>
          <p
            class="m-0 mt-1 mb-4 font-['Playfair_Display',Georgia,serif] text-[1.25rem] font-bold text-(--color-text-strong)"
          >
            Vaste weekbestelling
          </p>
          <ul class="m-0 list-none divide-y divide-(--color-border) p-0">
            <li
              v-for="item in mockItems"
              :key="item.name"
              class="flex items-center justify-between gap-4 py-3"
            >
              <span class="text-[0.95rem] text-(--color-text)">{{
                item.name
              }}</span>
              <span
                class="flex items-center gap-3 rounded-lg border border-(--color-border-strong) px-2 py-1 text-[0.95rem] text-(--color-text-strong)"
              >
                <span class="text-(--color-text-muted)">−</span>
                <span class="w-6 text-center tabular-nums">{{ item.qty }}</span>
                <span class="text-(--color-text-muted)">+</span>
              </span>
            </li>
          </ul>
          <div
            class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-(--color-border) pt-5"
          >
            <span class="text-[0.85rem] text-(--color-text-muted)"
              >Levering: morgen</span
            >
            <span
              class="rounded-xl bg-[#b8252a] px-5 py-2.5 text-[0.8rem] font-semibold tracking-[0.12em] text-white uppercase"
              >Bestelling plaatsen</span
            >
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { COMPANY } from "#shared/company";

const authModal = useAuthModal();

// Enkel functies die de klantenzone echt heeft: zoeken in /producten,
// bestellijsten (useOrderLists) en herbestellen vanuit Mijn bestellingen.
const points = [
  {
    title: "Ons volledige gamma",
    text: `Zoek en blader door meer dan ${COMPANY.productCount} producten, met de productfiches erbij.`,
  },
  {
    title: "Bestellijsten",
    text: "Bewaar uw vaste producten in een lijst en bestel ze telkens opnieuw in een paar klikken.",
  },
  {
    title: "Vorige bestellingen herhalen",
    text: "Start een nieuwe bestelling vanuit een eerdere, zonder alles opnieuw te zoeken.",
  },
];

// Generieke namen, geen merken of artikelnummers.
const mockItems = [
  { name: "Gekookte ham", qty: 4 },
  { name: "Salami", qty: 2 },
  { name: "Kipcurrysalade", qty: 3 },
  { name: "Ardeense paté", qty: 1 },
];
</script>
