<template>
  <AdminShell
    :title="data?.customer.name ?? 'Klant'"
    :subtitle="data ? `Klantnr. ${data.customer.customerNr}` : undefined"
  >
    <template #actions>
      <NuxtLink to="/admin/klanten" class="adm-btn adm-btn--secondary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Alle klanten
      </NuxtLink>
      <button
        v-if="data && canInvite"
        type="button"
        :disabled="inviting"
        class="adm-btn adm-btn--primary"
        @click="invite()"
      >
        {{
          inviting
            ? "Versturen…"
            : data.customer.loginStatus === "invited"
              ? "Opnieuw uitnodigen"
              : "Uitnodigen"
        }}
      </button>
    </template>

    <template v-if="data">
      <div class="adm-stats">
        <div class="adm-stat">
          <p class="adm-stat-label">Login</p>
          <p class="mt-1.5">
            <span class="adm-badge" :class="LOGIN_BADGE[data.customer.loginStatus]">
              {{ loginStatusLabel[data.customer.loginStatus] }}
            </span>
          </p>
        </div>
        <div class="adm-stat">
          <p class="adm-stat-label">Webshopbestellingen</p>
          <p class="adm-stat-value">{{ data.orders.length }}</p>
          <p v-if="data.orders[0]" class="adm-stat-sub">
            laatste {{ formatDate(data.orders[0].createdAt) }}
          </p>
        </div>
        <div class="adm-stat">
          <p class="adm-stat-label">Mijn producten</p>
          <p class="adm-stat-value">{{ data.myProducts.length }}</p>
          <p class="adm-stat-sub">producten</p>
        </div>
        <div class="adm-stat">
          <p class="adm-stat-label">Leveringsadressen</p>
          <p class="adm-stat-value">{{ data.addresses.length }}</p>
        </div>
      </div>

      <p v-if="saved && !editing" class="adm-notice adm-notice--success" role="status">
        Wijzigingen opgeslagen.
      </p>
      <p
        v-if="inviteMessage"
        class="adm-notice"
        :class="inviteError ? 'adm-notice--error' : 'adm-notice--success'"
        role="status"
      >
        {{ inviteMessage }}
      </p>

      <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <!-- Hoofdkolom: bestellingen en historiek -->
        <div class="min-w-0 space-y-6">
          <section v-if="data.account" class="adm-card">
            <div class="adm-card-head">
              <h2 class="adm-card-title">
                Webshopbestellingen
                <span class="adm-tab-count">{{ data.orders.length }}</span>
              </h2>
            </div>
            <p v-if="data.orders.length === 0" class="adm-card-empty">
              Nog geen bestellingen via de webshop.
            </p>
            <div v-else class="overflow-x-auto">
              <table class="adm-table">
                <thead>
                  <tr>
                    <th>Bestelnr.</th>
                    <th class="w-full">Datum</th>
                    <th class="adm-num">Artikelen</th>
                    <th class="adm-num">Stuks</th>
                    <th class="adm-col-actions"><span class="sr-only">Acties</span></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="order in data.orders" :key="order.id">
                    <td class="font-mono text-[0.8125rem]">
                      <NuxtLink :to="`/admin/bestellingen/${order.id}`" class="text-(--color-accent) hover:underline">
                        {{ order.id.slice(0, 8).toUpperCase() }}
                      </NuxtLink>
                    </td>
                    <td class="whitespace-nowrap">{{ formatDate(order.createdAt, true) }}</td>
                    <td class="adm-num">{{ order.lineCount }}</td>
                    <td class="adm-num">{{ order.totalQuantity }}</td>
                    <td class="adm-col-actions">
                      <NuxtLink
                        :to="`/admin/bestellingen/${order.id}`"
                        :aria-label="`Bestelling ${order.id.slice(0, 8).toUpperCase()} bekijken`"
                        title="Bekijken"
                        class="adm-row-btn"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </NuxtLink>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="producten" class="adm-card scroll-mt-6">
            <div class="adm-card-head">
              <h2 class="adm-card-title">
                Mijn producten
                <span class="adm-tab-count">{{ data.myProducts.length }}</span>
              </h2>
              <AdminSearchField
                v-if="data.myProducts.length > 0"
                v-model="historySearch"
                name="producten-filteren"
                placeholder="Filter op artikelnr, naam of leverancier…"
                class="w-full sm:w-72"
              />
            </div>

            <!-- Product toevoegen -->
            <div class="adm-card-body border-b border-(--color-border)">
              <AdminSearchField
                v-model="addSearch"
                name="product-toevoegen"
                placeholder="Product toevoegen: zoek op artikelnr of naam…"
                class="w-full"
              />
              <ul
                v-if="debouncedAddSearch.length >= 2"
                class="mt-2 max-h-72 overflow-auto rounded-lg border border-(--color-border)"
              >
                <li
                  v-for="p in addResults"
                  :key="p.id"
                  class="flex items-center gap-3 border-b border-(--color-border) px-3 py-2 last:border-b-0"
                >
                  <span class="font-mono text-[0.8125rem] text-(--color-text-muted)">{{ p.articleNr }}</span>
                  <span class="min-w-0 flex-1 truncate">
                    {{ p.name }}
                    <span v-if="!p.isActive" class="adm-badge adm-badge--neutral ml-2">Inactief</span>
                  </span>
                  <span v-if="myArticleNrs.has(p.articleNr)" class="text-[0.8125rem] text-(--color-text-muted)">
                    Staat er al
                  </span>
                  <button
                    v-else
                    type="button"
                    :disabled="busyProductId !== null"
                    class="adm-btn adm-btn--secondary adm-btn--sm"
                    @click="setProduct(p.id, true)"
                  >
                    Toevoegen
                  </button>
                </li>
                <li v-if="addPending" class="px-3 py-2 text-sm text-(--color-text-muted)">Zoeken…</li>
                <li v-else-if="addResults.length === 0" class="px-3 py-2 text-sm text-(--color-text-muted)">
                  Geen producten gevonden.
                </li>
              </ul>
              <p v-if="productError" class="mt-2 text-sm text-(--color-error)">{{ productError }}</p>
            </div>

            <p v-if="data.myProducts.length === 0" class="adm-card-empty">
              Deze klant heeft nog geen producten onder Mijn producten.
            </p>
            <div v-else class="max-h-128 overflow-auto">
              <table class="adm-table">
                <thead class="sticky top-0 z-1">
                  <tr>
                    <th>Artikelnr.</th>
                    <th class="w-full">Product</th>
                    <th class="hidden md:table-cell">Bron</th>
                    <th>Laatst gekocht</th>
                    <th class="adm-col-actions"><span class="sr-only">Acties</span></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in filteredProducts" :key="item.productId">
                    <td class="font-mono text-[0.8125rem] text-(--color-text-muted)">
                      <NuxtLink :to="`/admin/producten/${item.productId}`" class="hover:text-(--color-accent)">
                        {{ item.articleNr }}
                      </NuxtLink>
                    </td>
                    <td>
                      <span class="font-medium text-(--color-text-strong)">{{ item.name }}</span>
                      <span v-if="!item.isActive" class="adm-badge adm-badge--neutral ml-2">Inactief</span>
                      <span class="block text-[0.8125rem] text-(--color-text-muted)">{{ item.supplier }}</span>
                    </td>
                    <td class="hidden whitespace-nowrap md:table-cell">
                      <span
                        v-for="source in item.sources"
                        :key="source"
                        class="adm-badge mr-1"
                        :class="SOURCE_BADGE[source]"
                      >
                        {{ SOURCE_LABEL[source] }}
                      </span>
                    </td>
                    <td class="whitespace-nowrap text-(--color-text-muted)">
                      {{ item.lastPurchasedAt ? formatDate(item.lastPurchasedAt) : "—" }}
                    </td>
                    <td class="adm-col-actions">
                      <button
                        type="button"
                        :disabled="busyProductId !== null"
                        :aria-label="`${item.name} verwijderen uit Mijn producten`"
                        title="Verwijderen uit Mijn producten"
                        class="adm-row-btn"
                        @click="setProduct(item.productId, false)"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                  <tr v-if="filteredProducts.length === 0">
                    <td colspan="5" class="adm-card-empty">Geen producten gevonden.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <details v-if="data.hiddenProducts.length > 0" class="adm-card-body border-t border-(--color-border)">
              <summary class="cursor-pointer text-sm text-(--color-text-muted)">
                Verborgen voor deze klant ({{ data.hiddenProducts.length }})
              </summary>
              <ul class="mt-2 space-y-1">
                <li
                  v-for="item in data.hiddenProducts"
                  :key="item.productId"
                  class="flex items-center gap-3 text-sm"
                >
                  <span class="font-mono text-[0.8125rem] text-(--color-text-muted)">{{ item.articleNr }}</span>
                  <span class="min-w-0 flex-1 truncate">{{ item.name }}</span>
                  <button
                    type="button"
                    :disabled="busyProductId !== null"
                    class="adm-btn adm-btn--ghost adm-btn--sm"
                    @click="setProduct(item.productId, null)"
                  >
                    Terugzetten
                  </button>
                </li>
              </ul>
            </details>

            <p class="adm-card-hint">
              Wat de klant in de webshop onder Mijn producten ziet: aankopen van de
              laatste 18 maanden (CRM en webshop), plus wat je hier toevoegt.
              Toegevoegde producten blijven staan; verwijderde blijven weg, ook na
              een nieuwe CRM-import.
            </p>
          </section>
        </div>

        <!-- Zijkolom: contact, login en adressen -->
        <div class="min-w-0 space-y-6">
          <section class="adm-card">
            <div class="adm-card-head">
              <h2 class="adm-card-title">Contact</h2>
              <button
                v-if="!editing"
                type="button"
                class="adm-btn adm-btn--secondary adm-btn--sm"
                @click="startEdit()"
              >
                Bewerken
              </button>
            </div>

            <form v-if="editing" class="adm-card-body space-y-4" @submit.prevent="saveContact()">
              <label class="block">
                <span class="adm-label">Naam <span aria-hidden="true">*</span></span>
                <input v-model="form.name" type="text" required maxlength="200" class="adm-input w-full">
              </label>
              <div>
                <label class="block">
                  <span class="adm-label">Klantnummer <span aria-hidden="true">*</span></span>
                  <input
                    v-model="form.customerNr"
                    type="text"
                    required
                    maxlength="32"
                    :disabled="!customerNrUnlocked"
                    class="adm-input w-full font-mono disabled:cursor-not-allowed disabled:opacity-60"
                  >
                </label>
                <button
                  v-if="!customerNrUnlocked"
                  type="button"
                  class="mt-1.5 text-[0.8125rem] text-(--color-text-muted) underline hover:text-(--color-accent)"
                  @click="customerNrUnlocked = true"
                >
                  Klantnummer wijzigen
                </button>
              </div>
              <p v-if="customerNrUnlocked" class="adm-notice mb-0! text-[0.8125rem]!" role="alert">
                Let op: het klantnummer moet exact overeenkomen met het nummer in
                het CRM-pakket. Wijzig het alleen als het daar ook gewijzigd is —
                anders komen bestellingen en aankoophistoriek bij de verkeerde
                klant terecht.
              </p>
              <label class="block">
                <span class="adm-label">E-mail (ook de login)</span>
                <input
                  v-model="form.contactEmail"
                  type="email"
                  maxlength="200"
                  placeholder="naam@bedrijf.be"
                  class="adm-input w-full"
                >
              </label>
              <label class="block">
                <span class="adm-label">Telefoon</span>
                <input
                  v-model="form.phone"
                  type="tel"
                  maxlength="40"
                  placeholder="015 61 15 39"
                  class="adm-input w-full"
                >
              </label>

              <p v-if="saveError" class="text-sm text-(--color-error)">{{ saveError }}</p>

              <div class="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  :disabled="saving"
                  class="adm-btn adm-btn--ghost"
                  @click="editing = false"
                >
                  Annuleren
                </button>
                <button type="submit" :disabled="saving" class="adm-btn adm-btn--primary">
                  {{ saving ? "Opslaan…" : "Opslaan" }}
                </button>
              </div>
            </form>

            <template v-else>
              <dl class="adm-dl adm-card-body">
                <div>
                  <dt>Klantnummer</dt>
                  <dd class="font-mono">{{ data.customer.customerNr }}</dd>
                </div>
                <div>
                  <dt>Contact-e-mail (login)</dt>
                  <dd>{{ data.customer.contactEmail ?? "—" }}</dd>
                </div>
                <div>
                  <dt>Telefoon</dt>
                  <dd>{{ data.customer.phone ?? "—" }}</dd>
                </div>
              </dl>
              <p class="adm-card-hint">
                De klant ziet en wijzigt ditzelfde telefoonnummer onder Mijn account →
                Gegevens; het komt ook op de bestelbon.
              </p>
            </template>
          </section>

          <section class="adm-card">
            <div class="adm-card-head">
              <h2 class="adm-card-title">Login & facturatie</h2>
              <span class="adm-badge" :class="LOGIN_BADGE[data.customer.loginStatus]">
                {{ loginStatusLabel[data.customer.loginStatus] }}
              </span>
            </div>
            <dl class="adm-dl adm-card-body">
              <div>
                <dt>Login-e-mail</dt>
                <dd>
                  {{ data.customer.contactEmail ?? "— (vul eerst een e-mailadres in via Bewerken)" }}
                </dd>
              </div>
              <template v-if="data.billing">
                <div v-if="data.billing.vatNumber">
                  <dt>Btw-nummer</dt>
                  <dd>{{ data.billing.vatNumber }}</dd>
                </div>
                <!-- Enkel als het afwijkt van de login (hoofdletters tellen niet). -->
                <div
                  v-if="data.billing.invoiceEmail.toLowerCase() !== data.customer.contactEmail?.toLowerCase()"
                >
                  <dt>Facturatie-e-mail</dt>
                  <dd>{{ data.billing.invoiceEmail }}</dd>
                </div>
              </template>
            </dl>
          </section>

          <section class="adm-card">
            <div class="adm-card-head">
              <h2 class="adm-card-title">Leveringsadressen</h2>
            </div>
            <div class="adm-card-body">
              <DeliveryAddresses
                :endpoint="`/api/admin/customers/${data.customer.id}/addresses`"
                :addresses="data.addresses"
                @changed="refresh()"
              />
            </div>
            <p class="adm-card-hint">
              Dezelfde adressen die de klant zelf ziet en beheert. Bij een bestelling
              kiest de klant het leveradres; standaard is dat het primaire.
            </p>
          </section>
        </div>
      </div>
    </template>
  </AdminShell>
</template>

<script setup lang="ts">
import type { DeliveryAddress } from "#shared/address";

const route = useRoute();
definePageMeta({ layout: "admin", middleware: "admin" });
useHead({ title: "Klant — Vleeswaren Vermeir" });

interface CustomerDetail {
  customer: {
    id: string;
    customerNr: string;
    name: string;
    contactEmail: string | null;
    phone: string | null;
    loginStatus: CustomerLoginStatus;
  };
  addresses: DeliveryAddress[];
  account: { id: string; name: string; email: string } | null;
  billing: {
    companyName: string;
    vatNumber: string | null;
    invoiceEmail: string;
  } | null;
  orders: {
    id: string;
    createdAt: string;
    lineCount: number;
    totalQuantity: number;
  }[];
  myProducts: {
    productId: string;
    articleNr: string;
    name: string;
    supplier: string;
    unit: string | null;
    isActive: boolean;
    /** Null als enkel de beheerder het toevoegde. */
    lastPurchasedAt: string | null;
    sources: ProductSource[];
  }[];
  hiddenProducts: {
    productId: string;
    articleNr: string;
    name: string;
    supplier: string;
  }[];
}

type ProductSource = "webshop" | "crm" | "admin";
const SOURCE_LABEL: Record<ProductSource, string> = {
  webshop: "Webshop",
  crm: "CRM",
  admin: "Toegevoegd",
};
const SOURCE_BADGE: Record<ProductSource, string> = {
  webshop: "adm-badge--info",
  crm: "adm-badge--neutral",
  admin: "adm-badge--success",
};

const { data, refresh } = await useFetch<CustomerDetail>(
  `/api/admin/customers/${route.params.id}`,
);

const editing = ref(false);
const saving = ref(false);
const saveError = ref("");
const saved = ref(false);
// Het klantnummer koppelt de klant aan het CRM; pas na een bewuste klik
// bewerkbaar, zodat het niet per ongeluk mee wijzigt.
const customerNrUnlocked = ref(false);
const form = reactive({
  name: "",
  customerNr: "",
  contactEmail: "",
  phone: "",
});

function startEdit() {
  const c = data.value?.customer;
  if (!c) return;
  form.name = c.name;
  form.customerNr = c.customerNr;
  customerNrUnlocked.value = false;
  form.contactEmail = c.contactEmail ?? "";
  form.phone = c.phone ?? "";
  saveError.value = "";
  saved.value = false;
  editing.value = true;
}

// Het potloodje in de klantenlijst opent deze pagina meteen in bewerkmodus.
if (route.query.bewerken) startEdit();

async function saveContact() {
  if (saving.value || !data.value) return;
  saving.value = true;
  saveError.value = "";

  try {
    await $fetch(`/api/admin/customers/${data.value.customer.id}`, {
      method: "PATCH",
      body: {
        name: form.name.trim(),
        ...(customerNrUnlocked.value
          ? { customerNr: form.customerNr.trim() }
          : {}),
        contactEmail: form.contactEmail.trim(),
        phone: form.phone.trim(),
      },
    });
    await refresh();
    editing.value = false;
    saved.value = true;
  } catch (err) {
    saveError.value =
      (err as { data?: { statusMessage?: string } })?.data?.statusMessage ||
      "Opslaan mislukt. Controleer de ingevulde gegevens.";
  } finally {
    saving.value = false;
  }
}

/** Uitnodigen kan zodra er een e-mailadres is en de klant nog niet actief is. */
const canInvite = computed(() => {
  const status = data.value?.customer.loginStatus;
  return status !== undefined && status !== "no-email" && status !== "active";
});

const inviting = ref(false);
const inviteMessage = ref("");
const inviteError = ref(false);

async function invite() {
  if (inviting.value || !data.value) return;
  inviting.value = true;
  inviteMessage.value = "";

  try {
    const result = await $fetch<{ email: string }>(
      `/api/admin/customers/${data.value.customer.id}/invite`,
      { method: "POST" },
    );
    inviteError.value = false;
    inviteMessage.value = `Uitnodiging verstuurd naar ${result.email}.`;
    await refresh();
  } catch (err) {
    inviteError.value = true;
    inviteMessage.value =
      (err as { data?: { statusMessage?: string } })?.data?.statusMessage ||
      "Uitnodigen mislukt. Probeer het later opnieuw.";
  } finally {
    inviting.value = false;
  }
}

const historySearch = ref("");
const filteredProducts = computed(() => {
  const items = data.value?.myProducts ?? [];
  const term = historySearch.value.trim().toLowerCase();
  if (!term) return items;
  return items.filter((item) =>
    [item.articleNr, item.name, item.supplier].some((field) =>
      field.toLowerCase().includes(term),
    ),
  );
});

const myArticleNrs = computed(
  () => new Set((data.value?.myProducts ?? []).map((p) => p.articleNr)),
);

// Product toevoegen: zoeken in de volledige catalogus (ook inactieve).
interface ProductHit {
  id: string;
  articleNr: string;
  name: string;
  isActive: boolean;
}
const addSearch = ref("");
const debouncedAddSearch = ref("");
let addTimer: ReturnType<typeof setTimeout> | undefined;
watch(addSearch, (value) => {
  if (addTimer) clearTimeout(addTimer);
  addTimer = setTimeout(() => {
    debouncedAddSearch.value = value.trim();
  }, 300);
});
const { data: addData, pending: addPending, execute: searchProducts } = useFetch<{
  items: ProductHit[];
}>("/api/admin/products", {
  query: computed(() => ({ search: debouncedAddSearch.value, perPage: 10 })),
  immediate: false,
  watch: false,
  server: false,
});
watch(debouncedAddSearch, (term) => {
  if (term.length >= 2) searchProducts();
});
const addResults = computed(() =>
  debouncedAddSearch.value.length >= 2 ? (addData.value?.items ?? []) : [],
);

const busyProductId = ref<string | null>(null);
const productError = ref("");

/** true = toevoegen, false = verbergen, null = correctie wissen. */
async function setProduct(productId: string, included: boolean | null) {
  if (busyProductId.value || !data.value) return;
  busyProductId.value = productId;
  productError.value = "";
  try {
    await $fetch(`/api/admin/customers/${data.value.customer.id}/products/${productId}`, {
      method: "PUT",
      body: { included },
    });
    await refresh();
  } catch {
    productError.value = "Opslaan mislukt. Probeer het opnieuw.";
  } finally {
    busyProductId.value = null;
  }
}

function formatDate(value: string, withWeekday = false): string {
  return new Date(value).toLocaleDateString("nl-BE", {
    weekday: withWeekday ? "long" : undefined,
    day: "2-digit",
    month: withWeekday ? "long" : "short",
    year: "numeric",
  });
}
</script>
