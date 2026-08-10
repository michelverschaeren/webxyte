<template>
  <div class="bg-(--color-bg) text-(--color-text) min-h-screen">
    <!-- Page header -->
    <div
      class="relative py-20 px-4 overflow-hidden"
      style="
        background: radial-gradient(
          ellipse at 50% 40%,
          var(--gradient-banner-1) 0%,
          var(--gradient-banner-2) 45%,
          var(--gradient-banner-3) 100%
        );
      "
    >
      <div class="relative z-1 max-w-300 mx-auto text-center pt-12">
        <h1
          class="font-['Playfair_Display',Georgia,serif] text-[clamp(2.5rem,6vw,5rem)] font-black text-white leading-[1.05] mb-4"
        >
          Producten &amp; Bestellen
        </h1>
        <p class="text-white/70 text-lg max-w-xl mx-auto">
          {{ pagination.total }} producten gevonden
        </p>
      </div>
    </div>

    <div class="max-w-325 mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <!-- Search bar + lists action -->
      <div
        class="mb-8 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center max-w-3xl mx-auto"
      >
        <div class="relative flex-1">
          <svg
            class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#c89868]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            v-model="search"
            type="text"
            placeholder="Zoek op naam, artikelnr of fabrikant…"
            class="w-full pl-12 pr-5 py-4 bg-(--color-surface) border border-(--color-border) text-(--color-text) placeholder-(--color-text-muted) text-sm focus:outline-none focus:border-[#c89868] transition-colors"
          />
        </div>
        <button
          type="button"
          @click="orderLists.openPanel()"
          class="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-4 border border-[#c89868] text-[#c89868] text-[0.75rem] font-semibold uppercase tracking-[0.15em] hover:bg-[#c89868] hover:text-[#1a0a0a] transition-colors"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          Mijn bestellijsten
          <span
            v-if="orderLists.lists.value.length"
            class="text-[0.7rem] opacity-70"
            >({{ orderLists.lists.value.length }})</span
          >
        </button>
        <!-- Layout toggle -->
        <div class="shrink-0 flex border border-(--color-border-strong)">
          <button
            type="button"
            @click="viewLayout = 'grid'"
            :class="
              viewLayout === 'grid'
                ? 'bg-(--color-hover) text-[#c89868]'
                : 'text-(--color-text-muted) hover:text-(--color-text)'
            "
            class="w-10 h-13 inline-flex items-center justify-center transition-colors"
            title="Rasterweergave"
            aria-label="Rasterweergave"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <rect x="2" y="2" width="7" height="7" rx="1" />
              <rect x="11" y="2" width="7" height="7" rx="1" />
              <rect x="2" y="11" width="7" height="7" rx="1" />
              <rect x="11" y="11" width="7" height="7" rx="1" />
            </svg>
          </button>
          <button
            type="button"
            @click="viewLayout = 'table'"
            :class="
              viewLayout === 'table'
                ? 'bg-(--color-hover) text-[#c89868]'
                : 'text-(--color-text-muted) hover:text-(--color-text)'
            "
            class="w-10 h-13 inline-flex items-center justify-center transition-colors border-l border-(--color-border-strong)"
            title="Lijstweergave"
            aria-label="Lijstweergave"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      <div class="flex gap-8">
        <!-- Sidebar (desktop) -->
        <aside class="hidden lg:block w-60 shrink-0">
          <div class="bg-(--color-surface) border border-(--color-border)">
            <div class="px-5 py-4 border-b border-(--color-border)">
              <p
                class="uppercase tracking-[0.2em] text-[0.7rem] text-[#c89868] font-semibold"
              >
                Categorieën
              </p>
            </div>
            <div class="py-2">
              <button
                @click="selectedCategorySlug = null"
                class="w-full text-left px-5 py-2.5 text-sm transition-colors"
                :class="
                  !selectedCategorySlug
                    ? 'text-[#c89868] bg-(--color-hover)'
                    : 'text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-hover)'
                "
              >
                Alle categorieën
                <span class="float-right text-[#c89868]/60">{{
                  totalActiveCount
                }}</span>
              </button>
              <button
                v-for="cat in categories"
                :key="cat.id"
                @click="selectedCategorySlug = cat.slug"
                class="w-full text-left px-5 py-2 text-sm transition-colors"
                :class="
                  selectedCategorySlug === cat.slug
                    ? 'text-[#c89868] bg-(--color-hover)'
                    : 'text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-hover)'
                "
              >
                {{ cat.emoji }} {{ cat.name }}
              </button>
            </div>
          </div>
        </aside>

        <!-- Main area -->
        <div class="flex-1 min-w-0">
          <!-- Mobile category select -->
          <div class="lg:hidden mb-5">
            <select
              v-model="selectedCategorySlug"
              class="w-full px-4 py-3 bg-(--color-surface) border border-(--color-border) text-(--color-text) text-sm focus:outline-none focus:border-[#c89868]"
            >
              <option :value="null">
                Alle categorieën ({{ totalActiveCount }})
              </option>
              <option
                v-for="cat in categories"
                :key="cat.id"
                :value="cat.slug"
              >
                {{ cat.emoji }} {{ cat.name }}
              </option>
            </select>
          </div>

          <!-- Active filter chips -->
          <div
            v-if="search || selectedCategorySlug || selectedSupplier"
            class="flex flex-wrap gap-2 mb-5"
          >
            <span
              v-if="selectedCategorySlug"
              class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-[#b8252a]/20 text-(--color-text) border border-[#b8252a]/40"
            >
              {{ activeCategoryName }}
              <button
                @click="selectedCategorySlug = null"
                class="hover:text-[#c89868] transition-colors"
              >
                ✕
              </button>
            </span>
            <span
              v-if="selectedSupplier"
              class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-[#c89868]/15 text-(--color-text) border border-[#c89868]/40"
            >
              {{ selectedSupplier }}
              <button
                @click="selectedSupplier = null"
                class="hover:text-[#c89868] transition-colors"
              >
                ✕
              </button>
            </span>
            <span
              v-if="search"
              class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-(--color-hover) text-(--color-text-muted) border border-(--color-border)"
            >
              "{{ search }}"
              <button
                @click="search = ''"
                class="hover:text-[#c89868] transition-colors"
              >
                ✕
              </button>
            </span>
          </div>

          <!-- Empty state -->
          <div
            v-if="!pending && items.length === 0"
            class="flex flex-col items-center justify-center py-24 gap-4 text-center"
          >
            <span class="text-6xl">🔍</span>
            <p class="text-lg font-semibold text-(--color-text)">
              Geen producten gevonden
            </p>
            <p class="text-(--color-text-muted) text-sm">
              Probeer een andere zoekterm, categorie of fabrikant.
            </p>
            <button
              @click="
                search = '';
                selectedCategorySlug = null;
                selectedSupplier = null;
              "
              class="mt-2 px-6 py-3 bg-[#b8252a] text-white text-sm font-semibold uppercase tracking-widest hover:bg-[#8b1f1f] transition-colors"
            >
              Reset filters
            </button>
          </div>

          <!-- Product grid -->
          <div
            v-else-if="viewLayout === 'grid'"
            class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            <div
              v-for="product in items"
              :key="product.id"
              class="group bg-(--color-surface) border border-(--color-border) hover:border-[#c89868]/50 transition-all duration-300 flex flex-col"
            >
              <div class="p-5 flex flex-col gap-3 flex-1">
                <div class="flex items-start justify-between gap-3">
                  <h3
                    class="text-(--color-text) font-semibold text-[0.95rem] leading-[1.3] group-hover:text-(--color-text-strong) transition-colors"
                  >
                    {{ product.name }}
                  </h3>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <button
                      v-if="product.infoPdf"
                      type="button"
                      @click="openInfo(product)"
                      :title="`Productfiche ${product.name}`"
                      :aria-label="`Toon productfiche ${product.name}`"
                      class="w-6 h-6 inline-flex items-center justify-center rounded-full border border-[#c89868]/40 text-[#c89868] text-[0.7rem] font-bold italic hover:bg-[#c89868] hover:text-[#1a0a0a] transition-colors"
                    >
                      i
                    </button>
                    <span
                      class="text-[0.7rem] text-[#c89868] border border-[#c89868]/25 px-2 py-0.5 uppercase tracking-[0.08em]"
                      >{{ product.articleNr }}</span
                    >
                  </div>
                </div>
                <p
                  v-if="product.unit"
                  class="text-[#c89868]/90 text-[0.8rem] font-medium"
                >
                  {{ product.unit }}
                </p>
                <button
                  type="button"
                  @click="selectedSupplier = product.supplier"
                  :title="`Filter op fabrikant: ${product.supplier}`"
                  class="text-(--color-text-muted) hover:text-[#c89868] text-[0.8rem] transition-colors text-left"
                >
                  {{ product.supplier }}
                </button>
                <button
                  type="button"
                  @click="selectedCategorySlug = product.category.slug"
                  :title="`Filter op categorie: ${product.category.name}`"
                  class="text-[0.7rem] text-[#c89868]/70 hover:text-[#c89868] uppercase tracking-widest mt-auto transition-colors text-left"
                >
                  {{ product.category.name }}
                </button>
              </div>
              <div class="flex items-stretch border-t border-(--color-border)">
                <div class="flex items-center select-none">
                  <button
                    type="button"
                    @click="setQty(product.id, getQty(product.id) - 1)"
                    class="w-9 h-10 text-[#c89868] hover:bg-(--color-hover) transition-colors text-lg"
                    aria-label="Verlaag aantal"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    :value="getQty(product.id)"
                    @input="
                      setQty(
                        product.id,
                        Number(($event.target as HTMLInputElement).value),
                      )
                    "
                    class="w-10 h-10 bg-transparent text-center text-sm text-(--color-text) focus:outline-none focus:bg-(--color-hover) [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    @click="setQty(product.id, getQty(product.id) + 1)"
                    class="w-9 h-10 text-[#c89868] hover:bg-(--color-hover) transition-colors text-lg"
                    aria-label="Verhoog aantal"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  @click="addToCart(product)"
                  class="flex-1 bg-[#b8252a] text-white text-[0.75rem] font-semibold uppercase tracking-[0.08em] hover:bg-[#8b1f1f] transition-colors"
                >
                  + Toevoegen
                </button>
              </div>
            </div>
          </div>

          <!-- Table layout -->
          <div v-else-if="viewLayout === 'table'" class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr
                  class="border-b border-(--color-border) text-[0.7rem] uppercase tracking-[0.12em]"
                >
                  <th class="text-left py-3 px-3 font-semibold">
                    <button
                      type="button"
                      @click="toggleSort('name')"
                      class="inline-flex items-center gap-1.5 group"
                      :class="
                        sortKey === 'name'
                          ? 'text-[#c89868]'
                          : 'text-[#c89868]/60 hover:text-[#c89868]'
                      "
                    >
                      Product
                      <span
                        class="text-[0.65rem] opacity-70 group-hover:opacity-100"
                      >
                        <template v-if="sortKey === 'name'">{{
                          sortDir === "asc" ? "▲" : "▼"
                        }}</template>
                        <template v-else>⇅</template>
                      </span>
                    </button>
                  </th>
                  <th
                    class="text-left py-3 px-3 font-semibold hidden sm:table-cell"
                  >
                    <button
                      type="button"
                      @click="toggleSort('articleNr')"
                      class="inline-flex items-center gap-1.5 group"
                      :class="
                        sortKey === 'articleNr'
                          ? 'text-[#c89868]'
                          : 'text-[#c89868]/60 hover:text-[#c89868]'
                      "
                    >
                      Art. nr
                      <span
                        class="text-[0.65rem] opacity-70 group-hover:opacity-100"
                      >
                        <template v-if="sortKey === 'articleNr'">{{
                          sortDir === "asc" ? "▲" : "▼"
                        }}</template>
                        <template v-else>⇅</template>
                      </span>
                    </button>
                  </th>
                  <th
                    class="text-left py-3 px-3 font-semibold hidden md:table-cell"
                  >
                    <button
                      type="button"
                      @click="toggleSort('supplier')"
                      class="inline-flex items-center gap-1.5 group"
                      :class="
                        sortKey === 'supplier'
                          ? 'text-[#c89868]'
                          : 'text-[#c89868]/60 hover:text-[#c89868]'
                      "
                    >
                      Fabrikant
                      <span
                        class="text-[0.65rem] opacity-70 group-hover:opacity-100"
                      >
                        <template v-if="sortKey === 'supplier'">{{
                          sortDir === "asc" ? "▲" : "▼"
                        }}</template>
                        <template v-else>⇅</template>
                      </span>
                    </button>
                  </th>
                  <th
                    class="text-left py-3 px-3 font-semibold hidden lg:table-cell"
                  >
                    <button
                      type="button"
                      @click="toggleSort('unit')"
                      class="inline-flex items-center gap-1.5 group"
                      :class="
                        sortKey === 'unit'
                          ? 'text-[#c89868]'
                          : 'text-[#c89868]/60 hover:text-[#c89868]'
                      "
                    >
                      Eenheid
                      <span
                        class="text-[0.65rem] opacity-70 group-hover:opacity-100"
                      >
                        <template v-if="sortKey === 'unit'">{{
                          sortDir === "asc" ? "▲" : "▼"
                        }}</template>
                        <template v-else>⇅</template>
                      </span>
                    </button>
                  </th>
                  <th
                    class="text-left py-3 px-3 font-semibold hidden xl:table-cell"
                  >
                    <button
                      type="button"
                      @click="toggleSort('category')"
                      class="inline-flex items-center gap-1.5 group"
                      :class="
                        sortKey === 'category'
                          ? 'text-[#c89868]'
                          : 'text-[#c89868]/60 hover:text-[#c89868]'
                      "
                    >
                      Categorie
                      <span
                        class="text-[0.65rem] opacity-70 group-hover:opacity-100"
                      >
                        <template v-if="sortKey === 'category'">{{
                          sortDir === "asc" ? "▲" : "▼"
                        }}</template>
                        <template v-else>⇅</template>
                      </span>
                    </button>
                  </th>
                  <th
                    class="py-3 px-3 font-semibold w-52 text-center text-[#c89868]/60"
                  >
                    Aantal &amp; Toevoegen
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="product in items"
                  :key="product.id"
                  class="border-b border-(--color-border) hover:bg-(--color-hover) transition-colors group"
                >
                  <td class="py-2.5 px-3">
                    <div class="flex items-center gap-2">
                      <span
                        class="text-(--color-text) font-medium group-hover:text-(--color-text-strong) transition-colors"
                        >{{ product.name }}</span
                      >
                      <button
                        v-if="product.infoPdf"
                        type="button"
                        @click="openInfo(product)"
                        :title="`Productfiche ${product.name}`"
                        class="shrink-0 w-5 h-5 inline-flex items-center justify-center rounded-full border border-[#c89868]/40 text-[#c89868] text-[0.65rem] font-bold italic hover:bg-[#c89868] hover:text-[#1a0a0a] transition-colors"
                      >
                        i
                      </button>
                    </div>
                    <!-- Mobile fallback: art. nr + supplier -->
                    <div class="flex gap-2 mt-0.5 sm:hidden">
                      <span
                        class="text-[0.7rem] text-[#c89868] border border-[#c89868]/25 px-1.5 py-0.5"
                        >{{ product.articleNr }}</span
                      >
                      <button
                        type="button"
                        @click="selectedSupplier = product.supplier"
                        class="text-[0.7rem] text-(--color-text-muted) hover:text-[#c89868] transition-colors"
                      >
                        {{ product.supplier }}
                      </button>
                    </div>
                  </td>
                  <td class="py-2.5 px-3 hidden sm:table-cell">
                    <span
                      class="text-[0.75rem] text-[#c89868] border border-[#c89868]/25 px-2 py-0.5 uppercase tracking-[0.08em]"
                      >{{ product.articleNr }}</span
                    >
                  </td>
                  <td
                    class="py-2.5 px-3 text-[0.8rem] hidden md:table-cell"
                  >
                    <button
                      type="button"
                      @click="selectedSupplier = product.supplier"
                      :title="`Filter op fabrikant: ${product.supplier}`"
                      class="text-(--color-text-muted) hover:text-[#c89868] transition-colors text-left"
                    >
                      {{ product.supplier }}
                    </button>
                  </td>
                  <td
                    class="py-2.5 px-3 text-[#c89868]/80 text-[0.8rem] hidden lg:table-cell"
                  >
                    {{ product.unit ?? "—" }}
                  </td>
                  <td class="py-2.5 px-3 hidden xl:table-cell">
                    <button
                      type="button"
                      @click="selectedCategorySlug = product.category.slug"
                      :title="`Filter op categorie: ${product.category.name}`"
                      class="text-[0.7rem] text-[#c89868]/70 hover:text-[#c89868] uppercase tracking-widest transition-colors text-left"
                    >
                      {{ product.category.name }}
                    </button>
                  </td>
                  <td class="py-2 px-3">
                    <div class="flex items-center justify-center gap-1.5">
                      <div class="flex items-center border border-(--color-border)">
                        <button
                          type="button"
                          @click="setQty(product.id, getQty(product.id) - 1)"
                          class="w-7 h-8 text-[#c89868] hover:bg-(--color-hover) transition-colors"
                          aria-label="Verlaag aantal"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          :value="getQty(product.id)"
                          @input="
                            setQty(
                              product.id,
                              Number(($event.target as HTMLInputElement).value),
                            )
                          "
                          class="w-9 h-8 bg-transparent text-center text-sm text-(--color-text) focus:outline-none focus:bg-(--color-hover) [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          @click="setQty(product.id, getQty(product.id) + 1)"
                          class="w-7 h-8 text-[#c89868] hover:bg-(--color-hover) transition-colors"
                          aria-label="Verhoog aantal"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        @click="addToCart(product)"
                        class="h-8 px-3 bg-[#b8252a] text-white text-[0.7rem] font-semibold uppercase tracking-[0.08em] hover:bg-[#8b1f1f] transition-colors whitespace-nowrap"
                      >
                        + Toevoegen
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Load more -->
          <div
            v-if="pagination.total > PAGE_SIZE"
            class="mt-10 flex flex-col items-center gap-4"
          >
            <p class="text-sm text-(--color-text-muted)">
              {{ items.length }} van {{ pagination.total }} producten
            </p>
            <div class="w-full max-w-xs bg-(--color-hover) h-0.5">
              <div
                class="h-0.5 bg-[#c89868] transition-all duration-300"
                :style="`width: ${Math.min((items.length / pagination.total) * 100, 100)}%`"
              />
            </div>
            <button
              v-if="hasMore"
              @click="loadMore"
              class="px-8 py-3 border border-[#c89868] text-[#c89868] text-sm font-semibold uppercase tracking-[0.15em] hover:bg-[#c89868] hover:text-[#1a0a0a] transition-all duration-200"
            >
              Meer laden
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Product info (PDF) modal -->
    <ProductsProductInfoModal
      :open="infoOpen"
      :title="infoProduct?.name ?? ''"
      :pdf-url="infoProduct?.infoPdf ?? ''"
      @close="infoOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "main" });

useSeoMeta({
  title: "Producten & Bestellen — Vleeswaren Vermeir",
  description:
    "Doorzoek meer dan 5000 vleeswaren producten en voeg ze toe aan uw bestellijst.",
});

const cart = useCart();
const orderLists = useOrderLists();
const route = useRoute();

if (import.meta.client) orderLists.ensureLoaded();

interface CategoryDto {
  id: string;
  code: string;
  slug: string;
  name: string;
  emoji: string | null;
  image: string | null;
  productCount: number;
}

interface ProductDto {
  id: string;
  articleNr: string;
  name: string;
  supplier: string;
  unit: string | null;
  infoPdf: string | null;
  category: {
    id: string;
    slug: string;
    name: string;
    emoji: string | null;
    image: string | null;
  };
}

interface ProductsResponse {
  items: ProductDto[];
  pagination: { page: number; perPage: number; total: number; pageCount: number };
}

const { data: categoriesData } = await useFetch<CategoryDto[]>("/api/categories");
const categories = computed(() => categoriesData.value ?? []);
const totalActiveCount = computed(() =>
  categories.value.reduce((sum, c) => sum + c.productCount, 0),
);

const search = ref("");
const debouncedSearch = ref("");
let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(search, (value) => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    debouncedSearch.value = value;
  }, 300);
});

const selectedCategorySlug = ref<string | null>(
  (route.query.category as string) ?? null,
);
const selectedSupplier = ref<string | null>(null);
const viewLayout = ref<"grid" | "table">("table");

// Table sort
type SortKey = "name" | "articleNr" | "supplier" | "unit" | "category";
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

const PAGE_SIZE = 24;

// Alle actieve filters/sortering in één object; wijzigt dit, dan herlaadt
// pagina 1 automatisch via de `watch`-optie van useAsyncData hieronder.
const queryParams = computed(() => ({
  category: selectedCategorySlug.value || undefined,
  search: debouncedSearch.value || undefined,
  supplier: selectedSupplier.value || undefined,
  sort: sortKey.value || undefined,
  sortDir: sortDir.value,
}));

const { data: firstPage, pending } = await useAsyncData<ProductsResponse>(
  "producten-page-1",
  () =>
    $fetch<ProductsResponse>("/api/products", {
      query: { ...queryParams.value, page: 1, perPage: PAGE_SIZE },
    }),
  { watch: [queryParams] },
);

// "Meer laden" voegt volgende pagina's toe bovenop `firstPage`, zonder al
// geladen producten te laten verspringen. Bij een filterwijziging herstart
// useAsyncData vanzelf bij pagina 1 — daarom resetten we hier mee.
const extraItems = ref<ProductDto[]>([]);
const loadedPages = ref(1);

watch(queryParams, () => {
  extraItems.value = [];
  loadedPages.value = 1;
});

const items = computed<ProductDto[]>(() => [
  ...(firstPage.value?.items ?? []),
  ...extraItems.value,
]);

const pagination = computed(
  () =>
    firstPage.value?.pagination ?? {
      page: 1,
      perPage: PAGE_SIZE,
      total: 0,
      pageCount: 0,
    },
);

const hasMore = computed(() => items.value.length < pagination.value.total);

async function loadMore() {
  loadedPages.value++;
  const res = await $fetch<ProductsResponse>("/api/products", {
    query: {
      ...queryParams.value,
      page: loadedPages.value,
      perPage: PAGE_SIZE,
    },
  });
  extraItems.value.push(...res.items);
}

// Per-card quantity state
const qtyMap = reactive<Record<string, number>>({});
function getQty(id: string): number {
  return qtyMap[id] ?? 1;
}
function setQty(id: string, value: number) {
  const v = Number.isFinite(value) ? Math.floor(value) : 1;
  qtyMap[id] = Math.max(1, v);
}

// Info modal
const infoOpen = ref(false);
const infoProduct = ref<ProductDto | null>(null);
function openInfo(p: ProductDto) {
  infoProduct.value = p;
  infoOpen.value = true;
}

const activeCategoryName = computed(
  () =>
    categories.value.find((c) => c.slug === selectedCategorySlug.value)
      ?.name ?? "",
);

function addToCart(product: ProductDto) {
  const qty = getQty(product.id);
  cart.addItem(
    {
      // Artikelnummer als sleutel: zo valt een product uit een opgeslagen
      // lijst of vorige bestelling samen met dezelfde regel in het mandje.
      id: product.articleNr,
      articleNr: product.articleNr,
      name: product.name,
      supplier: product.supplier,
      unit: product.unit ?? undefined,
    },
    qty,
  );
  qtyMap[product.id] = 1;
}
</script>
