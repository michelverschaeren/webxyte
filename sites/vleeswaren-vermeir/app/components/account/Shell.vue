<template>
  <div class="min-h-screen bg-(--color-bg) text-(--color-text)">
    <!-- Page header -->
    <div
      class="relative overflow-hidden px-4 pt-14 pb-8 sm:py-20"
      style="background: radial-gradient(ellipse at 50% 40%, var(--gradient-banner-1) 0%, var(--gradient-banner-2) 45%, var(--gradient-banner-3) 100%)"
    >
      <div class="relative z-1 mx-auto max-w-300 pt-12 text-center">
        <p
          class="mb-2 text-[0.8rem] font-semibold tracking-[0.3em] text-(--color-accent) uppercase"
        >
          — Klantenzone —
        </p>
        <h1
          class="mb-3 font-['Playfair_Display',Georgia,serif] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] font-black text-white"
        >
          {{ title }}
        </h1>
        <p v-if="subtitle" class="mx-auto max-w-xl text-white/90">
          {{ subtitle }}
        </p>
      </div>
    </div>

    <!-- Sticky section nav -->
    <nav
      class="sticky top-0 z-50 border-b border-(--color-border) bg-(--color-bg)/95 backdrop-blur-md"
      aria-label="Klantenzone"
    >
      <div class="mx-auto flex max-w-300 items-center px-2 sm:px-6 lg:px-8">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="acc-tab"
          :class="{ 'acc-tab--active': isActive(link.to) }"
        >
          {{ link.label }}
        </NuxtLink>
        <div class="ml-auto flex items-center">
          <NuxtLink
            v-if="auth.isAdmin.value"
            to="/admin"
            class="acc-tab acc-tab--muted"
            aria-label="Adminzone"
            title="Adminzone"
          >
            <svg class="acc-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286z" />
            </svg>
            <span class="acc-tab-label">Adminzone</span>
          </NuxtLink>
          <button
            type="button"
            class="acc-tab acc-tab--logout"
            aria-label="Afmelden"
            title="Afmelden"
            @click="onLogout()"
          >
            <svg class="acc-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3H9m12 0l-3-3m3 3l-3 3" />
            </svg>
            <span class="acc-tab-label">Afmelden</span>
          </button>
        </div>
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
  { to: "/account/lijsten", label: "Lijsten" },
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
  flex: 1 1 auto;
  min-width: 0;
  padding: 0.75rem 0.2rem;
  font-size: 0.7rem;
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
.acc-tab:hover {
  color: var(--color-text-strong);
}
.acc-tab--active {
  color: var(--color-text-strong);
  border-bottom-color: #c89868;
}
.acc-tab--muted {
  flex: 0 0 auto;
  padding-inline: 0.4rem;
  opacity: 0.85;
}
.acc-tab--logout {
  flex: 0 0 auto;
  padding-inline: 0.4rem;
  color: var(--color-text-muted);
}
.acc-tab--logout:hover {
  color: #b8252a;
}
.acc-tab-icon {
  width: 18px;
  height: 18px;
}
.acc-tab-label {
  display: none;
}

@media (min-width: 640px) {
  .acc-tab {
    flex: 0 0 auto;
    padding: 0.9rem 1rem;
    font-size: 0.85rem;
    letter-spacing: 0.12em;
  }
  .acc-tab-icon {
    display: none;
  }
  .acc-tab-label {
    display: inline;
  }
}
</style>
