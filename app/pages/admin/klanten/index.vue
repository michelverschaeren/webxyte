<template>
  <AdminShell title="Klanten" subtitle="Klanten uit het CRM, met hun aankoophistoriek.">
    <template #actions>
      <button
        v-if="summary.notInvited > 0"
        type="button"
        :disabled="!INVITE_ALL_ENABLED || invitingAll"
        :title="INVITE_ALL_ENABLED ? undefined : 'Tijdelijk uitgeschakeld tot de livegang.'"
        class="adm-btn adm-btn--secondary"
        @click="inviteAll"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
        {{ invitingAll ? "Versturen…" : `Lanceringsmail naar alle klanten (${summary.notInvited})` }}
      </button>
      <button type="button" class="adm-btn adm-btn--primary" @click="openCreate">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14" />
        </svg>
        Nieuwe klant
      </button>
    </template>

    <p v-if="createNotice" class="adm-notice" role="status">{{ createNotice }}</p>

    <div class="adm-card">
      <div class="adm-card-toolbar">
        <AdminSearchField
          v-model="search"
          name="klanten-zoeken"
          placeholder="Zoek op klantnr, naam of e-mail…"
          class="w-full sm:w-72"
        />
        <!-- Bulkacties: lanceringsmail voor elke beheerder, verwijderen enkel voor de agency-admin -->
        <template v-if="selected.size > 0">
          <span class="text-sm text-(--color-text-muted)">{{ selected.size }} geselecteerd</span>
          <button
            type="button"
            :disabled="bulkInviting"
            class="adm-btn adm-btn--secondary adm-btn--sm"
            @click="bulkInvite"
          >
            {{ bulkInviting ? "Versturen…" : "Lanceringsmail versturen" }}
          </button>
          <button
            v-if="isAgencyAdmin"
            type="button"
            :disabled="bulkDeleting"
            class="adm-btn adm-btn--danger adm-btn--sm"
            @click="bulkDelete"
          >
            {{ bulkDeleting ? "Verwijderen…" : "Verwijderen" }}
          </button>
        </template>
        <span
          v-if="summary.noEmail > 0"
          class="text-sm text-(--color-text-muted) sm:ml-auto"
        >
          {{ summary.noEmail }} zonder e-mailadres (kunnen niet inloggen)
        </span>
      </div>

      <!-- Lijst (mobiel) -->
      <ul v-if="items.length > 0" class="adm-list sm:hidden">
        <li v-for="c in items" :key="c.id" class="flex items-start gap-3 px-4 py-3">
          <input
            type="checkbox"
            class="adm-check mt-1"
            :checked="selected.has(c.id)"
            aria-label="Klant selecteren"
            @change="toggleSelect(c.id)"
          >
          <NuxtLink :to="`/admin/klanten/${c.id}`" class="flex min-w-0 flex-1 flex-col gap-1">
            <span class="flex items-start justify-between gap-3">
              <span class="min-w-0 font-semibold text-(--color-text-strong)">{{ c.name }}</span>
              <span class="adm-badge" :class="LOGIN_BADGE[c.loginStatus]">
                {{ loginStatusLabel[c.loginStatus] }}
              </span>
            </span>
            <span class="truncate text-sm text-(--color-text-muted)">
              {{ c.customerNr }}<template v-if="c.contactEmail"> · {{ c.contactEmail }}</template>
            </span>
            <span class="text-sm text-(--color-text-muted)">
              {{ c.productCount }} product{{ c.productCount !== 1 ? "en" : "" }}
            </span>
          </NuxtLink>
        </li>
      </ul>
      <p v-else class="adm-card-empty sm:hidden">Geen klanten gevonden.</p>

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
                  aria-label="Alle klanten op deze pagina selecteren"
                  @change="toggleSelectAll()"
                >
              </th>
              <th>Klantnr.</th>
              <th class="w-full">Klant</th>
              <th class="hidden lg:table-cell">Login</th>
              <th>CRM-historiek</th>
              <th class="hidden lg:table-cell">Laatste bestelling</th>
              <th class="adm-col-actions"><span class="sr-only">Acties</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in items" :key="c.id" :aria-selected="selected.has(c.id)">
              <td class="adm-col-check">
                <input
                  type="checkbox"
                  class="adm-check"
                  :checked="selected.has(c.id)"
                  aria-label="Klant selecteren"
                  @change="toggleSelect(c.id)"
                >
              </td>
              <td class="font-mono text-[0.8125rem] text-(--color-text-muted)">{{ c.customerNr }}</td>
              <!-- max-w-0 + w-full: neemt de restbreedte en kapt af i.p.v. de tabel te verbreden -->
              <td class="w-full max-w-0">
                <NuxtLink
                  :to="`/admin/klanten/${c.id}`"
                  :title="c.name"
                  class="block truncate font-medium text-(--color-text-strong) hover:text-(--color-accent)"
                >
                  {{ c.name }}
                </NuxtLink>
                <p
                  v-if="c.contactEmail"
                  :title="c.contactEmail"
                  class="truncate text-[0.8125rem] text-(--color-text-muted)"
                >
                  {{ c.contactEmail }}
                </p>
              </td>
              <td class="hidden lg:table-cell">
                <span class="adm-badge" :class="LOGIN_BADGE[c.loginStatus]">
                  {{ loginStatusLabel[c.loginStatus] }}
                </span>
              </td>
              <td class="whitespace-nowrap">
                <template v-if="c.lastPurchasedAt">
                  {{ formatDate(c.lastPurchasedAt) }}
                  <span class="block text-[0.8125rem] text-(--color-text-muted)">
                    {{ c.productCount }} product{{ c.productCount !== 1 ? "en" : "" }}
                  </span>
                </template>
                <span v-else class="text-(--color-text-muted)">—</span>
              </td>
              <td class="hidden whitespace-nowrap lg:table-cell">
                <template v-if="c.lastOrderedAt">
                  {{ formatDate(c.lastOrderedAt) }}
                  <span class="block text-[0.8125rem] text-(--color-text-muted)">
                    {{ c.orderCount }} bestelling{{ c.orderCount !== 1 ? "en" : "" }} · {{ c.orderedQuantity }} st.
                  </span>
                </template>
                <span v-else class="text-(--color-text-muted)">—</span>
              </td>
              <td class="adm-col-actions">
                <NuxtLink
                  :to="`/admin/klanten/${c.id}?bewerken=1`"
                  :aria-label="`${c.name} bewerken`"
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
              <td colspan="7" class="adm-card-empty">Geen klanten gevonden.</td>
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
        noun="klanten"
      />
    </div>

    <!-- Nieuwe klant -->
    <Teleport to="body">
      <div
        v-if="createOpen"
        class="fixed inset-0 z-220 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
        @click.self="closeCreate"
      >
        <div
          class="my-auto w-full max-w-md overflow-hidden rounded-2xl border border-(--color-border) shadow-2xl"
          style="background: var(--color-surface)"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-customer-title"
        >
          <div class="border-b border-(--color-border) px-5 py-4 sm:px-6">
            <h3
              id="create-customer-title"
              class="font-['Playfair_Display',Georgia,serif] text-xl text-(--color-text-strong)"
            >
              Nieuwe klant
            </h3>
          </div>

          <form class="space-y-4 px-5 py-5 sm:px-6" @submit.prevent="submitCreate">
            <p class="text-sm text-(--color-text-muted)">
              Het e-mailadres wordt de login van deze klant. De klant krijgt
              een e-mail met een link om een wachtwoord in te stellen en meteen
              in te loggen.
            </p>
            <label class="block">
              <span class="adm-label">Klantnummer</span>
              <input
                ref="customerNrInput"
                v-model="form.customerNr"
                type="text"
                required
                maxlength="32"
                autocomplete="off"
                class="adm-input w-full"
              >
            </label>
            <label class="block">
              <span class="adm-label">Bedrijfsnaam</span>
              <input
                v-model="form.name"
                type="text"
                maxlength="200"
                autocomplete="off"
                placeholder="bv. Restaurant De Kroon"
                class="adm-input w-full"
              >
            </label>
            <label class="block">
              <span class="adm-label">E-mailadres</span>
              <input
                v-model="form.email"
                type="email"
                required
                maxlength="200"
                autocomplete="off"
                class="adm-input w-full"
              >
            </label>

            <!-- Optioneel: staat dan al klaar bij de klant. -->
            <fieldset class="space-y-3">
              <legend class="adm-label">Leveringsadres (optioneel)</legend>
              <input
                v-model="form.street"
                type="text"
                maxlength="200"
                autocomplete="off"
                placeholder="Straat en nummer"
                aria-label="Straat en nummer"
                class="adm-input w-full"
              >
              <div class="grid grid-cols-[1fr_2fr] gap-3">
                <input
                  v-model="form.postalCode"
                  type="text"
                  inputmode="numeric"
                  maxlength="4"
                  autocomplete="off"
                  placeholder="Postcode"
                  aria-label="Postcode"
                  class="adm-input w-full"
                >
                <input
                  v-model="form.city"
                  type="text"
                  maxlength="100"
                  autocomplete="off"
                  placeholder="Gemeente"
                  aria-label="Gemeente"
                  class="adm-input w-full"
                >
              </div>
            </fieldset>

            <p v-if="createError" class="text-sm text-(--color-error)">{{ createError }}</p>

            <div class="flex items-center justify-end gap-2 pt-1">
              <button type="button" class="adm-btn adm-btn--secondary" @click="closeCreate">
                Annuleren
              </button>
              <button type="submit" :disabled="creating" class="adm-btn adm-btn--primary">
                {{ creating ? "Bezig…" : "Uitnodigen" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </AdminShell>
</template>

<script setup lang="ts">
import { addressError } from "#shared/address";

definePageMeta({ layout: "admin", middleware: "admin" });
useHead({ title: "Klanten — Vleeswaren Vermeir" });

const auth = useAuth();
/**
 * Klanten verwijderen is voorbehouden aan de agency-admin — zelfde adres als
 * server/utils/session.ts requireAgencyAdmin. De lanceringsmail naar een
 * selectie mag elke beheerder versturen.
 * De server herhaalt deze check: dit is enkel om de UI te verbergen.
 */
const isAgencyAdmin = computed(() => auth.user.value?.email === "web.xyte@outlook.com");

interface CustomerDto {
  id: string;
  customerNr: string;
  name: string;
  contactEmail: string | null;
  phone: string | null;
  loginStatus: CustomerLoginStatus;
  productCount: number;
  lastPurchasedAt: string | null;
  orderCount: number;
  lastOrderedAt: string | null;
  orderedQuantity: number;
}

interface CustomersResponse {
  items: CustomerDto[];
  summary: { notInvited: number; noEmail: number };
  pagination: { page: number; perPage: number; total: number; pageCount: number };
}

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

const page = ref(1);
const PAGE_SIZE = 25;

watch(debouncedSearch, () => {
  page.value = 1;
});

const query = computed(() => ({
  search: debouncedSearch.value || undefined,
  page: page.value,
  perPage: PAGE_SIZE,
}));

const { data, refresh } = await useFetch<CustomersResponse>("/api/admin/customers", {
  query,
});

interface CreateCustomerResponse {
  id: string;
  invited: boolean;
}

const createOpen = ref(false);
const creating = ref(false);
const createError = ref("");
const createNotice = ref("");
const form = reactive({
  customerNr: "",
  name: "",
  email: "",
  street: "",
  postalCode: "",
  city: "",
});
const customerNrInput = ref<HTMLInputElement | null>(null);

function openCreate() {
  form.customerNr = "";
  form.name = "";
  form.email = "";
  form.street = "";
  form.postalCode = "";
  form.city = "";
  createError.value = "";
  createOpen.value = true;
  nextTick(() => customerNrInput.value?.focus());
}

function closeCreate() {
  if (!creating.value) createOpen.value = false;
}

async function submitCreate() {
  if (creating.value) return;
  createError.value = "";

  // Het adres is optioneel, maar een half adres heeft geen zin op de bon.
  const address = {
    street: form.street.trim(),
    postalCode: form.postalCode.trim(),
    city: form.city.trim(),
  };
  const hasAddress = Boolean(address.street || address.postalCode || address.city);
  if (hasAddress) {
    const invalid = addressError(address);
    if (invalid) {
      createError.value = invalid;
      return;
    }
  }

  creating.value = true;
  try {
    const result = await $fetch<CreateCustomerResponse>("/api/admin/customers", {
      method: "POST",
      body: {
        customerNr: form.customerNr,
        name: form.name.trim() || undefined,
        email: form.email,
        address: hasAddress ? address : undefined,
      },
    });

    createNotice.value = result.invited
      ? `Klant ${form.customerNr} opgeslagen. Uitnodiging verstuurd naar ${form.email}.`
      : `Klant ${form.customerNr} opgeslagen, maar de uitnodiging kon niet verstuurd worden. Probeer opnieuw via de klantpagina.`;
    createOpen.value = false;
    await refresh();
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    const message = (err as { statusMessage?: string; data?: { statusMessage?: string } })
      .data?.statusMessage;
    createError.value =
      status === 409 && message
        ? message
        : status === 400
          ? "Controleer het klantnummer en e-mailadres."
          : "Er ging iets mis. Probeer het later opnieuw.";
  } finally {
    creating.value = false;
  }
}

onMounted(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && createOpen.value) closeCreate();
  };
  window.addEventListener("keydown", onKey);
  onUnmounted(() => window.removeEventListener("keydown", onKey));
});

const items = computed(() => data.value?.items ?? []);
const summary = computed(() => data.value?.summary ?? { notInvited: 0, noEmail: 0 });

// Selectie + bulkacties (verwijderen enkel voor de agency-admin, zie isAgencyAdmin).
const selected = ref<Set<string>>(new Set());
const allSelected = computed(
  () => items.value.length > 0 && items.value.every((c) => selected.value.has(c.id)),
);

function toggleSelect(id: string) {
  if (selected.value.has(id)) selected.value.delete(id);
  else selected.value.add(id);
}

function toggleSelectAll() {
  if (allSelected.value) {
    selected.value.clear();
  } else {
    for (const c of items.value) selected.value.add(c.id);
  }
}

// Een andere pagina of zoekopdracht toont andere klanten: selectie erop
// laten staan zou ongemerkt de verkeerde klanten raken.
watch([page, debouncedSearch], () => selected.value.clear());

const bulkInviting = ref(false);
async function bulkInvite() {
  if (bulkInviting.value || selected.value.size === 0) return;
  const ids = Array.from(selected.value);
  if (
    !window.confirm(
      `Lanceringsmail versturen naar ${ids.length} klant${ids.length !== 1 ? "en" : ""}?`,
    )
  ) {
    return;
  }

  bulkInviting.value = true;
  try {
    const result = await $fetch<{
      invited: number;
      skipped: { noEmail: number; active: number };
      failed: { id: string; reason: string }[];
    }>("/api/admin/customers/invite-selected", { method: "POST", body: { ids } });
    const skippedParts = [
      result.skipped.noEmail > 0 ? `${result.skipped.noEmail} zonder e-mailadres` : "",
      result.skipped.active > 0 ? `${result.skipped.active} al actief` : "",
    ].filter(Boolean);
    createNotice.value =
      `${result.invited} lanceringsmail${result.invited !== 1 ? "s" : ""} verstuurd.` +
      (skippedParts.length > 0 ? ` Overgeslagen: ${skippedParts.join(", ")}.` : "") +
      (result.failed.length > 0
        ? ` Niet gelukt voor ${result.failed.length} klant${result.failed.length !== 1 ? "en" : ""}.`
        : "");
    selected.value.clear();
  } catch {
    createNotice.value = "Versturen mislukt. Probeer het later opnieuw.";
  } finally {
    bulkInviting.value = false;
    await refresh();
  }
}

const bulkDeleting = ref(false);
async function bulkDelete() {
  if (bulkDeleting.value || selected.value.size === 0) return;
  const ids = Array.from(selected.value);
  if (
    !window.confirm(
      `${ids.length} klant${ids.length !== 1 ? "en" : ""} definitief verwijderen, inclusief hun login? Dit kan niet ongedaan gemaakt worden.`,
    )
  ) {
    return;
  }

  bulkDeleting.value = true;
  try {
    const result = await $fetch<{ deleted: number }>("/api/admin/customers/delete", {
      method: "POST",
      body: { ids },
    });
    createNotice.value = `${result.deleted} klant${result.deleted !== 1 ? "en" : ""} verwijderd.`;
    selected.value.clear();
  } catch {
    createNotice.value = "Verwijderen mislukt. Probeer het later opnieuw.";
  } finally {
    bulkDeleting.value = false;
    await refresh();
  }
}

const invitingAll = ref(false);
/**
 * Tijdelijk uit: pas aanzetten bij de livegang, zodra elke klant een
 * e-mailadres heeft. Ook aanzetten in server/api/admin/customers/invite-all.post.ts.
 */
const INVITE_ALL_ENABLED = false;

async function inviteAll() {
  if (!INVITE_ALL_ENABLED || invitingAll.value) return;
  const n = summary.value.notInvited;
  if (
    !window.confirm(
      `${n} klant${n !== 1 ? "en" : ""} met een e-mailadres maar zonder login krijg${n !== 1 ? "en" : "t"} nu de lanceringsmail met hun persoonlijke link. Doorgaan?`,
    )
  ) {
    return;
  }

  invitingAll.value = true;
  try {
    const result = await $fetch<{
      invited: number;
      failed: { customerNr: string; reason: string }[];
    }>("/api/admin/customers/invite-all", { method: "POST" });
    createNotice.value =
      `${result.invited} uitnodiging${result.invited !== 1 ? "en" : ""} verstuurd.` +
      (result.failed.length > 0
        ? ` Niet gelukt: ${result.failed.map((f) => `${f.customerNr} (${f.reason})`).join(", ")}.`
        : "");
  } catch {
    createNotice.value = "Uitnodigen mislukt. Probeer het later opnieuw.";
  } finally {
    invitingAll.value = false;
    await refresh();
  }
}
const pagination = computed(() => data.value?.pagination);

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("nl-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
</script>
