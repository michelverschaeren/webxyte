<template>
  <div class="bg-(--color-bg) text-(--color-text) min-h-screen">
    <!-- Page header -->
    <div
      class="relative pt-32 pb-10 sm:pt-46.5 sm:pb-20 px-4 overflow-hidden"
      style="background: radial-gradient(ellipse at 50% 40%, var(--gradient-banner-1) 0%, var(--gradient-banner-2) 45%, var(--gradient-banner-3) 100%)"
    >
      <div class="relative z-1 max-w-300 mx-auto text-center">
        <h1
          class="font-['Playfair_Display',Georgia,serif] text-[clamp(2.5rem,6vw,5rem)] font-black text-white leading-[1.05] mb-4"
        >
          Producten &amp; Bestellen
        </h1>
        <p class="text-white/90 text-lg max-w-xl mx-auto">
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
                class="uppercase tracking-[0.2em] text-[0.8rem] text-(--color-accent) font-semibold"
              >
                Categorieën
              </p>
            </div>
            <!-- Klik op een naam = alle producten van die categorie. Zit de
                 klant in een lijst (mandje, eerder afgenomen, bestelling of
                 lijstje), dan filtert de trechter ernaast díé lijst. -->
            <div class="flex flex-col gap-1 px-3 pb-4">
              <div class="flex items-center gap-1">
                <button
                  class="flex-1 min-w-0 flex items-center justify-between gap-3 text-left px-4 py-3 text-[0.95rem] rounded-lg transition-colors"
                  :class="
                    !selectedCategorySlug && showingAll
                      ? 'text-(--color-accent) bg-(--color-hover) font-medium'
                      : 'text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-hover)'
                  "
                  @click="pickCategory(null)"
                >
                  <span>Alle categorieën</span>
                  <span class="text-(--color-accent) text-sm">{{
                    listTotal ?? totalActiveCount
                  }}</span>
                </button>
                <button
                  v-if="!showingAll"
                  type="button"
                  :title="`Toon alle categorieën in ${listScopeLabel}`"
                  :aria-label="`Toon alle categorieën in ${listScopeLabel}`"
                  class="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-lg transition-colors"
                  :class="
                    !selectedCategorySlug
                      ? 'bg-[#b8252a] text-white'
                      : 'text-(--color-text-muted) hover:text-(--color-accent) hover:bg-(--color-hover)'
                  "
                  @click="selectedCategorySlug = null"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M3 4.5h18l-7 8.25V19.5l-4-2.25v-4.5L3 4.5z"
                    />
                  </svg>
                </button>
              </div>
              <div
                v-for="cat in visibleCategories"
                :key="cat.id"
                class="flex items-center gap-1"
              >
                <button
                  class="flex-1 min-w-0 text-left px-4 py-3 text-[0.95rem] rounded-lg transition-colors"
                  :class="
                    selectedCategorySlug === cat.slug && showingAll
                      ? 'text-(--color-accent) bg-(--color-hover) font-medium'
                      : 'text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-hover)'
                  "
                  @click="pickCategory(cat.slug)"
                >
                  {{ cat.name }}
                </button>
                <button
                  v-if="!showingAll"
                  type="button"
                  :title="`Filter ${listScopeLabel} op ${cat.name}`"
                  :aria-label="`Filter ${listScopeLabel} op ${cat.name}`"
                  class="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-lg transition-colors"
                  :class="
                    selectedCategorySlug === cat.slug
                      ? 'bg-[#b8252a] text-white'
                      : 'text-(--color-text-muted) hover:text-(--color-accent) hover:bg-(--color-hover)'
                  "
                  @click="
                    selectedCategorySlug =
                      selectedCategorySlug === cat.slug ? null : cat.slug
                  "
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M3 4.5h18l-7 8.25V19.5l-4-2.25v-4.5L3 4.5z"
                    />
                  </svg>
                </button>
              </div>
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
              :placeholder="
                auth.isLoggedIn.value
                  ? 'Zoek op naam, artikelnr of fabrikant…'
                  : 'Zoek op productnaam…'
              "
              class="w-full pl-12 pr-5 py-4 bg-(--color-surface) border border-(--color-border) rounded-xl text-(--color-text) placeholder-(--color-text-muted) text-base focus:outline-none focus:border-[#c89868] transition-colors"
            >
          </div>

          <!-- Gasten zien enkel het gamma: geen mandje, filters of details. -->
          <div
            v-if="!auth.isLoggedIn.value"
            class="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-(--color-border) bg-(--color-surface) px-5 py-4"
          >
            <p class="flex-1 min-w-60 text-base text-(--color-text)">
              Klant bij Vleeswaren Vermeir? Log in om artikelnummers,
              productfiches en uw eerdere bestellingen te zien en online te
              bestellen.
            </p>
            <button
              type="button"
              class="rounded-lg bg-[#b8252a] px-5 py-2.5 text-sm font-semibold tracking-widest text-white uppercase transition-colors hover:bg-[#8b1f1f]"
              @click="authModal.open()"
            >
              Inloggen
            </button>
          </div>

          <!-- Filters: naast de categorieën links zijn dit extra filters die
               samen bepalen welke producten hieronder verschijnen. -->
          <div v-else class="mb-8">
            <!-- Mobiel: één horizontaal scrollbare rij die tot aan de schermrand
                 loopt (de afgesneden chip verraadt dat er meer is); vanaf sm
                 gewoon wrappen zoals voorheen. -->
            <div
              class="-mx-4 flex flex-nowrap items-center gap-2 overflow-x-auto px-4 pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:gap-2.5 sm:overflow-visible sm:px-0 sm:pb-0"
            >
              <!-- Alle producten: heft mandje, eerder afgenomen en vorige
                   bestelling/lijstje op (categorie en zoekterm blijven). -->
              <button
                type="button"
                :aria-pressed="showingAll"
                class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg border text-[0.65rem] font-semibold uppercase tracking-[0.08em] transition-colors sm:gap-2 sm:px-4 sm:py-2.5 sm:text-xs"
                :class="
                  showingAll
                    ? 'border-[#b8252a] bg-[#b8252a] text-white'
                    : 'border-(--color-border-strong) text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-hover)'
                "
                @click="showAllProducts()"
              >
                Alle producten
              </button>

              <!-- Winkelmandje -->
              <button
                type="button"
                role="switch"
                :aria-checked="cart.showCartOnly.value"
                class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap pl-3 pr-2.5 py-1.5 rounded-lg border text-[0.75rem] font-semibold uppercase tracking-[0.08em] transition-colors sm:gap-2 sm:pl-4 sm:pr-3.5 sm:py-2.5 sm:text-sm"
                :class="
                  cart.showCartOnly.value
                    ? 'border-[#b8252a] bg-[#b8252a] text-white'
                    : 'border-(--color-border-strong) text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-hover)'
                "
                @click="toggleCartOnly()"
              >
                <svg
                  class="w-3 h-3 shrink-0 sm:w-3.5 sm:h-3.5"
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
                <span class="sm:hidden">Mandje</span>
                <span class="hidden sm:inline">Mijn winkelmandje</span>
                <span
                  v-if="cart.totalItems.value > 0"
                  class="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[0.6rem] font-bold sm:min-w-4.5 sm:h-4.5 sm:text-[0.65rem]"
                  :class="cart.showCartOnly.value ? 'bg-white/25' : 'bg-[#b8252a] text-white'"
                  >{{ cart.totalItems.value > 99 ? "99+" : cart.totalItems.value }}</span
                >
              </button>

              <!-- Eerder afgenomen -->
              <button
                type="button"
                role="switch"
                :aria-checked="purchasedOnly"
                class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg border text-[0.75rem] font-semibold uppercase tracking-[0.08em] transition-colors sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
                :class="
                  purchasedOnly
                    ? 'border-[#b8252a] bg-[#b8252a] text-white'
                    : 'border-(--color-border-strong) text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-hover)'
                "
                @click="togglePurchasedOnly()"
              >
                <span class="sm:hidden">Eerder afgenomen</span>
                <span class="hidden sm:inline">Eerder afgenomen producten</span>
              </button>

              <!-- Vorige bestelling -->
              <SelectMenu
                class="shrink-0"
                :model-value="selectedOrderId || null"
                :options="orderSourceOptions"
                placeholder="Bestellingen & lijstjes"
                :disabled="loadingOrderFilter"
                :loading="loadingOrderSources"
                :trigger-class="previousOrderTriggerClass"
                title="Kies een bestelling of lijstje"
                eyebrow="Snel bestellen"
                empty-label="Nog geen bestellingen of lijstjes gevonden."
                @open="loadOrdersAndLists()"
                @update:model-value="selectPreviousOrder($event ?? '')"
              />
            </div>
            <div class="flex items-center gap-2 mt-4">
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
                class="text-[0.75rem] font-semibold uppercase tracking-[0.25em] text-(--color-accent) whitespace-nowrap"
                >Filters</span
              >
              <div class="flex-1 h-px bg-(--color-border)" />
            </div>
          </div>

          <!-- Mobile category select -->
          <div class="lg:hidden mb-5">
            <SelectMenu
              :model-value="mobileCategoryValue"
              :options="mobileCategoryOptions"
              trigger-class="w-full justify-between px-4 py-3 bg-(--color-surface) border border-(--color-border) rounded-xl text-(--color-text) text-base focus:outline-none focus:border-[#c89868]"
              title="Kies een categorie"
              eyebrow="Categorieën"
              @update:model-value="onMobileCategory($event)"
            />
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
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium bg-[#b8252a]/20 text-(--color-text) border border-[#b8252a]/40"
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
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium bg-[#c89868]/15 text-(--color-text) border border-[#c89868]/40"
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
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium bg-[#c89868]/15 text-(--color-text) border border-[#c89868]/40"
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
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium bg-[#b8252a]/20 text-(--color-text) border border-[#b8252a]/40"
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
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium bg-[#c89868]/15 text-(--color-text) border border-[#c89868]/40"
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
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium bg-(--color-hover) text-(--color-text) border border-(--color-border)"
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
            <p class="text-(--color-text-muted) text-base">
              {{
                auth.isLoggedIn.value
                  ? "Probeer een andere zoekterm, categorie of fabrikant."
                  : "Probeer een andere zoekterm of categorie."
              }}
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
            <table class="w-full text-base border-collapse">
              <thead>
                <tr
                  class="border-b border-(--color-border) text-[0.8rem] uppercase tracking-[0.12em]"
                >
                  <th class="text-left py-3 px-3 font-semibold">
                    <button
                      type="button"
                      class="inline-flex items-center gap-1.5 group"
                      :class="
                        sortKey === 'name'
                          ? 'text-(--color-accent)'
                          : 'text-(--color-text-muted) hover:text-(--color-accent)'
                      "
                      @click="toggleSort('name')"
                    >
                      Product
                      <span
                        class="text-[0.75rem] opacity-80 group-hover:opacity-100"
                      >
                        <template v-if="sortKey === 'name'">{{
                          sortDir === "asc" ? "▲" : "▼"
                        }}</template>
                        <template v-else>⇅</template>
                      </span>
                    </button>
                  </th>
                  <th
                    v-if="auth.isLoggedIn.value"
                    class="text-left py-3 px-3 font-semibold hidden sm:table-cell"
                  >
                    <button
                      type="button"
                      class="inline-flex items-center gap-1.5 group"
                      :class="
                        sortKey === 'articleNr'
                          ? 'text-(--color-accent)'
                          : 'text-(--color-text-muted) hover:text-(--color-accent)'
                      "
                      @click="toggleSort('articleNr')"
                    >
                      Art. nr
                      <span
                        class="text-[0.75rem] opacity-80 group-hover:opacity-100"
                      >
                        <template v-if="sortKey === 'articleNr'">{{
                          sortDir === "asc" ? "▲" : "▼"
                        }}</template>
                        <template v-else>⇅</template>
                      </span>
                    </button>
                  </th>
                  <th
                    v-if="auth.isLoggedIn.value"
                    class="text-left py-3 px-3 font-semibold hidden md:table-cell"
                  >
                    <button
                      type="button"
                      class="inline-flex items-center gap-1.5 group"
                      :class="
                        sortKey === 'supplier'
                          ? 'text-(--color-accent)'
                          : 'text-(--color-text-muted) hover:text-(--color-accent)'
                      "
                      @click="toggleSort('supplier')"
                    >
                      Fabrikant
                      <span
                        class="text-[0.75rem] opacity-80 group-hover:opacity-100"
                      >
                        <template v-if="sortKey === 'supplier'">{{
                          sortDir === "asc" ? "▲" : "▼"
                        }}</template>
                        <template v-else>⇅</template>
                      </span>
                    </button>
                  </th>
                  <th
                    v-if="auth.isLoggedIn.value"
                    class="text-left py-3 px-3 font-semibold hidden lg:table-cell"
                  >
                    <button
                      type="button"
                      class="inline-flex items-center gap-1.5 group"
                      :class="
                        sortKey === 'unit'
                          ? 'text-(--color-accent)'
                          : 'text-(--color-text-muted) hover:text-(--color-accent)'
                      "
                      @click="toggleSort('unit')"
                    >
                      Eenheid
                      <span
                        class="text-[0.75rem] opacity-80 group-hover:opacity-100"
                      >
                        <template v-if="sortKey === 'unit'">{{
                          sortDir === "asc" ? "▲" : "▼"
                        }}</template>
                        <template v-else>⇅</template>
                      </span>
                    </button>
                  </th>
                  <th
                    class="text-left py-3 px-3 font-semibold"
                    :class="auth.isLoggedIn.value ? 'hidden xl:table-cell' : ''"
                  >
                    <button
                      type="button"
                      class="inline-flex items-center gap-1.5 group"
                      :class="
                        sortKey === 'category'
                          ? 'text-(--color-accent)'
                          : 'text-(--color-text-muted) hover:text-(--color-accent)'
                      "
                      @click="toggleSort('category')"
                    >
                      Categorie
                      <span
                        class="text-[0.75rem] opacity-80 group-hover:opacity-100"
                      >
                        <template v-if="sortKey === 'category'">{{
                          sortDir === "asc" ? "▲" : "▼"
                        }}</template>
                        <template v-else>⇅</template>
                      </span>
                    </button>
                  </th>
                  <th
                    v-if="auth.isLoggedIn.value"
                    class="py-3 px-3 font-semibold w-36 text-center text-(--color-text-muted)"
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
                  <td class="py-3 px-3">
                    <div class="flex items-center gap-2">
                      <span
                        class="text-(--color-text) font-medium group-hover:text-(--color-text-strong) transition-colors"
                        >{{ product.name }}</span
                      >
                      <button
                        v-if="auth.isLoggedIn.value && product.infoPdf"
                        type="button"
                        :title="`Productfiche ${product.name}`"
                        class="shrink-0 w-6 h-6 inline-flex items-center justify-center rounded-full border border-[#c89868]/60 text-(--color-accent) text-[0.8rem] font-bold italic hover:bg-[#c89868] hover:text-[#1a0a0a] transition-colors"
                        @click="openInfo(product)"
                      >
                        i
                      </button>
                    </div>
                    <p
                      v-if="product.lastPurchasedAt"
                      class="mt-0.5 text-[0.85rem] text-(--color-text-muted)"
                    >
                      Laatst afgenomen: {{ formatPurchaseDate(product.lastPurchasedAt) }}
                    </p>
                    <!-- Mobile fallback: art. nr + supplier -->
                    <div
                      v-if="auth.isLoggedIn.value"
                      class="flex gap-2 mt-0.5 sm:hidden"
                    >
                      <span
                        class="text-[0.85rem] text-(--color-accent) border border-[#c89868]/40 rounded-md px-1.5 py-0.5"
                        >{{ product.articleNr }}</span
                      >
                      <button
                        type="button"
                        class="text-[0.85rem] text-(--color-text-muted) hover:text-(--color-accent) transition-colors"
                        @click="selectedSupplier = product.supplier"
                      >
                        {{ product.supplier }}
                      </button>
                    </div>
                  </td>
                  <td
                    v-if="auth.isLoggedIn.value"
                    class="py-3 px-3 hidden sm:table-cell"
                  >
                    <span
                      class="text-[0.85rem] text-(--color-accent) border border-[#c89868]/40 rounded-md px-2 py-0.5 uppercase tracking-[0.08em]"
                      >{{ product.articleNr }}</span
                    >
                  </td>
                  <td
                    v-if="auth.isLoggedIn.value"
                    class="py-3 px-3 text-[0.95rem] hidden md:table-cell"
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
                    v-if="auth.isLoggedIn.value"
                    class="py-3 px-3 text-(--color-accent) text-[0.95rem] hidden lg:table-cell"
                  >
                    {{ product.unit ?? "—" }}
                  </td>
                  <td
                    class="py-3 px-3"
                    :class="auth.isLoggedIn.value ? 'hidden xl:table-cell' : ''"
                  >
                    <button
                      type="button"
                      :title="`Filter op categorie: ${product.category.name}`"
                      class="text-[0.8rem] text-(--color-accent) hover:text-(--color-text-strong) uppercase tracking-widest transition-colors text-left"
                      @click="selectedCategorySlug = product.category.slug"
                    >
                      {{ product.category.name }}
                    </button>
                  </td>
                  <td v-if="auth.isLoggedIn.value" class="py-2 px-3">
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
                          class="w-8 h-9 text-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
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
                          class="w-10 h-9 bg-transparent text-center text-base focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                          class="w-8 h-9 text-lg transition-colors"
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
            <p class="text-base text-(--color-text-muted)">
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
      v-if="auth.isLoggedIn.value && cart.totalItems.value > 0"
      class="sticky bottom-0 z-40 mt-10 border-t border-(--color-border) bg-(--color-surface-strong)/95 backdrop-blur-md"
    >
      <div
        class="max-w-325 mx-auto flex items-center gap-2 px-3 py-2.5 sm:flex-wrap sm:gap-4 sm:px-6 sm:py-4 lg:px-8"
      >
        <div class="text-sm shrink-0 sm:text-base">
          <span class="text-(--color-text-muted)">In winkelmandje</span>
          <span class="ml-1 font-bold text-(--color-text-strong) sm:ml-2">{{
            cart.totalItems.value
          }}</span>
          <span class="hidden text-(--color-text-muted) sm:inline"
            >&nbsp;stuk{{ cart.totalItems.value !== 1 ? "s" : "" }}</span
          >
        </div>
        <div class="ml-auto flex items-center gap-1.5 sm:flex-wrap sm:gap-2">
          <button
            type="button"
            class="rounded-lg px-2 py-2 text-[0.8rem] font-medium sm:text-sm text-(--color-text-muted) transition-colors hover:bg-(--color-hover) hover:text-(--color-text-strong) sm:px-3 sm:py-2.5"
            @click="checkout.openClearConfirm()"
          >
            Wissen
          </button>
          <button
            type="button"
            class="rounded-lg border border-[#c89868] px-2.5 py-2 text-[0.75rem] font-semibold whitespace-nowrap tracking-[0.08em] text-(--color-accent) uppercase transition-colors hover:bg-[#c89868] hover:text-[#1a0a0a] sm:px-4 sm:py-2.5 sm:text-[0.8rem]"
            @click="checkout.openSaveModal()"
          >
            <span class="sm:hidden">Lijst</span>
            <span class="hidden sm:inline">Lijst opslaan</span>
          </button>
          <button
            type="button"
            class="rounded-lg bg-[#b8252a] px-4 py-2 text-[0.8rem] font-semibold whitespace-nowrap tracking-widest text-white uppercase transition-colors hover:bg-[#8b1f1f] sm:px-6 sm:py-2.5 sm:text-[0.85rem]"
            @click="checkout.openOrderModal()"
          >
            <span class="sm:hidden">Bestellen</span>
            <span class="hidden sm:inline">Bestelling plaatsen</span>
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
import type { SelectMenuOption } from "~/components/SelectMenu.vue";

definePageMeta({ layout: "main" });

useSeoMeta({
  title: "Producten & Bestellen",
  description:
    "Doorzoek meer dan 5000 vleeswaren producten en voeg ze toe aan uw bestellijst.",
});

const cart = useCart();
const checkout = useCartCheckout();
const orderLists = useOrderLists();
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

/** Voor gasten zijn artikelnr, fabrikant, eenheid en fiche `null` (zie
 * /api/products). */
interface ProductDto {
  id: string;
  articleNr: string | null;
  name: string;
  supplier: string | null;
  unit: string | null;
  infoPdf: string | null;
  /** JJJJ-MM-DD; enkel gevuld bij de filter "eerder afgenomen". */
  lastPurchasedAt: string | null;
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
  listCategoryCounts: Record<string, number> | null;
}

const { data: categoriesData } = await useFetch<CategoryDto[]>("/api/categories");
const categories = computed(() => categoriesData.value ?? []);
const totalActiveCount = computed(() =>
  categories.value.reduce((sum, c) => sum + c.productCount, 0),
);
const categoryOptions = computed<SelectMenuOption[]>(() => [
  { value: null, label: `Alle categorieën (${totalActiveCount.value})` },
  ...categories.value.map((c) => ({ value: c.slug, label: c.name })),
]);

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
  if (purchasedOnly.value) {
    cart.showCartOnly.value = false;
    selectPreviousOrder("");
  }
}

// "Enkel winkelmandje", "Eerder afgenomen" en "Vorige bestelling" beperken de
// lijst alle drie tot een vaste set artikelnummers — samen zetten zou geen
// zinnig resultaat geven, dus ze sluiten elkaar uit. De categoriefilter valt
// hier bewust buiten: die mag altijd gecombineerd blijven.
function toggleCartOnly() {
  cart.showCartOnly.value = !cart.showCartOnly.value;
  if (cart.showCartOnly.value) {
    selectPreviousOrder("");
    purchasedOnly.value = false;
  }
}

const showingAll = computed(
  () => !cart.showCartOnly.value && !purchasedOnly.value && !selectedOrderId.value,
);
function showAllProducts() {
  cart.showCartOnly.value = false;
  purchasedOnly.value = false;
  selectPreviousOrder("");
}

/** Naam van de actieve lijst, voor de categorie-filterknoppen. */
const listScopeLabel = computed(() => {
  if (cart.showCartOnly.value) return "winkelmandje";
  if (purchasedOnly.value) return "eerder afgenomen";
  if (selectedOrderId.value.startsWith(LIST_PREFIX)) return "dit lijstje";
  return "deze bestelling";
});

// Categorienaam = verder winkelen: alle producten van die categorie, zodat de
// klant meteen kan toevoegen zonder eerst zelf de lijst-filter af te zetten.
// Filteren bínnen de lijst gaat via de trechter naast de naam.
function pickCategory(slug: string | null) {
  showAllProducts();
  selectedCategorySlug.value = slug;
}

// Mobiel is er geen plaats voor een trechter per regel: zolang er een lijst
// actief is, toont de keuzelijst twee groepen. Waarden in de lijst-groep
// krijgen een prefix ("in:" = alle categorieën binnen de lijst).
const IN_LIST_PREFIX = "in:";
const mobileCategoryOptions = computed<SelectMenuOption[]>(() => {
  if (showingAll.value) return categoryOptions.value;
  const inList = `In ${listScopeLabel.value}`;
  const allProducts = "Alle producten";
  return [
    {
      value: IN_LIST_PREFIX,
      label: `Alle categorieën (${listTotal.value ?? 0})`,
      group: inList,
    },
    ...visibleCategories.value.map((c) => ({
      value: `${IN_LIST_PREFIX}${c.slug}`,
      label: c.name,
      group: inList,
    })),
    {
      value: null,
      label: `Alle categorieën (${totalActiveCount.value})`,
      group: allProducts,
    },
    ...visibleCategories.value.map((c) => ({
      value: c.slug,
      label: c.name,
      group: allProducts,
    })),
  ];
});
const mobileCategoryValue = computed(() =>
  showingAll.value
    ? selectedCategorySlug.value
    : `${IN_LIST_PREFIX}${selectedCategorySlug.value ?? ""}`,
);
function onMobileCategory(value: string | null) {
  if (value?.startsWith(IN_LIST_PREFIX)) {
    selectedCategorySlug.value = value.slice(IN_LIST_PREFIX.length) || null;
  } else {
    pickCategory(value);
  }
}

interface OrderSummaryDto {
  id: string;
  name: string | null;
  createdAt: string;
}

const previousOrders = ref<OrderSummaryDto[]>([]);
const previousOrdersLoaded = ref(false);
const loadingPreviousOrders = ref(false);
async function ensurePreviousOrdersLoaded() {
  if (previousOrdersLoaded.value || !auth.isLoggedIn.value) return;
  previousOrdersLoaded.value = true;
  loadingPreviousOrders.value = true;
  try {
    const res = await $fetch<{ items: OrderSummaryDto[] }>(
      "/api/account/orders",
      { query: { perPage: 50 } },
    );
    previousOrders.value = res.items;
  } finally {
    loadingPreviousOrders.value = false;
  }
}

function loadOrdersAndLists() {
  ensurePreviousOrdersLoaded();
  orderLists.ensureLoaded();
}

// Eén filter voor twee bronnen: vorige bestellingen en zelfgemaakte lijstjes.
// De waarde is voorzien van een prefix ("order:" / "list:") zodat we weten
// welke bron erbij hoort. Geen "geen selectie"-optie: de trigger toont de
// placeholder zolang er niets gekozen is, en wissen kan via het filterlabel
// met ✕ eronder.
const ORDER_PREFIX = "order:";
const LIST_PREFIX = "list:";

const orderSourceOptions = computed<SelectMenuOption[]>(() => [
  ...previousOrders.value.map((o) => ({
    value: `${ORDER_PREFIX}${o.id}`,
    label: `${o.name || "Bestelling"} — ${formatOrderDate(o.createdAt)}`,
    group: "Vorige bestellingen",
  })),
  ...orderLists.lists.value.map((l) => ({
    value: `${LIST_PREFIX}${l.id}`,
    label: `${l.name} (${l.items.length})`,
    group: "Mijn lijstjes",
  })),
]);
const loadingOrderSources = computed(
  () => loadingPreviousOrders.value || orderLists.loading.value,
);

const selectedOrderId = ref("");
const previousOrderTriggerClass = computed(
  () =>
    "max-w-[60vw] justify-between px-3 py-1.5 rounded-lg border text-[0.75rem] font-semibold uppercase tracking-[0.08em] bg-(--color-surface) focus:outline-none disabled:opacity-60 disabled:cursor-wait sm:max-w-56 sm:px-4 sm:py-2.5 sm:text-sm " +
    (selectedOrderId.value
      ? "border-[#b8252a] text-(--color-text)"
      : "border-(--color-border-strong) text-(--color-text-muted) hover:text-(--color-text)"),
);
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
  purchasedOnly.value = false;
  loadingOrderFilter.value = true;
  try {
    if (id.startsWith(LIST_PREFIX)) {
      const list = orderLists.getList(id.slice(LIST_PREFIX.length));
      selectedOrderArticleNrs.value = (list?.items ?? []).map(
        (i) => i.articleNr,
      );
    } else {
      const order = await $fetch<{ items: { articleNr: string }[] }>(
        `/api/account/orders/${id.slice(ORDER_PREFIX.length)}`,
      );
      selectedOrderArticleNrs.value = order.items.map((i) => i.articleNr);
    }
  } finally {
    loadingOrderFilter.value = false;
  }
}

// Vangt ook de gevallen op waarin het mandje-filter van elders wordt
// geactiveerd (navbalk-icoon, "opnieuw bestellen", mijn-lijsten-paneel).
watch(
  () => cart.showCartOnly.value,
  (on) => {
    if (!on) return;
    if (selectedOrderId.value) selectPreviousOrder("");
    purchasedOnly.value = false;
  },
);

const selectedOrderLabel = computed(() => {
  const key = selectedOrderId.value;
  if (key.startsWith(LIST_PREFIX)) {
    const list = orderLists.getList(key.slice(LIST_PREFIX.length));
    return `Lijst: ${list?.name ?? "onbekend"}`;
  }
  const order = previousOrders.value.find(
    (o) => `${ORDER_PREFIX}${o.id}` === key,
  );
  if (!order) return "Vorige bestelling";
  const name = order.name || `Bestelling van ${formatOrderDate(order.createdAt)}`;
  return `Vorige bestelling: ${name}`;
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
  // Ook bij in-/uitloggen herladen: de API geeft gasten minder velden terug.
  { watch: [queryParams, auth.isLoggedIn] },
);

// "Meer laden" voegt volgende pagina's toe bovenop `firstPage`, zonder al
// geladen producten te laten verspringen. Bij een filterwijziging herstart
// useAsyncData vanzelf bij pagina 1 — daarom resetten we hier mee.
const extraItems = ref<ProductDto[]>([]);
const loadedPages = ref(1);

watch([queryParams, auth.isLoggedIn], () => {
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

// In een lijst (mandje, eerder afgenomen, bestelling/lijstje) tonen we enkel
// de categorieën waar die lijst producten in heeft. De gekozen categorie blijft
// altijd zichtbaar, ook als ze net leeg viel (bv. laatste stuk uit het mandje).
const listCategoryCounts = computed(
  () => firstPage.value?.listCategoryCounts ?? null,
);
const listTotal = computed(() =>
  listCategoryCounts.value
    ? Object.values(listCategoryCounts.value).reduce((sum, n) => sum + n, 0)
    : null,
);
const visibleCategories = computed(() => {
  const counts = listCategoryCounts.value;
  if (!counts) return categories.value;
  return categories.value.filter(
    (c) => (counts[c.slug] ?? 0) > 0 || c.slug === selectedCategorySlug.value,
  );
});

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
  if (!product.articleNr || !product.supplier) return;
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
/** "2026-09-14" → "14 sep. 2026". Als UTC-middag, zodat de tijdzone de dag niet verschuift. */
function formatPurchaseDate(value: string): string {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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
