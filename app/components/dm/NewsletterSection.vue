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
        Plaats uw bestelling via mail, telefoon of online — wij zorgen voor de
        rest.
      </p>
    </div>
  </section>
</template>
