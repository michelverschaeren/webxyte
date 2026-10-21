<template>
  <div class="adm-card-footer">
    <span>
      <template v-if="total > 0">
        <span class="font-semibold text-(--color-text-strong)">{{ first }}–{{ last }}</span>
        van {{ total }} {{ noun }}
      </template>
      <template v-else>Geen {{ noun }}</template>
    </span>

    <nav v-if="pageCount > 1" class="flex items-center gap-1" aria-label="Paginering">
      <button
        type="button"
        class="adm-page-btn px-2.5"
        :disabled="page <= 1"
        aria-label="Vorige pagina"
        @click="go(page - 1)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span class="hidden sm:inline">Vorige</span>
      </button>
      <template v-for="(item, i) in pages" :key="i">
        <span v-if="item === null" class="px-1.5" aria-hidden="true">…</span>
        <button
          v-else
          type="button"
          class="adm-page-btn"
          :aria-current="item === page ? 'page' : undefined"
          :aria-label="`Pagina ${item}`"
          @click="go(item)"
        >
          {{ item }}
        </button>
      </template>
      <button
        type="button"
        class="adm-page-btn px-2.5"
        :disabled="page >= pageCount"
        aria-label="Volgende pagina"
        @click="go(page + 1)"
      >
        <span class="hidden sm:inline">Volgende</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
/**
 * Voettekst van een tabelkaart: "1–25 van 240 klanten" en genummerde pagina's
 * (eerste, laatste en de buren van de huidige, met … ertussen).
 */
const props = withDefaults(
  defineProps<{
    pageCount: number;
    total: number;
    perPage: number;
    /** Meervoud van wat er geteld wordt, bv. "klanten". */
    noun?: string;
  }>(),
  { noun: "resultaten" },
);

const page = defineModel<number>("page", { required: true });

const first = computed(() => (page.value - 1) * props.perPage + 1);
const last = computed(() => Math.min(page.value * props.perPage, props.total));

const pages = computed<(number | null)[]>(() => {
  const count = props.pageCount;
  const current = page.value;
  const wanted = new Set([1, count, current - 1, current, current + 1]);
  const list: (number | null)[] = [];
  let previous = 0;
  for (let p = 1; p <= count; p++) {
    if (!wanted.has(p)) continue;
    if (p - previous > 1) list.push(p - previous === 2 ? p - 1 : null);
    list.push(p);
    previous = p;
  }
  return list;
});

function go(target: number) {
  page.value = Math.min(Math.max(1, target), props.pageCount);
}
</script>

<style scoped>
.adm-page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 0.4rem;
  background: var(--color-surface);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text);
  transition: background-color 0.15s, border-color 0.15s;
}
.adm-page-btn:not(:disabled):hover {
  background: var(--color-surface-2);
}
.adm-page-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
.adm-page-btn[aria-current="page"] {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
}
.adm-page-btn svg {
  width: 0.9rem;
  height: 0.9rem;
}
</style>
