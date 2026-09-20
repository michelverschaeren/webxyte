<template>
  <div class="min-h-screen bg-(--color-bg) text-(--color-text)">
    <!-- Page header -->
    <div
      class="relative overflow-hidden px-4 pt-14 pb-8 sm:py-20"
      style="background: radial-gradient(ellipse at 50% 40%, #7a1a1a 0%, #4a0e0e 45%, #1a0808 100%)"
    >
      <div class="relative z-1 mx-auto max-w-300 pt-12 text-center">
        <p
          class="mb-2 text-[0.7rem] font-semibold tracking-[0.3em] text-(--color-accent) uppercase"
        >
          — Beheer —
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
      aria-label="Beheer"
    >
      <div class="mx-auto flex max-w-300 items-center px-2 sm:px-6 lg:px-8">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="adm-tab"
          :class="{ 'adm-tab--active': isActive(link.to) }"
        >
          {{ link.label }}
        </NuxtLink>
        <NuxtLink
          to="/account"
          class="adm-tab adm-tab--muted"
          aria-label="Klantenzone"
          title="Klantenzone"
        >
          <svg class="adm-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 9.75h12.974c.576 0 1.059.435 1.119 1.007z" />
          </svg>
          <span class="adm-tab-label">Klantenzone</span>
        </NuxtLink>
        <button
          type="button"
          class="adm-tab adm-tab--logout"
          aria-label="Afmelden"
          title="Afmelden"
          @click="onLogout()"
        >
          <svg class="adm-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3H9m12 0l-3-3m3 3l-3 3" />
          </svg>
          <span class="adm-tab-label">Afmelden</span>
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
  { to: "/admin", label: "Overzicht" },
  { to: "/admin/bestellingen", label: "Bestellingen" },
  { to: "/admin/producten", label: "Producten" },
  { to: "/admin/klanten", label: "Klanten" },
];

function isActive(path: string) {
  if (path === "/admin") return route.path === "/admin";
  return route.path.startsWith(path);
}

async function onLogout() {
  await auth.logout();
}
</script>

<style scoped>
.adm-tab {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 0.2rem;
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0;
  color: var(--color-text-muted);
  text-decoration: none;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  text-align: center;
  transition: color 0.2s;
  cursor: pointer;
  background: none;
}
.adm-tab:hover {
  color: var(--color-text-strong);
}
.adm-tab--active {
  color: var(--color-text-strong);
  border-bottom-color: #b8252a;
}
.adm-tab--muted {
  flex: 0 0 auto;
  margin-left: auto;
  padding-inline: 0.4rem;
  opacity: 0.7;
}
.adm-tab--logout {
  flex: 0 0 auto;
  padding-inline: 0.4rem;
  color: var(--color-text-muted);
}
.adm-tab--logout:hover {
  color: #b8252a;
}
.adm-tab-icon {
  width: 18px;
  height: 18px;
}
.adm-tab-label {
  display: none;
}

@media (min-width: 640px) {
  .adm-tab {
    flex: 0 0 auto;
    padding: 0.9rem 1rem;
    font-size: 0.75rem;
    letter-spacing: 0.12em;
  }
  .adm-tab-icon {
    display: none;
  }
  .adm-tab-label {
    display: inline;
  }
}
</style>
