<template>
  <!-- Slotblok van de homepage: persoonlijk contact en de vroegere
       "Wij staan u heel de dag graag te woord"-banner in één. De accentkleur
       staat vast op #c89868: het lichte thema maakt --color-accent donkerbruin,
       en dat leest niet op rood. -->
  <section
    class="relative overflow-hidden py-24"
    style="background: linear-gradient(135deg, var(--gradient-banner-3) 0%, var(--gradient-banner-2) 40%, var(--gradient-banner-1) 100%)"
  >
    <div
      class="pointer-events-none absolute inset-0"
      style="background: radial-gradient(ellipse at 50% 50%, rgba(200, 152, 104, 0.08), transparent 70%)"
    />
    <div class="relative z-1 max-w-300 mx-auto px-6">
      <!-- Rij 1: kop links, intro + knop rechts -->
      <div
        class="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 lg:gap-16 items-end mb-12"
      >
        <div>
          <p
            class="uppercase tracking-[0.3em] text-[0.75rem] text-[#c89868] font-semibold mb-4"
          >
            — Persoonlijk contact —
          </p>
          <h2
            class="font-['Playfair_Display',Georgia,serif] text-[clamp(2rem,4vw,3.25rem)] font-bold text-white m-0 leading-[1.1]"
          >
            <span class="block">Persoonlijke</span>
            <span
              class="block font-['Dancing_Script',cursive] text-[#c89868] font-normal text-[1.1em] mt-2"
              >vertrouwensband</span
            >
          </h2>
        </div>
        <div>
          <p class="text-white/80 text-[1.05rem] leading-[1.7] m-0 mb-6">
            Als hecht familiebedrijf bouwen wij met elke klant een persoonlijke
            vertrouwensband op. Bij ons krijgt u geen callcenter, maar iemand
            van het team die met u meedenkt. Bestel online wanneer het u past,
            of neem gewoon contact op — wij staan u heel de dag graag te woord.
          </p>
          <NuxtLink
            to="/contact"
            class="inline-block rounded-xl bg-[#c89868] text-[#1a0a0a] px-8 py-[0.9rem] no-underline font-semibold uppercase tracking-[0.15em] text-[0.8rem] hover:bg-[#d8a878] hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all duration-200"
            >Alle contactgegevens</NuxtLink
          >
        </div>
      </div>

      <!-- Rij 2: contactkanalen naast elkaar. Hele kaart is klikbaar. -->
      <ul
        class="list-none p-0 m-0 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6"
      >
        <li v-for="point in qualityPoints" :key="point.title">
          <a
            :href="point.href"
            class="group flex h-full gap-4 items-start rounded-xl border border-white/15 bg-black/20 p-5 lg:p-6 no-underline backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#c89868]/70 hover:bg-black/30"
          >
            <div
              class="w-11 h-11 border border-[#c89868] text-[#c89868] rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 group-hover:bg-[#c89868] group-hover:text-[#1a0a0a]"
            >
              <component :is="point.icon" class="w-5.5 h-5.5" />
            </div>
            <div class="min-w-0">
              <h3
                class="text-white text-[0.9rem] m-0 mb-1 uppercase tracking-widest"
              >
                {{ point.title }}
              </h3>
              <span
                class="block text-[#c89868] font-semibold wrap-break-word group-hover:underline"
                >{{ point.value }}</span
              >
              <p class="text-white/70 m-0 mt-1 text-[0.9rem] leading-normal">
                {{ point.text }}
              </p>
            </div>
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { defineComponent, h } from "vue";
import { COMPANY } from "#shared/company";

function svgPoint(d: string) {
  return defineComponent({
    render: () =>
      h(
        "svg",
        {
          viewBox: "0 0 32 32",
          fill: "none",
          stroke: "currentColor",
          "stroke-width": "1.5",
        },
        [
          h("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            d,
          }),
        ],
      ),
  });
}

// De contactkanalen staan hier bewust op de homepage: vaste klanten zoeken
// vooral een nummer. Waarden komen uit #shared/company, net als op /contact.
const qualityPoints = [
  {
    icon: svgPoint(
      "M6 4h5l2 6-3 2a16 16 0 008 8l2-3 6 2v5a2 2 0 01-2 2A22 22 0 014 6a2 2 0 012-2z",
    ),
    title: "Telefoon",
    value: COMPANY.phone,
    href: `tel:${COMPANY.phoneIntl.replace(/\s/g, "")}`,
    text: "Voor een vraag, advies of een laatste aanvulling op uw bestelling.",
  },
  {
    icon: svgPoint(
      "M10 3h12a2 2 0 012 2v22a2 2 0 01-2 2H10a2 2 0 01-2-2V5a2 2 0 012-2zM14 25h4",
    ),
    title: "GSM & WhatsApp",
    value: COMPANY.mobile,
    href: `https://wa.me/${COMPANY.mobileIntl.replace(/[^\d]/g, "")}`,
    text: "Stuur gerust een bericht, ook voor een bestelling.",
  },
  {
    icon: svgPoint("M4 8h24v16H4V8zm0 0l12 9 12-9"),
    title: "E-mail",
    value: COMPANY.email,
    href: `mailto:${COMPANY.email}`,
    text: "Voor offertes, productfiches of alles wat niet dringend is.",
  },
];
</script>

