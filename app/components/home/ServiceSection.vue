<template>
  <section class="py-24" style="background-color: var(--color-surface-2)">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section header -->
      <div class="text-center mb-16">
        <span
          class="inline-block text-sm font-semibold uppercase tracking-widest mb-3"
          style="color: var(--color-primary)"
          >Hoe wij werken</span
        >
        <h2 class="text-4xl sm:text-5xl font-black text-site mb-4">
          Onze service van A tot Z
        </h2>
        <p class="text-lg text-muted max-w-2xl mx-auto">
          Van bestelling tot aan uw deur — snel, flexibel en betrouwbaar.
        </p>
      </div>

      <!-- Steps -->
      <div class="relative">
        <!-- Connector line (desktop) -->
        <div
          class="hidden lg:block absolute top-12 left-0 right-0 h-0.5 mx-32"
          style="
            background: linear-gradient(
              to right,
              var(--color-primary),
              var(--color-primary-light)
            );
          "
        />

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div
            v-for="(step, index) in steps"
            :key="step.title"
            class="relative text-center"
          >
            <!-- Step number circle -->
            <div
              class="relative z-10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
              style="
                background: linear-gradient(
                  135deg,
                  var(--color-primary-dark),
                  var(--color-primary)
                );
              "
            >
              <component :is="step.icon" class="w-9 h-9 text-white" />
              <div
                class="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
                style="background-color: var(--color-accent)"
              >
                {{ index + 1 }}
              </div>
            </div>

            <h3 class="text-lg font-bold text-site mb-2">{{ step.title }}</h3>
            <p class="text-sm text-muted leading-relaxed px-2">
              {{ step.text }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { defineComponent, h } from "vue";

function svgIcon(d: string) {
  return defineComponent({
    render: () =>
      h(
        "svg",
        {
          xmlns: "http://www.w3.org/2000/svg",
          fill: "none",
          viewBox: "0 0 24 24",
          stroke: "currentColor",
          "stroke-width": "2",
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

const steps = [
  {
    icon: svgIcon(
      "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    ),
    title: "Bestelling",
    text: "Bestel eenvoudig online, via mail, fax of telefoon. Volledige flexibiliteit naar uw noden.",
  },
  {
    icon: svgIcon(
      "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    ),
    title: "Verwerken",
    text: "Bestellingen voor de huidige dag kunnen tot 8u worden aangevuld. Wij verwerken alles nauwkeurig.",
  },
  {
    icon: svgIcon(
      "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4",
    ),
    title: "Levering",
    text: "Eigen chauffeurs bezorgen uw bestelling. Bij problemen zoeken zij ter plaatse een oplossing op maat.",
  },
  {
    icon: svgIcon(
      "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    ),
    title: "Nalevering",
    text: "Ontbreekt er iets? Wij zorgen voor nalevering dezelfde week — uw tevredenheid staat altijd centraal.",
  },
];
</script>
