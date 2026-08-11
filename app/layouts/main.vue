<template>
  <div class="dm-shell">
    <!-- ══════════════ FIXED HEADER WRAP ══════════════ -->
    <div class="dm-fixed-wrap" :class="{ 'dm-fixed-wrap--scrolled': scrolled }">
      <!-- TOP BAR -->
      <div class="dm-topbar">
        <div class="dm-topbar-inner">
          <div class="dm-topbar-left">
            <a href="tel:015611539" class="dm-topbar-link">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path
                  d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"
                />
              </svg>
              015 / 61 15 39
            </a>
            <a
              href="mailto:vleeswarenvermeir@telenet.be"
              class="dm-topbar-link"
            >
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path
                  d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"
                />
                <path
                  d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"
                />
              </svg>
              vleeswarenvermeir@telenet.be
            </a>
          </div>
          <div class="dm-topbar-right">
            <span class="dm-topbar-link">Schoolstraat 51, 1980 Zemst</span>
          </div>
        </div>
      </div>

      <!-- ══════════════ MAIN NAVBAR ══════════════ -->
      <header class="dm-header">
        <div class="dm-nav-inner">
          <!-- Logo -->
          <NuxtLink to="/" class="dm-logo">
            <img
              :src="
                theme === 'dark'
                  ? '/images/logo-dark.png'
                  : '/images/logo-light.png'
              "
              alt="Vleeswaren Vermeir logo"
              class="dm-logo-badge"
            >
            <div class="dm-logo-text">
              <span class="dm-logo-name">Vleeswaren</span>
              <span class="dm-logo-accent">Vermeir</span>
            </div>
          </NuxtLink>

          <!-- Desktop nav -->
          <nav class="dm-nav">
            <NuxtLink
              v-for="link in links"
              :key="link.to"
              :to="link.to"
              class="dm-nav-link"
              :class="{ 'dm-nav-link--active': isActive(link.to) }"
            >
              {{ link.label }}
            </NuxtLink>
          </nav>

          <!-- Right actions -->
          <div class="dm-nav-actions">
            <!-- Thema -->
            <button
              class="dm-icon-btn"
              :aria-label="theme === 'dark' ? 'Licht thema' : 'Donker thema'"
              :title="theme === 'dark' ? 'Licht thema' : 'Donker thema'"
              @click="toggleTheme()"
            >
              <svg
                v-if="theme === 'dark'"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                />
              </svg>
              <svg
                v-else
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                />
              </svg>
            </button>

            <!-- Login / account -->
            <button
              class="dm-icon-btn"
              :aria-label="auth.isLoggedIn.value ? 'Mijn account' : 'Inloggen'"
              :title="auth.isLoggedIn.value ? 'Mijn account' : 'Inloggen'"
              @click="onAccountClick()"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
              <span v-if="auth.isLoggedIn.value" class="dm-account-dot" />
            </button>

            <!-- Cart -->
            <NuxtLink
              to="/winkelmandje"
              class="dm-icon-btn"
              aria-label="Winkelwagen"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span v-if="cart.totalItems.value > 0" class="dm-cart-badge">
                {{ cart.totalItems.value > 99 ? "99+" : cart.totalItems.value }}
              </span>
            </NuxtLink>

            <!-- Mobile hamburger -->
            <button
              class="dm-icon-btn dm-hamburger"
              aria-label="Menu"
              @click="mobileOpen = !mobileOpen"
            >
              <svg
                v-if="!mobileOpen"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                v-else
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile menu -->
        <transition name="dm-slide">
          <div v-if="mobileOpen" class="dm-mobile-menu">
            <NuxtLink
              v-for="link in links"
              :key="link.to"
              :to="link.to"
              class="dm-mobile-link"
              :class="{ 'dm-mobile-link--active': isActive(link.to) }"
              @click="mobileOpen = false"
            >
              {{ link.label }}
            </NuxtLink>
          </div>
        </transition>
      </header>
    </div>
    <!-- end dm-fixed-wrap -->

    <!-- Page content -->
    <main>
      <slot />
    </main>

    <TheFooter />
    <CartDrawer />
    <SavedListsPanel />
    <AuthModal />
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const cart = useCart();
const auth = useAuth();
const authModal = useAuthModal();
const { theme, toggle: toggleTheme } = useTheme();
const mobileOpen = ref(false);
const scrolled = ref(false);

const links = [
  { to: "/", label: "Home" },
  { to: "/producten", label: "Producten & Bestellen" },
  { to: "/contact", label: "Contact" },
];

// Haalt het mandje van een reeds ingelogde klant op (bv. na een refresh),
// zonder dat elke pagina dit zelf moet aanroepen.
if (import.meta.client) cart.ensureLoaded();

function onAccountClick() {
  if (auth.isLoggedIn.value) navigateTo("/account");
  else authModal.open("login");
}

function isActive(path: string) {
  if (path === "/") return route.path === "/";
  return route.path.startsWith(path);
}

onMounted(() => {
  const onScroll = () => {
    scrolled.value = window.scrollY > 40;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onUnmounted(() => window.removeEventListener("scroll", onScroll));
});
</script>

<style scoped>
.dm-shell {
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-text);
}

/* ── Fixed header wrapper ───────────────────────────────────────── */
.dm-fixed-wrap {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: color-mix(in srgb, var(--color-surface-strong) 92%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition:
    background 0.4s ease,
    box-shadow 0.4s ease;
}
.dm-fixed-wrap--scrolled {
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
}

/* ── Top bar ─────────────────────────────────────────────────────── */
.dm-topbar {
  border-bottom: 1px solid var(--color-border);
  max-height: 38px;
  opacity: 1;
  overflow: hidden;
  transition:
    max-height 0.35s ease,
    opacity 0.25s ease;
}
.dm-fixed-wrap--scrolled .dm-topbar {
  max-height: 0;
  opacity: 0;
}
.dm-topbar-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 38px;
  gap: 1rem;
}
.dm-topbar-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.dm-topbar-right {
  display: flex;
  align-items: center;
}
.dm-topbar-link {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-decoration: none;
  letter-spacing: 0.03em;
  transition: color 0.2s;
}
.dm-topbar-link:hover {
  color: var(--color-accent);
}
.dm-topbar-link svg {
  width: 12px;
  height: 12px;
  opacity: 0.7;
  flex-shrink: 0;
}

/* ── Main header ─────────────────────────────────────────────────── */
.dm-header {
  border-bottom: 1px solid transparent;
  transition: border-color 0.4s ease;
}
.dm-fixed-wrap--scrolled .dm-header {
  border-bottom-color: rgba(184, 37, 42, 0.25);
}

.dm-nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

/* Logo */
.dm-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  flex-shrink: 0;
}
.dm-logo-badge {
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
  object-fit: contain;
}
.dm-logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}
.dm-logo-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text-strong);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.dm-logo-accent {
  font-family: "Dancing Script", cursive;
  font-size: 1.15rem;
  color: var(--color-accent);
  font-weight: 600;
  margin-top: -2px;
}

/* Nav links */
.dm-nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
  justify-content: center;
}
.dm-nav-link {
  position: relative;
  padding: 0.5rem 1.1rem;
  font-size: 0.82rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-text);
  text-decoration: none;
  transition: color 0.2s;
}
.dm-nav-link::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 1.1rem;
  right: 1.1rem;
  height: 2px;
  background: #b8252a;
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.3s ease;
}
.dm-nav-link:hover {
  color: var(--color-text-strong);
}
.dm-nav-link:hover::after {
  transform: scaleX(1);
}
.dm-nav-link--active {
  color: var(--color-text-strong);
}
.dm-nav-link--active::after {
  transform: scaleX(1);
  background: #c89868;
}

/* Right actions */
.dm-nav-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
.dm-icon-btn {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--color-text);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}
.dm-icon-btn svg {
  width: 18px;
  height: 18px;
}
.dm-icon-btn:hover {
  background: rgba(184, 37, 42, 0.15);
  border-color: #b8252a;
  color: var(--color-text-strong);
}
.dm-cart-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  background: #b8252a;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}
.dm-account-dot {
  position: absolute;
  top: 7px;
  right: 7px;
  width: 7px;
  height: 7px;
  background: #c89868;
  border-radius: 50%;
}
.dm-hamburger {
  display: none;
}

/* Mobile menu */
.dm-mobile-menu {
  border-top: 1px solid var(--color-border);
  padding: 0.75rem 1.5rem 1rem;
  background: color-mix(in srgb, var(--color-surface-strong) 98%, transparent);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.dm-mobile-link {
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-text-muted);
  text-decoration: none;
  border-left: 2px solid transparent;
  transition: all 0.2s;
}
.dm-mobile-link:hover,
.dm-mobile-link--active {
  color: var(--color-text-strong);
  border-left-color: #b8252a;
  padding-left: 1.5rem;
}

/* Transition */
.dm-slide-enter-active,
.dm-slide-leave-active {
  transition: all 0.22s ease;
}
.dm-slide-enter-from,
.dm-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Responsive */
@media (max-width: 768px) {
  .dm-hamburger {
    display: flex;
  }
  .dm-nav {
    display: none;
  }
  .dm-topbar-right {
    display: none;
  }
  .dm-topbar-left {
    gap: 0.75rem;
  }
  .dm-topbar-link span {
    display: none;
  }

  /* Iconenrij is te breed op smalle schermen — logo/knoppen verkleinen en
     de (nog niet-functionele) verlanglijst-knop hier weglaten. */
  .dm-nav-inner {
    gap: 0.75rem;
  }
  .dm-logo-badge {
    width: 34px;
    height: 34px;
  }
  .dm-logo-name {
    font-size: 0.8rem;
  }
  .dm-logo-accent {
    font-size: 1rem;
  }
  .dm-wishlist-btn {
    display: none;
  }
  .dm-nav-actions {
    gap: 0.125rem;
  }
  .dm-icon-btn {
    width: 34px;
    height: 34px;
  }
  .dm-icon-btn svg {
    width: 17px;
    height: 17px;
  }
}

@media (max-width: 360px) {
  .dm-logo-text {
    display: none;
  }
}
</style>
