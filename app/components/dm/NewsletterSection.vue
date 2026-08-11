<template>
  <section
    class="relative overflow-hidden py-20 text-center"
    style="
      background: linear-gradient(
        135deg,
        var(--gradient-banner-3) 0%,
        var(--gradient-banner-2) 40%,
        var(--gradient-banner-1) 100%
      );
    "
  >
    <div
      class="pointer-events-none absolute inset-0"
      style="
        background: radial-gradient(
          ellipse at 50% 50%,
          rgba(200, 152, 104, 0.08),
          transparent 70%
        );
      "
    />
    <div class="relative z-1 mx-auto max-w-300 px-6">
      <h2
        class="m-0 mb-4 font-['Playfair_Display',Georgia,serif] text-[clamp(1.6rem,3vw,2.4rem)] leading-[1.2] font-bold text-white"
      >
        Wij staan u
        <span
          class="font-['Dancing_Script',cursive] text-[1.1em] text-(--color-accent)"
          >heel de dag graag te woord</span
        >
      </h2>
      <p
        class="mx-auto -mt-1 mb-8 max-w-130 text-[0.95rem] leading-normal text-white/80"
      >
        Plaats uw bestelling via mail, telefoon, fax of online — wij zorgen voor
        de rest.
      </p>
      <form
        class="mx-auto flex max-w-125 flex-col items-center rounded-2xl border border-white/15 bg-black/30 p-1.5 sm:flex-row sm:rounded-full"
        @submit.prevent
      >
        <span class="px-4 text-[1.5rem] text-(--color-accent)">✉</span>
        <input
          type="email"
          placeholder="Uw e-mailadres"
          class="w-full flex-1 border-none bg-transparent px-3 py-3 text-[0.95rem] text-white placeholder-white/50 outline-none"
        >
        <button
          type="submit"
          class="w-full cursor-pointer rounded-xl border-none bg-[#c89868] px-6 py-3 text-[0.85rem] font-semibold tracking-widest text-[#1a0a0a] uppercase transition-colors duration-200 hover:bg-[#d8a878] sm:w-auto sm:rounded-full"
        >
          + Houd mij op de hoogte
        </button>
      </form>
    </div>
  </section>
</template>
