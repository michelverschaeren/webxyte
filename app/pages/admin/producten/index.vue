<template>
  <AdminShell title="Producten" subtitle="Volledige catalogus, inclusief inactieve producten.">
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <input
        v-model="search"
        type="text"
        placeholder="Zoek op naam, artikelnr of leverancier…"
        class="adm-input max-w-sm flex-1"
      >
      <!-- Mobiel: modal i.p.v. native select -->
      <SelectMenu
        v-model="categorySlug"
        class="sm:hidden"
        :options="categoryOptions"
        :trigger-class="menuTriggerClass"
        title="Kies een categorie"
        eyebrow="Categorieën"
      />
      <SelectMenu
        class="sm:hidden"
        :model-value="status"
        :options="statusOptions"
        :trigger-class="menuTriggerClass"
        title="Filter op status"
        eyebrow="Status"
        @update:model-value="setStatus"
      />
      <select v-model="categorySlug" class="adm-input hidden w-auto sm:block">
        <option :value="null">Alle categorieën</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.slug">
          {{ cat.name }}
        </option>
      </select>
      <select v-model="status" class="adm-input hidden w-auto sm:block">
        <option :value="null">Actief + inactief</option>
        <option value="active">Enkel actief</option>
        <option value="inactive">Enkel inactief</option>
      </select>
      <NuxtLink
        to="/admin/producten/nieuw"
        class="ml-auto rounded-lg bg-[#b8252a] px-5 py-2.5 text-xs font-semibold tracking-widest text-white uppercase transition-colors hover:bg-[#8b1f1f]"
      >
        + Nieuw product
      </NuxtLink>
    </div>

    <p class="mb-3 text-xs text-(--color-text-muted)">
      {{ pagination?.total ?? 0 }} producten
    </p>
    <p v-if="toggleError" class="mb-3 text-sm text-[#e06a6a]">
      {{ toggleError }}
    </p>

    <div class="rounded-xl border border-(--color-border) overflow-hidden">
      <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr
            class="border-b border-(--color-border) text-[0.7rem] uppercase tracking-widest text-(--color-text-muted)"
          >
            <th class="px-4 py-3 text-left font-semibold">
              <button type="button" class="adm-sort" @click="toggleSort('articleNr')">
                Artikelnr {{ sortIndicator("articleNr") }}
              </button>
            </th>
            <th class="px-4 py-3 text-left font-semibold">
              <button type="button" class="adm-sort" @click="toggleSort('name')">
                Naam {{ sortIndicator("name") }}
              </button>
            </th>
            <th class="hidden px-4 py-3 text-left font-semibold sm:table-cell">
              <button type="button" class="adm-sort" @click="toggleSort('supplier')">
                Leverancier {{ sortIndicator("supplier") }}
              </button>
            </th>
            <th class="hidden px-4 py-3 text-left font-semibold md:table-cell">
              <button type="button" class="adm-sort" @click="toggleSort('category')">
                Categorie {{ sortIndicator("category") }}
              </button>
            </th>
            <th class="hidden px-4 py-3 text-right font-semibold lg:table-cell">
              Prijs
            </th>
            <th class="hidden px-4 py-3 text-right font-semibold lg:table-cell">
              <button type="button" class="adm-sort" @click="toggleSort('sold')">
                Verkocht {{ sortIndicator("sold") }}
              </button>
            </th>
            <th class="px-4 py-3 text-left font-semibold">Status</th>
            <th class="px-4 py-3"/>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in items"
            :key="p.id"
            class="border-b border-(--color-border) last:border-0 hover:bg-(--color-hover)"
          >
            <td class="px-4 py-2.5 text-(--color-accent)">{{ p.articleNr }}</td>
            <td class="px-4 py-2.5 text-(--color-text-strong)">
              <span class="inline-flex items-center gap-2">
                {{ p.name }}
                <a
                  v-if="p.infoPdf"
                  :href="p.infoPdf"
                  target="_blank"
                  :title="`Productfiche ${p.name} openen`"
                  :aria-label="`Productfiche ${p.name} openen`"
                  class="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#c89868]/40 text-[0.65rem] font-bold italic text-(--color-accent) transition-colors hover:bg-[#c89868] hover:text-[#1a0a0a]"
                >
                  i
                </a>
              </span>
            </td>
            <td class="hidden px-4 py-2.5 text-(--color-text-muted) sm:table-cell">
              {{ p.supplier }}
            </td>
            <td class="hidden px-4 py-2.5 text-(--color-text-muted) md:table-cell">
              {{ p.category.name }}
            </td>
            <td class="hidden px-4 py-2.5 text-right text-(--color-text-muted) lg:table-cell">
              {{ p.price != null ? `€ ${p.price.toFixed(2)}` : "—" }}
            </td>
            <td class="hidden px-4 py-2.5 text-right text-(--color-text-muted) lg:table-cell">
              {{ p.soldQuantity }}
            </td>
            <td class="px-4 py-2.5">
              <button
                type="button"
                :disabled="togglingIds.has(p.id)"
                :title="p.isActive ? 'Klik om inactief te maken' : 'Klik om actief te maken'"
                :aria-label="`${p.name}: ${p.isActive ? 'actief' : 'inactief'}, klik om te wisselen`"
                class="cursor-pointer rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.08em] transition-colors disabled:cursor-wait disabled:opacity-50"
                :class="
                  p.isActive
                    ? 'text-[#8fc98f] border border-[#8fc98f]/40 hover:bg-[#8fc98f]/10'
                    : 'text-(--color-text-muted) border border-(--color-border-strong) hover:bg-(--color-hover) hover:text-(--color-text)'
                "
                @click="toggleActive(p)"
              >
                {{ p.isActive ? "Actief" : "Inactief" }}
              </button>
            </td>
            <td class="px-4 py-2.5 text-right">
              <NuxtLink
                :to="`/admin/producten/${p.id}`"
                class="text-xs font-semibold tracking-[0.08em] text-(--color-accent) uppercase hover:text-[#e8c97a]"
              >
                Bewerken →
              </NuxtLink>
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td colspan="8" class="px-4 py-10 text-center text-(--color-text-muted)">
              Geen producten gevonden.
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

    <div
      v-if="pagination && pagination.pageCount > 1"
      class="mt-8 flex items-center justify-center gap-4"
    >
      <button
        type="button"
        :disabled="page <= 1"
        class="rounded-lg border border-(--color-border-strong) px-4 py-2 text-xs font-semibold tracking-[0.08em] text-(--color-text) uppercase transition-colors hover:bg-(--color-hover) disabled:cursor-not-allowed disabled:opacity-40"
        @click="page--"
      >
        Vorige
      </button>
      <span class="text-xs text-(--color-text-muted)">
        Pagina {{ page }} van {{ pagination.pageCount }}
      </span>
      <button
        type="button"
        :disabled="page >= pagination.pageCount"
        class="rounded-lg border border-(--color-border-strong) px-4 py-2 text-xs font-semibold tracking-[0.08em] text-(--color-text) uppercase transition-colors hover:bg-(--color-hover) disabled:cursor-not-allowed disabled:opacity-40"
        @click="page++"
      >
        Volgende
      </button>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import type { SelectMenuOption } from "~/components/SelectMenu.vue";

definePageMeta({ layout: "main", middleware: "admin" });
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

const search = ref("");
const debouncedSearch = ref("");
let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(search, (value) => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    debouncedSearch.value = value;
  }, 300);
});

const categorySlug = ref<string | null>(null);
const status = ref<"active" | "inactive" | null>(null);

// Op mobiel vervangt een modal (SelectMenu) de native selects; de opties staan
// hier zodat beide varianten dezelfde lijst tonen.
const categoryOptions = computed<SelectMenuOption[]>(() => [
  { value: null, label: "Alle categorieën" },
  ...categories.value.map((c) => ({ value: c.slug, label: c.name })),
]);
const statusOptions: SelectMenuOption[] = [
  { value: null, label: "Actief + inactief" },
  { value: "active", label: "Enkel actief" },
  { value: "inactive", label: "Enkel inactief" },
];
function setStatus(value: string | null) {
  status.value = value as typeof status.value;
}
const menuTriggerClass =
  "justify-between rounded-lg border border-(--color-border-strong) bg-(--color-surface-2) px-3.5 py-2.5 text-[0.85rem] text-(--color-text-strong) focus:outline-none focus:border-[#c89868]";

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

watch([debouncedSearch, categorySlug, status, sortKey, sortDir], () => {
  page.value = 1;
});

const query = computed(() => ({
  search: debouncedSearch.value || undefined,
  category: categorySlug.value || undefined,
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
.adm-sort {
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  color: inherit;
  font: inherit;
  text-transform: inherit;
  letter-spacing: inherit;
}
.adm-sort:hover {
  color: var(--color-text-strong);
}
</style>
