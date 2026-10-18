<template>
  <div ref="rootRef" class="relative">
    <label class="relative block">
      <span class="sr-only">Zoeken in beheer</span>
      <svg
        class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-(--color-text-muted)"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
      <input
        ref="inputRef"
        v-model="query"
        type="search"
        placeholder="Zoek klant, bestelling, product…"
        autocomplete="off"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="open"
        aria-controls="adm-search-results"
        :aria-activedescendant="activeIndex >= 0 ? `adm-search-${activeIndex}` : undefined"
        class="h-10 w-full rounded-lg border border-(--color-border) bg-(--color-surface) pr-12 pl-9 text-sm text-(--color-text) placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:outline-none"
        @focus="open = query.trim().length >= MIN_LENGTH"
        @keydown="onKeydown"
      >
      <kbd
        v-if="shortcut && !query"
        class="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-(--color-border) px-1.5 py-0.5 text-[0.65rem] text-(--color-text-muted) md:block"
      >
        Ctrl K
      </kbd>
    </label>

    <div
      v-if="open"
      id="adm-search-results"
      role="listbox"
      class="absolute top-[calc(100%+0.4rem)] right-0 left-0 z-20 max-h-[70vh] min-w-72 overflow-y-auto rounded-lg border border-(--color-border) bg-(--color-surface-strong) p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
    >
      <p v-if="pending && !entries.length" class="px-3 py-2.5 text-sm text-(--color-text-muted)">
        Zoeken…
      </p>
      <p v-else-if="error" class="px-3 py-2.5 text-sm text-(--color-error)">
        Zoeken mislukt. Probeer opnieuw.
      </p>
      <p v-else-if="!entries.length" class="px-3 py-2.5 text-sm text-(--color-text-muted)">
        Geen resultaten voor “{{ query.trim() }}”.
      </p>

      <template v-for="group in groups" :key="group.key">
        <div v-if="group.entries.length" class="mb-1 last:mb-0">
          <div class="flex items-center justify-between px-3 pt-2 pb-1">
            <span class="text-[0.7rem] font-semibold tracking-[0.15em] text-(--color-accent) uppercase">
              {{ group.label }}
            </span>
            <NuxtLink
              :to="{ path: group.listPath, query: { zoek: query.trim() } }"
              class="text-[0.72rem] text-(--color-text-muted) hover:text-(--color-accent)"
              @click="close()"
            >
              Alle resultaten →
            </NuxtLink>
          </div>
          <NuxtLink
            v-for="entry in group.entries"
            :id="`adm-search-${entry.index}`"
            :key="entry.key"
            :to="entry.to"
            role="option"
            :aria-selected="entry.index === activeIndex"
            class="flex items-baseline justify-between gap-3 rounded-md px-3 py-2 text-sm text-(--color-text)"
            :class="entry.index === activeIndex ? 'bg-[#b8252a]/15 text-(--color-text-strong)' : 'hover:bg-(--color-hover)'"
            @mouseenter="activeIndex = entry.index"
            @click="close()"
          >
            <span class="truncate">{{ entry.title }}</span>
            <span class="shrink-0 text-xs text-(--color-text-muted)">{{ entry.meta }}</span>
          </NuxtLink>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  /** Ctrl+K en "/" focussen dit veld; zet dit op maar één instantie. */
  shortcut?: boolean;
}>();

interface SearchResult {
  customers: { id: string; customerNr: string; name: string }[];
  orders: { id: string; createdAt: string; customerName: string; companyName: string | null }[];
  products: { id: string; articleNr: string; name: string; isActive: boolean }[];
}

const MIN_LENGTH = 2;

const rootRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const query = ref("");
const result = ref<SearchResult | null>(null);
const pending = ref(false);
const error = ref(false);
const open = ref(false);
const activeIndex = ref(-1);

// Debounce + enkel het antwoord op de laatste zoekopdracht tonen.
let timer: ReturnType<typeof setTimeout> | undefined;
let requestId = 0;
watch(query, (value) => {
  if (timer) clearTimeout(timer);
  const q = value.trim();
  activeIndex.value = -1;
  if (q.length < MIN_LENGTH) {
    open.value = false;
    result.value = null;
    return;
  }
  open.value = true;
  pending.value = true;
  timer = setTimeout(async () => {
    const id = ++requestId;
    try {
      const data = await $fetch<SearchResult>("/api/admin/search", { query: { q } });
      if (id !== requestId) return;
      result.value = data;
      error.value = false;
    } catch {
      if (id !== requestId) return;
      error.value = true;
    } finally {
      if (id === requestId) pending.value = false;
    }
  }, 250);
});

const dateFormat = new Intl.DateTimeFormat("nl-BE", { day: "2-digit", month: "2-digit", year: "numeric" });

const groups = computed(() => {
  const r = result.value;
  let index = 0;
  function make<T>(
    items: T[] | undefined,
    map: (item: T) => { key: string; to: string; title: string; meta: string },
  ) {
    return (items ?? []).map((item) => ({ ...map(item), index: index++ }));
  }

  return [
    {
      key: "customers",
      label: "Klanten",
      listPath: "/admin/klanten",
      entries: make(r?.customers, (c) => ({
        key: `c-${c.id}`,
        to: `/admin/klanten/${c.id}`,
        title: c.name,
        meta: `Klantnr. ${c.customerNr}`,
      })),
    },
    {
      key: "orders",
      label: "Bestellingen",
      listPath: "/admin/bestellingen",
      entries: make(r?.orders, (o) => ({
        key: `o-${o.id}`,
        to: `/admin/bestellingen/${o.id}`,
        title: `${o.id.slice(0, 8).toUpperCase()} · ${o.companyName || o.customerName}`,
        meta: dateFormat.format(new Date(o.createdAt)),
      })),
    },
    {
      key: "products",
      label: "Producten",
      listPath: "/admin/producten",
      entries: make(r?.products, (p) => ({
        key: `p-${p.id}`,
        to: `/admin/producten/${p.id}`,
        title: p.name,
        meta: p.isActive ? p.articleNr : `${p.articleNr} · inactief`,
      })),
    },
  ];
});

const entries = computed(() => groups.value.flatMap((g) => g.entries));

function close() {
  open.value = false;
  activeIndex.value = -1;
  inputRef.value?.blur();
}

function onKeydown(e: KeyboardEvent) {
  const count = entries.value.length;
  if (e.key === "Escape") {
    if (query.value) query.value = "";
    else close();
  } else if (e.key === "ArrowDown" && count) {
    e.preventDefault();
    open.value = true;
    activeIndex.value = (activeIndex.value + 1) % count;
  } else if (e.key === "ArrowUp" && count) {
    e.preventDefault();
    activeIndex.value = activeIndex.value <= 0 ? count - 1 : activeIndex.value - 1;
  } else if (e.key === "Enter" && open.value) {
    const entry = entries.value[activeIndex.value >= 0 ? activeIndex.value : 0];
    if (entry) {
      e.preventDefault();
      close();
      navigateTo(entry.to);
    }
  }
}

function focus() {
  inputRef.value?.focus();
  inputRef.value?.select();
}
defineExpose({ focus });

onMounted(() => {
  const onDocClick = (e: MouseEvent) => {
    if (open.value && !rootRef.value?.contains(e.target as Node)) open.value = false;
  };
  const onKey = (e: KeyboardEvent) => {
    if (!props.shortcut) return;
    const target = e.target as HTMLElement | null;
    const typing = target?.closest("input, textarea, select, [contenteditable='true']");
    if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) {
      e.preventDefault();
      focus();
    }
  };
  document.addEventListener("click", onDocClick);
  document.addEventListener("keydown", onKey);
  onUnmounted(() => {
    document.removeEventListener("click", onDocClick);
    document.removeEventListener("keydown", onKey);
  });
});
</script>
