<template>
  <div class="adm-shell">
    <transition name="adm-fade">
      <div v-if="drawerOpen" class="adm-backdrop" @click="drawerOpen = false" />
    </transition>

    <aside class="adm-sidebar" :class="{ 'adm-sidebar--open': drawerOpen }" aria-label="Beheer">
      <div class="adm-sidebar-head">
        <NuxtLink to="/admin" class="adm-brand">
          <img
            src="/images/logo-dark.png"
            alt="Vleeswaren Vermeir logo"
            class="adm-brand-logo only-dark"
          >
          <img
            src="/images/logo-light.png"
            alt="Vleeswaren Vermeir logo"
            class="adm-brand-logo only-light"
          >
          <span class="adm-brand-stack">
            <span class="adm-brand-name">Vleeswaren</span>
            <span class="adm-brand-accent">Beheer</span>
          </span>
        </NuxtLink>
        <button
          type="button"
          class="adm-icon-btn adm-close"
          aria-label="Menu sluiten"
          @click="drawerOpen = false"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav class="adm-nav">
        <NuxtLink
          v-for="link in adminNavLinks"
          :key="link.to"
          :to="link.to"
          class="adm-link"
          :class="{ 'adm-link--active': isActive(link.to) }"
          :aria-current="isActive(link.to) ? 'page' : undefined"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" :d="link.icon" />
          </svg>
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="adm-sidebar-foot">
        <NuxtLink to="/" class="adm-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18" />
          </svg>
          Naar website
        </NuxtLink>
        <NuxtLink to="/account" class="adm-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 9.75h12.974c.576 0 1.059.435 1.119 1.007z" />
          </svg>
          Klantenzone
        </NuxtLink>
        <button type="button" class="adm-link adm-link--logout" @click="onLogout()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3H9m12 0l-3-3m3 3l-3 3" />
          </svg>
          Afmelden
        </button>
        <p v-if="auth.user.value?.email" class="adm-user" :title="auth.user.value.email">
          {{ auth.user.value.email }}
        </p>
      </div>
    </aside>

    <main class="adm-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const auth = useAuth();
const drawerOpen = useAdminDrawer();
const { load: loadWide } = useAdminWide();

function isActive(path: string) {
  if (path === "/admin") return route.path === "/admin";
  return route.path.startsWith(path);
}

async function onLogout() {
  await auth.logout();
}

// Lade sluiten bij navigatie of Escape.
watch(() => route.fullPath, () => {
  drawerOpen.value = false;
});

onMounted(() => {
  loadWide();
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") drawerOpen.value = false;
  };
  document.addEventListener("keydown", onKey);
  onUnmounted(() => document.removeEventListener("keydown", onKey));
});
</script>

<style scoped>
.adm-shell {
  --adm-sidebar-w: 248px;
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-text);
}

/* ── Merk ────────────────────────────────────────────────────────── */
.adm-brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  text-decoration: none;
}
.adm-brand-logo {
  width: 36px;
  height: 36px;
  border-radius: 0.5rem;
  object-fit: contain;
  flex-shrink: 0;
}
.adm-brand-name {
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-text-strong);
}
.adm-brand-stack {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}
.adm-brand-accent {
  font-family: "Dancing Script", cursive;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-accent);
  margin-top: -2px;
}

/* ── Zijbalk ─────────────────────────────────────────────────────── */
.adm-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 80;
  width: var(--adm-sidebar-w);
  max-width: 85vw;
  display: flex;
  flex-direction: column;
  background: var(--color-surface-strong);
  border-right: 1px solid var(--color-border);
  transform: translateX(-100%);
  transition: transform 0.25s ease;
}
.adm-sidebar--open {
  transform: translateX(0);
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.4);
}
.adm-sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 1rem 1rem 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
}
.adm-nav {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 1rem 0.75rem;
}
.adm-sidebar-foot {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.adm-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.6rem 0.75rem;
  font-size: 0.92rem;
  font-weight: 500;
  text-align: left;
  color: var(--color-text-muted);
  text-decoration: none;
  background: transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}
.adm-link svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}
.adm-link:hover {
  background: var(--color-hover);
  color: var(--color-text-strong);
}
.adm-link--active {
  background: rgba(184, 37, 42, 0.12);
  color: var(--color-text-strong);
  font-weight: 600;
}
.adm-link--active svg {
  color: #b8252a;
}
.adm-link--logout:hover {
  color: #b8252a;
}
.adm-user {
  margin-top: 0.5rem;
  padding: 0 0.75rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.adm-icon-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-text);
  background: transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
}
.adm-icon-btn:hover {
  background: rgba(184, 37, 42, 0.15);
  color: var(--color-text-strong);
}
.adm-icon-btn svg {
  width: 20px;
  height: 20px;
}

.adm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 70;
  background: rgba(0, 0, 0, 0.5);
}
.adm-fade-enter-active,
.adm-fade-leave-active {
  transition: opacity 0.2s ease;
}
.adm-fade-enter-from,
.adm-fade-leave-to {
  opacity: 0;
}

/* ── Desktop: vaste zijbalk, geen topbalk of lade ───────────────── */
@media (min-width: 1024px) {
  .adm-backdrop,
  .adm-close {
    display: none;
  }
  .adm-sidebar {
    transform: none;
    box-shadow: none;
  }
  .adm-main {
    padding-left: var(--adm-sidebar-w);
  }
}
</style>
