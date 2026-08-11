<template>
  <header
    class="sticky top-0 z-50 w-full border-b border-site"
    style="background-color: var(--color-surface); backdrop-filter: blur(12px)"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-3 group">
          <img
            :src="'/images/favicon.png'"
            alt="Vleeswaren Vermeir logo"
            class="w-9 h-9 rounded-lg shrink-0 object-contain"
          />
          <span
            class="font-bold text-lg tracking-tight text-site hidden sm:block"
          >
            Vleeswaren <span style="color: var(--color-primary)">Vermeir</span>
          </span>
        </NuxtLink>

        <!-- Navigation links -->
        <nav class="hidden md:flex items-center gap-1">
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="px-4 py-2 rounded-lg text-sm font-medium text-site transition-all duration-200 hover:bg-surface-2"
            active-class="font-semibold"
            :style="isActive(link.to) ? `color: var(--color-primary);` : ''"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>

        <!-- Right side: cart + mobile menu -->
        <div class="flex items-center gap-2">
          <!-- Login button -->
          <button
            class="relative p-2 rounded-lg text-site hover:bg-surface-2 transition-colors"
            aria-label="Inloggen"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </button>

          <!-- Cart button -->
          <button
            @click="cart.isOpen.value = !cart.isOpen.value"
            class="relative p-2 rounded-lg text-site hover:bg-surface-2 transition-colors"
            aria-label="Winkelwagen"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span
              v-if="cart.totalItems.value > 0"
              class="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold"
              style="background-color: var(--color-primary)"
            >
              {{ cart.totalItems.value > 99 ? "99+" : cart.totalItems.value }}
            </span>
          </button>

          <!-- Mobile hamburger -->
          <button
            @click="mobileOpen = !mobileOpen"
            class="md:hidden p-2 rounded-lg text-site hover:bg-surface-2 transition-colors"
            aria-label="Menu"
          >
            <svg
              v-if="!mobileOpen"
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
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
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
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
    </div>

    <!-- Mobile menu -->
    <transition name="slide-down">
      <div
        v-if="mobileOpen"
        class="md:hidden border-t border-site bg-surface px-4 pb-4 pt-2 space-y-1"
      >
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          @click="mobileOpen = false"
          class="block px-3 py-2.5 rounded-lg text-sm font-medium text-site hover:bg-surface-2 transition-colors"
          :style="
            isActive(link.to)
              ? `color: var(--color-primary); font-weight: 600;`
              : ''
          "
        >
          {{ link.label }}
        </NuxtLink>
      </div>
    </transition>
  </header>
</template>

<script setup lang="ts">
const route = useRoute();
const cart = useCart();
const mobileOpen = ref(false);

const links = [
  { to: "/", label: "Home" },
  { to: "/producten", label: "Producten & Bestellen" },
  { to: "/contact", label: "Contact" },
];

function isActive(path: string) {
  if (path === "/") return route.path === "/";
  return route.path.startsWith(path);
}
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
