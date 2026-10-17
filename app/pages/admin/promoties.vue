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
      <ul v-if="entries.length > 0" class="adm-list sm:hidden">
        <template v-for="entry in entries" :key="entry.key">
          <li v-if="entry.group" class="promo-group-row flex items-start gap-3 px-4 py-3">
            <input
              type="checkbox"
              class="adm-check mt-1"
              :checked="groupSelection(entry) === 'all'"
              :indeterminate="groupSelection(entry) === 'some'"
              aria-label="Alle promoties van deze groep selecteren"
              @change="toggleGroupSelect(entry)"
            >
            <button
              type="button"
              class="flex min-w-0 flex-1 flex-col gap-1 text-left"
              :aria-expanded="isGroupOpen(entry)"
              @click="toggleGroup(entry)"
            >
              <span class="flex items-start justify-between gap-3">
                <span class="flex min-w-0 items-center gap-1.5 font-semibold text-(--color-text-strong)">
                  <svg class="promo-chevron" :class="{ 'promo-chevron--open': isGroupOpen(entry) }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  <span class="truncate">{{ entry.group.name }}</span>
                </span>
                <span class="adm-badge" :class="STATUS_BADGE[groupStatus(entry)]">
                  {{ PROMOTION_STATUS_LABELS[groupStatus(entry)] }}
                </span>
              </span>
              <span class="text-sm text-(--color-text-strong)">
                {{ productCount(entry) }} · {{ groupDiscount(entry) }}
              </span>
              <span class="text-sm text-(--color-text-muted)">
                {{ groupPeriod(entry) }} · {{ groupAudience(entry) }}
              </span>
            </button>
          </li>
          <template v-for="part in visibleParts(entry)" :key="part.key">
          <li v-if="part.label" class="promo-part promo-child">
            {{ part.label }} · {{ part.items.length }} product{{ part.items.length !== 1 ? "en" : "" }}
          </li>
          <li
            v-for="p in part.items"
            :key="p.id"
            class="flex items-start gap-3 px-4 py-3"
            :class="{ 'promo-child': entry.group }"
          >
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
                <span v-if="!entry.group" class="adm-badge" :class="STATUS_BADGE[p.status]">
                  {{ PROMOTION_STATUS_LABELS[p.status] }}
                </span>
              </span>
              <span class="text-sm text-(--color-text-strong)">{{ promotionLabel(p) }}</span>
              <!-- In een groep staan periode en klanten al op de groepslijn. -->
              <span v-if="!entry.group" class="text-sm text-(--color-text-muted)">
                {{ formatDate(p.startsOn) }} – {{ formatDate(p.endsOn) }} · {{ audienceSummary(p) }}
              </span>
            </button>
          </li>
          </template>
        </template>
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
              <th class="hidden sm:table-cell">Eenheid</th>
              <th>Korting</th>
              <th>Periode</th>
              <th>Status</th>
              <th class="hidden lg:table-cell">Klanten</th>
              <th class="adm-col-actions"><span class="sr-only">Acties</span></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="entry in entries" :key="entry.key">
            <tr v-if="entry.group" class="promo-group-row align-top">
              <td class="adm-col-check">
                <input
                  type="checkbox"
                  class="adm-check"
                  :checked="groupSelection(entry) === 'all'"
                  :indeterminate="groupSelection(entry) === 'some'"
                  aria-label="Alle promoties van deze groep selecteren"
                  @change="toggleGroupSelect(entry)"
                >
              </td>
              <td class="w-full max-w-0">
                <button
                  type="button"
                  class="flex max-w-full items-center gap-1.5 text-left font-semibold text-(--color-text-strong) hover:text-(--color-accent)"
                  :aria-expanded="isGroupOpen(entry)"
                  :title="entry.group.name"
                  @click="toggleGroup(entry)"
                >
                  <svg class="promo-chevron" :class="{ 'promo-chevron--open': isGroupOpen(entry) }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  <span class="truncate">{{ entry.group.name }}</span>
                </button>
                <p class="truncate pl-5.5 text-[0.8125rem] text-(--color-text-muted)">
                  {{ productCount(entry) }}
                </p>
              </td>
              <td class="hidden sm:table-cell" />
              <td class="whitespace-nowrap font-medium text-(--color-text-strong)">{{ groupDiscount(entry) }}</td>
              <td class="whitespace-nowrap">{{ groupPeriod(entry) }}</td>
              <td>
                <span class="adm-badge" :class="STATUS_BADGE[groupStatus(entry)]">
                  {{ PROMOTION_STATUS_LABELS[groupStatus(entry)] }}
                </span>
              </td>
              <td class="hidden min-w-48 text-(--color-text-muted) lg:table-cell">{{ groupAudience(entry) }}</td>
              <td class="adm-col-actions">
                <button
                  type="button"
                  title="Bewerken"
                  :aria-label="`${entry.group.name} bewerken`"
                  class="adm-row-btn"
                  @click="openGroupWizard(entry)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </button>
                <button
                  type="button"
                  title="Dupliceren"
                  :aria-label="`${entry.group.name} dupliceren`"
                  class="adm-row-btn"
                  @click="openGroupWizard(entry, true)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </td>
            </tr>
            <template v-for="part in visibleParts(entry)" :key="part.key">
            <tr v-if="part.label" class="promo-part-row">
              <td />
              <td colspan="7" class="promo-child-cell">
                <span class="promo-part">
                  {{ part.label }} · {{ part.items.length }} product{{ part.items.length !== 1 ? "en" : "" }}
                </span>
              </td>
            </tr>
            <tr
              v-for="p in part.items"
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
              <td class="w-full max-w-0" :class="{ 'promo-child-cell': entry.group }">
                <NuxtLink
                  :to="`/admin/producten/${p.product.id}`"
                  :title="p.product.name"
                  class="block truncate font-medium text-(--color-text-strong) hover:text-(--color-accent)"
                >
                  {{ p.product.name }}
                </NuxtLink>
                <p class="truncate text-[0.8125rem] text-(--color-text-muted)">
                  {{ p.product.articleNr }} · {{ p.product.supplier }}<span v-if="p.product.unit" class="sm:hidden"> · {{ p.product.unit }}</span>
                  <template v-if="p.product.price !== null"> · {{ formatEuro(p.product.price) }}</template>
                  <template v-if="!p.product.isActive"> · niet actief</template>
                </p>
              </td>
              <td class="hidden whitespace-nowrap text-(--color-text-muted) sm:table-cell">{{ p.product.unit ?? "—" }}</td>
              <td class="whitespace-nowrap font-medium text-(--color-text-strong)">
                {{ promotionLabel(p) }}
              </td>
              <!-- In een groep staan periode, status en klanten al op de groepslijn. -->
              <td class="whitespace-nowrap">
                <template v-if="!entry.group">
                  {{ formatDate(p.startsOn) }} – {{ formatDate(p.endsOn) }}
                  <span class="block text-[0.8125rem] text-(--color-text-muted)">
                    {{ dayCount(p) }} dag{{ dayCount(p) !== 1 ? "en" : "" }}
                  </span>
                </template>
              </td>
              <td>
                <span v-if="!entry.group" class="adm-badge" :class="STATUS_BADGE[p.status]">
                  {{ PROMOTION_STATUS_LABELS[p.status] }}
                </span>
              </td>
              <td class="hidden min-w-48 lg:table-cell">
                <template v-if="entry.group" />
                <span v-else-if="p.allCustomers" class="adm-badge adm-badge--neutral">Alle klanten</span>
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
                  v-if="!entry.group"
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
            </template>
            </template>
            <tr v-if="entries.length === 0">
              <td colspan="8" class="adm-card-empty">{{ emptyText }}</td>
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
  todayInBrussels,
  type PromotionDiscount,
  type PromotionStatus,
} from "#shared/promotion";
import type {
  PromotionWizardGroup,
  PromotionWizardInitial,
} from "~/components/admin/PromotionWizard.vue";

definePageMeta({ layout: "admin", middleware: "admin" });
useHead({ title: "Promoties — Vleeswaren Vermeir" });

interface PromotionDto extends PromotionDiscount {
  id: string;
  startsOn: string;
  endsOn: string;
  allCustomers: boolean;
  status: PromotionStatus;
  group: PromotionWizardGroup | null;
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

/** Eén lijn: een groep met haar promoties, of één promotie zonder groep. */
interface PromotionEntry {
  key: string;
  group: PromotionWizardGroup | null;
  items: PromotionDto[];
}

interface PromotionsResponse {
  entries: PromotionEntry[];
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

const entries = computed(() => data.value?.entries ?? []);
const items = computed(() => entries.value.flatMap((e) => e.items));
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

/**
 * Periode voor een kopie: de week na vandaag, maandag t.e.m. zondag. Zo is
 * de folder van volgende week: dupliceren, naam aanpassen, producten bijwerken.
 */
function nextWeek() {
  const today = new Date(`${todayInBrussels()}T00:00:00Z`);
  const weekday = (today.getUTCDay() + 6) % 7; // maandag = 0
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() + 7 - weekday);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { startsOn: monday.toISOString().slice(0, 10), endsOn: sunday.toISOString().slice(0, 10) };
}

function wizardItem(p: PromotionDto) {
  return {
    product: {
      id: p.product.id,
      articleNr: p.product.articleNr,
      name: p.product.name,
      unit: p.product.unit,
      price: p.product.price,
    },
    discount: {
      type: p.type,
      percentage: p.percentage,
      minQuantity: p.minQuantity,
      buyQuantity: p.buyQuantity,
      freeQuantity: p.freeQuantity,
      price: p.price,
    },
  };
}

/**
 * `null` = nieuw. Een losse promotie bewerken of dupliceren (`duplicate`);
 * een promotie uit een groep opent de hele groep, met dat product klaar.
 */
function openWizard(p: PromotionDto | null, duplicate = false) {
  if (p?.group) {
    void openGroupWizard({ key: p.group.id, group: p.group, items: [] }, false, p.product.id);
    return;
  }
  wizardInitial.value = p
    ? {
        id: duplicate ? undefined : p.id,
        groupName: "",
        items: [wizardItem(p)],
        ...(duplicate ? nextWeek() : { startsOn: p.startsOn, endsOn: p.endsOn }),
        allCustomers: p.allCustomers,
        customers: p.customers,
      }
    : null;
  wizardOpen.value = true;
}

interface PromotionGroupResponse {
  id: string;
  name: string;
  startsOn: string | null;
  endsOn: string | null;
  allCustomers: boolean;
  customers: PromotionDto["customers"];
  items: PromotionWizardInitial["items"];
}

/**
 * Een groep bewerken, of dupliceren als nieuwe groep (bv. de folder van
 * volgende week). De groep wordt volledig opgehaald: de lijst toont bij
 * filters maar een deel, en opslaan vervangt de hele groep.
 */
async function openGroupWizard(entry: PromotionEntry, duplicate = false, focusProductId?: string) {
  if (!entry.group) return;
  let group: PromotionGroupResponse;
  try {
    group = await $fetch<PromotionGroupResponse>(`/api/admin/promotion-groups/${entry.group.id}`);
  } catch {
    notice.value = "Promotie openen mislukt. Probeer het later opnieuw.";
    return;
  }
  wizardInitial.value = {
    groupId: duplicate ? undefined : group.id,
    groupName: duplicate ? `${group.name} (kopie)` : group.name,
    items: group.items,
    focusProductId,
    ...(duplicate
      ? nextWeek()
      : { startsOn: group.startsOn ?? todayInBrussels(), endsOn: group.endsOn ?? todayInBrussels() }),
    allCustomers: group.allCustomers,
    customers: group.customers,
  };
  wizardOpen.value = true;
}

async function onSaved(message: string) {
  wizardOpen.value = false;
  notice.value = message;
  await refresh();
}

// --- Groepen --------------------------------------------------------------

const openGroups = ref<Set<string>>(new Set());

// Zoeken: groepen met treffers meteen openklappen.
watch(entries, (list) => {
  if (!debouncedSearch.value) return;
  for (const e of list) if (e.group) openGroups.value.add(e.group.id);
});

function isGroupOpen(entry: PromotionEntry) {
  return entry.group ? openGroups.value.has(entry.group.id) : true;
}

function toggleGroup(entry: PromotionEntry) {
  if (!entry.group) return;
  if (openGroups.value.has(entry.group.id)) openGroups.value.delete(entry.group.id);
  else openGroups.value.add(entry.group.id);
}

/**
 * Wat er onder een lijn staat, per kortingsregel (producten met dezelfde
 * korting). Een losse promotie altijd; een groep enkel als ze open staat.
 */
function visibleParts(entry: PromotionEntry) {
  if (!entry.group) return [{ key: entry.key, label: null, items: entry.items }];
  if (!isGroupOpen(entry)) return [];
  const parts = new Map<string, { key: string; label: string | null; items: PromotionDto[] }>();
  for (const p of entry.items) {
    const label = promotionLabel(p);
    const part = parts.get(label) ?? { key: `${entry.key}:${label}`, label, items: [] };
    part.items.push(p);
    parts.set(label, part);
  }
  return [...parts.values()];
}

function productCount(entry: PromotionEntry) {
  const n = entry.items.length;
  return `${n} product${n !== 1 ? "en" : ""}`;
}

/** Eén kortingsregel? Dan die korting, anders het aantal regels. */
function groupDiscount(entry: PromotionEntry) {
  const labels = new Set(entry.items.map((p) => promotionLabel(p)));
  return labels.size === 1 ? [...labels][0]! : `${labels.size} kortingen`;
}

function groupPeriod(entry: PromotionEntry) {
  const starts = entry.items.map((p) => p.startsOn).sort();
  const ends = entry.items.map((p) => p.endsOn).sort();
  return `${formatDate(starts[0]!)} – ${formatDate(ends.at(-1)!)}`;
}

/** Actief zodra één promotie loopt; anders gepland, anders verlopen. */
function groupStatus(entry: PromotionEntry): PromotionStatus {
  const statuses = new Set(entry.items.map((p) => p.status));
  if (statuses.has("active")) return "active";
  if (statuses.has("scheduled")) return "scheduled";
  return "expired";
}

function groupAudience(entry: PromotionEntry) {
  const audiences = new Set(
    entry.items.map((p) => (p.allCustomers ? "*" : p.customers.map((c) => c.id).sort().join(","))),
  );
  return audiences.size === 1 ? audienceSummary(entry.items[0]!) : "Verschillend per product";
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

function groupSelection(entry: PromotionEntry): "none" | "some" | "all" {
  const n = entry.items.filter((p) => selected.value.has(p.id)).length;
  if (n === 0) return "none";
  return n === entry.items.length ? "all" : "some";
}

function toggleGroupSelect(entry: PromotionEntry) {
  if (groupSelection(entry) === "all") for (const p of entry.items) selected.value.delete(p.id);
  else for (const p of entry.items) selected.value.add(p.id);
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
.promo-chevron {
  width: 1rem;
  height: 1rem;
  flex: none;
  transition: transform 0.15s ease;
}
.promo-chevron--open {
  transform: rotate(90deg);
}
.promo-group-row {
  background: var(--color-surface-2);
}
/* Op de beige groepslijn valt de grijze badge anders weg. */
.promo-group-row .adm-badge--neutral {
  background: var(--color-surface);
  box-shadow: inset 0 0 0 1px var(--color-border-strong);
}
/* Kopje per kortingsregel binnen een opengeklapte groep. */
.promo-part {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--color-accent);
}
li.promo-part {
  padding-top: 0.6rem;
  padding-bottom: 0.2rem;
}
.promo-part-row td {
  padding-top: 0.6rem;
  padding-bottom: 0.2rem;
}
/* Producten van een groep inspringen onder de groepslijn. */
.promo-child-cell,
.promo-child {
  padding-left: 2.25rem;
}
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
