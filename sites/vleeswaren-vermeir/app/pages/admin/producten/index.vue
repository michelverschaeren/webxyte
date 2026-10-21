<template>
  <AdminShell title="Producten" subtitle="Volledige catalogus, inclusief inactieve producten.">
    <template #actions>
      <NuxtLink to="/admin/producten/nieuw" class="adm-btn adm-btn--primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14" />
        </svg>
        Nieuw product
      </NuxtLink>
    </template>

    <div class="adm-tabs" role="group" aria-label="Filter op status">
      <button
        v-for="option in STATUS_TABS"
        :key="option.value ?? 'all'"
        type="button"
        class="adm-tab"
        :aria-pressed="status === option.value"
        @click="status = option.value"
      >
        {{ option.label }}
      </button>
    </div>

    <p v-if="toggleError" class="adm-notice" role="alert">{{ toggleError }}</p>

    <div class="adm-card">
      <div class="adm-card-toolbar">
        <AdminSearchField
          v-model="search"
          name="producten-zoeken"
          placeholder="Zoek op naam, artikelnr of leverancier…"
          class="w-full sm:w-72"
        />
        <!-- Mobiel: modal i.p.v. native select -->
        <div class="grid w-full grid-cols-2 gap-2 sm:hidden">
          <SelectMenu
            v-model="categorySlug"
            :options="categoryOptions"
            :trigger-class="menuTriggerClass"
            title="Kies een categorie"
            eyebrow="Categorieën"
          />
          <SelectMenu
            v-model="supplier"
            :options="supplierOptions"
            :trigger-class="menuTriggerClass"
            title="Kies een leverancier"
            eyebrow="Leveranciers"
          />
        </div>
        <div class="hidden items-center gap-2 sm:ml-auto sm:flex">
          <select v-model="categorySlug" aria-label="Categorie" class="adm-input w-auto max-w-56">
            <option :value="null">Alle categorieën</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.slug">
              {{ cat.name }}
            </option>
          </select>
          <select v-model="supplier" aria-label="Leverancier" class="adm-input w-auto max-w-56">
            <option :value="null">Alle leveranciers</option>
            <option v-for="s in suppliers" :key="s.name" :value="s.name">
              {{ s.name }} ({{ s.productCount }})
            </option>
          </select>
          <button
            v-if="categorySlug || supplier"
            type="button"
            class="adm-btn adm-btn--ghost adm-btn--sm"
            @click="categorySlug = null; supplier = null"
          >
            Wissen
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="adm-table">
          <thead>
            <tr>
              <th>
                <button type="button" class="adm-sort" @click="toggleSort('articleNr')">
                  Artikelnr {{ sortIndicator("articleNr") }}
                </button>
              </th>
              <th class="w-full">
                <button type="button" class="adm-sort" @click="toggleSort('name')">
                  Naam {{ sortIndicator("name") }}
                </button>
              </th>
              <th class="hidden sm:table-cell">
                <button type="button" class="adm-sort" @click="toggleSort('supplier')">
                  Leverancier {{ sortIndicator("supplier") }}
                </button>
              </th>
              <th class="hidden md:table-cell">
                <button type="button" class="adm-sort" @click="toggleSort('category')">
                  Categorie {{ sortIndicator("category") }}
                </button>
              </th>
              <th class="adm-num hidden lg:table-cell">Prijs</th>
              <th class="adm-num hidden lg:table-cell">
                <button type="button" class="adm-sort" @click="toggleSort('sold')">
                  Verkocht {{ sortIndicator("sold") }}
                </button>
              </th>
              <th>Status</th>
              <th class="adm-col-actions"><span class="sr-only">Acties</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in items" :key="p.id">
              <td class="font-mono text-[0.8125rem] text-(--color-text-muted)">{{ p.articleNr }}</td>
              <td class="font-medium text-(--color-text-strong)">
                <span class="inline-flex items-center gap-2">
                  <NuxtLink :to="`/admin/producten/${p.id}`" class="hover:text-(--color-accent)">
                    {{ p.name }}
                  </NuxtLink>
                  <a
                    v-if="p.infoPdf"
                    :href="p.infoPdf"
                    target="_blank"
                    :title="`Productfiche ${p.name} openen`"
                    :aria-label="`Productfiche ${p.name} openen`"
                    class="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-(--color-border-strong) text-[0.7rem] font-bold text-(--color-text-muted) italic transition-colors hover:border-(--color-accent) hover:text-(--color-accent)"
                  >
                    i
                  </a>
                </span>
              </td>
              <td class="hidden text-(--color-text-muted) sm:table-cell">{{ p.supplier }}</td>
              <td class="hidden text-(--color-text-muted) md:table-cell">{{ p.category.name }}</td>
              <td class="adm-num hidden lg:table-cell">
                {{ p.price != null ? `€ ${p.price.toFixed(2)}` : "—" }}
              </td>
              <td class="adm-num hidden lg:table-cell">{{ p.soldQuantity }}</td>
              <td>
                <button
                  type="button"
                  :disabled="togglingIds.has(p.id)"
                  :title="p.isActive ? 'Klik om inactief te maken' : 'Klik om actief te maken'"
                  :aria-label="`${p.name}: ${p.isActive ? 'actief' : 'inactief'}, klik om te wisselen`"
                  class="adm-badge cursor-pointer transition-opacity hover:opacity-75 disabled:cursor-wait disabled:opacity-50"
                  :class="p.isActive ? 'adm-badge--success' : 'adm-badge--neutral'"
                  @click="toggleActive(p)"
                >
                  {{ p.isActive ? "Actief" : "Inactief" }}
                </button>
              </td>
              <td class="adm-col-actions">
                <NuxtLink
                  :to="`/admin/producten/${p.id}`"
                  :aria-label="`${p.name} bewerken`"
                  title="Bewerken"
                  class="adm-row-btn"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </NuxtLink>
              </td>
            </tr>
            <tr v-if="items.length === 0">
              <td colspan="8" class="adm-card-empty">Geen producten gevonden.</td>
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
        noun="producten"
      />
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import type { SelectMenuOption } from "~/components/SelectMenu.vue";

definePageMeta({ layout: "admin", middleware: "admin" });
useHead({ title: "Producten beheren — Vleeswaren Vermeir" });

interface CategoryDto {
  id: string;
  slug: string;
  name: string;
}

interface AdminProductDto {
  id: string;
  articleNr: string;
  name: string;
  supplier: string;
  unit: string | null;
  infoPdf: string | null;
  price: number | null;
  notes: string | null;
  isActive: boolean;
  category: { id: string; slug: string; name: string };
  soldQuantity: number;
}

interface ProductsResponse {
  items: AdminProductDto[];
  pagination: { page: number; perPage: number; total: number; pageCount: number };
}

const { data: categoriesData } = await useFetch<CategoryDto[]>("/api/categories");
const categories = computed(() => categoriesData.value ?? []);

const { data: suppliersData } = await useFetch<{ name: string; productCount: number }[]>(
  "/api/admin/suppliers",
);
const suppliers = computed(() => suppliersData.value ?? []);

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

const categorySlug = ref<string | null>(null);
const supplier = ref<string | null>(null);
const status = ref<"active" | "inactive" | null>(null);

const STATUS_TABS: { value: typeof status.value; label: string }[] = [
  { value: null, label: "Alle producten" },
  { value: "active", label: "Actief" },
  { value: "inactive", label: "Inactief" },
];

// Op mobiel vervangt een modal (SelectMenu) de native selects; de opties staan
// hier zodat beide varianten dezelfde lijst tonen.
const categoryOptions = computed<SelectMenuOption[]>(() => [
  { value: null, label: "Alle categorieën" },
  ...categories.value.map((c) => ({ value: c.slug, label: c.name })),
]);
const supplierOptions = computed<SelectMenuOption[]>(() => [
  { value: null, label: "Alle leveranciers" },
  ...suppliers.value.map((s) => ({ value: s.name, label: s.name })),
]);
const menuTriggerClass =
  "h-10 w-full justify-between rounded-lg border border-(--color-border-strong) bg-(--color-surface) px-3.5 text-sm text-(--color-text-strong) focus:outline-none focus:border-(--color-accent)";

const page = ref(1);
const PAGE_SIZE = 25;

type SortKey = "name" | "articleNr" | "supplier" | "category" | "sold";
const sortKey = ref<SortKey | null>(null);
const sortDir = ref<"asc" | "desc">("asc");

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortDir.value = "asc";
  }
}

function sortIndicator(key: SortKey) {
  if (sortKey.value !== key) return "";
  return sortDir.value === "asc" ? "▲" : "▼";
}

watch([debouncedSearch, categorySlug, supplier, status, sortKey, sortDir], () => {
  page.value = 1;
});

const query = computed(() => ({
  search: debouncedSearch.value || undefined,
  category: categorySlug.value || undefined,
  supplier: supplier.value || undefined,
  status: status.value || undefined,
  sort: sortKey.value || undefined,
  sortDir: sortDir.value,
  page: page.value,
  perPage: PAGE_SIZE,
}));

const { data, refresh } = await useFetch<ProductsResponse>(
  "/api/admin/products",
  { query },
);

const items = computed(() => data.value?.items ?? []);
const pagination = computed(() => data.value?.pagination);

// Eén klik op het statuslabel wisselt actief/inactief. De rij wordt pas na
// het antwoord van de server aangepast; staat er een statusfilter aan, dan
// herladen we de lijst zodat het product er meteen uit verdwijnt.
const togglingIds = ref(new Set<string>());
const toggleError = ref("");

async function toggleActive(product: AdminProductDto) {
  if (togglingIds.value.has(product.id)) return;
  togglingIds.value = new Set(togglingIds.value).add(product.id);
  toggleError.value = "";
  try {
    await $fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      body: { isActive: !product.isActive },
    });
    if (status.value) {
      await refresh();
    } else {
      product.isActive = !product.isActive;
    }
  } catch (err) {
    toggleError.value =
      (err as { data?: { statusMessage?: string } })?.data?.statusMessage ||
      `Status van "${product.name}" wijzigen mislukt.`;
  } finally {
    const next = new Set(togglingIds.value);
    next.delete(product.id);
    togglingIds.value = next;
  }
}
</script>
