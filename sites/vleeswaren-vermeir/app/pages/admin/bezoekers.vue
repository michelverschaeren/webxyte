<template>
  <AdminShell title="Bezoekers" subtitle="Bezoekcijfers van de website, uit Vercel Web Analytics.">
    <template #actions>
      <span v-if="pending" class="text-sm text-(--color-text-muted)">Laden…</span>
      <div class="adm-segmented" role="group" aria-label="Periode">
        <button
          v-for="option in PERIODS"
          :key="option"
          type="button"
          :aria-pressed="days === option"
          @click="days = option"
        >
          {{ option }} dagen
        </button>
      </div>
    </template>

    <p v-if="!stats || !stats.configured" class="adm-notice">
      De bezoekcijfers zijn nog niet gekoppeld: de omgevingsvariabele
      <code>VERCEL_ANALYTICS_TOKEN</code> ontbreekt.
    </p>

    <p v-else-if="'error' in stats" class="adm-notice adm-notice--error" role="alert">
      {{ stats.error }}
    </p>

    <template v-else>
      <div class="adm-kpis">
        <div class="adm-kpi">
          <span class="adm-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </span>
          <span>
            <span class="adm-kpi-label block">Bezoekers</span>
            <span class="adm-kpi-value block">{{ format(stats.totals.visitors) }}</span>
            <span class="adm-kpi-sub block">Uniek, laatste {{ stats.days }} dagen</span>
          </span>
        </div>
        <div class="adm-kpi">
          <span class="adm-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
          <span>
            <span class="adm-kpi-label block">Paginaweergaven</span>
            <span class="adm-kpi-value block">{{ format(stats.totals.pageviews) }}</span>
            <span class="adm-kpi-sub block">Laatste {{ stats.days }} dagen</span>
          </span>
        </div>
        <div class="adm-kpi">
          <span class="adm-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </span>
          <span>
            <span class="adm-kpi-label block">Pagina's per bezoeker</span>
            <span class="adm-kpi-value block">{{ pagesPerVisitor }}</span>
            <span class="adm-kpi-sub block">Gemiddeld</span>
          </span>
        </div>
        <div class="adm-kpi">
          <span class="adm-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          </span>
          <span>
            <span class="adm-kpi-label block">Drukste dag</span>
            <span class="adm-kpi-value block">{{ format(maxVisitors) }}</span>
            <span class="adm-kpi-sub block">
              {{ busiestDay ? `bezoekers op ${formatDay(busiestDay.date)}` : "—" }}
            </span>
          </span>
        </div>
      </div>

      <section v-if="stats.perDay.length > 0" class="adm-card mb-6">
        <div class="adm-card-head">
          <h2 class="adm-card-title">Bezoekers per dag</h2>
          <span class="text-[0.8125rem] text-(--color-text-muted)">
            {{ formatDay(stats.perDay[0]!.date) }} – {{ formatDay(stats.perDay[stats.perDay.length - 1]!.date) }}
          </span>
        </div>
        <div class="adm-card-body">
          <div class="flex gap-2">
            <div
              class="relative h-56 w-9 shrink-0 text-right text-[0.75rem] text-(--color-text-muted) tabular-nums"
              aria-hidden="true"
            >
              <span
                v-for="tick in yTicks"
                :key="tick"
                class="absolute right-0 translate-y-1/2 leading-none"
                :style="{ bottom: `${(tick / axisMax) * 100}%` }"
              >
                {{ format(tick) }}
              </span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="relative h-56">
                <div
                  v-for="tick in yTicks"
                  :key="tick"
                  class="absolute inset-x-0 border-t border-dashed border-(--color-border)"
                  :style="{ bottom: `${(tick / axisMax) * 100}%` }"
                />
                <div class="absolute inset-0 flex items-end gap-0.5 sm:gap-1">
                  <div
                    v-for="day in stats.perDay"
                    :key="day.date"
                    class="group flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                    :title="`${formatDay(day.date)}: ${day.visitors} bezoekers, ${day.pageviews} weergaven`"
                  >
                    <span
                      v-if="showValues && day.visitors > 0"
                      class="mb-1 text-[0.7rem] leading-none font-semibold text-(--color-text-muted) tabular-nums group-hover:text-(--color-text-strong)"
                      :class="{ 'hidden sm:block': stats.perDay.length > 7 }"
                    >
                      {{ format(day.visitors) }}
                    </span>
                    <div
                      class="adm-bar w-full max-w-10 shrink-0 rounded-t-md transition-colors"
                      :style="{ height: `${barHeight(day.visitors)}%` }"
                    />
                  </div>
                </div>
              </div>
              <div class="mt-2 flex justify-between text-[0.75rem] text-(--color-text-muted)">
                <span>{{ formatDay(stats.perDay[0]!.date) }}</span>
                <span>{{ formatDay(stats.perDay[stats.perDay.length - 1]!.date) }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="grid items-start gap-6 lg:grid-cols-2">
        <section v-for="table in tables" :key="table.title" class="adm-card">
          <div class="adm-card-head">
            <h2 class="adm-card-title">{{ table.title }}</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="adm-table">
              <thead>
                <tr>
                  <th class="w-full">{{ table.label }}</th>
                  <th class="adm-num">Bezoekers</th>
                  <th class="adm-num">Weergaven</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in table.rows" :key="row.key">
                  <td class="w-full max-w-0">
                    <p class="truncate font-medium text-(--color-text-strong)" :title="row.key || table.empty">
                      {{ row.key || table.empty }}
                    </p>
                    <div class="adm-share" aria-hidden="true">
                      <span :style="{ width: `${(row.visitors / table.max) * 100}%` }" />
                    </div>
                  </td>
                  <td class="adm-num font-semibold text-(--color-text-strong)">{{ format(row.visitors) }}</td>
                  <td class="adm-num text-(--color-text-muted)">{{ format(row.pageviews) }}</td>
                </tr>
                <tr v-if="table.rows.length === 0">
                  <td colspan="3" class="adm-card-empty">Nog geen gegevens voor deze periode.</td>
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
definePageMeta({ layout: "admin", middleware: "admin" });
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

const busiestDay = computed(() =>
  ok.value?.perDay.find((d) => d.visitors === maxVisitors.value && d.visitors > 0),
);

const pagesPerVisitor = computed(() => {
  const totals = ok.value?.totals;
  if (!totals || totals.visitors === 0) return "—";
  return (totals.pageviews / totals.visitors).toLocaleString("nl-BE", {
    maximumFractionDigits: 1,
  });
});

const tables = computed(() =>
  [
    { title: "Meest bezochte pagina's", label: "Pagina", empty: "—", rows: ok.value?.pages ?? [] },
    {
      title: "Herkomst",
      label: "Verwijzende site",
      empty: "Rechtstreeks",
      rows: ok.value?.referrers ?? [],
    },
    { title: "Toestellen", label: "Toestel", empty: "Onbekend", rows: ok.value?.devices ?? [] },
  ].map((table) => ({
    ...table,
    // Grootste waarde = volle balk.
    max: Math.max(1, ...table.rows.map((r) => r.visitors)),
  })),
);

/** Ronde stap (1, 2, 5, 10, …) zodat de y-as een viertal leesbare streepjes krijgt. */
const tickStep = computed(() => {
  const rough = maxVisitors.value / 4;
  if (rough <= 1) return 1;
  const pow = 10 ** Math.floor(Math.log10(rough));
  return [1, 2, 5, 10].map((m) => m * pow).find((step) => step >= rough)!;
});

const axisMax = computed(() =>
  Math.max(tickStep.value, Math.ceil(maxVisitors.value / tickStep.value) * tickStep.value),
);

const yTicks = computed(() => {
  const ticks: number[] = [];
  for (let tick = 0; tick <= axisMax.value; tick += tickStep.value) ticks.push(tick);
  return ticks;
});

/** Bij 90 dagen zijn de balken te smal voor een getal erboven. */
const showValues = computed(() => (ok.value?.perDay.length ?? 0) <= 31);

/** Minstens 2% zodat ook een dag met weinig bezoek zichtbaar blijft. */
function barHeight(visitors: number): number {
  if (visitors === 0) return 0;
  return Math.max(2, (visitors / axisMax.value) * 100);
}

function format(value: number): string {
  return value.toLocaleString("nl-BE");
}

function formatDay(value: string): string {
  return new Date(value).toLocaleDateString("nl-BE", { day: "numeric", month: "short" });
}
</script>

<style scoped>
.adm-bar {
  background: rgb(184 37 42 / 0.55);
}
.group:hover .adm-bar {
  background: var(--color-primary);
}
</style>
