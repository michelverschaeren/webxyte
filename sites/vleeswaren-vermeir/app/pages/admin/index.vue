<template>
  <AdminShell
    title="Overzicht"
    subtitle="Productcatalogus, verkoop en klanten in één oogopslag."
  >
    <template #actions>
      <NuxtLink to="/admin/bezoekers" class="adm-btn adm-btn--secondary">Bezoekers</NuxtLink>
      <NuxtLink to="/admin/producten/nieuw" class="adm-btn adm-btn--primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14" />
        </svg>
        Nieuw product
      </NuxtLink>
    </template>

    <div class="adm-kpis">
      <NuxtLink v-for="kpi in kpis" :key="kpi.label" :to="kpi.to" class="adm-kpi">
        <span class="adm-kpi-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" :d="kpi.icon" />
          </svg>
        </span>
        <span class="min-w-0">
          <span class="adm-kpi-label block">{{ kpi.label }}</span>
          <span class="adm-kpi-value block">{{ kpi.value }}</span>
          <span class="adm-kpi-sub block">{{ kpi.sub }}</span>
        </span>
      </NuxtLink>
    </div>

    <div class="grid items-start gap-6 lg:grid-cols-2">
      <!-- Recente bestellingen -->
      <section class="adm-card">
        <div class="adm-card-head">
          <h2 class="adm-card-title">Recente bestellingen</h2>
          <NuxtLink to="/admin/bestellingen" class="adm-btn adm-btn--ghost adm-btn--sm">
            Alle bestellingen
          </NuxtLink>
        </div>
        <p v-if="recentOrders.length === 0" class="adm-card-empty">Nog geen bestellingen.</p>
        <div v-else class="overflow-x-auto">
          <table class="adm-table">
            <thead>
              <tr>
                <th>Bestelnr.</th>
                <th class="w-full">Klant</th>
                <th>Datum</th>
                <th class="adm-num">Stuks</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in recentOrders" :key="o.id">
                <td class="font-mono text-[0.8125rem]">
                  <NuxtLink :to="`/admin/bestellingen/${o.id}`" class="text-(--color-accent) hover:underline">
                    {{ o.id.slice(0, 8).toUpperCase() }}
                  </NuxtLink>
                </td>
                <td class="w-full max-w-0">
                  <p class="truncate font-medium text-(--color-text-strong)">{{ o.customerName }}</p>
                </td>
                <td class="whitespace-nowrap text-(--color-text-muted)">{{ formatDate(o.createdAt) }}</td>
                <td class="adm-num">{{ o.totalQuantity }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Meest verkocht -->
      <section class="adm-card">
        <div class="adm-card-head">
          <h2 class="adm-card-title">Meest verkocht</h2>
          <NuxtLink to="/admin/producten" class="adm-btn adm-btn--ghost adm-btn--sm">
            Alle producten
          </NuxtLink>
        </div>
        <p v-if="topProducts.length === 0" class="adm-card-empty">Nog niets verkocht.</p>
        <div v-else class="overflow-x-auto">
          <table class="adm-table">
            <thead>
              <tr>
                <th>#</th>
                <th class="w-full">Product</th>
                <th class="adm-num">Verkocht</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, i) in topProducts" :key="p.articleNr">
                <td class="text-(--color-text-muted) tabular-nums">{{ i + 1 }}</td>
                <td class="w-full max-w-0">
                  <p class="truncate font-medium text-(--color-text-strong)" :title="p.name">{{ p.name }}</p>
                  <div class="adm-share" aria-hidden="true">
                    <span :style="{ width: `${(p.totalQuantity / topMax) * 100}%` }" />
                  </div>
                </td>
                <td class="adm-num font-semibold text-(--color-text-strong)">{{ p.totalQuantity }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Lopende promoties -->
      <section class="adm-card lg:col-span-2">
        <div class="adm-card-head">
          <h2 class="adm-card-title">
            Lopende promoties
            <span class="adm-tab-count">{{ promoSummary.active }}</span>
          </h2>
          <NuxtLink to="/admin/promoties" class="adm-btn adm-btn--ghost adm-btn--sm">
            Alle promoties
          </NuxtLink>
        </div>
        <p v-if="activePromotions.length === 0" class="adm-card-empty">
          Er loopt vandaag geen promotie.
        </p>
        <div v-else class="overflow-x-auto">
          <table class="adm-table">
            <thead>
              <tr>
                <th class="w-full">Product</th>
                <th>Korting</th>
                <th>Loopt tot</th>
                <th class="hidden sm:table-cell">Klanten</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in activePromotions" :key="p.key">
                <td class="w-full max-w-0">
                  <p class="truncate font-medium text-(--color-text-strong)" :title="p.title">
                    {{ p.title }}
                  </p>
                  <p class="truncate text-[0.8125rem] text-(--color-text-muted)">{{ p.subtitle }}</p>
                </td>
                <td class="whitespace-nowrap font-medium text-(--color-text-strong)">{{ p.discount }}</td>
                <td class="whitespace-nowrap">
                  {{ formatIsoDate(p.endsOn) }}
                  <span class="block text-[0.8125rem] text-(--color-text-muted)">{{ daysLeftLabel(p.endsOn) }}</span>
                </td>
                <td class="hidden whitespace-nowrap text-(--color-text-muted) sm:table-cell">
                  {{ p.customers }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import {
  promotionLabel,
  todayInBrussels,
  type PromotionDiscount,
  type PromotionStatus,
} from "#shared/promotion";

definePageMeta({ layout: "admin", middleware: "admin" });
useHead({ title: "Beheer — Vleeswaren Vermeir" });

interface Stats {
  totalProducts: number;
  activeProducts: number;
  customerCount: number;
  soldQuantity: number;
  topProducts: { articleNr: string; name: string; totalQuantity: number }[];
}

interface RecentOrders {
  items: {
    id: string;
    createdAt: string;
    customerName: string;
    totalQuantity: number;
  }[];
  pagination: { total: number };
}

type ActivePromotion = PromotionDiscount & {
  id: string;
  endsOn: string;
  allCustomers: boolean;
  product: { articleNr: string; name: string };
  customers: { id: string }[];
};

/** Zelfde vorm als op /admin/promoties: één lijn per groep of losse promotie. */
interface ActivePromotions {
  entries: {
    key: string;
    group: { id: string; name: string } | null;
    items: ActivePromotion[];
  }[];
  summary: Record<PromotionStatus, number>;
}

const [{ data: stats }, { data: orders }, { data: promotions }] = await Promise.all([
  useFetch<Stats>("/api/admin/stats"),
  useFetch<RecentOrders>("/api/admin/orders", { query: { perPage: 6 } }),
  useFetch<ActivePromotions>("/api/admin/promotions", {
    query: { status: "active", perPage: 5 },
  }),
]);

const recentOrders = computed(() => orders.value?.items ?? []);
// Een groep (folder) is één rij: haar naam en het aantal producten; periode
// en klanten zijn voor de hele groep dezelfde.
const activePromotions = computed(() =>
  (promotions.value?.entries ?? []).flatMap((entry) => {
    const first = entry.items[0];
    if (!first) return [];
    const labels = [...new Set(entry.items.map((p) => promotionLabel(p)))];
    const count = entry.items.length;
    return [
      {
        key: entry.key,
        title: entry.group?.name ?? first.product.name,
        subtitle: entry.group
          ? `${count} product${count !== 1 ? "en" : ""}`
          : first.product.articleNr,
        discount: labels.length === 1 ? labels[0] : "Verschillende kortingen",
        endsOn: entry.items.reduce((max, p) => (p.endsOn > max ? p.endsOn : max), first.endsOn),
        customers: first.allCustomers
          ? "Alle klanten"
          : `${first.customers.length} klant${first.customers.length !== 1 ? "en" : ""}`,
      },
    ];
  }),
);
const promoSummary = computed(
  () => promotions.value?.summary ?? { active: 0, scheduled: 0, expired: 0 },
);
const topProducts = computed(() => stats.value?.topProducts ?? []);
const topMax = computed(() => Math.max(1, ...topProducts.value.map((p) => p.totalQuantity)));

/** Zelfde icoon als in de zijbalk (app/utils/admin-nav.ts). */
function navIcon(to: string): string {
  return adminNavLinks.find((link) => link.to === to)?.icon ?? "";
}

function formatNumber(value: number | undefined): string {
  return value === undefined ? "—" : value.toLocaleString("nl-BE");
}

const kpis = computed(() => [
  {
    label: "Producten",
    value: formatNumber(stats.value?.totalProducts),
    sub: `${formatNumber(stats.value?.activeProducts)} actief in de catalogus`,
    to: "/admin/producten",
    icon: navIcon("/admin/producten"),
  },
  {
    label: "Klanten",
    value: formatNumber(stats.value?.customerCount),
    sub: "Klanten uit het CRM",
    to: "/admin/klanten",
    icon: navIcon("/admin/klanten"),
  },
  {
    label: "Bestellingen",
    value: formatNumber(orders.value?.pagination.total),
    sub: "Via de webshop",
    to: "/admin/bestellingen",
    icon: navIcon("/admin/bestellingen"),
  },
  {
    label: "Stuks verkocht",
    value: formatNumber(stats.value?.soldQuantity),
    sub: "Totaal, geannuleerd niet meegeteld",
    to: "/admin/producten",
    icon: navIcon("/admin/bezoekers"),
  },
  {
    label: "Actieve promoties",
    value: formatNumber(promotions.value?.summary.active),
    sub: `${formatNumber(promoSummary.value.scheduled)} gepland`,
    to: "/admin/promoties",
    icon: navIcon("/admin/promoties"),
  },
]);

/** Kalenderdag "YYYY-MM-DD" zonder tijdzoneverschuiving. */
function formatIsoDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("nl-BE", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

function daysLeftLabel(endsOn: string): string {
  const days = Math.round(
    (Date.parse(`${endsOn}T00:00:00Z`) - Date.parse(`${todayInBrussels()}T00:00:00Z`)) / 86_400_000,
  );
  if (days <= 0) return "laatste dag";
  return `nog ${days} dag${days !== 1 ? "en" : ""}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("nl-BE", { day: "2-digit", month: "short" });
}
</script>
