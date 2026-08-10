<template>
  <div class="bg-[#0f0d0d] text-[#e8e2dc] min-h-screen">
    <!-- Page header -->
    <div
      class="relative py-20 px-4 overflow-hidden"
      style="
        background: radial-gradient(
          ellipse at 50% 40%,
          #7a1a1a 0%,
          #4a0e0e 45%,
          #1a0808 100%
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
          {{ filteredProducts.length }} producten gevonden
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
            class="w-full pl-12 pr-5 py-4 bg-[#1a1414] border border-white/10 text-[#e8e2dc] placeholder-[#a89a8e] text-sm focus:outline-none focus:border-[#c89868] transition-colors"
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
        <div class="shrink-0 flex border border-white/15">
          <button
            type="button"
            @click="viewLayout = 'grid'"
            :class="
              viewLayout === 'grid'
                ? 'bg-white/10 text-[#c89868]'
                : 'text-[#a89a8e] hover:text-[#e8e2dc]'
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
                ? 'bg-white/10 text-[#c89868]'
                : 'text-[#a89a8e] hover:text-[#e8e2dc]'
            "
            class="w-10 h-13 inline-flex items-center justify-center transition-colors border-l border-white/15"
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
          <div class="bg-[#1a1414] border border-white/8">
            <div class="px-5 py-4 border-b border-white/8">
              <p
                class="uppercase tracking-[0.2em] text-[0.7rem] text-[#c89868] font-semibold"
              >
                Categorieën
              </p>
            </div>
            <div class="py-2">
              <button
                @click="selectedCategory = null"
                class="w-full text-left px-5 py-2.5 text-sm transition-colors"
                :class="
                  !selectedCategory
                    ? 'text-[#c89868] bg-white/5'
                    : 'text-[#a89a8e] hover:text-[#e8e2dc] hover:bg-white/3'
                "
              >
                Alle categorieën
                <span class="float-right text-[#c89868]/60">{{
                  products.length
                }}</span>
              </button>
              <button
                v-for="cat in categories"
                :key="cat.id"
                @click="selectedCategory = cat.id"
                class="w-full text-left px-5 py-2 text-sm transition-colors"
                :class="
                  selectedCategory === cat.id
                    ? 'text-[#c89868] bg-white/5'
                    : 'text-[#a89a8e] hover:text-[#e8e2dc] hover:bg-white/3'
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
              v-model="selectedCategory"
              class="w-full px-4 py-3 bg-[#1a1414] border border-white/10 text-[#e8e2dc] text-sm focus:outline-none focus:border-[#c89868]"
            >
              <option :value="null">
                Alle categorieën ({{ products.length }})
              </option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.emoji }} {{ cat.name }}
              </option>
            </select>
          </div>

          <!-- Active filter chips -->
          <div
            v-if="search || selectedCategory || selectedSupplier"
            class="flex flex-wrap gap-2 mb-5"
          >
            <span
              v-if="selectedCategory"
              class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-[#b8252a]/20 text-[#e8e2dc] border border-[#b8252a]/40"
            >
              {{ activeCategoryName }}
              <button
                @click="selectedCategory = null"
                class="hover:text-[#c89868] transition-colors"
              >
                ✕
              </button>
            </span>
            <span
              v-if="selectedSupplier"
              class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-[#c89868]/15 text-[#e8e2dc] border border-[#c89868]/40"
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
              class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-white/5 text-[#a89a8e] border border-white/10"
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
            v-if="filteredProducts.length === 0"
            class="flex flex-col items-center justify-center py-24 gap-4 text-center"
          >
            <span class="text-6xl">🔍</span>
            <p class="text-lg font-semibold text-[#e8e2dc]">
              Geen producten gevonden
            </p>
            <p class="text-[#a89a8e] text-sm">
              Probeer een andere zoekterm, categorie of fabrikant.
            </p>
            <button
              @click="
                search = '';
                selectedCategory = null;
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
              v-for="product in paginatedProducts"
              :key="product.id"
              class="group bg-[#1a1414] border border-white/8 hover:border-[#c89868]/50 transition-all duration-300 flex flex-col"
            >
              <div class="p-5 flex flex-col gap-3 flex-1">
                <div class="flex items-start justify-between gap-3">
                  <h3
                    class="text-[#e8e2dc] font-semibold text-[0.95rem] leading-[1.3] group-hover:text-white transition-colors"
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
                  class="text-[#a89a8e] hover:text-[#c89868] text-[0.8rem] transition-colors text-left"
                >
                  {{ product.supplier }}
                </button>
                <button
                  type="button"
                  @click="selectedCategory = product.categoryId"
                  :title="`Filter op categorie: ${categoryNameMap[product.categoryId]}`"
                  class="text-[0.7rem] text-[#c89868]/70 hover:text-[#c89868] uppercase tracking-widest mt-auto transition-colors text-left"
                >
                  {{ categoryNameMap[product.categoryId] }}
                </button>
              </div>
              <div class="flex items-stretch border-t border-white/6">
                <div class="flex items-center select-none">
                  <button
                    type="button"
                    @click="setQty(product.id, getQty(product.id) - 1)"
                    class="w-9 h-10 text-[#c89868] hover:bg-white/4 transition-colors text-lg"
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
                    class="w-10 h-10 bg-transparent text-center text-sm text-[#e8e2dc] focus:outline-none focus:bg-white/4 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    @click="setQty(product.id, getQty(product.id) + 1)"
                    class="w-9 h-10 text-[#c89868] hover:bg-white/4 transition-colors text-lg"
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
                  class="border-b border-white/10 text-[0.7rem] uppercase tracking-[0.12em]"
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
                  v-for="product in paginatedProducts"
                  :key="product.id"
                  class="border-b border-white/5 hover:bg-white/3 transition-colors group"
                >
                  <td class="py-2.5 px-3">
                    <div class="flex items-center gap-2">
                      <span
                        class="text-[#e8e2dc] font-medium group-hover:text-white transition-colors"
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
                        class="text-[0.7rem] text-[#a89a8e] hover:text-[#c89868] transition-colors"
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
                      class="text-[#a89a8e] hover:text-[#c89868] transition-colors text-left"
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
                      @click="selectedCategory = product.categoryId"
                      :title="`Filter op categorie: ${categoryNameMap[product.categoryId]}`"
                      class="text-[0.7rem] text-[#c89868]/70 hover:text-[#c89868] uppercase tracking-widest transition-colors text-left"
                    >
                      {{ categoryNameMap[product.categoryId] }}
                    </button>
                  </td>
                  <td class="py-2 px-3">
                    <div class="flex items-center justify-center gap-1.5">
                      <div class="flex items-center border border-white/10">
                        <button
                          type="button"
                          @click="setQty(product.id, getQty(product.id) - 1)"
                          class="w-7 h-8 text-[#c89868] hover:bg-white/4 transition-colors"
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
                          class="w-9 h-8 bg-transparent text-center text-sm text-[#e8e2dc] focus:outline-none focus:bg-white/4 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          @click="setQty(product.id, getQty(product.id) + 1)"
                          class="w-7 h-8 text-[#c89868] hover:bg-white/4 transition-colors"
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
            v-if="filteredProducts.length > pageSize"
            class="mt-10 flex flex-col items-center gap-4"
          >
            <p class="text-sm text-[#a89a8e]">
              {{ Math.min(page * pageSize, filteredProducts.length) }} van
              {{ filteredProducts.length }} producten
            </p>
            <div class="w-full max-w-xs bg-white/10 h-0.5">
              <div
                class="h-0.5 bg-[#c89868] transition-all duration-300"
                :style="`width: ${Math.min(((page * pageSize) / filteredProducts.length) * 100, 100)}%`"
              />
            </div>
            <button
              v-if="page * pageSize < filteredProducts.length"
              @click="page++"
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
import { products, type Product } from "~/data/products";
import { categories } from "~/data/categories";

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

const search = ref("");
const selectedCategory = ref<string | null>(
  (route.query.category as string) ?? null,
);
const selectedSupplier = ref<string | null>(null);
const page = ref(1);
const pageSize = 24;
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
  page.value = 1;
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
const infoProduct = ref<Product | null>(null);
function openInfo(p: Product) {
  infoProduct.value = p;
  infoOpen.value = true;
}

watch([search, selectedCategory, selectedSupplier], () => {
  page.value = 1;
});

const filteredProducts = computed(() => {
  const q = search.value.toLowerCase().trim();
  return products.filter((p) => {
    const matchesCategory =
      !selectedCategory.value || p.categoryId === selectedCategory.value;
    const matchesSupplier =
      !selectedSupplier.value || p.supplier === selectedSupplier.value;
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.articleNr.toLowerCase().includes(q) ||
      p.supplier.toLowerCase().includes(q);
    return matchesCategory && matchesSupplier && matchesSearch;
  });
});

const categoryNameMap = computed(() => {
  const m: Record<string, string> = {};
  for (const c of categories) m[c.id] = c.name;
  return m;
});

const sortedProducts = computed(() => {
  const list = [...filteredProducts.value];
  if (!sortKey.value) return list;
  const key = sortKey.value;
  const dir = sortDir.value === "asc" ? 1 : -1;
  return list.sort((a, b) => {
    let av = "",
      bv = "";
    if (key === "name") {
      av = a.name;
      bv = b.name;
    } else if (key === "articleNr") {
      av = a.articleNr;
      bv = b.articleNr;
    } else if (key === "supplier") {
      av = a.supplier;
      bv = b.supplier;
    } else if (key === "unit") {
      av = a.unit ?? "";
      bv = b.unit ?? "";
    } else if (key === "category") {
      av = categoryNameMap.value[a.categoryId] ?? "";
      bv = categoryNameMap.value[b.categoryId] ?? "";
    }
    return av.localeCompare(bv, "nl") * dir;
  });
});

const paginatedProducts = computed(() =>
  sortedProducts.value.slice(0, page.value * pageSize),
);

const activeCategoryName = computed(
  () => categories.find((c) => c.id === selectedCategory.value)?.name ?? "",
);

function addToCart(product: Product) {
  const qty = getQty(product.id);
  cart.addItem(
    {
      // Artikelnummer als sleutel: zo valt een product uit een opgeslagen
      // lijst of vorige bestelling samen met dezelfde regel in het mandje.
      id: product.articleNr,
      articleNr: product.articleNr,
      name: product.name,
      supplier: product.supplier,
      unit: product.unit,
    },
    qty,
  );
  qtyMap[product.id] = 1;
}
</script>
