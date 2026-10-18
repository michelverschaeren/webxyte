<template>
  <AdminShell title="Bestellingen" subtitle="Alle bestellingen van alle klanten.">
    <div class="adm-card">
      <div class="adm-card-toolbar">
        <AdminSearchField
          v-model="search"
          name="bestellingen-zoeken"
          placeholder="Zoek op bestelnr., klant, e-mail of adres…"
          class="w-full sm:w-80"
        />
        <!-- Filter vanuit de klantenlijst (?klant=…) -->
        <span v-if="data?.customer" class="adm-badge adm-badge--info gap-1.5">
          Klant: {{ data.customer.name }} ({{ data.customer.customerNr }})
          <NuxtLink
            :to="{ query: { ...route.query, klant: undefined } }"
            aria-label="Klantfilter wissen"
            title="Klantfilter wissen"
            class="hover:opacity-70"
          >
            ×
          </NuxtLink>
        </span>
      </div>

      <!-- Lijst (mobiel) -->
      <ul v-if="items.length > 0" class="adm-list sm:hidden">
        <li v-for="o in items" :key="o.id">
          <NuxtLink :to="`/admin/bestellingen/${o.id}`" class="flex flex-col gap-1 px-4 py-3">
            <span class="flex items-start justify-between gap-3">
              <span class="min-w-0 font-semibold text-(--color-text-strong)">{{ o.customerName }}</span>
              <span class="shrink-0 font-mono text-[0.8125rem] text-(--color-text-muted)">
                {{ orderNumber(o.id) }}
              </span>
            </span>
            <span class="truncate text-sm text-(--color-text-muted)">{{ o.customerEmail }}</span>
            <span v-if="hasAddress(o)" class="truncate text-sm text-(--color-text-muted)">
              {{ o.delivery?.street }}, {{ o.delivery?.postalCode }} {{ o.delivery?.city }}
            </span>
            <span class="text-sm text-(--color-text-muted)">
              {{ formatDate(o.createdAt) }} · {{ o.lineCount }} artikel{{ o.lineCount !== 1 ? "en" : "" }} · {{ o.totalQuantity }} st.
            </span>
          </NuxtLink>
        </li>
      </ul>
      <p v-else class="adm-card-empty sm:hidden">Geen bestellingen gevonden.</p>

      <!-- Tabel (desktop) -->
      <div class="hidden overflow-x-auto sm:block">
        <table class="adm-table">
          <thead>
            <tr>
              <th>Bestelnr.</th>
              <th>Datum</th>
              <th class="w-full">Klant</th>
              <th class="hidden lg:table-cell">Leveringsadres</th>
              <th class="adm-num">Artikelen</th>
              <th class="adm-num">Stuks</th>
              <th class="adm-col-actions"><span class="sr-only">Acties</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in items" :key="o.id">
              <td class="font-mono text-[0.8125rem]">
                <NuxtLink :to="`/admin/bestellingen/${o.id}`" class="text-(--color-accent) hover:underline">
                  {{ orderNumber(o.id) }}
                </NuxtLink>
              </td>
              <td class="whitespace-nowrap">{{ formatDate(o.createdAt) }}</td>
              <td class="w-full max-w-0">
                <p class="truncate font-medium text-(--color-text-strong)">{{ o.customerName }}</p>
                <p class="truncate text-[0.8125rem] text-(--color-text-muted)">{{ o.customerEmail }}</p>
              </td>
              <td class="hidden whitespace-nowrap lg:table-cell">
                <template v-if="hasAddress(o)">
                  <p class="text-(--color-text-strong)">{{ o.delivery?.street }}</p>
                  <p class="text-[0.8125rem] text-(--color-text-muted)">
                    {{ o.delivery?.postalCode }} {{ o.delivery?.city }}
                  </p>
                </template>
                <span v-else class="text-(--color-text-muted)">—</span>
              </td>
              <td class="adm-num">{{ o.lineCount }}</td>
              <td class="adm-num">{{ o.totalQuantity }}</td>
              <td class="adm-col-actions">
                <a
                  :href="`/api/admin/orders/${o.id}/pdf`"
                  download
                  :aria-label="`Bestelbon ${orderNumber(o.id)} downloaden (PDF)`"
                  title="Bestelbon downloaden (PDF)"
                  class="adm-row-btn"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" />
                  </svg>
                </a>
                <NuxtLink
                  :to="`/admin/bestellingen/${o.id}`"
                  :aria-label="`Bestelling ${orderNumber(o.id)} bekijken`"
                  title="Bekijken"
                  class="adm-row-btn"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </NuxtLink>
              </td>
            </tr>
            <tr v-if="items.length === 0">
              <td colspan="7" class="adm-card-empty">Geen bestellingen gevonden.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <AdminPagination
        v-if="pagination"
        v-model:page="page"
        :page-count="pagination.pageCount"
        :total="pagination.total"
        :per-page="pagination.perPage"
        noun="bestellingen"
      />
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });
useHead({ title: "Bestellingen — Vleeswaren Vermeir" });

interface OrderDto {
  id: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  /** Leveringsadres zoals op de bestelling; leeg op heel oude bestellingen. */
  delivery: { street: string | null; postalCode: string | null; city: string | null } | null;
  lineCount: number;
  totalQuantity: number;
}

function hasAddress(o: OrderDto): boolean {
  return Boolean(o.delivery?.street || o.delivery?.city);
}

interface OrdersResponse {
  items: OrderDto[];
  customer: { id: string; customerNr: string; name: string } | null;
  pagination: { page: number; perPage: number; total: number; pageCount: number };
}

// Startwaarde uit ?zoek= (link "Alle resultaten" in de zoekbalk bovenaan).
const route = useRoute();
const search = ref(String(route.query.zoek ?? ""));
const debouncedSearch = ref(search.value);
watch(() => route.query.zoek, (q) => {
  search.value = String(q ?? "");
});
let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(search, (value) => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    debouncedSearch.value = value;
  }, 300);
});

const page = ref(1);
const PAGE_SIZE = 25;

// ?klant=<id>: enkel de bestellingen van die klant (icoon in de klantenlijst).
const customerFilter = computed(() =>
  typeof route.query.klant === "string" ? route.query.klant : undefined,
);

watch([debouncedSearch, customerFilter], () => {
  page.value = 1;
});

const query = computed(() => ({
  search: debouncedSearch.value || undefined,
  customer: customerFilter.value,
  page: page.value,
  perPage: PAGE_SIZE,
}));

const { data } = await useFetch<OrdersResponse>("/api/admin/orders", {
  query,
});

const items = computed(() => data.value?.items ?? []);
const pagination = computed(() => data.value?.pagination);

/** Kort bestelnummer: de eerste 8 tekens van de id, zoals op de bestelbon. */
function orderNumber(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("nl-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
</script>
