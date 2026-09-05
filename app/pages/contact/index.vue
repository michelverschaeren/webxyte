<template>
  <div class="bg-(--color-bg) text-(--color-text) min-h-screen">
    <!-- Page header -->
    <div
      class="relative pt-46.5 pb-20 px-4 overflow-hidden"
      style="
        background: radial-gradient(
          ellipse at 50% 40%,
          var(--gradient-banner-1) 0%,
          var(--gradient-banner-2) 45%,
          var(--gradient-banner-3) 100%
        );
      "
    >
      <div class="relative z-1 max-w-300 mx-auto text-center">
        <h1
          class="font-['Playfair_Display',Georgia,serif] text-[clamp(2.5rem,6vw,5rem)] font-black text-white leading-[1.05] mb-4"
        >
          Contacteer ons
        </h1>
        <p class="text-white/70 text-lg max-w-xl mx-auto">
          Heeft u vragen of wenst u meer info? Wij helpen u graag verder.
        </p>
      </div>
    </div>

    <div class="max-w-300 mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <!-- Left: contact info + map -->
        <div class="flex flex-col gap-8">
          <div>
            <p
              class="uppercase tracking-[0.3em] text-[0.75rem] text-(--color-accent) font-semibold mb-6"
            >
              — Contactgegevens —
            </p>
            <div class="flex flex-col gap-5">
              <div
                v-for="info in contactInfo"
                :key="info.label"
                class="flex items-start gap-5 py-4 border-b border-(--color-border) last:border-b-0"
              >
                <div
                  class="w-11 h-11 rounded-lg border border-[#c89868] text-(--color-accent) flex items-center justify-center shrink-0"
                >
                  <component :is="info.icon" class="w-5 h-5" />
                </div>
                <div>
                  <p
                    class="text-xs font-semibold uppercase tracking-[0.15em] text-(--color-accent) mb-1"
                  >
                    {{ info.label }}
                  </p>
                  <p class="text-(--color-text) font-medium">
                    {{ info.value }}
                  </p>
                  <p
                    v-if="info.sub"
                    class="text-(--color-text-muted) text-sm mt-0.5"
                  >
                    {{ info.sub }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Google Maps -->
          <div
            class="overflow-hidden rounded-xl border border-(--color-border)"
            style="height: 300px"
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2499.01!2d4.462458!3d50.981381!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTDCsDU4JzUzLjAiTiA0wrAyNyc0NC44IkU!5e0!3m2!1snl!2sbe!4v1000000000000"
              width="100%"
              height="300"
              style="
                border: 0;
                filter: grayscale(0.6) brightness(0.7) contrast(1.2);
              "
              allowfullscreen
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              title="Vleeswaren Vermeir locatie"
            />
          </div>
        </div>

        <!-- Right: contact form -->
        <div
          class="bg-(--color-surface) border border-(--color-border) rounded-xl p-8"
        >
          <p
            class="uppercase tracking-[0.3em] text-[0.75rem] text-(--color-accent) font-semibold mb-2"
          >
            — Stuur ons een bericht —
          </p>
          <h2
            class="font-['Playfair_Display',Georgia,serif] text-[2rem] font-bold text-(--color-text-strong) mb-8 leading-[1.1]"
          >
            Wij antwoorden<br />
            <span
              class="font-['Dancing_Script',cursive] text-[#b8252a] font-normal text-[1.1em]"
              >zo snel mogelijk</span
            >
          </h2>

          <form class="flex flex-col gap-5" @submit.prevent="submitForm">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-xs font-semibold uppercase tracking-[0.15em] text-(--color-accent) mb-2"
                  >Naam</label
                >
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="Uw naam"
                  required
                  class="w-full px-4 py-3 bg-(--color-bg) border border-(--color-border) rounded-lg text-(--color-text) placeholder-(--color-text-muted)/60 text-sm focus:outline-none focus:border-[#c89868] transition-colors"
                />
              </div>
              <div>
                <label
                  class="block text-xs font-semibold uppercase tracking-[0.15em] text-(--color-accent) mb-2"
                  >Bedrijf</label
                >
                <input
                  v-model="form.company"
                  type="text"
                  placeholder="Bedrijfsnaam (optioneel)"
                  class="w-full px-4 py-3 bg-(--color-bg) border border-(--color-border) rounded-lg text-(--color-text) placeholder-(--color-text-muted)/60 text-sm focus:outline-none focus:border-[#c89868] transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                class="block text-xs font-semibold uppercase tracking-[0.15em] text-(--color-accent) mb-2"
                >E-mailadres</label
              >
              <input
                v-model="form.email"
                type="email"
                placeholder="uw@email.be"
                required
                class="w-full px-4 py-3 bg-(--color-bg) border border-(--color-border) text-(--color-text) placeholder-(--color-text-muted)/60 text-sm focus:outline-none focus:border-[#c89868] transition-colors"
              />
            </div>

            <div>
              <label
                class="block text-xs font-semibold uppercase tracking-[0.15em] text-(--color-accent) mb-2"
                >Telefoonnummer</label
              >
              <input
                v-model="form.phone"
                type="tel"
                placeholder="0495 123 456"
                class="w-full px-4 py-3 bg-(--color-bg) border border-(--color-border) text-(--color-text) placeholder-(--color-text-muted)/60 text-sm focus:outline-none focus:border-[#c89868] transition-colors"
              />
            </div>

            <div>
              <label
                class="block text-xs font-semibold uppercase tracking-[0.15em] text-(--color-accent) mb-2"
                >Bericht</label
              >
              <textarea
                v-model="form.message"
                rows="5"
                placeholder="Uw vraag of opmerking…"
                required
                class="w-full px-4 py-3 bg-(--color-bg) border border-(--color-border) text-(--color-text) placeholder-(--color-text-muted)/60 text-sm focus:outline-none focus:border-[#c89868] transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              class="w-full py-4 rounded-lg bg-[#c89868] text-[#1a0a0a] font-semibold uppercase tracking-[0.15em] text-sm hover:bg-[#d8a878] hover:-translate-y-0.5 transition-all duration-200"
            >
              Verstuur bericht
            </button>

            <p
              v-if="submitted"
              class="text-center text-sm font-medium text-(--color-accent)"
            >
              ✓ Bedankt! We nemen zo snel mogelijk contact op.
            </p>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h } from "vue";

definePageMeta({ layout: "main" });

useSeoMeta({
  title: "Contact — Vleeswaren Vermeir",
  description:
    "Contacteer Vleeswaren Vermeir in Zemst. Tel: 015/61 15 39 · vleeswarenvermeir@telenet.be",
});

function svgIcon(d: string | string[]) {
  const paths = Array.isArray(d) ? d : [d];
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
        paths.map((p) =>
          h("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            d: p,
          }),
        ),
      ),
  });
}

const contactInfo = [
  {
    icon: svgIcon([
      "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
      "M15 11a3 3 0 11-6 0 3 3 0 016 0z",
    ]),
    label: "Adres",
    value: "Schoolstraat 51",
    sub: "1980 Zemst, België",
  },
  {
    icon: svgIcon(
      "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
    ),
    label: "Telefoon",
    value: "015 / 61 15 39",
  },
  {
    icon: svgIcon(
      "M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3",
    ),
    label: "GSM",
    value: "0475 97 13 70",
    sub: undefined,
  },
  {
    icon: svgIcon(
      "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    ),
    label: "E-mail",
    value: "vleeswarenvermeir@telenet.be",
    sub: undefined,
  },
];

const form = reactive({
  name: "",
  company: "",
  email: "",
  phone: "",
  message: "",
});
const submitted = ref(false);

function submitForm() {
  submitted.value = true;
  setTimeout(() => {
    submitted.value = false;
  }, 5000);
}
</script>
