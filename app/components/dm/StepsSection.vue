<template>
  <section class="bg-[var(--color-bg)] py-24">
    <div class="mx-auto max-w-300 px-6">
      <div class="mb-12 text-center">
        <p
          class="mb-4 text-[0.75rem] font-semibold tracking-[0.3em] text-(--color-accent) uppercase"
        >
          — Onze service —
        </p>
        <h2
          class="mb-4 font-['Playfair_Display',Georgia,serif] text-[clamp(2rem,4vw,3.25rem)] leading-[1.1] font-bold text-[var(--color-text-strong)]"
        >
          <span class="block">Van bestelling</span>
          <span
            class="mt-2 block font-['Dancing_Script',cursive] text-[1.1em] font-normal text-[#b8252a]"
            >tot nalevering</span
          >
        </h2>
      </div>

      <div
        class="steps-row relative grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div
          v-for="post in posts"
          :key="post.title"
          class="group relative z-1 text-center"
        >
          <div
            class="relative z-2 mx-auto mb-8 flex h-18 w-18 items-center justify-center rounded-full bg-[#b8252a] font-['Playfair_Display',serif] text-[1.75rem] font-black text-white shadow-[0_0_0_4px_var(--color-bg),0_0_0_6px_rgba(184,37,42,0.4)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_0_4px_var(--color-bg),0_0_0_6px_#b8252a,0_10px_30px_rgba(184,37,42,0.4)]"
          >
            {{ post.day }}
          </div>
          <div
            class="relative mb-7 aspect-[4/3] overflow-hidden border-t-3 border-t-transparent transition-colors duration-300 group-hover:border-t-[#c89868]"
          >
            <img
              :src="post.image"
              :alt="post.title"
              class="h-full w-full object-cover brightness-[.8] saturate-[.8] transition-all duration-500 group-hover:scale-105 group-hover:brightness-100 group-hover:saturate-[1.1]"
            />
            <div
              class="absolute inset-0"
              style="
                background: linear-gradient(
                  to top,
                  rgba(15, 13, 13, 0.7) 0%,
                  transparent 50%
                );
              "
            ></div>
          </div>
          <div class="px-2 text-left">
            <span
              class="mb-3 inline-block text-[0.7rem] font-semibold tracking-[0.22em] text-(--color-accent) uppercase"
              >{{ post.category }}</span
            >
            <h3
              class="m-0 mb-3 font-['Playfair_Display',serif] text-[1.2rem] leading-[1.25] text-[var(--color-text-strong)]"
            >
              {{ post.title }}
            </h3>
            <p
              class="m-0 mb-4 text-[0.88rem] leading-[1.65] text-[var(--color-text-muted)]"
            >
              {{ post.excerpt }}
            </p>
            <div class="flex flex-wrap gap-3">
              <span
                v-for="tag in [post.comments, post.views]"
                :key="tag"
                class="rounded-xs border border-[#c89868]/25 px-2.5 py-0.5 text-[0.75rem] tracking-widest text-(--color-accent) uppercase"
                >✓ {{ tag }}</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const posts = [
  {
    title: "Bestelling",
    category: "Stap 01",
    day: "01",
    excerpt:
      "Bij Vleeswaren Vermeir hechten wij veel belang aan flexibiliteit naar u als klant toe. U kan met uw bestelling altijd bij ons terecht voor een levering de dag nadien. Dit kan via mail, fax, telefoon of online.",
    comments: "Flexibel",
    views: "Online",
    image:
      "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=700&q=80",
  },
  {
    title: "Verwerken",
    category: "Stap 02",
    day: "02",
    excerpt:
      "Heeft u reeds een bestelling geplaatst voor de huidige dag, dan kan u voor 8u nog producten toevoegen. Het wordt aangeraden dit per telefoon te melden zodat wij uw bestelling naar uw behoeven kunnen afleveren.",
    comments: "Voor 8u",
    views: "Op maat",
    image:
      "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=700&q=80",
  },
  {
    title: "Levering",
    category: "Stap 03",
    day: "03",
    excerpt:
      "Uw bestelling wordt afgeleverd door één van onze eigen in-huis chauffeurs. Bij problemen staan zij u bij in het zoeken naar een oplossing op maat van uw probleem.",
    comments: "In-huis",
    views: "Persoonlijk",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80",
  },
  {
    title: "Nalevering",
    category: "Stap 04",
    day: "04",
    excerpt:
      "Is uw bestelling niet volledig of ontbreken er artikels? Wij zorgen ervoor dat de ontbrekende artikels dezelfde week worden nageleverd om u als klant een zo goed mogelijke service te bieden.",
    comments: "Dezelfde week",
    views: "Volledig",
    image:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=700&q=80",
  },
];
</script>

<style scoped>
.steps-row::before {
  content: "";
  position: absolute;
  top: 3.5rem;
  left: calc(100% / 8);
  right: calc(100% / 8);
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    #c89868,
    #c89868,
    transparent
  );
  opacity: 0.3;
  z-index: 0;
  display: none;
}

@media (min-width: 1024px) {
  .steps-row::before {
    display: block;
  }
}
</style>
