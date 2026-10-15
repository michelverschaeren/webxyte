<template>
  <AdminShell title="Promoties" subtitle="Acties en kortingen per product, per periode en per klant.">
    <template #actions>
      <button type="button" class="adm-btn adm-btn--primary" @click="openWizard(null)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14" />
        </svg>
        Nieuwe promotie
      </button>
    </template>

    <div class="adm-tabs" role="group" aria-label="Filter op status">
      <button
        v-for="option in STATUS_OPTIONS"
        :key="option.value ?? 'all'"
        type="button"
        class="adm-tab"
        :aria-pressed="status === option.value"
        @click="status = option.value"
      >
        {{ option.label }}
        <span class="adm-tab-count">
          {{ option.value ? summary[option.value] : summaryTotal }}
        </span>
      </button>
    </div>

    <p v-if="notice" class="adm-notice" role="status">{{ notice }}</p>

    <div class="adm-card">
      <div class="adm-card-toolbar">
        <AdminSearchField
          v-model="search"
          name="promoties-zoeken"
          placeholder="Zoek op product, artikelnr of klant…"
          class="w-full sm:w-72"
        />
        <template v-if="selected.size > 0">
          <span class="text-sm text-(--color-text-muted)">{{ selected.size }} geselecteerd</span>
          <button
            type="button"
            :disabled="deleting"
            class="adm-btn adm-btn--danger adm-btn--sm"
            @click="deleteSelected"
          >
            {{ deleting ? "Verwijderen…" : "Verwijderen" }}
          </button>
        </template>
        <div class="flex flex-wrap items-center gap-2 sm:ml-auto">
          <select
            v-model="categorySlug"
            aria-label="Categorie"
            class="adm-input adm-input--compact max-w-48 flex-1 sm:flex-none"
          >
            <option :value="null">Alle categorieën</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.slug">
              {{ cat.name }}
            </option>
          </select>
          <select
            v-model="supplier"
            aria-label="Leverancier"
            class="adm-input adm-input--compact max-w-48 flex-1 sm:flex-none"
          >
            <option :value="null">Alle leveranciers</option>
            <option v-for="s in suppliers" :key="s.name" :value="s.name">{{ s.name }}</option>
          </select>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm text-(--color-text-muted)">Periode</span>
          <input v-model="from" type="date" aria-label="Periode van" class="adm-input adm-input--compact">
          <span class="text-sm text-(--color-text-muted)">–</span>
          <input
            v-model="to"
            type="date"
            aria-label="Periode tot"
            :min="from || undefined"
            class="adm-input adm-input--compact"
          >
          <button
            v-if="hasFilters"
            type="button"
            class="adm-btn adm-btn--ghost adm-btn--sm"
            @click="resetFilters"
          >
            Wissen
          </button>
        </div>
      </div>

      <!-- Lijst (mobiel) -->
      <ul v-if="items.length > 0" class="adm-list sm:hidden">
        <li v-for="p in items" :key="p.id" class="flex items-start gap-3 px-4 py-3">
          <input
            type="checkbox"
            class="adm-check mt-1"
            :checked="selected.has(p.id)"
            aria-label="Promotie selecteren"
            @change="toggleSelect(p.id)"
          >
          <button type="button" class="flex min-w-0 flex-1 flex-col gap-1 text-left" @click="openWizard(p)">
            <span class="flex items-start justify-between gap-3">
              <span class="min-w-0 font-semibold text-(--color-text-strong)">{{ p.product.name }}</span>
              <span class="adm-badge" :class="STATUS_BADGE[p.status]">
                {{ PROMOTION_STATUS_LABELS[p.status] }}
              </span>
            </span>
            <span class="text-sm text-(--color-text-strong)">{{ promotionLabel(p) }}</span>
            <span class="text-sm text-(--color-text-muted)">
              {{ formatDate(p.startsOn) }} – {{ formatDate(p.endsOn) }} · {{ audienceSummary(p) }}
            </span>
          </button>
        </li>
      </ul>
      <p v-else class="adm-card-empty sm:hidden">{{ emptyText }}</p>

      <!-- Tabel (desktop) -->
      <div class="hidden overflow-x-auto sm:block">
        <table class="adm-table">
          <thead>
            <tr>
              <th class="adm-col-check">
                <input
                  type="checkbox"
                  class="adm-check"
                  :checked="allSelected"
                  aria-label="Alle promoties op deze pagina selecteren"
                  @change="toggleSelectAll()"
                >
              </th>
              <th class="w-full">Product</th>
              <th>Korting</th>
              <th>Periode</th>
              <th>Status</th>
              <th class="hidden lg:table-cell">Klanten</th>
              <th class="adm-col-actions"><span class="sr-only">Acties</span></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in items"
              :key="p.id"
              :aria-selected="selected.has(p.id)"
              class="align-top"
            >
              <td class="adm-col-check">
                <input
                  type="checkbox"
                  class="adm-check"
                  :checked="selected.has(p.id)"
                  aria-label="Promotie selecteren"
                  @change="toggleSelect(p.id)"
                >
              </td>
              <!-- max-w-0 + w-full: neemt de restbreedte en kapt af i.p.v. de tabel te verbreden -->
              <td class="w-full max-w-0">
                <NuxtLink
                  :to="`/admin/producten/${p.product.id}`"
                  :title="p.product.name"
                  class="block truncate font-medium text-(--color-text-strong) hover:text-(--color-accent)"
                >
                  {{ p.product.name }}
                </NuxtLink>
                <p class="truncate text-[0.8125rem] text-(--color-text-muted)">
                  {{ p.product.articleNr }} · {{ p.product.supplier }}<template v-if="p.product.unit"> · {{ p.product.unit }}</template>
                  <template v-if="p.product.price !== null"> · {{ formatEuro(p.product.price) }}</template>
                  <template v-if="!p.product.isActive"> · niet actief</template>
                </p>
              </td>
              <td class="whitespace-nowrap font-medium text-(--color-text-strong)">
                {{ promotionLabel(p) }}
              </td>
              <td class="whitespace-nowrap">
                {{ formatDate(p.startsOn) }} – {{ formatDate(p.endsOn) }}
                <span class="block text-[0.8125rem] text-(--color-text-muted)">
                  {{ dayCount(p) }} dag{{ dayCount(p) !== 1 ? "en" : "" }}
                </span>
              </td>
              <td>
                <span class="adm-badge" :class="STATUS_BADGE[p.status]">
                  {{ PROMOTION_STATUS_LABELS[p.status] }}
                </span>
              </td>
              <td class="hidden min-w-48 lg:table-cell">
                <span v-if="p.allCustomers" class="adm-badge adm-badge--neutral">Alle klanten</span>
                <template v-else>
                  <ul>
                    <li
                      v-for="c in expanded.has(p.id) ? p.customers : p.customers.slice(0, CUSTOMER_PREVIEW)"
                      :key="c.id"
                    >
                      <NuxtLink :to="`/admin/klanten/${c.id}`" class="hover:text-(--color-accent)">
                        {{ c.name }}
                      </NuxtLink>
                    </li>
                  </ul>
                  <button
                    v-if="p.customers.length > CUSTOMER_PREVIEW"
                    type="button"
                    class="mt-0.5 text-[0.8125rem] font-semibold text-(--color-accent) hover:underline"
                    @click="toggleExpanded(p.id)"
                  >
                    {{
                      expanded.has(p.id)
                        ? "Minder tonen"
                        : `+ ${p.customers.length - CUSTOMER_PREVIEW} meer`
                    }}
                  </button>
                </template>
              </td>
              <td class="adm-col-actions">
                <button
                  type="button"
                  title="Bewerken"
                  :aria-label="`Promotie op ${p.product.name} bewerken`"
                  class="adm-row-btn"
                  @click="openWizard(p)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </button>
                <button
                  type="button"
                  title="Dupliceren"
                  :aria-label="`Promotie op ${p.product.name} dupliceren`"
                  class="adm-row-btn"
                  @click="openWizard(p, true)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </td>
            </tr>
            <tr v-if="items.length === 0">
              <td colspan="7" class="adm-card-empty">{{ emptyText }}</td>
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
        noun="promoties"
      />
    </div>

    <AdminPromotionWizard
      :open="wizardOpen"
      :initial="wizardInitial"
      @close="wizardOpen = false"
      @saved="onSaved"
    />
  </AdminShell>
</template>

<script setup lang="ts">
import {
  PROMOTION_STATUS_LABELS,
  promotionLabel,
  type PromotionDiscount,
  type PromotionStatus,
} from "#shared/promotion";
import type { PromotionWizardInitial } from "~/components/admin/PromotionWizard.vue";

definePageMeta({ layout: "admin", middleware: "admin" });
useHead({ title: "Promoties — Vleeswaren Vermeir" });

interface PromotionDto extends PromotionDiscount {
  id: string;
  startsOn: string;
  endsOn: string;
  allCustomers: boolean;
  status: PromotionStatus;
  product: {
    id: string;
    articleNr: string;
    name: string;
    unit: string | null;
    price: number | null;
    isActive: boolean;
    supplier: string;
    categoryName: string;
  };
  customers: { id: string; customerNr: string; name: string }[];
}

interface PromotionsResponse {
  items: PromotionDto[];
  summary: Record<PromotionStatus, number>;
  pagination: { page: number; perPage: number; total: number; pageCount: number };
}

const STATUS_BADGE: Record<PromotionStatus, string> = {
  active: "adm-badge--success",
  scheduled: "adm-badge--info",
  expired: "adm-badge--neutral",
};

const STATUS_OPTIONS:{ value: PromotionStatus | undefined; label: string }[] = [
  { value: undefined, label: "Alle" },
  { value: "active", label: "Actief" },
  { value: "scheduled", label: "Gepland" },
  { value: "expired", label: "Verlopen" },
];

/** Zoveel klantnamen per promotie tonen voor "+ N meer". */
const CUSTOMER_PREVIEW = 3;
const PAGE_SIZE = 25;

const search = ref("");
const debouncedSearch = ref("");
let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(search, (value) => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    debouncedSearch.value = value;
  }, 300);
});

const { data: categoriesData } = await useFetch<{ id: string; slug: string; name: string }[]>(
  "/api/categories",
);
const categories = computed(() => categoriesData.value ?? []);
const { data: suppliersData } = await useFetch<{ name: string; productCount: number }[]>(
  "/api/admin/suppliers",
);
const suppliers = computed(() => suppliersData.value ?? []);

const status = ref<PromotionStatus | undefined>(undefined);
const from = ref("");
const to = ref("");
const categorySlug = ref<string | null>(null);
const supplier = ref<string | null>(null);
const page = ref(1);

const hasFilters = computed(() =>
  Boolean(
    status.value || from.value || to.value || search.value || categorySlug.value || supplier.value,
  ),
);

function resetFilters() {
  search.value = "";
  debouncedSearch.value = "";
  status.value = undefined;
  from.value = "";
  to.value = "";
  categorySlug.value = null;
  supplier.value = null;
}

watch([debouncedSearch, status, from, to, categorySlug, supplier], () => {
  page.value = 1;
});

const query = computed(() => ({
  search: debouncedSearch.value || undefined,
  status: status.value,
  from: from.value || undefined,
  to: to.value || undefined,
  category: categorySlug.value || undefined,
  supplier: supplier.value || undefined,
  page: page.value,
  perPage: PAGE_SIZE,
}));

const { data, refresh } = await useFetch<PromotionsResponse>("/api/admin/promotions", { query });

const items = computed(() => data.value?.items ?? []);
const summary = computed(
  () => data.value?.summary ?? { active: 0, scheduled: 0, expired: 0 },
);
const summaryTotal = computed(
  () => summary.value.active + summary.value.scheduled + summary.value.expired,
);
const pagination = computed(() => data.value?.pagination);
const emptyText = computed(() =>
  hasFilters.value ? "Geen promoties voor deze filters." : "Nog geen promoties. Maak er een aan met “Nieuwe promotie”.",
);

const notice = ref("");

// --- Wizard ---------------------------------------------------------------

const wizardOpen = ref(false);
const wizardInitial = ref<PromotionWizardInitial | null>(null);

/** `null` = nieuw; met `duplicate` wordt het een nieuwe promotie met dezelfde gegevens. */
function openWizard(p: PromotionDto | null, duplicate = false) {
  wizardInitial.value = p
    ? {
        id: duplicate ? undefined : p.id,
        type: p.type,
        percentage: p.percentage,
        minQuantity: p.minQuantity,
        buyQuantity: p.buyQuantity,
        freeQuantity: p.freeQuantity,
        price: p.price,
        product: {
          id: p.product.id,
          articleNr: p.product.articleNr,
          name: p.product.name,
          unit: p.product.unit,
          price: p.product.price,
        },
        startsOn: p.startsOn,
        endsOn: p.endsOn,
        allCustomers: p.allCustomers,
        customers: p.customers,
      }
    : null;
  wizardOpen.value = true;
}

async function onSaved(message: string) {
  wizardOpen.value = false;
  notice.value = message;
  await refresh();
}

// --- Klantenlijst uitklappen ----------------------------------------------

const expanded = ref<Set<string>>(new Set());
function toggleExpanded(id: string) {
  if (expanded.value.has(id)) expanded.value.delete(id);
  else expanded.value.add(id);
}

function audienceSummary(p: PromotionDto) {
  if (p.allCustomers) return "Alle klanten";
  const names = p.customers.slice(0, CUSTOMER_PREVIEW).map((c) => c.name).join(", ");
  const rest = p.customers.length - CUSTOMER_PREVIEW;
  return rest > 0 ? `${names} + ${rest} meer` : names;
}

// --- Selectie + verwijderen -----------------------------------------------

const selected = ref<Set<string>>(new Set());
const allSelected = computed(
  () => items.value.length > 0 && items.value.every((p) => selected.value.has(p.id)),
);

function toggleSelect(id: string) {
  if (selected.value.has(id)) selected.value.delete(id);
  else selected.value.add(id);
}

function toggleSelectAll() {
  if (allSelected.value) selected.value.clear();
  else for (const p of items.value) selected.value.add(p.id);
}

// Andere pagina of filters tonen andere promoties: selectie wissen.
watch(query, () => selected.value.clear());

const deleting = ref(false);
async function deleteSelected() {
  if (deleting.value || selected.value.size === 0) return;
  const ids = Array.from(selected.value);
  if (!window.confirm(`${ids.length} promotie${ids.length !== 1 ? "s" : ""} definitief verwijderen?`)) {
    return;
  }
  deleting.value = true;
  try {
    const result = await $fetch<{ deleted: number }>("/api/admin/promotions/delete", {
      method: "POST",
      body: { ids },
    });
    notice.value = `${result.deleted} promotie${result.deleted !== 1 ? "s" : ""} verwijderd.`;
    selected.value.clear();
  } catch {
    notice.value = "Verwijderen mislukt. Probeer het later opnieuw.";
  } finally {
    deleting.value = false;
    await refresh();
  }
}

// --- Opmaak ---------------------------------------------------------------

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("nl-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatEuro(value: number) {
  return value.toLocaleString("nl-BE", { style: "currency", currency: "EUR" });
}

function dayCount(p: PromotionDto) {
  return (
    Math.round(
      (Date.parse(`${p.endsOn}T00:00:00Z`) - Date.parse(`${p.startsOn}T00:00:00Z`)) / 86_400_000,
    ) + 1
  );
}
</script>

<style scoped>
.adm-input--compact {
  width: auto;
  height: 2.125rem;
  padding: 0 0.6rem;
}
/* Ruimte voor het pijltje uit admin.css houden. */
select.adm-input--compact {
  padding-right: 2.1rem;
  background-position: right 0.6rem center;
}
</style>
