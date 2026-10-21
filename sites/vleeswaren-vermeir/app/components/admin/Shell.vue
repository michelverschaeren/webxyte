<template>
  <div>
    <!-- Topbalk: kruimelpad, zoeken en weergaveknoppen. Op mobiel
         ook de menuknop voor de zijbalk-lade uit layouts/admin.vue. -->
    <header
      class="sticky top-0 z-50 border-b border-(--color-border) bg-(--color-bg)/90 backdrop-blur-md"
    >
      <div class="flex min-h-16 items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-10">
        <button
          type="button"
          class="adm-bar-btn -ml-1.5 flex lg:hidden"
          aria-label="Menu openen"
          :aria-expanded="drawerOpen"
          @click="drawerOpen = true"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <nav aria-label="Kruimelpad" class="min-w-0 flex-1">
          <ol class="flex min-w-0 items-center gap-1.5 text-sm text-(--color-text-muted)">
            <li
              v-for="(crumb, i) in crumbs"
              :key="i"
              class="flex min-w-0 items-center gap-1.5"
              :class="{ 'shrink-0': i < crumbs.length - 1 }"
            >
              <svg
                v-if="i > 0"
                class="h-3.5 w-3.5 shrink-0 opacity-60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <NuxtLink
                v-if="crumb.to"
                :to="crumb.to"
                class="transition hover:text-(--color-accent)"
              >
                {{ crumb.label }}
              </NuxtLink>
              <span
                v-else
                class="truncate font-medium text-(--color-text-strong)"
                aria-current="page"
              >
                {{ crumb.label }}
              </span>
            </li>
          </ol>
        </nav>

        <AdminSearch shortcut class="hidden w-64 md:block xl:w-80" />

        <div class="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            class="adm-bar-btn flex md:hidden"
            aria-label="Zoeken"
            :aria-expanded="mobileSearchOpen"
            @click="toggleMobileSearch()"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </button>

          <!-- Icoon via CSS op [data-theme], zie useTheme. -->
          <button
            type="button"
            class="adm-bar-btn flex"
            aria-label="Thema wisselen"
            title="Thema wisselen"
            @click="toggleTheme()"
          >
            <svg class="only-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
            </svg>
            <svg class="only-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
            </svg>
          </button>

          <!-- Breedte heeft op kleine schermen geen effect. -->
          <button
            type="button"
            class="adm-bar-btn hidden xl:flex"
            :aria-label="wide ? 'Boxed weergave' : 'Volledige breedte'"
            :title="wide ? 'Boxed weergave' : 'Volledige breedte'"
            :aria-pressed="wide"
            @click="toggleWide()"
          >
            <svg v-if="wide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          </button>
        </div>
      </div>

      <div v-if="mobileSearchOpen" class="px-4 pb-3 md:hidden">
        <AdminSearch ref="mobileSearchRef" />
      </div>
    </header>

    <div
      class="mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-10"
      :class="wide ? 'max-w-none' : 'max-w-300'"
    >
      <div class="adm-page-head">
        <div class="min-w-0">
          <h1
            class="font-['Playfair_Display',Georgia,serif] text-[1.6rem] leading-tight font-bold text-(--color-text-strong) sm:text-[1.85rem]"
          >
            {{ title }}
          </h1>
          <p v-if="subtitle" class="mt-1 text-sm text-(--color-text-muted)">
            {{ subtitle }}
          </p>
        </div>
        <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
          <slot name="actions" />
        </div>
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ title: string; subtitle?: string }>();

const route = useRoute();
const drawerOpen = useAdminDrawer();
const { wide, toggle: toggleWide } = useAdminWide();
const { toggle: toggleTheme } = useTheme();

const mobileSearchOpen = ref(false);
const mobileSearchRef = ref<{ focus: () => void } | null>(null);

async function toggleMobileSearch() {
  mobileSearchOpen.value = !mobileSearchOpen.value;
  if (mobileSearchOpen.value) {
    await nextTick();
    mobileSearchRef.value?.focus();
  }
}

watch(() => route.fullPath, () => {
  mobileSearchOpen.value = false;
});

// Beheer › sectie (uit het zijbalkmenu) › huidige pagina. Op een
// sectiepagina zelf is de sectie het laatste item; dieper (detail, nieuw)
// komt de paginatitel erachter.
const crumbs = computed(() => {
  const list: { label: string; to?: string }[] = [{ label: "Beheer", to: "/admin" }];
  const section = adminNavLinks.find(
    (l) => l.to !== "/admin" && route.path.startsWith(l.to),
  );
  if (!section) {
    list.push({ label: "Overzicht" });
    return list;
  }
  if (route.path === section.to) {
    list.push({ label: section.label });
  } else {
    list.push({ label: section.label, to: section.to });
    list.push({ label: props.title });
  }
  return list;
});
</script>

<style scoped>
.adm-bar-btn {
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-text);
  background: transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.adm-bar-btn:hover {
  background: rgba(184, 37, 42, 0.15);
  color: var(--color-text-strong);
}
.adm-bar-btn svg {
  width: 20px;
  height: 20px;
}
</style>
