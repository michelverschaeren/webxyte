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
            <!-- Beide varianten renderen en via CSS schakelen: de server kent
                 het thema niet meer, dus `theme` is hier tijdens SSR altijd
                 "dark" en een `:src` zou flitsen. -->
            <img
              src="/images/logo-dark.png"
              alt="Vleeswaren Vermeir logo"
              class="dm-logo-badge only-dark"
            >
            <img
              src="/images/logo-light.png"
              alt="Vleeswaren Vermeir logo"
              class="dm-logo-badge only-light"
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
            <!-- Label bewust thema-onafhankelijk: een `:aria-label` zou tijdens
                 SSR altijd van "dark" uitgaan en pas bij hydratie kloppen. -->
            <button
              class="dm-icon-btn"
              aria-label="Thema wisselen"
              title="Thema wisselen"
              @click="toggleTheme()"
            >
              <svg
                class="only-dark"
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
                class="only-light"
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

            <!-- Login / klantenzone -->
            <button
              v-if="!auth.isLoggedIn.value"
              type="button"
              class="dm-account-btn"
              aria-label="Login klantenzone"
              @click="authModal.open()"
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
              <span class="dm-account-label">Login klantenzone</span>
            </button>
            <div v-else ref="accountMenuRef" class="dm-account-split">
              <NuxtLink
                :to="auth.isAdmin.value ? '/admin' : '/account'"
                class="dm-account-btn dm-account-btn--main"
                :aria-label="zoneLabel"
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
                <span class="dm-account-label">{{ zoneLabel }}</span>
              </NuxtLink>
              <button
                type="button"
                class="dm-account-btn dm-account-btn--toggle"
                :aria-label="`${zoneLabel}-menu`"
                aria-haspopup="menu"
                :aria-expanded="accountMenuOpen"
                @click="accountMenuOpen = !accountMenuOpen"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  :class="{ 'dm-chevron--open': accountMenuOpen }"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>
              <transition name="dm-slide">
                <div
                  v-if="accountMenuOpen"
                  class="dm-account-menu"
                  role="menu"
                >
                  <NuxtLink
                    to="/account/bestellingen"
                    class="dm-account-menu-item"
                    role="menuitem"
                    @click="accountMenuOpen = false"
                  >
                    Mijn vorige bestellingen
                  </NuxtLink>
                  <NuxtLink
                    to="/account/gegevens"
                    class="dm-account-menu-item"
                    role="menuitem"
                    @click="accountMenuOpen = false"
                  >
                    Mijn gegevens
                  </NuxtLink>
                  <button
                    type="button"
                    class="dm-account-menu-item"
                    role="menuitem"
                    @click="onLogout()"
                  >
                    Afmelden
                  </button>
                </div>
              </transition>
            </div>

            <!-- Cart: geen eigen pagina meer — springt naar het (uitgeklapte)
                 mandje-filter op de productenpagina. Enkel voor ingelogde
                 klanten: gasten kunnen niet bestellen. -->
            <button
              v-if="auth.isLoggedIn.value"
              type="button"
              class="dm-icon-btn"
              aria-label="Winkelwagen"
              @click="goToCart()"
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
            </button>

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
    <SavedListsPanel />
    <AuthModal />
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const cart = useCart();
const auth = useAuth();
const authModal = useAuthModal();
// Enkel de toggle: het thema zelf schakelt via CSS op `[data-theme]`.
const { toggle: toggleTheme } = useTheme();
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

// Klantenzone-submenu: sluit bij klik buiten, Escape of paginawissel.
const accountMenuOpen = ref(false);
const accountMenuRef = ref<HTMLElement | null>(null);
const zoneLabel = computed(() =>
  auth.isAdmin.value ? "Adminzone" : "Klantenzone",
);

watch(() => route.fullPath, () => {
  accountMenuOpen.value = false;
});

async function onLogout() {
  accountMenuOpen.value = false;
  await auth.logout();
}

function goToCart() {
  cart.showCartOnly.value = true;
  navigateTo("/producten");
}

function isActive(path: string) {
  if (path === "/") return route.path === "/";
  return route.path.startsWith(path);
}

onMounted(() => {
  const onScroll = () => {
    scrolled.value = window.scrollY > 40;
  };
  const onDocClick = (e: MouseEvent) => {
    if (
      accountMenuOpen.value &&
      !accountMenuRef.value?.contains(e.target as Node)
    )
      accountMenuOpen.value = false;
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") accountMenuOpen.value = false;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("click", onDocClick);
  document.addEventListener("keydown", onKey);
  onUnmounted(() => {
    window.removeEventListener("scroll", onScroll);
    document.removeEventListener("click", onDocClick);
    document.removeEventListener("keydown", onKey);
  });
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
  font-size: 0.82rem;
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
  font-size: 0.9rem;
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
  font-size: 0.7rem;
  font-weight: 700;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}
/* Login / klantenzone */
.dm-account-btn {
  height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1rem;
  background: #b8252a;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  white-space: nowrap;
  text-decoration: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
}
.dm-account-btn:hover {
  background: #9a1e22;
}
.dm-account-btn svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  transition: transform 0.2s;
}
.dm-account-split {
  position: relative;
  display: flex;
}
.dm-account-btn--main {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.dm-account-btn--toggle {
  padding: 0 0.6rem;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-left: 1px solid rgba(255, 255, 255, 0.3);
}
.dm-chevron--open {
  transform: rotate(180deg);
}
.dm-account-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 220px;
  padding: 0.375rem;
  background: var(--color-surface-strong);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  z-index: 10;
}
.dm-account-menu-item {
  display: block;
  width: 100%;
  padding: 0.6rem 0.85rem;
  text-align: left;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text);
  text-decoration: none;
  background: transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s;
}
.dm-account-menu-item:hover {
  background: rgba(184, 37, 42, 0.15);
  color: var(--color-text-strong);
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
  font-size: 0.95rem;
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
  .dm-account-btn {
    height: 34px;
    padding: 0 0.75rem;
  }
}

/* Te smal voor de tekst: rode knop blijft, enkel het icoon. */
@media (max-width: 560px) {
  .dm-account-label {
    display: none;
  }
  .dm-account-btn {
    padding: 0 0.6rem;
  }
}

@media (max-width: 360px) {
  .dm-logo-text {
    display: none;
  }
}
</style>
