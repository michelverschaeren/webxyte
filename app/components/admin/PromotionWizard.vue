<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-220 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      @click.self="close"
    >
      <!-- Vaste breedte en hoogte voor alle stappen: niets verspringt bij het wisselen. -->
      <div
        class="wiz wiz--wide my-auto flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-2xl border border-(--color-border) shadow-2xl"
        style="background: var(--color-surface)"
        role="dialog"
        aria-modal="true"
        aria-labelledby="promotion-wizard-title"
      >
        <!-- Kop + stappen -->
        <div class="border-b border-(--color-border) px-5 py-4 sm:px-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3
                id="promotion-wizard-title"
                class="font-['Playfair_Display',Georgia,serif] text-xl font-bold text-(--color-text-strong)"
              >
                {{ editing || editingGroup ? "Promotie bewerken" : "Nieuwe promotie" }}
              </h3>
              <p class="mt-0.5 text-sm text-(--color-text-muted)">{{ STEP_HINTS[step] }}</p>
            </div>
            <button type="button" class="adm-row-btn shrink-0" aria-label="Sluiten" @click="close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <ol class="mt-4 flex items-center gap-2 overflow-x-auto">
            <li v-for="(label, i) in STEPS" :key="label" class="flex items-center gap-2" :class="{ 'flex-1': i < STEPS.length - 1 }">
              <button
                type="button"
                :disabled="!canVisit(i)"
                class="wiz-step"
                :class="{ 'wiz-step--current': i === step, 'wiz-step--done': i < step && stepValid[i] }"
                :aria-current="i === step ? 'step' : undefined"
                @click="step = i"
              >
                <span class="wiz-step-dot">
                  <svg v-if="i < step && stepValid[i]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <template v-else>{{ i + 1 }}</template>
                </span>
                <span class="whitespace-nowrap">{{ label }}</span>
              </button>
              <span v-if="i < STEPS.length - 1" class="wiz-step-line" :class="{ 'wiz-step-line--done': i < step }" aria-hidden="true" />
            </li>
          </ol>
        </div>

        <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="next">
          <!-- Producten kiezen voor één kortingsregel: filters + tabel -->
          <div v-if="pickingSet" class="flex min-h-0 flex-1 flex-col">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-(--color-border) px-4 py-3">
              <span class="text-sm font-semibold text-(--color-text-strong)">
                Producten voor korting {{ setNumber(pickingSet) }}
              </span>
              <span class="adm-badge adm-badge--info">{{ setLabel(pickingSet) }}</span>
              <span class="text-[0.8125rem] text-(--color-text-muted)">
                Producten uit een andere korting van deze promotie kun je hier niet kiezen.
              </span>
            </div>
            <div class="adm-card-toolbar">
              <label class="relative block w-full sm:w-72">
                <span class="sr-only">Zoek een product</span>
                <svg
                  class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-(--color-text-muted)"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  ref="productSearchInput"
                  v-model="productSearch"
                  type="search"
                  autocomplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  placeholder="Zoek op naam, artikelnr of leverancier…"
                  class="adm-input w-full pl-9"
                  @keydown.enter.prevent="pickFirstProduct"
                >
              </label>
              <select v-model="productCategory" aria-label="Categorie" class="adm-input w-full max-w-52 sm:w-auto">
                <option :value="null">Alle categorieën</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.slug">{{ cat.name }}</option>
              </select>
              <select v-model="productSupplier" aria-label="Leverancier" class="adm-input w-full max-w-52 sm:w-auto">
                <option :value="null">Alle leveranciers</option>
                <option v-for="s in suppliers" :key="s.name" :value="s.name">{{ s.name }}</option>
              </select>
              <label class="flex items-center gap-2 text-sm text-(--color-text-muted) sm:ml-auto">
                <input v-model="includeInactive" type="checkbox" class="adm-check">
                Ook inactieve producten
              </label>
            </div>

            <!-- Gekozen producten -->
            <div
              v-if="selectedProducts.length > 0"
              class="flex max-h-28 flex-wrap items-center gap-2 overflow-y-auto border-b border-(--color-border) bg-(--color-surface-2) px-4 py-2.5"
            >
              <span class="text-[0.8125rem] font-semibold text-(--color-text-strong)">
                {{ selectedProducts.length }} gekozen:
              </span>
              <span v-for="p in selectedProducts" :key="p.id" class="wiz-chip">
                <span class="max-w-56 truncate">{{ p.name }}</span>
                <button type="button" :aria-label="`${p.name} verwijderen`" @click="toggleProduct(p)">×</button>
              </span>
              <button
                v-if="!editing && selectedProducts.length > 1"
                type="button"
                class="ml-auto text-[0.8125rem] font-semibold text-(--color-accent) hover:underline"
                @click="selectedProducts = []"
              >
                Selectie wissen
              </button>
            </div>

            <div class="min-h-0 flex-1 overflow-auto">
              <table class="adm-table">
                <thead class="sticky top-0 z-1">
                  <tr>
                    <th class="adm-col-check">
                      <input
                        v-if="!editing"
                        type="checkbox"
                        class="adm-check"
                        :checked="allOnPageSelected"
                        :disabled="productResults.length === 0"
                        aria-label="Alle producten op deze pagina selecteren"
                        @change="toggleAllOnPage"
                      >
                    </th>
                    <th :aria-sort="ariaSort('articleNr')">
                      <button type="button" class="adm-sort" @click="toggleProductSort('articleNr')">
                        Artikelnr.
                        <span class="wiz-sort" :class="{ 'wiz-sort--active': productSort === 'articleNr' }" aria-hidden="true">{{ sortIcon('articleNr') }}</span>
                      </button>
                    </th>
                    <th class="w-full" :aria-sort="ariaSort('name')">
                      <button type="button" class="adm-sort" @click="toggleProductSort('name')">
                        Product
                        <span class="wiz-sort" :class="{ 'wiz-sort--active': productSort === 'name' }" aria-hidden="true">{{ sortIcon('name') }}</span>
                      </button>
                    </th>
                    <th class="hidden sm:table-cell">Eenheid</th>
                    <th class="hidden md:table-cell" :aria-sort="ariaSort('supplier')">
                      <button type="button" class="adm-sort" @click="toggleProductSort('supplier')">
                        Leverancier
                        <span class="wiz-sort" :class="{ 'wiz-sort--active': productSort === 'supplier' }" aria-hidden="true">{{ sortIcon('supplier') }}</span>
                      </button>
                    </th>
                    <th class="hidden lg:table-cell" :aria-sort="ariaSort('category')">
                      <button type="button" class="adm-sort" @click="toggleProductSort('category')">
                        Categorie
                        <span class="wiz-sort" :class="{ 'wiz-sort--active': productSort === 'category' }" aria-hidden="true">{{ sortIcon('category') }}</span>
                      </button>
                    </th>
                    <th class="adm-num">Prijs</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="p in productResults"
                    :key="p.id"
                    :class="otherSetOf(p.id) ? 'opacity-55' : 'cursor-pointer'"
                    :aria-selected="isProductSelected(p.id)"
                    @click="toggleProduct(p)"
                  >
                    <td class="adm-col-check">
                      <input
                        :type="editing ? 'radio' : 'checkbox'"
                        name="promotion-product"
                        class="adm-check"
                        :checked="isProductSelected(p.id) || Boolean(otherSetOf(p.id))"
                        :disabled="Boolean(otherSetOf(p.id))"
                        :aria-label="`${p.name} kiezen`"
                        @click.stop
                        @change="toggleProduct(p)"
                      >
                    </td>
                    <td class="font-mono text-[0.8125rem] whitespace-nowrap text-(--color-text-muted)">{{ p.articleNr }}</td>
                    <td class="w-full max-w-0">
                      <p class="truncate font-medium text-(--color-text-strong)" :title="p.name">
                        {{ p.name }}
                        <span v-if="!p.isActive" class="adm-badge adm-badge--neutral ml-1.5">Inactief</span>
                        <span v-if="otherSetOf(p.id)" class="adm-badge adm-badge--neutral ml-1.5">
                          In korting {{ setNumber(otherSetOf(p.id)!) }}
                        </span>
                      </p>
                    </td>
                    <td class="hidden whitespace-nowrap text-(--color-text-muted) sm:table-cell">{{ p.unit ?? "—" }}</td>
                    <td class="hidden whitespace-nowrap text-(--color-text-muted) md:table-cell">{{ p.supplier }}</td>
                    <td class="hidden whitespace-nowrap text-(--color-text-muted) lg:table-cell">{{ p.category.name }}</td>
                    <td class="adm-num whitespace-nowrap">{{ p.price !== null ? formatEuro(p.price) : "—" }}</td>
                  </tr>
                  <tr v-if="productResults.length === 0">
                    <td colspan="7" class="adm-card-empty">
                      {{ productsPending ? "Zoeken…" : "Geen producten gevonden." }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <AdminPagination
              v-model:page="productPage"
              :page-count="productPageCount"
              :total="productTotal"
              :per-page="PRODUCT_PAGE_SIZE"
              noun="producten"
            />
          </div>

          <div
            v-else
            class="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_20rem] lg:overflow-hidden"
          >
            <div class="flex min-w-0 flex-col gap-5 px-5 py-5 sm:px-6 lg:overflow-y-auto">
            <!-- 1. Naam + periode -->
            <template v-if="step === 0">
              <label v-if="!editing" class="block">
                <span class="adm-label">Naam van de promotie</span>
                <input
                  ref="groupNameInput"
                  v-model="groupName"
                  type="text"
                  maxlength="120"
                  autocomplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  placeholder="bv. Folder week 43 of Promotie op kaas"
                  class="adm-input w-full sm:max-w-md"
                >
              </label>
              <p v-else class="adm-notice mb-0!">
                Losse promotie zonder naam. Nieuwe promoties krijgen altijd een naam.
              </p>
              <div>
                <span class="adm-label">Snel kiezen</span>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="range in quickRanges"
                    :key="range.label"
                    type="button"
                    class="wiz-preset"
                    @click="setPeriod(range.start, range.end)"
                  >
                    {{ range.label }}
                  </button>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <label class="block">
                  <span class="adm-label">Begindatum</span>
                  <input v-model="startsOn" type="date" required class="adm-input w-full">
                </label>
                <label class="block">
                  <span class="adm-label">Einddatum (inclusief)</span>
                  <input
                    v-model="endsOn"
                    type="date"
                    required
                    :min="startsOn || undefined"
                    class="adm-input w-full"
                  >
                </label>
              </div>
              <p v-if="periodValid" class="adm-notice mb-0! flex flex-wrap items-center gap-2">
                <strong>{{ periodDays }} dag{{ periodDays !== 1 ? "en" : "" }}</strong>
                <span class="text-(--color-text-muted)">
                  {{ formatDate(startsOn) }} – {{ formatDate(endsOn) }}
                </span>
                <span class="adm-badge ml-auto" :class="STATUS_BADGE[promotionStatus(startsOn, endsOn)]">
                  {{ PROMOTION_STATUS_LABELS[promotionStatus(startsOn, endsOn)] }}
                </span>
              </p>
            </template>

            <!-- 2. Klanten -->
            <template v-else-if="step === 1">
              <fieldset>
                <legend class="adm-label">Wie heeft recht op de promotie?</legend>
                <div class="grid gap-2 sm:grid-cols-2">
                  <label
                    v-for="option in AUDIENCE_OPTIONS"
                    :key="option.label"
                    class="wiz-option"
                    :class="{ 'wiz-option--active': allCustomers === option.value }"
                  >
                    <input v-model="allCustomers" type="radio" name="promotion-audience" :value="option.value" class="adm-check">
                    {{ option.label }}
                  </label>
                </div>
              </fieldset>

              <!-- Op een breed scherm vult de lijst de rest van de hoogte; ernaast scrolt enkel de lijst. -->
              <div v-if="!allCustomers" class="adm-card flex flex-col lg:min-h-0 lg:flex-1">
                <div class="adm-card-toolbar">
                  <label class="relative block w-full sm:w-72">
                    <span class="sr-only">Zoek een klant</span>
                    <svg
                      class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-(--color-text-muted)"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      aria-hidden="true"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <input
                      ref="customerSearchInput"
                      v-model="customerSearch"
                      type="search"
                      autocomplete="off"
                      data-1p-ignore
                      data-lpignore="true"
                      placeholder="Zoek op klantnr, naam of e-mail…"
                      class="adm-input w-full pl-9"
                      @keydown.enter.prevent="pickFirstCustomer"
                    >
                  </label>
                  <span class="text-sm text-(--color-text-muted)">{{ selectedCustomers.length }} gekozen</span>
                  <button
                    v-if="customerResults.length > 0"
                    type="button"
                    class="adm-btn adm-btn--ghost adm-btn--sm sm:ml-auto"
                    @click="selectAllCustomerResults"
                  >
                    Alle {{ customerResults.length }} resultaten kiezen
                  </button>
                </div>
                <div
                  v-if="selectedCustomers.length > 0"
                  class="flex max-h-24 flex-wrap gap-2 overflow-y-auto border-b border-(--color-border) bg-(--color-surface-2) px-4 py-2.5"
                >
                  <span v-for="c in selectedCustomers" :key="c.id" class="wiz-chip">
                    <span class="max-w-56 truncate">{{ c.name }}</span>
                    <button type="button" :aria-label="`${c.name} verwijderen`" @click="toggleCustomer(c)">×</button>
                  </span>
                </div>
                <div class="max-h-80 overflow-y-auto lg:max-h-none lg:min-h-40 lg:flex-1">
                  <table class="adm-table">
                    <tbody>
                      <tr
                        v-for="c in customerResults"
                        :key="c.id"
                        class="cursor-pointer"
                        :aria-selected="selectedCustomerIds.has(c.id)"
                        @click="toggleCustomer(c)"
                      >
                        <td class="adm-col-check">
                          <input
                            type="checkbox"
                            class="adm-check"
                            :checked="selectedCustomerIds.has(c.id)"
                            :aria-label="`${c.name} kiezen`"
                            @click.stop
                            @change="toggleCustomer(c)"
                          >
                        </td>
                        <td class="font-mono text-[0.8125rem] whitespace-nowrap text-(--color-text-muted)">{{ c.customerNr }}</td>
                        <td class="w-full max-w-0">
                          <p class="truncate font-medium text-(--color-text-strong)">{{ c.name }}</p>
                        </td>
                      </tr>
                      <tr v-if="customerResults.length === 0">
                        <td colspan="3" class="adm-card-empty">
                          {{ customersPending ? "Zoeken…" : "Geen klanten gevonden." }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </template>

            <!-- 3. Kortingen: elke regel = één korting voor een verzameling producten -->
            <template v-else>
              <div
                v-for="set in sets"
                :key="set.key"
                class="wiz-set"
                :class="{ 'wiz-set--open': openSetKey === set.key }"
              >
                <div class="wiz-set-head">
                  <button
                    type="button"
                    class="flex min-w-0 flex-1 items-center gap-2 text-left"
                    :aria-expanded="openSetKey === set.key"
                    @click="openSetKey = openSetKey === set.key ? null : set.key"
                  >
                    <svg class="wiz-set-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span class="font-semibold text-(--color-text-strong)">Korting {{ setNumber(set) }}</span>
                    <span class="truncate text-sm" :class="setDiscount(set) ? 'text-(--color-text-strong)' : 'text-(--color-primary)'">
                      {{ setLabel(set) }}
                    </span>
                    <span class="ml-auto shrink-0 text-[0.8125rem]" :class="set.products.length ? 'text-(--color-text-muted)' : 'text-(--color-primary)'">
                      {{ set.products.length }} product{{ set.products.length !== 1 ? "en" : "" }}
                    </span>
                  </button>
                  <button
                    v-if="sets.length > 1"
                    type="button"
                    class="adm-row-btn shrink-0"
                    title="Korting verwijderen"
                    :aria-label="`Korting ${setNumber(set)} verwijderen`"
                    @click="removeSet(set)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div v-if="openSetKey === set.key" class="flex flex-col gap-4 px-4 pt-1 pb-4">
                  <div>
                    <span class="adm-label">Snel kiezen</span>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="preset in PRESETS"
                        :key="preset.label"
                        type="button"
                        class="wiz-preset"
                        @click="applyPreset(set.form, preset)"
                      >
                        {{ preset.label }}
                      </button>
                    </div>
                  </div>

                  <fieldset>
                    <legend class="adm-label">Soort korting</legend>
                    <div class="grid gap-2 sm:grid-cols-3">
                      <label
                        v-for="type in PROMOTION_TYPES"
                        :key="type"
                        class="wiz-option"
                        :class="{ 'wiz-option--active': set.form.type === type }"
                      >
                        <input v-model="set.form.type" type="radio" :name="`promotion-type-${set.key}`" :value="type" class="adm-check">
                        {{ PROMOTION_TYPE_LABELS[type] }}
                      </label>
                    </div>
                  </fieldset>

                  <div v-if="set.form.type === 'percentage'" class="grid grid-cols-2 gap-3">
                    <label class="block">
                      <span class="adm-label">Korting (%)</span>
                      <input v-model.number="set.form.percentage" type="number" min="0.01" max="99.99" step="0.01" required class="adm-input w-full">
                    </label>
                    <label class="block">
                      <span class="adm-label">Vanaf aantal stuks</span>
                      <input v-model.number="set.form.minQuantity" type="number" min="1" max="999" step="1" required class="adm-input w-full">
                    </label>
                  </div>

                  <div v-else-if="set.form.type === 'free_items'" class="grid grid-cols-2 gap-3">
                    <label class="block">
                      <span class="adm-label">Aantal kopen</span>
                      <input v-model.number="set.form.buyQuantity" type="number" min="1" max="999" step="1" required class="adm-input w-full">
                    </label>
                    <label class="block">
                      <span class="adm-label">Aantal gratis</span>
                      <input v-model.number="set.form.freeQuantity" type="number" min="1" max="999" step="1" required class="adm-input w-full">
                    </label>
                  </div>

                  <div v-else class="grid grid-cols-2 gap-3">
                    <label class="block">
                      <span class="adm-label">Promoprijs per stuk (€)</span>
                      <input v-model.number="set.form.price" type="number" min="0.01" step="0.01" required class="adm-input w-full">
                    </label>
                    <label class="block">
                      <span class="adm-label">Vanaf aantal stuks</span>
                      <input v-model.number="set.form.minQuantity" type="number" min="1" max="999" step="1" required class="adm-input w-full">
                    </label>
                  </div>

                  <div>
                    <span class="adm-label">Producten met deze korting</span>
                    <div class="flex flex-wrap items-center gap-2">
                      <span v-for="p in set.products" :key="p.id" class="wiz-chip">
                        <span class="max-w-56 truncate">{{ p.name }}</span>
                        <button type="button" :aria-label="`${p.name} verwijderen`" @click="removeProduct(set, p.id)">×</button>
                      </span>
                      <button type="button" class="adm-btn adm-btn--secondary adm-btn--sm" @click="startPicking(set)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        {{ set.products.length ? "Producten wijzigen" : "Producten kiezen" }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button
                v-if="!editing"
                type="button"
                class="adm-btn adm-btn--secondary self-start"
                @click="addSet"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14" />
                </svg>
                Nog een korting toevoegen
              </button>
            </template>
            </div>

            <!-- Samenvatting: altijd zichtbaar naast de stappen -->
            <aside
              class="border-t border-(--color-border) bg-(--color-surface-2) px-5 py-5 sm:px-6 lg:overflow-y-auto lg:border-t-0 lg:border-l"
              aria-label="Samenvatting"
            >
              <h4 class="mb-4 text-sm font-semibold text-(--color-text-strong)">Samenvatting</h4>
              <dl class="adm-dl">
                <div v-if="!editing">
                  <dt>Naam</dt>
                  <dd v-if="groupName.trim()">{{ groupName.trim() }}</dd>
                  <dd v-else class="text-(--color-text-muted)">Nog in te vullen</dd>
                </div>
                <div>
                  <dt>Periode</dt>
                  <dd v-if="periodValid">
                    {{ formatDate(startsOn) }} – {{ formatDate(endsOn) }}
                    <span class="block text-[0.8125rem] text-(--color-text-muted)">
                      {{ periodDays }} dag{{ periodDays !== 1 ? "en" : "" }}
                    </span>
                  </dd>
                  <dd v-else class="text-(--color-text-muted)">Nog in te vullen</dd>
                </div>
                <div>
                  <dt>Klanten</dt>
                  <dd v-if="step >= 1">
                    {{
                      allCustomers
                        ? "Alle klanten"
                        : `${selectedCustomers.length} klant${selectedCustomers.length !== 1 ? "en" : ""}`
                    }}
                  </dd>
                  <dd v-else class="text-(--color-text-muted)">Nog in te vullen</dd>
                </div>
                <div>
                  <dt>Kortingen ({{ allProducts.length }} product{{ allProducts.length !== 1 ? "en" : "" }})</dt>
                  <dd v-if="step >= 2">
                    <ul class="space-y-0.5">
                      <li v-for="set in sets" :key="set.key" class="truncate">
                        {{ setLabel(set) }}
                        <span class="text-(--color-text-muted)">· {{ set.products.length }}</span>
                      </li>
                    </ul>
                  </dd>
                  <dd v-else class="text-(--color-text-muted)">Nog in te vullen</dd>
                </div>
              </dl>
            </aside>
          </div>

          <p v-if="error" class="adm-notice adm-notice--error mx-5 mt-3 mb-0! sm:mx-6" role="alert">{{ error }}</p>

          <!-- Producten kiezen: terug naar de kortingen -->
          <div
            v-if="pickingSet"
            class="flex items-center gap-2 border-t border-(--color-border) bg-(--color-surface-2) px-5 py-3.5 sm:px-6"
          >
            <span class="text-sm text-(--color-text-muted)">
              {{ selectedProducts.length }} product{{ selectedProducts.length !== 1 ? "en" : "" }} gekozen
            </span>
            <button type="submit" class="adm-btn adm-btn--primary ml-auto">Klaar</button>
          </div>

          <div v-else class="flex items-center gap-2 border-t border-(--color-border) bg-(--color-surface-2) px-5 py-3.5 sm:px-6">
            <button v-if="step > 0" type="button" class="adm-btn adm-btn--secondary" @click="step--">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Vorige
            </button>
            <span v-if="stepHint" class="text-sm text-(--color-text-muted)">{{ stepHint }}</span>
            <button type="button" class="adm-btn adm-btn--ghost ml-auto" @click="close">Annuleren</button>
            <button type="submit" :disabled="saving || !stepValid[step]" class="adm-btn adm-btn--primary">
              {{ step < STEPS.length - 1 ? "Volgende" : saving ? "Opslaan…" : "Opslaan" }}
              <svg v-if="step < STEPS.length - 1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {
  PROMOTION_STATUS_LABELS,
  PROMOTION_TYPE_LABELS,
  PROMOTION_TYPES,
  promotionDiscountSchema,
  promotionLabel,
  promotionStatus,
  normalizeDiscount,
  todayInBrussels,
  type PromotionDiscount,
  type PromotionStatus,
  type PromotionType,
} from "#shared/promotion";

/**
 * Wizard voor een promotie (groep): naam + periode → klanten → kortingen.
 * Een groep heeft één naam, periode en klantenlijst, en een of meer
 * kortingsregels: één korting voor een verzameling producten (bv. een folder
 * met "3+1 gratis" op kazen en "10%" op salami's). Elk product komt in één
 * regel. Oude promoties zonder groep zijn als losse promotie te bewerken.
 */
export interface PromotionWizardProduct {
  id: string;
  articleNr: string;
  name: string;
  unit: string | null;
  price: number | null;
}

export interface PromotionWizardCustomer {
  id: string;
  customerNr: string;
  name: string;
}

export interface PromotionWizardGroup {
  id: string;
  name: string;
}

export interface PromotionWizardItem {
  product: PromotionWizardProduct;
  discount: PromotionDiscount;
}

export interface PromotionWizardInitial {
  /** Eén losse promotie bewerken (zonder groep). */
  id?: string;
  /** Een groep bewerken; ontbreekt bij een nieuwe promotie of bij dupliceren. */
  groupId?: string;
  groupName: string;
  /** Producten met elk hun korting; gelijke kortingen worden één regel. */
  items: PromotionWizardItem[];
  /** De regel met dit product staat open; de wizard begint dan bij de kortingen. */
  focusProductId?: string;
  startsOn: string;
  endsOn: string;
  allCustomers: boolean;
  customers: PromotionWizardCustomer[];
}

const props = defineProps<{
  open: boolean;
  /** Vooraf ingevuld (bewerken of dupliceren); `null` voor een lege wizard. */
  initial: PromotionWizardInitial | null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [message: string];
}>();

const STEPS = ["Naam & periode", "Klanten", "Kortingen"];

const STEP_HINTS = computed(() => [
  editing.value ? "Wanneer loopt de promotie?" : "Hoe heet de promotie en wanneer loopt ze?",
  "Wie heeft recht op de promotie? Geldt voor alle producten.",
  pickingSet.value
    ? "Kies de producten die deze korting krijgen."
    : editing.value
      ? "Welke korting krijgt het product?"
      : "Voeg een of meer kortingen toe, elk met de producten die ze krijgen.",
]);

const STATUS_BADGE: Record<PromotionStatus, string> = {
  active: "adm-badge--success",
  scheduled: "adm-badge--info",
  expired: "adm-badge--neutral",
};

const AUDIENCE_OPTIONS = [
  { value: true, label: "Alle klanten" },
  { value: false, label: "Enkel geselecteerde klanten" },
];

interface Preset {
  label: string;
  type: PromotionType;
  percentage?: number;
  minQuantity?: number;
  buyQuantity?: number;
  freeQuantity?: number;
}

const PRESETS: Preset[] = [
  { label: "10%", type: "percentage", percentage: 10, minQuantity: 1 },
  { label: "25% vanaf 2 stuks", type: "percentage", percentage: 25, minQuantity: 2 },
  { label: "15% bij 2 stuks", type: "percentage", percentage: 15, minQuantity: 2 },
  { label: "2+1 gratis", type: "free_items", buyQuantity: 2, freeQuantity: 1 },
  { label: "3+1 gratis", type: "free_items", buyQuantity: 3, freeQuantity: 1 },
];

/** Eén losse promotie (zonder groep) bewerken: precies één product, geen naam. */
const editing = computed(() => Boolean(props.initial?.id));
/** Een bestaande groep bewerken: alles wordt in één keer vervangen. */
const editingGroup = computed(() => Boolean(props.initial?.groupId));

const step = ref(0);
const saving = ref(false);
const error = ref("");

const groupName = ref("");
const groupNameInput = ref<HTMLInputElement | null>(null);

// --- Kortingsregels -------------------------------------------------------

/** Formulierwaarden van één korting; "" = leeg veld. */
interface DiscountForm {
  type: PromotionType;
  percentage: number | "";
  minQuantity: number | "";
  buyQuantity: number | "";
  freeQuantity: number | "";
  price: number | "";
}

/** Eén korting voor een verzameling producten. */
interface DiscountSet {
  key: number;
  form: DiscountForm;
  products: PromotionWizardProduct[];
}

function discountForm(d?: PromotionDiscount | DiscountForm): DiscountForm {
  return {
    type: d?.type ?? "percentage",
    percentage: d?.percentage ?? 10,
    minQuantity: d?.minQuantity ?? 1,
    buyQuantity: d?.buyQuantity ?? 3,
    freeQuantity: d?.freeQuantity ?? 1,
    price: d?.price ?? "",
  };
}

function parseDiscount(form: DiscountForm) {
  return promotionDiscountSchema.safeParse({
    type: form.type,
    percentage: form.percentage === "" ? undefined : form.percentage,
    minQuantity: form.minQuantity === "" ? undefined : form.minQuantity,
    buyQuantity: form.buyQuantity === "" ? undefined : form.buyQuantity,
    freeQuantity: form.freeQuantity === "" ? undefined : form.freeQuantity,
    price: form.price === "" ? undefined : form.price,
  });
}

const sets = ref<DiscountSet[]>([]);
let lastSetKey = 0;
/** De regel die openstaat om te bewerken. */
const openSetKey = ref<number | null>(null);
/** De regel waarvoor de producttabel openstaat. */
const pickingSetKey = ref<number | null>(null);
const pickingSet = computed(() => sets.value.find((s) => s.key === pickingSetKey.value) ?? null);

function newSet(form = discountForm(), products: PromotionWizardProduct[] = []): DiscountSet {
  return { key: ++lastSetKey, form, products };
}

function addSet() {
  const set = newSet();
  sets.value.push(set);
  openSetKey.value = set.key;
}

function removeSet(set: DiscountSet) {
  if (set.products.length > 0 && !window.confirm(`Korting ${setNumber(set)} met ${set.products.length} product(en) verwijderen?`)) {
    return;
  }
  sets.value = sets.value.filter((s) => s.key !== set.key);
}

function setNumber(set: DiscountSet) {
  return sets.value.indexOf(set) + 1;
}

function setDiscount(set: DiscountSet): PromotionDiscount | null {
  const parsed = parseDiscount(set.form);
  return parsed.success ? normalizeDiscount(parsed.data) : null;
}

function setLabel(set: DiscountSet) {
  const d = setDiscount(set);
  return d ? promotionLabel(d) : "Korting onvolledig";
}

function applyPreset(form: DiscountForm, preset: Preset) {
  form.type = preset.type;
  if (preset.percentage !== undefined) form.percentage = preset.percentage;
  if (preset.minQuantity !== undefined) form.minQuantity = preset.minQuantity;
  if (preset.buyQuantity !== undefined) form.buyQuantity = preset.buyQuantity;
  if (preset.freeQuantity !== undefined) form.freeQuantity = preset.freeQuantity;
}

function removeProduct(set: DiscountSet, productId: string) {
  set.products = set.products.filter((p) => p.id !== productId);
}

const allProducts = computed(() => sets.value.flatMap((s) => s.products));

/** De andere regel waar dit product al in zit (een product krijgt één korting). */
function otherSetOf(productId: string) {
  return sets.value.find(
    (s) => s.key !== pickingSetKey.value && s.products.some((p) => p.id === productId),
  );
}

function startPicking(set: DiscountSet) {
  pickingSetKey.value = set.key;
  void loadProducts();
  nextTick(() => productSearchInput.value?.focus());
}

/**
 * Wat er in de producttabel aangevinkt is: de producten van de regel
 * waarvoor de tabel openstaat.
 */
const selectedProducts = computed<PromotionWizardProduct[]>({
  get: () => pickingSet.value?.products ?? [],
  set: (list) => {
    if (pickingSet.value) pickingSet.value.products = list;
  },
});

// --- Producttabel ---------------------------------------------------------

interface ProductResult extends PromotionWizardProduct {
  supplier: string;
  isActive: boolean;
  category: { name: string };
}

const PRODUCT_PAGE_SIZE = 25;

const productSearch = ref("");
const debouncedProductSearch = useDebounced(productSearch);
const productSearchInput = ref<HTMLInputElement | null>(null);
const productCategory = ref<string | null>(null);
const productSupplier = ref<string | null>(null);
const includeInactive = ref(false);
const productPage = ref(1);

// Sorteren op een kolomkop: eerste klik oplopend, tweede klik aflopend.
type ProductSortKey = "name" | "articleNr" | "supplier" | "category";
const productSort = ref<ProductSortKey>("name");
const productSortDir = ref<"asc" | "desc">("asc");

function toggleProductSort(key: ProductSortKey) {
  if (productSort.value === key) {
    productSortDir.value = productSortDir.value === "asc" ? "desc" : "asc";
  } else {
    productSort.value = key;
    productSortDir.value = "asc";
  }
}

function sortIcon(key: ProductSortKey) {
  if (productSort.value !== key) return "↕";
  return productSortDir.value === "asc" ? "↑" : "↓";
}

function ariaSort(key: ProductSortKey) {
  if (productSort.value !== key) return undefined;
  return productSortDir.value === "asc" ? "ascending" : "descending";
}

const productResults = ref<ProductResult[]>([]);
const productTotal = ref(0);
const productPageCount = ref(0);
const productsPending = ref(false);
let productRequest = 0;

async function loadProducts() {
  const request = ++productRequest;
  productsPending.value = true;
  try {
    const result = await $fetch<{
      items: ProductResult[];
      pagination: { total: number; pageCount: number };
    }>("/api/admin/products", {
      query: {
        search: debouncedProductSearch.value || undefined,
        category: productCategory.value || undefined,
        supplier: productSupplier.value || undefined,
        status: includeInactive.value ? undefined : "active",
        sort: productSort.value,
        sortDir: productSortDir.value,
        page: productPage.value,
        perPage: PRODUCT_PAGE_SIZE,
      },
    });
    // Enkel het antwoord op de laatste zoekopdracht tonen.
    if (request === productRequest) {
      productResults.value = result.items;
      productTotal.value = result.pagination.total;
      productPageCount.value = result.pagination.pageCount;
    }
  } catch {
    if (request === productRequest) productResults.value = [];
  } finally {
    if (request === productRequest) productsPending.value = false;
  }
}

// Andere filters: terug naar pagina 1 (dat herlaadt via de watcher hieronder).
watch(
  [debouncedProductSearch, productCategory, productSupplier, includeInactive, productSort, productSortDir],
  () => {
    if (productPage.value !== 1) productPage.value = 1;
    else if (props.open) void loadProducts();
  },
);
watch(productPage, () => {
  if (props.open) void loadProducts();
});

// Filterlijsten: één keer laden, bij de eerste opening.
const categories = ref<{ id: string; slug: string; name: string }[]>([]);
const suppliers = ref<{ name: string }[]>([]);
async function loadFilterOptions() {
  if (categories.value.length > 0) return;
  try {
    [categories.value, suppliers.value] = await Promise.all([
      $fetch<{ id: string; slug: string; name: string }[]>("/api/categories"),
      $fetch<{ name: string }[]>("/api/admin/suppliers"),
    ]);
  } catch {
    // Zonder filterlijsten werkt zoeken nog altijd.
  }
}

const allOnPageSelected = computed(
  () =>
    productResults.value.length > 0 &&
    productResults.value.every((p) => isProductSelected(p.id) || otherSetOf(p.id)),
);

function toggleAllOnPage() {
  if (allOnPageSelected.value) {
    const onPage = new Set(productResults.value.map((p) => p.id));
    selectedProducts.value = selectedProducts.value.filter((p) => !onPage.has(p.id));
  } else {
    selectAllProductResults();
  }
}

function isProductSelected(id: string) {
  return selectedProducts.value.some((p) => p.id === id);
}

function toggleProduct(p: PromotionWizardProduct) {
  if (otherSetOf(p.id)) return;
  const product = { id: p.id, articleNr: p.articleNr, name: p.name, unit: p.unit, price: p.price };
  if (editing.value) {
    selectedProducts.value = [product];
  } else if (isProductSelected(p.id)) {
    selectedProducts.value = selectedProducts.value.filter((s) => s.id !== p.id);
  } else {
    selectedProducts.value = [...selectedProducts.value, product];
  }
}

/**
 * Enter in het zoekveld: eerste treffer aanvinken en het zoekveld leegmaken,
 * zodat je meteen het volgende product kunt zoeken. Leeg veld + Enter = klaar.
 */
function pickFirstProduct() {
  const first = productResults.value.find((p) => !isProductSelected(p.id) && !otherSetOf(p.id));
  if (productSearch.value.trim() && first) {
    toggleProduct(first);
    if (!editing.value) productSearch.value = "";
  } else if (!productSearch.value.trim()) {
    next();
  }
}

function selectAllProductResults() {
  for (const p of productResults.value) {
    if (!isProductSelected(p.id)) toggleProduct(p);
  }
}

// --- Periode ---------------------------------------------------------------

const startsOn = ref("");
const endsOn = ref("");

/** Rekenen op kalenderdagen in UTC, zodat zomertijd geen dag verschuift. */
function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function monthRange(iso: string, offset: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  const first = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset, 1));
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset + 1, 0));
  return { start: first.toISOString().slice(0, 10), end: last.toISOString().slice(0, 10) };
}

const quickRanges = computed(() => {
  const today = todayInBrussels();
  // Maandag = 0
  const weekday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  const nextMonday = addDays(today, 7 - weekday);
  const thisMonth = monthRange(today, 0);
  const nextMonth = monthRange(today, 1);
  return [
    { label: "1 week vanaf vandaag", start: today, end: addDays(today, 6) },
    { label: "2 weken vanaf vandaag", start: today, end: addDays(today, 13) },
    { label: "Volgende week", start: nextMonday, end: addDays(nextMonday, 6) },
    { label: "Rest van deze maand", start: today, end: thisMonth.end },
    { label: "Volgende maand", start: nextMonth.start, end: nextMonth.end },
  ];
});

function setPeriod(start: string, end: string) {
  startsOn.value = start;
  endsOn.value = end;
}

const periodValid = computed(
  () => Boolean(startsOn.value && endsOn.value) && endsOn.value >= startsOn.value,
);
const periodDays = computed(() =>
  periodValid.value
    ? Math.round(
        (Date.parse(`${endsOn.value}T00:00:00Z`) - Date.parse(`${startsOn.value}T00:00:00Z`)) /
          86_400_000,
      ) + 1
    : 0,
);

// --- Klanten ---------------------------------------------------------------

const allCustomers = ref(true);
const selectedCustomers = ref<PromotionWizardCustomer[]>([]);
const selectedCustomerIds = computed(() => new Set(selectedCustomers.value.map((c) => c.id)));
const customerSearch = ref("");
const debouncedCustomerSearch = useDebounced(customerSearch);
const customerSearchInput = ref<HTMLInputElement | null>(null);

const customerResults = ref<PromotionWizardCustomer[]>([]);
const customersPending = ref(false);
let customerRequest = 0;

async function loadCustomers() {
  const request = ++customerRequest;
  customersPending.value = true;
  try {
    const result = await $fetch<{ items: PromotionWizardCustomer[] }>("/api/admin/customers", {
      query: { search: debouncedCustomerSearch.value || undefined, perPage: 50 },
    });
    if (request === customerRequest) customerResults.value = result.items;
  } catch {
    if (request === customerRequest) customerResults.value = [];
  } finally {
    if (request === customerRequest) customersPending.value = false;
  }
}

watch(debouncedCustomerSearch, () => {
  if (props.open && !allCustomers.value) void loadCustomers();
});

function toggleCustomer(c: PromotionWizardCustomer) {
  if (selectedCustomerIds.value.has(c.id)) {
    selectedCustomers.value = selectedCustomers.value.filter((s) => s.id !== c.id);
  } else {
    selectedCustomers.value = [
      ...selectedCustomers.value,
      { id: c.id, customerNr: c.customerNr, name: c.name },
    ];
  }
}

function pickFirstCustomer() {
  const first = customerResults.value.find((c) => !selectedCustomerIds.value.has(c.id));
  if (first) {
    toggleCustomer(first);
    customerSearch.value = "";
  }
}

function selectAllCustomerResults() {
  const add = customerResults.value
    .filter((c) => !selectedCustomerIds.value.has(c.id))
    .map((c) => ({ id: c.id, customerNr: c.customerNr, name: c.name }));
  selectedCustomers.value = [...selectedCustomers.value, ...add];
}

watch(allCustomers, (all) => {
  if (all) return;
  if (customerResults.value.length === 0) void loadCustomers();
  nextTick(() => customerSearchInput.value?.focus());
});

// --- Navigatie + opslaan --------------------------------------------------

const setsValid = computed(
  () =>
    sets.value.length > 0 &&
    sets.value.every((s) => s.products.length > 0 && setDiscount(s) !== null),
);

const stepValid = computed(() => [
  (editing.value || Boolean(groupName.value.trim())) && periodValid.value,
  allCustomers.value || selectedCustomers.value.length > 0,
  setsValid.value,
]);

/** Waarom "Volgende"/"Opslaan" nog niet kan. */
const stepHint = computed(() => {
  if (step.value === 0) {
    if (!editing.value && !groupName.value.trim()) return "Geef de promotie een naam.";
    if (!periodValid.value) return "Kies een periode.";
  }
  if (step.value === 1 && !stepValid.value[1]) return "Kies minstens één klant.";
  if (step.value === 2) {
    const empty = sets.value.find((s) => s.products.length === 0);
    if (empty) return `Korting ${setNumber(empty)} heeft nog geen producten.`;
    const invalid = sets.value.find((s) => setDiscount(s) === null);
    if (invalid) return `Korting ${setNumber(invalid)} is nog onvolledig.`;
    return `${allProducts.value.length} product${allProducts.value.length !== 1 ? "en" : ""} in ${sets.value.length} korting${sets.value.length !== 1 ? "en" : ""}`;
  }
  return "";
});

/** Een stap is bereikbaar als alle stappen ervoor in orde zijn. */
function canVisit(i: number) {
  return stepValid.value.slice(0, i).every(Boolean);
}

function next() {
  // Enter of "Klaar" in de producttabel: terug naar de kortingen.
  if (pickingSet.value) {
    pickingSetKey.value = null;
    return;
  }
  if (!stepValid.value[step.value]) return;
  error.value = "";
  if (step.value < STEPS.length - 1) step.value++;
  else void save();
}

watch(step, (s) => {
  pickingSetKey.value = null;
  if (s === 0) nextTick(() => groupNameInput.value?.focus());
  if (s === 1 && !allCustomers.value) nextTick(() => customerSearchInput.value?.focus());
});

async function save() {
  if (saving.value || !setsValid.value) return;
  const items = sets.value.flatMap((set) => {
    const parsed = parseDiscount(set.form);
    return parsed.success
      ? set.products.map((p) => ({ productId: p.id, discount: parsed.data }))
      : [];
  });
  saving.value = true;
  error.value = "";
  const period = {
    startsOn: startsOn.value,
    endsOn: endsOn.value,
    customerIds: allCustomers.value ? null : selectedCustomers.value.map((c) => c.id),
  };
  try {
    if (props.initial?.id) {
      await $fetch(`/api/admin/promotions/${props.initial.id}`, {
        method: "PATCH",
        body: { ...period, productId: items[0]!.productId, discount: items[0]!.discount },
      });
      emit("saved", "Promotie bijgewerkt.");
    } else if (props.initial?.groupId) {
      await $fetch(`/api/admin/promotion-groups/${props.initial.groupId}`, {
        method: "PUT",
        body: { ...period, name: groupName.value.trim(), items },
      });
      emit("saved", `Promotie “${groupName.value.trim()}” bijgewerkt.`);
    } else {
      await $fetch("/api/admin/promotions", {
        method: "POST",
        body: { ...period, groupName: groupName.value.trim(), items },
      });
      emit("saved", `Promotie “${groupName.value.trim()}” aangemaakt met ${items.length} product${items.length !== 1 ? "en" : ""}.`);
    }
  } catch (err) {
    const message = (err as { data?: { statusMessage?: string } }).data?.statusMessage;
    error.value = message ?? "Opslaan mislukt. Probeer het later opnieuw.";
  } finally {
    saving.value = false;
  }
}

function close() {
  if (!saving.value) emit("close");
}

/**
 * Producten met dezelfde korting samenvoegen tot één regel, in de volgorde
 * waarin ze binnenkomen.
 */
function setsFromItems(items: PromotionWizardItem[]) {
  const byDiscount = new Map<string, DiscountSet>();
  for (const item of items) {
    const key = JSON.stringify(normalizeDiscount(promotionDiscountSchema.parse(item.discount)));
    const set = byDiscount.get(key) ?? newSet(discountForm(item.discount));
    set.products.push(item.product);
    byDiscount.set(key, set);
  }
  return [...byDiscount.values()];
}

/** Bij elke opening de wizard vullen vanuit `initial`, of leegmaken. */
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return;
    const init = props.initial;
    error.value = "";
    productSearch.value = "";
    debouncedProductSearch.value = "";
    productCategory.value = null;
    productSupplier.value = null;
    includeInactive.value = false;
    productSort.value = "name";
    productSortDir.value = "asc";
    productPage.value = 1;
    customerSearch.value = "";
    debouncedCustomerSearch.value = "";
    groupName.value = init?.groupName ?? "";
    sets.value = init && init.items.length > 0 ? setsFromItems(init.items) : [newSet()];
    pickingSetKey.value = null;
    const focusSet = init?.focusProductId
      ? sets.value.find((s) => s.products.some((p) => p.id === init.focusProductId))
      : undefined;
    openSetKey.value = (focusSet ?? sets.value[0])?.key ?? null;
    const week = quickRanges.value[0]!;
    startsOn.value = init?.startsOn ?? week.start;
    endsOn.value = init?.endsOn ?? week.end;
    allCustomers.value = init?.allCustomers ?? true;
    selectedCustomers.value = init ? [...init.customers] : [];
    // Een product aangeklikt in de lijst: meteen naar zijn korting.
    step.value = focusSet ? 2 : 0;
    void loadFilterOptions();
    if (!allCustomers.value) void loadCustomers();
    if (step.value === 0) nextTick(() => groupNameInput.value?.focus());
  },
);

onMounted(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && props.open) close();
  };
  window.addEventListener("keydown", onKey);
  onUnmounted(() => window.removeEventListener("keydown", onKey));
});

function useDebounced(source: Ref<string>, delay = 250) {
  const value = ref(source.value);
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch(source, (v) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      value.value = v;
    }, delay);
  });
  return value;
}

function formatEuro(value: number) {
  return value.toLocaleString("nl-BE", { style: "currency", currency: "EUR" });
}

function formatDate(iso: string) {
  return iso
    ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("nl-BE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";
}
</script>

<style scoped>
/* Breed genoeg voor de producttabel (stap 1), met een vaste hoogte zodat de
   modal niet verspringt tussen stappen of terwijl resultaten laden. */
.wiz--wide {
  max-width: 72rem;
  height: min(48rem, calc(100dvh - 2rem));
}

/* Stappenbalk */
.wiz-step {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-muted);
  transition: color 0.15s;
}
.wiz-step:not(:disabled):hover {
  color: var(--color-text-strong);
}
.wiz-step:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
.wiz-step-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  flex-shrink: 0;
  border: 1px solid var(--color-border-strong);
  border-radius: 9999px;
  background: var(--color-surface);
  font-size: 0.75rem;
  font-weight: 700;
}
.wiz-step-dot svg {
  width: 0.85rem;
  height: 0.85rem;
}
.wiz-step--current {
  color: var(--color-text-strong);
  font-weight: 600;
}
.wiz-step--current .wiz-step-dot {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
}
.wiz-step--done .wiz-step-dot {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.wiz-step-line {
  height: 1px;
  min-width: 1rem;
  flex: 1;
  background: var(--color-border-strong);
}
.wiz-step-line--done {
  background: var(--color-primary);
}

/* Snelkeuzes en keuzekaarten */
.wiz-preset {
  height: 2rem;
  padding: 0 0.85rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 9999px;
  background: var(--color-surface);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text);
  transition: background-color 0.15s, border-color 0.15s;
}
.wiz-preset:hover {
  border-color: var(--color-accent);
  background: var(--color-surface-2);
}
.wiz-option {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.6rem;
  font-size: 0.875rem;
  color: var(--color-text);
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
}
.wiz-option:hover {
  background: var(--color-hover);
}
.wiz-option--active {
  border-color: var(--color-primary);
  background: rgb(184 37 42 / 0.06);
  color: var(--color-text-strong);
  font-weight: 600;
}

/* Kortingsregel: één korting + haar producten */
.wiz-set {
  flex: none;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.75rem;
  background: var(--color-surface);
}
.wiz-set--open {
  border-color: var(--color-primary);
  box-shadow: inset 3px 0 0 var(--color-primary);
}
.wiz-set-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 0.85rem;
}
.wiz-set-chevron {
  width: 1rem;
  height: 1rem;
  flex: none;
  transition: transform 0.15s ease;
}
.wiz-set--open .wiz-set-chevron {
  transform: rotate(90deg);
}

/* Gekozen product of klant */
.wiz-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.25rem 0.15rem 0.6rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.4rem;
  background: var(--color-surface);
  font-size: 0.8125rem;
  color: var(--color-text-strong);
}
.wiz-chip button {
  padding: 0 0.35rem;
  border-radius: 0.25rem;
  color: var(--color-text-muted);
}
.wiz-chip button:hover {
  color: var(--color-error);
}

/* Sorteerpijltje in de kolomkop: grijs tot de kolom actief is. */
.wiz-sort {
  font-size: 0.75rem;
  opacity: 0.45;
}
.wiz-sort--active {
  opacity: 1;
  color: var(--color-primary);
}

/* Tabellen in de wizard: iets compacter dan op de lijstpagina's. */
.wiz :deep(.adm-table td) {
  padding-top: 0.55rem;
  padding-bottom: 0.55rem;
}
</style>
