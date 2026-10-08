<template>
  <AdminShell title="Bezoekers" subtitle="Bezoekcijfers van de website, uit Vercel Web Analytics.">
    <div class="mb-8 flex flex-wrap items-center gap-2">
      <button
        v-for="option in PERIODS"
        :key="option"
        type="button"
        class="rounded-lg border px-4 py-2 text-sm font-semibold tracking-widest uppercase transition-colors"
        :class="
          days === option
            ? 'border-[#b8252a] bg-[#b8252a] text-white'
            : 'border-(--color-border-strong) text-(--color-text-muted) hover:text-(--color-text-strong)'
        "
        @click="days = option"
      >
        {{ option }} dagen
      </button>
      <span v-if="pending" class="text-sm text-(--color-text-muted)">Laden…</span>
    </div>

    <p
      v-if="!stats || !stats.configured"
      class="rounded-r-xl border-l-2 border-[#c89868] bg-(--color-surface-2) px-5 py-4 text-base text-(--color-text-muted)"
    >
      De bezoekcijfers zijn nog niet gekoppeld: de omgevingsvariabele
      <code>VERCEL_ANALYTICS_TOKEN</code> ontbreekt.
    </p>

    <p
      v-else-if="'error' in stats"
      class="rounded-r-xl border-l-2 border-[#e06a6a] bg-(--color-surface-2) px-5 py-4 text-base text-(--color-text)"
    >
      {{ stats.error }}
    </p>

    <template v-else>
      <div class="grid gap-5 sm:grid-cols-2">
        <div class="adm-card">
          <span class="adm-card-value">{{ format(stats.totals.visitors) }}</span>
          <span class="adm-card-title">Bezoekers</span>
          <span class="adm-card-hint">Unieke bezoekers, laatste {{ stats.days }} dagen</span>
        </div>
        <div class="adm-card">
          <span class="adm-card-value">{{ format(stats.totals.pageviews) }}</span>
          <span class="adm-card-title">Paginaweergaven</span>
          <span class="adm-card-hint">Laatste {{ stats.days }} dagen</span>
        </div>
      </div>

      <section v-if="stats.perDay.length > 0" class="mt-12">
        <h2 class="adm-heading">— Bezoekers per dag —</h2>
        <div class="rounded-xl border border-(--color-border) bg-(--color-surface) px-4 pt-6 pb-3">
          <div class="flex h-48 items-end gap-0.5 sm:gap-1">
            <div
              v-for="day in stats.perDay"
              :key="day.date"
              class="group relative flex h-full flex-1 items-end"
              :title="`${formatDay(day.date)}: ${day.visitors} bezoekers, ${day.pageviews} weergaven`"
            >
              <div
                class="w-full rounded-t-sm bg-[#c89868] transition-colors group-hover:bg-[#b8252a]"
                :style="{ height: `${barHeight(day.visitors)}%` }"
              />
            </div>
          </div>
          <div class="mt-2 flex justify-between text-[0.8rem] text-(--color-text-muted)">
            <span>{{ formatDay(stats.perDay[0]!.date) }}</span>
            <span>Hoogste dag: {{ format(maxVisitors) }} bezoekers</span>
            <span>{{ formatDay(stats.perDay[stats.perDay.length - 1]!.date) }}</span>
          </div>
        </div>
      </section>

      <div class="mt-12 grid gap-10 lg:grid-cols-2">
        <section v-for="table in tables" :key="table.title">
          <h2 class="adm-heading">— {{ table.title }} —</h2>
          <div class="overflow-hidden rounded-xl border border-(--color-border)">
            <table class="w-full border-collapse text-base">
              <thead>
                <tr
                  class="border-b border-(--color-border) text-[0.8rem] tracking-widest text-(--color-text-muted) uppercase"
                >
                  <th class="px-4 py-3 text-left font-semibold">{{ table.label }}</th>
                  <th class="px-4 py-3 text-right font-semibold">Bezoekers</th>
                  <th class="px-4 py-3 text-right font-semibold">Weergaven</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in table.rows"
                  :key="row.key"
                  class="border-b border-(--color-border) last:border-0 hover:bg-(--color-hover)"
                >
                  <td class="max-w-0 truncate px-4 py-2.5 text-(--color-text-strong)">
                    {{ row.key || table.empty }}
                  </td>
                  <td class="px-4 py-2.5 text-right font-semibold text-(--color-text-strong)">
                    {{ format(row.visitors) }}
                  </td>
                  <td class="px-4 py-2.5 text-right text-(--color-text)">
                    {{ format(row.pageviews) }}
                  </td>
                </tr>
                <tr v-if="table.rows.length === 0">
                  <td colspan="3" class="px-4 py-4 text-(--color-text-muted)">
                    Nog geen gegevens voor deze periode.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </template>
  </AdminShell>
</template>

<script setup lang="ts">
definePageMeta({ layout: "main", middleware: "admin" });
useHead({ title: "Bezoekers — Vleeswaren Vermeir" });

const PERIODS = [7, 30, 90] as const;
const days = ref<(typeof PERIODS)[number]>(30);

const { data: stats, pending } = await useFetch("/api/admin/analytics", {
  query: { days },
});

const ok = computed(() =>
  stats.value?.configured && !("error" in stats.value) ? stats.value : null,
);

const maxVisitors = computed(() =>
  Math.max(0, ...(ok.value?.perDay.map((d) => d.visitors) ?? [])),
);

const tables = computed(() => [
  { title: "Meest bezochte pagina's", label: "Pagina", empty: "—", rows: ok.value?.pages ?? [] },
  {
    title: "Herkomst",
    label: "Verwijzende site",
    empty: "Rechtstreeks",
    rows: ok.value?.referrers ?? [],
  },
  { title: "Toestellen", label: "Toestel", empty: "Onbekend", rows: ok.value?.devices ?? [] },
]);

/** Minstens 2% zodat ook een dag met weinig bezoek zichtbaar blijft. */
function barHeight(visitors: number): number {
  if (maxVisitors.value === 0 || visitors === 0) return 0;
  return Math.max(2, (visitors / maxVisitors.value) * 100);
}

function format(value: number): string {
  return value.toLocaleString("nl-BE");
}

function formatDay(value: string): string {
  return new Date(value).toLocaleDateString("nl-BE", { day: "numeric", month: "short" });
}
</script>

<style scoped>
.adm-heading {
  margin-bottom: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-accent);
}
.adm-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.75rem;
  background: var(--color-surface);
  padding: 1.5rem 1.75rem;
}
.adm-card-value {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-variant-numeric: lining-nums tabular-nums;
  color: var(--color-text-strong);
}
.adm-card-title {
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-accent);
}
.adm-card-hint {
  font-size: 1rem;
  color: var(--color-text);
}
</style>
