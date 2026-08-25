<template>
  <div class="bg-(--color-bg) text-(--color-text) min-h-screen">
    <!-- Page header -->
    <div
      class="relative pt-46.5 pb-20 px-4 overflow-hidden"
      style="background: radial-gradient(ellipse at 50% 40%, var(--gradient-banner-1) 0%, var(--gradient-banner-2) 45%, var(--gradient-banner-3) 100%)"
    >
      <div class="relative z-1 max-w-300 mx-auto text-center">
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
      <div class="flex gap-8">
        <!-- Sidebar (desktop) -->
        <aside class="hidden lg:block w-64 shrink-0">
          <div
            class="sticky top-8 bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden"
          >
            <div class="px-6 py-5">
              <p
                class="uppercase tracking-[0.2em] text-[0.7rem] text-(--color-accent) font-semibold"
              >
                Categorieën
              </p>
            </div>
            <div class="flex flex-col gap-1 px-3 pb-4">
              <button
                class="w-full flex items-center justify-between gap-3 text-left px-4 py-3 text-sm rounded-lg transition-colors"
                :class="
                  !selectedCategorySlug
                    ? 'text-(--color-accent) bg-(--color-hover) font-medium'
                    : 'text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-hover)'
                "
                @click="selectedCategorySlug = null"
              >
                <span>Alle categorieën</span>
                <span class="text-(--color-accent)/60 text-xs">{{
                  totalActiveCount
                }}</span>
              </button>
              <button
                v-for="cat in categories"
                :key="cat.id"
                class="w-full text-left px-4 py-3 text-sm rounded-lg transition-colors"
                :class="
                  selectedCategorySlug === cat.slug
                    ? 'text-(--color-accent) bg-(--color-hover) font-medium'
                    : 'text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-hover)'
                "
                @click="selectedCategorySlug = cat.slug"
              >
                {{ cat.name }}
              </button>
            </div>
          </div>
        </aside>

        <!-- Main area -->
        <div class="flex-1 min-w-0">
          <!-- Search bar -->
          <div class="relative mb-8">
            <svg
              class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-(--color-accent)"
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
              class="w-full pl-12 pr-5 py-4 bg-(--color-surface) border border-(--color-border) rounded-xl text-(--color-text) placeholder-(--color-text-muted) text-sm focus:outline-none focus:border-[#c89868] transition-colors"
            >
          </div>

          <!-- Filters: naast de categorieën links zijn dit extra filters die
               samen bepalen welke producten hieronder verschijnen. -->
          <div class="mb-8">
            <div class="flex items-center gap-2 mb-3">
              <svg
                class="w-3.5 h-3.5 text-(--color-accent) shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 4.5h18M6 9.75h12M10.5 15h3"
                />
              </svg>
              <span
                class="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-(--color-accent) whitespace-nowrap"
                >Filters</span
              >
              <div class="flex-1 h-px bg-(--color-border)" />
            </div>
            <div class="flex flex-wrap items-center gap-2.5">
              <!-- Winkelmandje -->
              <button
                type="button"
                role="switch"
                :aria-checked="cart.showCartOnly.value"
                class="inline-flex items-center gap-2 pl-4 pr-3.5 py-2.5 rounded-full border text-xs font-semibold uppercase tracking-[0.08em] transition-colors"
                :class="
                  cart.showCartOnly.value
                    ? 'border-[#b8252a] bg-[#b8252a] text-white'
                    : 'border-(--color-border-strong) text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-hover)'
                "
                @click="toggleCartOnly()"
              >
                <svg
                  class="w-3.5 h-3.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Mijn winkelmandje
                <span
                  v-if="cart.totalItems.value > 0"
                  class="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full text-[0.65rem] font-bold"
                  :class="cart.showCartOnly.value ? 'bg-white/25' : 'bg-[#b8252a] text-white'"
                  >{{ cart.totalItems.value > 99 ? "99+" : cart.totalItems.value }}</span
                >
              </button>

              <!-- Eerder afgenomen -->
              <button
                type="button"
                role="switch"
                :aria-checked="purchasedOnly"
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-semibold uppercase tracking-[0.08em] transition-colors"
                :class="
                  purchasedOnly
                    ? 'border-[#b8252a] bg-[#b8252a] text-white'
                    : 'border-(--color-border-strong) text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-hover)'
                "
                @click="togglePurchasedOnly()"
              >
                Eerder afgenomen producten
              </button>

              <!-- Vorige bestelling -->
              <button
                v-if="!auth.isLoggedIn.value"
                type="button"
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-(--color-border-strong) text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-hover) text-xs font-semibold uppercase tracking-[0.08em] transition-colors"
                @click="authModal.open()"
              >
                Vorige bestelling
              </button>
              <select
                v-else
                :value="selectedOrderId"
                :disabled="loadingOrderFilter"
                class="pl-4 pr-8 py-2.5 rounded-full border text-xs font-semibold uppercase tracking-[0.08em] transition-colors cursor-pointer focus:outline-none bg-(--color-surface) disabled:opacity-60 disabled:cursor-wait"
                :class="
                  selectedOrderId
                    ? 'border-[#b8252a] text-(--color-text)'
                    : 'border-(--color-border-strong) text-(--color-text-muted) hover:text-(--color-text)'
                "
                @focus="ensurePreviousOrdersLoaded()"
                @change="selectPreviousOrder(($event.target as HTMLSelectElement).value)"
              >
                <option value="">Vorige bestelling…</option>
                <option v-for="o in previousOrders" :key="o.id" :value="o.id">
                  {{ o.name || "Bestelling" }} — {{ formatOrderDate(o.createdAt) }}
                </option>
              </select>
            </div>
          </div>

          <!-- Mobile category select -->
          <div class="lg:hidden mb-5">
            <select
              v-model="selectedCategorySlug"
              class="w-full px-4 py-3 bg-(--color-surface) border border-(--color-border) rounded-xl text-(--color-text) text-sm focus:outline-none focus:border-[#c89868]"
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
            v-if="
              search ||
              selectedCategorySlug ||
              selectedSupplier ||
              purchasedOnly ||
              cart.showCartOnly.value ||
              selectedOrderId
            "
            class="flex flex-wrap gap-2 mb-5"
          >
            <span
              v-if="purchasedOnly"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#b8252a]/20 text-(--color-text) border border-[#b8252a]/40"
            >
              Eerder afgenomen
              <button
                class="hover:text-(--color-accent) transition-colors"
                @click="purchasedOnly = false"
              >
                ✕
              </button>
            </span>
            <span
              v-if="cart.showCartOnly.value"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#c89868]/15 text-(--color-text) border border-[#c89868]/40"
            >
              Enkel winkelmandje
              <button
                class="hover:text-(--color-accent) transition-colors"
                @click="cart.showCartOnly.value = false"
              >
                ✕
              </button>
            </span>
            <span
              v-if="selectedOrderId"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#c89868]/15 text-(--color-text) border border-[#c89868]/40"
            >
              {{ selectedOrderLabel }}
              <button
                class="hover:text-(--color-accent) transition-colors"
                @click="selectPreviousOrder('')"
              >
                ✕
              </button>
            </span>
            <span
              v-if="selectedCategorySlug"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#b8252a]/20 text-(--color-text) border border-[#b8252a]/40"
            >
              {{ activeCategoryName }}
              <button
                class="hover:text-(--color-accent) transition-colors"
                @click="selectedCategorySlug = null"
              >
                ✕
              </button>
            </span>
            <span
              v-if="selectedSupplier"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#c89868]/15 text-(--color-text) border border-[#c89868]/40"
            >
              {{ selectedSupplier }}
              <button
                class="hover:text-(--color-accent) transition-colors"
                @click="selectedSupplier = null"
              >
                ✕
              </button>
            </span>
            <span
              v-if="search"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-(--color-hover) text-(--color-text-muted) border border-(--color-border)"
            >
              "{{ search }}"
              <button
                class="hover:text-(--color-accent) transition-colors"
                @click="search = ''"
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
              class="mt-2 px-6 py-3 rounded-lg bg-[#b8252a] text-white text-sm font-semibold uppercase tracking-widest hover:bg-[#8b1f1f] transition-colors"
              @click="
                search = '';
                selectedCategorySlug = null;
                selectedSupplier = null;
                purchasedOnly = false;
                cart.showCartOnly.value = false;
                selectPreviousOrder('');
              "
            >
              Reset filters
            </button>
          </div>

          <!-- Table layout -->
          <div
            v-else
            class="border border-(--color-border) rounded-xl overflow-hidden"
          >
            <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr
                  class="border-b border-(--color-border) text-[0.7rem] uppercase tracking-[0.12em]"
                >
                  <th class="text-left py-3 px-3 font-semibold">
                    <button
                      type="button"
                      class="inline-flex items-center gap-1.5 group"
                      :class="
                        sortKey === 'name'
                          ? 'text-(--color-accent)'
                          : 'text-(--color-accent)/60 hover:text-(--color-accent)'
                      "
                      @click="toggleSort('name')"
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
                      class="inline-flex items-center gap-1.5 group"
                      :class="
                        sortKey === 'articleNr'
                          ? 'text-(--color-accent)'
                          : 'text-(--color-accent)/60 hover:text-(--color-accent)'
                      "
                      @click="toggleSort('articleNr')"
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
                      class="inline-flex items-center gap-1.5 group"
                      :class="
                        sortKey === 'supplier'
                          ? 'text-(--color-accent)'
                          : 'text-(--color-accent)/60 hover:text-(--color-accent)'
                      "
                      @click="toggleSort('supplier')"
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
                      class="inline-flex items-center gap-1.5 group"
                      :class="
                        sortKey === 'unit'
                          ? 'text-(--color-accent)'
                          : 'text-(--color-accent)/60 hover:text-(--color-accent)'
                      "
                      @click="toggleSort('unit')"
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
                      class="inline-flex items-center gap-1.5 group"
                      :class="
                        sortKey === 'category'
                          ? 'text-(--color-accent)'
                          : 'text-(--color-accent)/60 hover:text-(--color-accent)'
                      "
                      @click="toggleSort('category')"
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
                    class="py-3 px-3 font-semibold w-36 text-center text-(--color-accent)/60"
                  >
                    Aantal
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
                        :title="`Productfiche ${product.name}`"
                        class="shrink-0 w-5 h-5 inline-flex items-center justify-center rounded-full border border-[#c89868]/40 text-(--color-accent) text-[0.65rem] font-bold italic hover:bg-[#c89868] hover:text-[#1a0a0a] transition-colors"
                        @click="openInfo(product)"
                      >
                        i
                      </button>
                    </div>
                    <!-- Mobile fallback: art. nr + supplier -->
                    <div class="flex gap-2 mt-0.5 sm:hidden">
                      <span
                        class="text-[0.7rem] text-(--color-accent) border border-[#c89868]/25 rounded-md px-1.5 py-0.5"
                        >{{ product.articleNr }}</span
                      >
                      <button
                        type="button"
                        class="text-[0.7rem] text-(--color-text-muted) hover:text-(--color-accent) transition-colors"
                        @click="selectedSupplier = product.supplier"
                      >
                        {{ product.supplier }}
                      </button>
                    </div>
                  </td>
                  <td class="py-2.5 px-3 hidden sm:table-cell">
                    <span
                      class="text-[0.75rem] text-(--color-accent) border border-[#c89868]/25 rounded-md px-2 py-0.5 uppercase tracking-[0.08em]"
                      >{{ product.articleNr }}</span
                    >
                  </td>
                  <td
                    class="py-2.5 px-3 text-[0.8rem] hidden md:table-cell"
                  >
                    <button
                      type="button"
                      :title="`Filter op fabrikant: ${product.supplier}`"
                      class="text-(--color-text-muted) hover:text-(--color-accent) transition-colors text-left"
                      @click="selectedSupplier = product.supplier"
                    >
                      {{ product.supplier }}
                    </button>
                  </td>
                  <td
                    class="py-2.5 px-3 text-(--color-accent)/80 text-[0.8rem] hidden lg:table-cell"
                  >
                    {{ product.unit ?? "—" }}
                  </td>
                  <td class="py-2.5 px-3 hidden xl:table-cell">
                    <button
                      type="button"
                      :title="`Filter op categorie: ${product.category.name}`"
                      class="text-[0.7rem] text-(--color-accent)/70 hover:text-(--color-accent) uppercase tracking-widest transition-colors text-left"
                      @click="selectedCategorySlug = product.category.slug"
                    >
                      {{ product.category.name }}
                    </button>
                  </td>
                  <td class="py-2 px-3">
                    <div class="flex items-center justify-center">
                      <div
                        class="flex items-center border rounded-lg overflow-hidden transition-colors"
                        :class="
                          cartQty(product) > 0
                            ? 'border-[#b8252a]/40 bg-[#b8252a]/5'
                            : 'border-(--color-border)'
                        "
                      >
                        <button
                          type="button"
                          :disabled="cartQty(product) === 0"
                          class="w-7 h-8 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          :class="
                            cartQty(product) > 0
                              ? 'text-[#b8252a] hover:bg-[#b8252a]/10'
                              : 'text-(--color-accent) hover:bg-(--color-hover)'
                          "
                          aria-label="Verlaag aantal"
                          @click="decrement(product)"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="0"
                          :value="cartQty(product)"
                          class="w-9 h-8 bg-transparent text-center text-sm focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          :class="
                            cartQty(product) > 0
                              ? 'text-[#b8252a] focus:bg-[#b8252a]/10'
                              : 'text-(--color-text) focus:bg-(--color-hover)'
                          "
                          @input="
                            setCartQty(
                              product,
                              Number(($event.target as HTMLInputElement).value),
                            )
                          "
                        >
                        <button
                          type="button"
                          class="w-7 h-8 transition-colors"
                          :class="
                            cartQty(product) > 0
                              ? 'text-[#b8252a] hover:bg-[#b8252a]/10'
                              : 'text-(--color-accent) hover:bg-(--color-hover)'
                          "
                          aria-label="Verhoog aantal"
                          @click="increment(product)"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>

          <!-- Load more -->
          <div
            v-if="pagination.total > PAGE_SIZE"
            class="mt-10 flex flex-col items-center gap-4"
          >
            <p class="text-sm text-(--color-text-muted)">
              {{ items.length }} van {{ pagination.total }} producten
            </p>
            <div class="w-full max-w-xs bg-(--color-hover) h-0.5 rounded-full overflow-hidden">
              <div
                class="h-0.5 bg-[#c89868] rounded-full transition-all duration-300"
                :style="`width: ${Math.min((items.length / pagination.total) * 100, 100)}%`"
              />
            </div>
            <button
              v-if="hasMore"
              class="px-8 py-3 rounded-xl border border-[#c89868] text-(--color-accent) text-sm font-semibold uppercase tracking-[0.15em] hover:bg-[#c89868] hover:text-[#1a0a0a] transition-all duration-200"
              @click="loadMore"
            >
              Meer laden
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Sticky winkelmandje-balk: het mandje leeft nu volledig op deze
         pagina, dus deze balk vervangt de vroegere /winkelmandje-pagina en
         mandje-drawer. -->
    <div
      v-if="cart.totalItems.value > 0"
      class="sticky bottom-0 z-40 mt-10 border-t border-(--color-border) bg-(--color-surface-strong)/95 backdrop-blur-md"
    >
      <div
        class="max-w-325 mx-auto flex flex-wrap items-center gap-4 px-4 py-4 sm:px-6 lg:px-8"
      >
        <div class="text-sm">
          <span class="text-(--color-text-muted)">In winkelmandje</span>
          <span class="ml-2 font-bold text-(--color-text-strong)">{{
            cart.totalItems.value
          }}</span>
          <span class="text-(--color-text-muted)"
            >&nbsp;stuk{{ cart.totalItems.value !== 1 ? "s" : "" }}</span
          >
        </div>
        <div class="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="rounded-lg px-3 py-2.5 text-[0.7rem] font-medium text-(--color-text-muted) transition-colors hover:bg-(--color-hover) hover:text-(--color-text-strong)"
            @click="checkout.openClearConfirm()"
          >
            Wissen
          </button>
          <button
            type="button"
            class="rounded-lg border border-[#c89868] px-4 py-2.5 text-[0.7rem] font-semibold tracking-[0.08em] text-(--color-accent) uppercase transition-colors hover:bg-[#c89868] hover:text-[#1a0a0a]"
            @click="checkout.openSaveModal()"
          >
            Lijst opslaan
          </button>
          <button
            type="button"
            class="rounded-lg bg-[#b8252a] px-6 py-2.5 text-[0.75rem] font-semibold tracking-widest text-white uppercase transition-colors hover:bg-[#8b1f1f]"
            @click="checkout.openOrderModal()"
          >
            Bestelling plaatsen
          </button>
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

    <!-- Lijst opslaan / bestelling plaatsen / mandje wissen -->
    <CartCheckoutModals />
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
const checkout = useCartCheckout();
const auth = useAuth();
const authModal = useAuthModal();
const route = useRoute();

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

const purchasedOnly = ref(false);
function togglePurchasedOnly() {
  if (!auth.isLoggedIn.value) {
    authModal.open();
    return;
  }
  purchasedOnly.value = !purchasedOnly.value;
}

// "Enkel winkelmandje" en "Vorige bestelling" beperken de lijst allebei tot
// een vaste set artikelnummers — samen zetten zou geen zinnig resultaat
// geven, dus ze sluiten elkaar uit.
function toggleCartOnly() {
  cart.showCartOnly.value = !cart.showCartOnly.value;
  if (cart.showCartOnly.value) selectPreviousOrder("");
}

interface OrderSummaryDto {
  id: string;
  name: string | null;
  createdAt: string;
}

const previousOrders = ref<OrderSummaryDto[]>([]);
const previousOrdersLoaded = ref(false);
async function ensurePreviousOrdersLoaded() {
  if (previousOrdersLoaded.value || !auth.isLoggedIn.value) return;
  previousOrdersLoaded.value = true;
  const res = await $fetch<{ items: OrderSummaryDto[] }>("/api/account/orders", {
    query: { perPage: 50 },
  });
  previousOrders.value = res.items;
}

const selectedOrderId = ref("");
// Losstaand van `selectedOrderId` zodat de query pas herlaadt zodra de
// artikelnummers van de bestelling ook echt binnen zijn — anders flitst de
// lijst even leeg terwijl de bestelling nog opgehaald wordt.
const selectedOrderArticleNrs = ref<string[] | null>(null);
const loadingOrderFilter = ref(false);

async function selectPreviousOrder(id: string) {
  selectedOrderId.value = id;
  if (!id) {
    selectedOrderArticleNrs.value = null;
    return;
  }
  cart.showCartOnly.value = false;
  loadingOrderFilter.value = true;
  try {
    const order = await $fetch<{ items: { articleNr: string }[] }>(
      `/api/account/orders/${id}`,
    );
    selectedOrderArticleNrs.value = order.items.map((i) => i.articleNr);
  } finally {
    loadingOrderFilter.value = false;
  }
}

// Vangt ook de gevallen op waarin het mandje-filter van elders wordt
// geactiveerd (navbalk-icoon, "opnieuw bestellen", mijn-lijsten-paneel).
watch(
  () => cart.showCartOnly.value,
  (on) => {
    if (on && selectedOrderId.value) selectPreviousOrder("");
  },
);

const selectedOrderLabel = computed(() => {
  const order = previousOrders.value.find((o) => o.id === selectedOrderId.value);
  return order ? order.name || "Bestelling" : "Vorige bestelling";
});

function formatOrderDate(value: string): string {
  return new Date(value).toLocaleDateString("nl-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

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
// `articleNrs` leest `cart.items` bewust enkel binnen de ternary: zolang
// "enkel winkelmandje" uit staat, telt een wijzigend mandje (bv. via +/-)
// niet als dependency en herlaadt de lijst dus niet bij elke klik. Voor
// "vorige bestelling" wordt bewust `selectedOrderArticleNrs` gelezen i.p.v.
// `selectedOrderId`, zodat de query pas verandert zodra de artikelnummers
// er ook echt zijn (zie selectPreviousOrder).
const queryParams = computed(() => ({
  category: selectedCategorySlug.value || undefined,
  search: debouncedSearch.value || undefined,
  supplier: selectedSupplier.value || undefined,
  sort: sortKey.value || undefined,
  sortDir: sortDir.value,
  purchased: purchasedOnly.value || undefined,
  articleNrs: cart.showCartOnly.value
    ? cart.items.value.map((i) => i.articleNr).join(",")
    : selectedOrderArticleNrs.value
      ? selectedOrderArticleNrs.value.join(",")
      : undefined,
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

// Aantal per product = rechtstreeks de hoeveelheid in het mandje — er is
// geen apart "+ Toevoegen"-stapje meer, elke +/- klik past het mandje meteen
// aan. Gekoppeld via product.id (de catalogus-UUID), want dat is ook de
// sleutel die het mandje voor ingelogde klanten van de server terugkrijgt.
function cartQty(product: ProductDto): number {
  return cart.items.value.find((i) => i.id === product.id)?.quantity ?? 0;
}

function setCartQty(product: ProductDto, value: number) {
  const qty = Number.isFinite(value) ? Math.floor(value) : 0;
  const clamped = Math.max(0, qty);
  const existing = cart.items.value.find((i) => i.id === product.id);

  if (clamped === 0) {
    if (existing) cart.removeItem(existing.id);
    return;
  }
  if (existing) {
    cart.updateQuantity(existing.id, clamped);
  } else {
    cart.addItem(
      {
        id: product.id,
        articleNr: product.articleNr,
        name: product.name,
        supplier: product.supplier,
        unit: product.unit ?? undefined,
      },
      clamped,
      false,
    );
  }
}

function increment(product: ProductDto) {
  setCartQty(product, cartQty(product) + 1);
}

function decrement(product: ProductDto) {
  setCartQty(product, cartQty(product) - 1);
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
</script>
