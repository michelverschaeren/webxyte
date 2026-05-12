<template>
  <section
    class="py-24 bg-[#0f0d0d] bg-[radial-gradient(circle_at_20%_30%,rgba(184,37,42,0.05),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(184,37,42,0.05),transparent_50%)]"
  >
    <div class="max-w-300 mx-auto px-6">
      <div
        class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"
      >
        <!-- Left: text + list -->
        <div>
          <p
            class="uppercase tracking-[0.3em] text-[0.75rem] text-[#c89868] font-semibold mb-4"
          >
            — Onze service —
          </p>
          <h2
            class="font-['Playfair_Display',Georgia,serif] text-[clamp(2rem,4vw,3.25rem)] font-bold text-white mb-4 leading-[1.1]"
          >
            <span class="block">Persoonlijke</span>
            <span
              class="block font-['Dancing_Script',cursive] text-[#b8252a] font-normal text-[1.1em] mt-2"
              >vertrouwensband</span
            >
          </h2>
          <ul class="list-none p-0 my-8">
            <li
              v-for="point in qualityPoints"
              :key="point.title"
              class="flex gap-4 items-start py-4 border-b border-white/8 last:border-b-0"
            >
              <div
                class="w-11 h-11 border border-[#c89868] text-[#c89868] rounded-full flex items-center justify-center shrink-0"
              >
                <component :is="point.icon" class="w-5.5 h-5.5" />
              </div>
              <div>
                <h4
                  class="text-white text-[1rem] m-0 mb-1 uppercase tracking-widest"
                >
                  {{ point.title }}
                </h4>
                <p class="text-[#a89a8e] m-0 text-[0.9rem] leading-normal">
                  {{ point.text }}
                </p>
              </div>
            </li>
          </ul>
          <p class="text-[#a89a8e] leading-[1.7] my-8">
            Door de diepgewortelde waardes van Vleeswaren Vermeir, als hecht
            familiebedrijf, trachten wij met onze klanten steeds een
            persoonlijke vertrouwensband op te bouwen. U wordt steeds bediend
            met de beste service en de beste producten.
          </p>
          <NuxtLink
            to="/contact"
            class="inline-block bg-[#c89868] text-[#1a0a0a] px-8 py-[0.9rem] no-underline font-semibold uppercase tracking-[0.15em] text-[0.8rem] hover:bg-[#d8a878] hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(200,152,104,0.3)] transition-all duration-200"
            >+ Contacteer ons</NuxtLink
          >
        </div>

        <!-- Right: image + stamp -->
        <div class="relative text-center">
          <img
            src="https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=900&q=80"
            alt="Premium vlees"
            class="max-w-full brightness-90 contrast-110 rounded-xl shadow-[0_40px_80px_rgba(0,0,0,0.7),0_0_0_1px_rgba(200,152,104,0.1)]"
          />
          <div
            class="stamp absolute -top-5 right-0 lg:-right-2.5 w-27.5 h-27.5 lg:w-35 lg:h-35 bg-[#b8252a] rounded-full flex items-center justify-center text-white shadow-[0_10px_40px_rgba(184,37,42,0.6),0_0_0_4px_rgba(184,37,42,0.2),0_0_0_8px_rgba(184,37,42,0.1)]"
          >
            <div class="text-center leading-none">
              <span
                class="block font-['Playfair_Display',serif] text-[2.2rem] font-black"
                >100%</span
              >
              <span
                class="block text-[0.65rem] uppercase tracking-[0.12em] mt-1 opacity-90"
                >bewezen<br />kwaliteit</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { defineComponent, h } from "vue";

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

const qualityPoints = [
  {
    icon: svgPoint(
      "M16 4v8m0 8v8m-8-4h16M6 12h20M8 8a8 8 0 0116 0v16a8 8 0 01-16 0V8z",
    ),
    title: "Bestelling",
    text: "Plaats uw bestelling via mail, fax, telefoon of online — voor levering de dag nadien.",
  },
  {
    icon: svgPoint(
      "M12 4h8v8l4 12c1 3-1 4-4 4H12c-3 0-5-1-4-4l4-12V4zM10 22h12",
    ),
    title: "Verwerken",
    text: "Tot 8u 's ochtends kunnen producten worden toegevoegd aan uw lopende bestelling.",
  },
  {
    icon: svgPoint("M16 2l3 7h7l-5.5 5 2 8L16 18l-6.5 4 2-8L6 9h7l3-7z"),
    title: "Nalevering",
    text: "Ontbrekende artikels worden steeds dezelfde week nageleverd.",
  },
];
</script>

<style scoped>
.stamp {
  animation: stamp-wiggle 4s ease-in-out infinite;
}
@keyframes stamp-wiggle {
  0%,
  100% {
    transform: rotate(-12deg);
  }
  50% {
    transform: rotate(-8deg) scale(1.03);
  }
}
</style>
