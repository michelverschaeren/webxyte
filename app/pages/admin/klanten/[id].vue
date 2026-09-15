<template>
  <AdminShell
    :title="data?.customer.name ?? 'Klant'"
    :subtitle="data ? `Klantnr. ${data.customer.customerNr}` : undefined"
  >
    <div v-if="data" class="space-y-10">
      <!-- Contact & levering -->
      <section>
        <h2
          class="mb-4 text-[0.7rem] font-semibold tracking-[0.2em] text-(--color-accent) uppercase"
        >
          — Contact & levering —
        </h2>

        <dl class="grid gap-x-8 gap-y-3 rounded-xl border border-(--color-border) bg-(--color-surface-2) px-5 py-5 sm:grid-cols-2">
          <div>
            <dt class="text-xs text-(--color-text-muted)">Contact-e-mail</dt>
            <dd class="text-(--color-text-strong)">{{ data.customer.contactEmail ?? "—" }}</dd>
          </div>
          <div>
            <dt class="text-xs text-(--color-text-muted)">Telefoon</dt>
            <dd class="text-(--color-text-strong)">{{ data.customer.phone ?? "—" }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-xs text-(--color-text-muted)">Leveradres</dt>
            <dd class="text-(--color-text-strong)">{{ deliveryAddress ?? "—" }}</dd>
          </div>
        </dl>
      </section>

      <!-- Account -->
      <section>
        <h2
          class="mb-4 text-[0.7rem] font-semibold tracking-[0.2em] text-(--color-accent) uppercase"
        >
          — Account —
        </h2>

        <div
          v-if="!data.account"
          class="rounded-xl border border-(--color-border) bg-(--color-surface-2) px-5 py-4 text-sm text-(--color-text-muted)"
        >
          Nog geen account gekoppeld. De klant ziet zijn historiek pas na het koppelen van een login.
        </div>
        <dl v-else class="grid gap-x-8 gap-y-3 rounded-xl border border-(--color-border) bg-(--color-surface-2) px-5 py-5 sm:grid-cols-2">
          <div>
            <dt class="text-xs text-(--color-text-muted)">Naam</dt>
            <dd class="text-(--color-text-strong)">{{ data.account.name }}</dd>
          </div>
          <div>
            <dt class="text-xs text-(--color-text-muted)">Login-e-mail</dt>
            <dd class="text-(--color-text-strong)">{{ data.account.email }}</dd>
          </div>
          <template v-if="data.billing">
            <div>
              <dt class="text-xs text-(--color-text-muted)">Facturatie: bedrijf</dt>
              <dd class="text-(--color-text-strong)">
                {{ data.billing.companyName }}
                <span v-if="data.billing.vatNumber" class="text-(--color-text-muted)">
                  · BTW {{ data.billing.vatNumber }}
                </span>
              </dd>
            </div>
            <div>
              <dt class="text-xs text-(--color-text-muted)">Facturatie: adres</dt>
              <dd class="text-(--color-text-strong)">
                {{ data.billing.street }}, {{ data.billing.postalCode }}
                {{ data.billing.city }}, {{ data.billing.country }}
              </dd>
            </div>
          </template>
        </dl>
      </section>

      <!-- Webshopbestellingen -->
      <section v-if="data.account">
        <h2
          class="mb-4 text-[0.7rem] font-semibold tracking-[0.2em] text-(--color-accent) uppercase"
        >
          — Webshopbestellingen ({{ data.orders.length }}) —
        </h2>

        <div
          v-if="data.orders.length === 0"
          class="rounded-xl border border-(--color-border) bg-(--color-surface-2) px-5 py-4 text-sm text-(--color-text-muted)"
        >
          Nog geen bestellingen via de webshop.
        </div>
        <ul v-else class="space-y-2">
          <li v-for="order in data.orders" :key="order.id">
            <NuxtLink
              :to="`/admin/bestellingen/${order.id}`"
              class="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-(--color-border) bg-(--color-surface-2) px-4 py-4 hover:bg-(--color-hover) sm:px-6"
            >
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-(--color-text-strong)">
                  {{ formatDate(order.createdAt, true) }}
                </p>
                <p class="mt-0.5 text-xs text-(--color-text-muted)">
                  {{ order.lineCount }} artikel{{ order.lineCount !== 1 ? "en" : "" }}
                  · {{ order.totalQuantity }} stuks
                </p>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </section>

      <!-- CRM-historiek -->
      <section>
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2
            class="text-[0.7rem] font-semibold tracking-[0.2em] text-(--color-accent) uppercase"
          >
            — Eerder afgenomen ({{ data.purchaseHistory.length }}) —
          </h2>
          <input
            v-if="data.purchaseHistory.length > 0"
            v-model="historySearch"
            type="text"
            placeholder="Filter op artikelnr, naam of leverancier…"
            class="adm-input w-full max-w-xs"
          >
        </div>

        <div
          v-if="data.purchaseHistory.length === 0"
          class="rounded-xl border border-(--color-border) bg-(--color-surface-2) px-5 py-4 text-sm text-(--color-text-muted)"
        >
          Geen aankoophistoriek uit het CRM.
        </div>
        <div v-else class="rounded-xl border border-(--color-border) overflow-hidden">
          <div class="overflow-x-auto">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr
                class="border-b border-(--color-border) text-[0.7rem] uppercase tracking-widest text-(--color-text-muted)"
              >
                <th class="px-4 py-3 text-left font-semibold">Artikelnr.</th>
                <th class="px-4 py-3 text-left font-semibold">Product</th>
                <th class="hidden px-4 py-3 text-left font-semibold md:table-cell">
                  Leverancier
                </th>
                <th class="px-4 py-3 text-left font-semibold">Laatst gekocht</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in filteredHistory"
                :key="item.productId"
                class="border-b border-(--color-border) last:border-0 hover:bg-(--color-hover)"
              >
                <td class="px-4 py-2.5 font-mono text-xs text-(--color-text-muted)">
                  <NuxtLink :to="`/admin/producten/${item.productId}`" class="hover:text-(--color-accent)">
                    {{ item.articleNr }}
                  </NuxtLink>
                </td>
                <td class="px-4 py-2.5 text-(--color-text-strong)">
                  {{ item.name }}
                  <span
                    v-if="!item.isActive"
                    class="ml-2 rounded bg-(--color-hover) px-1.5 py-0.5 text-[0.65rem] text-(--color-text-muted) uppercase"
                  >
                    Inactief
                  </span>
                </td>
                <td class="hidden px-4 py-2.5 text-(--color-text-muted) md:table-cell">
                  {{ item.supplier }}
                </td>
                <td class="px-4 py-2.5 whitespace-nowrap text-(--color-text-muted)">
                  {{ formatDate(item.lastPurchasedAt) }}
                </td>
              </tr>
              <tr v-if="filteredHistory.length === 0">
                <td colspan="4" class="px-4 py-10 text-center text-(--color-text-muted)">
                  Geen producten gevonden.
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      </section>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
const route = useRoute();
definePageMeta({ layout: "main", middleware: "admin" });
useHead({ title: "Klant — Vleeswaren Vermeir" });

interface CustomerDetail {
  customer: {
    id: string;
    customerNr: string;
    name: string;
    contactEmail: string | null;
    phone: string | null;
    deliveryStreet: string | null;
    deliveryPostalCode: string | null;
    deliveryCity: string | null;
    deliveryCountry: string;
  };
  account: { id: string; name: string; email: string } | null;
  billing: {
    companyName: string;
    vatNumber: string | null;
    street: string;
    postalCode: string;
    city: string;
    country: string;
  } | null;
  orders: {
    id: string;
    createdAt: string;
    lineCount: number;
    totalQuantity: number;
  }[];
  purchaseHistory: {
    productId: string;
    articleNr: string;
    name: string;
    supplier: string;
    unit: string | null;
    isActive: boolean;
    lastPurchasedAt: string;
  }[];
}

const { data } = await useFetch<CustomerDetail>(
  `/api/admin/customers/${route.params.id}`,
);

const deliveryAddress = computed(() => {
  const c = data.value?.customer;
  if (!c?.deliveryStreet) return null;
  const city = [c.deliveryPostalCode, c.deliveryCity].filter(Boolean).join(" ");
  return [c.deliveryStreet, city, c.deliveryCountry].filter(Boolean).join(", ");
});

const historySearch = ref("");
const filteredHistory = computed(() => {
  const items = data.value?.purchaseHistory ?? [];
  const term = historySearch.value.trim().toLowerCase();
  if (!term) return items;
  return items.filter((item) =>
    [item.articleNr, item.name, item.supplier].some((field) =>
      field.toLowerCase().includes(term),
    ),
  );
});

function formatDate(value: string, withWeekday = false): string {
  return new Date(value).toLocaleDateString("nl-BE", {
    weekday: withWeekday ? "long" : undefined,
    day: "2-digit",
    month: withWeekday ? "long" : "short",
    year: "numeric",
  });
}
</script>

<style scoped>
.adm-input {
  border: 1px solid var(--color-border-strong);
  border-radius: 0.5rem;
  background: var(--color-surface-2);
  padding: 0.6rem 0.85rem;
  font-size: 0.85rem;
  color: var(--color-text-strong);
}
.adm-input:focus {
  outline: none;
  border-color: #c89868;
}
</style>
