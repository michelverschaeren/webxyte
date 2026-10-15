<template>
  <AdminShell
    :title="order ? `Bestelling ${order.id.slice(0, 8).toUpperCase()}` : 'Bestelling'"
    :subtitle="order ? `Geplaatst op ${formatDate(order.createdAt)}` : ''"
  >
    <template #actions>
      <NuxtLink to="/admin/bestellingen" class="adm-btn adm-btn--secondary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Alle bestellingen
      </NuxtLink>
      <NuxtLink
        v-if="order?.customer.customerId"
        :to="`/admin/klanten/${order.customer.customerId}`"
        class="adm-btn adm-btn--secondary"
      >
        Klantprofiel
      </NuxtLink>
    </template>

    <template v-if="order">
      <div class="adm-stats">
        <div class="adm-stat">
          <p class="adm-stat-label">Artikelen</p>
          <p class="adm-stat-value">{{ order.items.length }}</p>
        </div>
        <div class="adm-stat">
          <p class="adm-stat-label">Stuks in totaal</p>
          <p class="adm-stat-value">{{ totalQuantity }}</p>
        </div>
        <div class="adm-stat">
          <p class="adm-stat-label">Besteld op</p>
          <p class="adm-stat-value">{{ formatShortDate(order.createdAt) }}</p>
          <p class="adm-stat-sub">{{ formatTime(order.createdAt) }}</p>
        </div>
        <div class="adm-stat">
          <p class="adm-stat-label">Met promotie</p>
          <p class="adm-stat-value" :class="{ 'text-(--color-primary)': promotionCount > 0 }">
            {{ promotionCount }}
          </p>
        </div>
        <div class="adm-stat">
          <p class="adm-stat-label">Niet meer beschikbaar</p>
          <p class="adm-stat-value" :class="{ 'text-(--color-warning)': unavailableCount > 0 }">
            {{ unavailableCount }}
          </p>
        </div>
      </div>

      <div class="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
        <!-- Artikelen -->
        <section class="adm-card">
          <div class="adm-card-head">
            <h2 class="adm-card-title">Bestelde artikelen</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="adm-table">
              <thead>
                <tr>
                  <th>Artikelnr.</th>
                  <th class="w-full">Product</th>
                  <th class="hidden sm:table-cell">Eenheid</th>
                  <th class="hidden md:table-cell">Leverancier</th>
                  <th class="adm-num">Aantal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in order.items" :key="item.id">
                  <td class="font-mono text-[0.8125rem] text-(--color-text-muted)">{{ item.articleNr }}</td>
                  <td>
                    <p class="font-medium text-(--color-text-strong)">{{ item.name }}</p>
                    <!-- Smal scherm: eenheid en leverancier onder de naam i.p.v. in hun kolom -->
                    <p class="text-[0.8125rem] text-(--color-text-muted) md:hidden">
                      <span v-if="item.unit" class="sm:hidden">{{ item.unit }} · </span>{{ item.supplier }}
                    </p>
                    <!-- Promotie die gold bij het bestellen: rood = minimum gehaald -->
                    <p
                      v-for="promo in item.promotions"
                      :key="promo.label"
                      class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5"
                    >
                      <span class="adm-badge" :class="promo.reached ? 'adm-badge--danger' : 'adm-badge--neutral'">
                        Promotie: {{ promo.label }}
                      </span>
                      <span class="text-[0.8125rem] text-(--color-text-muted)">{{ promo.note }}</span>
                    </p>
                    <span v-if="!item.available" class="adm-badge adm-badge--warning mt-1">
                      Niet meer beschikbaar
                    </span>
                  </td>
                  <td class="hidden whitespace-nowrap text-(--color-text-muted) sm:table-cell">
                    {{ item.unit ?? "—" }}
                  </td>
                  <td class="hidden whitespace-nowrap text-(--color-text-muted) md:table-cell">
                    {{ item.supplier }}
                  </td>
                  <td class="adm-num font-semibold text-(--color-text-strong)">{{ item.quantity }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" class="hidden border-t border-(--color-border) text-right text-(--color-text-muted) md:table-cell">
                    Totaal
                  </td>
                  <td colspan="3" class="hidden border-t border-(--color-border) text-right text-(--color-text-muted) sm:table-cell md:hidden">
                    Totaal
                  </td>
                  <td colspan="2" class="border-t border-(--color-border) text-right text-(--color-text-muted) sm:hidden">
                    Totaal
                  </td>
                  <td class="adm-num border-t border-(--color-border) font-bold text-(--color-text-strong)">
                    {{ totalQuantity }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <div class="space-y-6">
          <!-- Klant -->
          <section class="adm-card">
            <div class="adm-card-head">
              <h2 class="adm-card-title">Klant</h2>
              <span v-if="order.customer.customerNr" class="font-mono text-[0.8125rem] text-(--color-text-muted)">
                {{ order.customer.customerNr }}
              </span>
            </div>
            <dl class="adm-dl adm-card-body">
              <div>
                <dt>Naam</dt>
                <dd>
                  <NuxtLink
                    v-if="order.customer.customerId"
                    :to="`/admin/klanten/${order.customer.customerId}`"
                    class="hover:text-(--color-accent)"
                  >
                    {{ order.customer.name }}
                  </NuxtLink>
                  <template v-else>{{ order.customer.name }}</template>
                </dd>
              </div>
              <div>
                <dt>E-mail</dt>
                <dd>{{ order.customer.email }}</dd>
              </div>
              <div v-if="order.billing.companyName">
                <dt>Bedrijf</dt>
                <dd>{{ order.billing.companyName }}</dd>
              </div>
              <div v-if="order.billing.vatNumber">
                <dt>Btw-nummer</dt>
                <dd>{{ order.billing.vatNumber }}</dd>
              </div>
              <div v-if="order.billing.invoiceEmail && order.billing.invoiceEmail !== order.customer.email">
                <dt>Facturatie-e-mail</dt>
                <dd>{{ order.billing.invoiceEmail }}</dd>
              </div>
            </dl>
          </section>

          <!-- Levering: zoals bevroren op de bestelling, niet het huidige adres. -->
          <section class="adm-card">
            <div class="adm-card-head">
              <h2 class="adm-card-title">Levering</h2>
            </div>
            <dl class="adm-dl adm-card-body">
              <div>
                <dt>Leveringsadres</dt>
                <dd v-if="order.billing.street || order.billing.city">
                  {{ order.billing.street }}<br>
                  {{ order.billing.postalCode }} {{ order.billing.city }}
                </dd>
                <dd v-else class="text-(--color-text-muted)">Niet ingevuld</dd>
              </div>
              <div>
                <dt>Telefoon</dt>
                <dd>{{ order.billing.phone ?? "—" }}</dd>
              </div>
            </dl>
            <p class="adm-card-hint">Zoals op het moment van bestellen, ook als de klant het adres later wijzigt.</p>
          </section>
        </div>
      </div>
    </template>
  </AdminShell>
</template>

<script setup lang="ts">
import type { OrderLinePromotion } from "#shared/promotion";

const route = useRoute();
definePageMeta({ layout: "admin", middleware: "admin" });

interface OrderDetail {
  id: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
    customerId: string | null;
    customerNr: string | null;
  };
  billing: {
    companyName: string;
    vatNumber: string | null;
    phone: string | null;
    invoiceEmail: string;
    street?: string | null;
    postalCode?: string | null;
    city?: string | null;
  };
  items: {
    id: string;
    articleNr: string;
    name: string;
    supplier: string;
    unit: string | null;
    quantity: number;
    /** Promoties die bij het bestellen golden; leeg op oudere bestellingen. */
    promotions: OrderLinePromotion[];
    available: boolean;
  }[];
}

const { data } = await useFetch<OrderDetail>(
  `/api/admin/orders/${route.params.id}`,
);

if (!data.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Bestelling niet gevonden.",
    fatal: true,
  });
}

const order = computed(() => data.value ?? null);
useHead({ title: "Bestelling — Beheer — Vleeswaren Vermeir" });

const totalQuantity = computed(() =>
  (order.value?.items ?? []).reduce((sum, item) => sum + item.quantity, 0),
);
const promotionCount = computed(
  () => (order.value?.items ?? []).filter((item) => item.promotions.length > 0).length,
);
const unavailableCount = computed(
  () => (order.value?.items ?? []).filter((item) => !item.available).length,
);

function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("nl-BE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("nl-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string | Date): string {
  // Vaste tijdzone: de server (UTC) en de browser moeten hetzelfde uur tonen.
  return new Date(value).toLocaleTimeString("nl-BE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Brussels",
  });
}
</script>
