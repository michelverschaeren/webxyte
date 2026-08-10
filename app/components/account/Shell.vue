<template>
  <div class="min-h-screen bg-(--color-bg) text-(--color-text)">
    <!-- Page header -->
    <div
      class="relative overflow-hidden px-4 py-14 sm:py-20"
      style="
        background: radial-gradient(
          ellipse at 50% 40%,
          var(--gradient-banner-1) 0%,
          var(--gradient-banner-2) 45%,
          var(--gradient-banner-3) 100%
        );
      "
    >
      <div class="relative z-1 mx-auto max-w-300 pt-12 text-center">
        <p
          class="mb-2 text-[0.7rem] font-semibold tracking-[0.3em] text-[#c89868] uppercase"
        >
          — Klantenzone —
        </p>
        <h1
          class="mb-3 font-['Playfair_Display',Georgia,serif] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] font-black text-white"
        >
          {{ title }}
        </h1>
        <p v-if="subtitle" class="mx-auto max-w-xl text-white/70">
          {{ subtitle }}
        </p>
      </div>
    </div>

    <!-- Sticky section nav -->
    <nav
      class="sticky top-0 z-50 border-b border-(--color-border) bg-(--color-bg)/95 backdrop-blur-md"
      aria-label="Klantenzone"
    >
      <div
        class="mx-auto flex max-w-300 gap-1 overflow-x-auto px-2 sm:px-6 lg:px-8"
      >
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="acc-tab"
          :class="{ 'acc-tab--active': isActive(link.to) }"
        >
          {{ link.label }}
        </NuxtLink>
        <button type="button" class="acc-tab acc-tab--logout" @click="onLogout()">
          Afmelden
        </button>
      </div>
    </nav>

    <div class="mx-auto max-w-300 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>();

const route = useRoute();
const auth = useAuth();

const links = [
  { to: "/account", label: "Overzicht" },
  { to: "/account/bestellingen", label: "Bestellingen" },
  { to: "/account/lijsten", label: "Mijn lijsten" },
  { to: "/account/gegevens", label: "Gegevens" },
];

function isActive(path: string) {
  if (path === "/account") return route.path === "/account";
  return route.path.startsWith(path);
}

async function onLogout() {
  await auth.logout();
}
</script>

<style scoped>
.acc-tab {
  flex-shrink: 0;
  padding: 0.9rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-text-muted);
  text-decoration: none;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: color 0.2s;
  cursor: pointer;
  background: none;
}
.acc-tab:hover {
  color: var(--color-text-strong);
}
.acc-tab--active {
  color: var(--color-text-strong);
  border-bottom-color: #c89868;
}
.acc-tab--logout {
  margin-left: auto;
  color: var(--color-text-muted);
}
.acc-tab--logout:hover {
  color: #b8252a;
}
</style>
