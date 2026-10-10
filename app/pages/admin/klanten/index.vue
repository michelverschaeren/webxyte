<template>
  <AdminShell title="Klanten" subtitle="Klanten uit het CRM, met hun aankoophistoriek.">
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <input
        v-model="search"
        type="search"
        name="klanten-zoeken"
        autocomplete="off"
        data-protonpass-ignore="true"
        data-1p-ignore
        data-lpignore="true"
        placeholder="Zoek op klantnr, naam of e-mail…"
        class="adm-input max-w-sm flex-1"
      >
      <button
        v-if="summary.notInvited > 0"
        type="button"
        :disabled="!INVITE_ALL_ENABLED || invitingAll"
        :title="INVITE_ALL_ENABLED ? undefined : 'Tijdelijk uitgeschakeld tot de livegang.'"
        class="ml-auto rounded-lg border border-(--color-border-strong) px-5 py-2.5 text-sm font-semibold tracking-widest text-(--color-text) uppercase transition-colors hover:bg-(--color-hover) disabled:cursor-not-allowed disabled:opacity-50"
        @click="inviteAll"
      >
        {{ invitingAll ? "Versturen…" : `Lanceringsmail naar alle klanten (${summary.notInvited})` }}
      </button>
      <button
        type="button"
        :class="summary.notInvited > 0 ? '' : 'ml-auto'"
        class="rounded-lg bg-[#b8252a] px-5 py-2.5 text-sm font-semibold tracking-widest text-white uppercase transition-colors hover:bg-[#8b1f1f]"
        @click="openCreate"
      >
        + Nieuwe klant
      </button>
    </div>

    <p
      v-if="createNotice"
      class="mb-4 rounded-lg border border-(--color-border) bg-(--color-surface-2) px-4 py-3 text-sm text-(--color-text-strong)"
      role="status"
    >
      {{ createNotice }}
    </p>

    <p class="mb-3 text-sm text-(--color-text-muted)">
      {{ pagination?.total ?? 0 }} klanten
      <template v-if="summary.noEmail > 0">
        · {{ summary.noEmail }} zonder e-mailadres (kunnen niet inloggen)
      </template>
    </p>

    <!-- Bulkacties: enkel voor de agency-admin -->
    <div v-if="isAgencyAdmin" class="mb-3 flex items-center gap-3">
      <span class="text-sm text-(--color-text-muted)">
        {{ selected.size > 0 ? `${selected.size} geselecteerd` : "Niets geselecteerd" }}
      </span>
      <div ref="actionMenuRef" class="relative">
        <button
          type="button"
          aria-haspopup="menu"
          :aria-expanded="menuOpen"
          aria-label="Acties voor geselecteerde klanten"
          :disabled="selected.size === 0"
          class="rounded-lg border px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed"
          :class="
            selected.size === 0
              ? 'border-(--color-border) text-(--color-text-muted) opacity-50'
              : 'border-(--color-border-strong) text-(--color-accent) hover:bg-(--color-hover)'
          "
          @click="menuOpen = !menuOpen"
        >
          ⋮
        </button>
        <div
          v-if="menuOpen"
          role="menu"
          class="absolute left-0 z-20 mt-1 w-64 overflow-hidden rounded-lg border border-(--color-border-strong) shadow-xl"
          style="background: var(--color-surface)"
        >
          <button
            type="button"
            role="menuitem"
            :disabled="bulkInviting"
            class="block w-full px-4 py-2.5 text-left text-sm text-(--color-text) transition-colors hover:bg-(--color-hover) disabled:cursor-not-allowed disabled:opacity-50"
            @click="bulkInvite"
          >
            {{ bulkInviting ? "Versturen…" : "Lanceringsmail versturen" }}
          </button>
          <button
            type="button"
            role="menuitem"
            :disabled="bulkDeleting"
            class="block w-full px-4 py-2.5 text-left text-sm text-[#e06a6a] transition-colors hover:bg-(--color-hover) disabled:cursor-not-allowed disabled:opacity-50"
            @click="bulkDelete"
          >
            {{ bulkDeleting ? "Verwijderen…" : "Klanten verwijderen" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Kaarten (mobiel) -->
    <ul v-if="items.length > 0" class="space-y-2 sm:hidden">
      <li
        v-for="c in items"
        :key="c.id"
        class="flex items-start gap-2 rounded-xl border border-(--color-border) bg-(--color-surface-2) overflow-hidden"
      >
        <label v-if="isAgencyAdmin" class="py-3 pl-4">
          <input
            type="checkbox"
            :checked="selected.has(c.id)"
            aria-label="Klant selecteren"
            @change="toggleSelect(c.id)"
          >
        </label>
        <NuxtLink
          :to="`/admin/klanten/${c.id}`"
          class="flex min-w-0 flex-1 flex-col gap-2 px-4 py-3"
        >
          <div class="min-w-0">
            <p class="text-sm text-(--color-text-muted)">{{ c.customerNr }}</p>
            <p class="font-semibold text-(--color-text-strong)">{{ c.name }}</p>
            <p v-if="c.contactEmail" class="truncate text-sm text-(--color-text-muted)">
              {{ c.contactEmail }}
            </p>
          </div>
          <div class="flex items-center justify-between gap-3 text-sm text-(--color-text-muted)">
            <span>{{ c.productCount }} product{{ c.productCount !== 1 ? "en" : "" }}</span>
            <span>{{ loginStatusLabel[c.loginStatus] }}</span>
          </div>
        </NuxtLink>
      </li>
    </ul>
    <p
      v-else
      class="rounded-xl border border-(--color-border) bg-(--color-surface-2) px-4 py-10 text-center text-base text-(--color-text-muted) sm:hidden"
    >
      Geen klanten gevonden.
    </p>

    <!-- Tabel (desktop) -->
    <div class="hidden rounded-xl border border-(--color-border) overflow-hidden sm:block">
      <div class="overflow-x-auto">
      <table class="w-full text-base border-collapse">
        <thead>
          <tr
            class="border-b border-(--color-border) text-[0.8rem] uppercase tracking-widest text-(--color-text-muted)"
          >
            <th v-if="isAgencyAdmin" class="w-10 px-4 py-3">
              <input
                type="checkbox"
                :checked="allSelected"
                aria-label="Alle klanten op deze pagina selecteren"
                @change="toggleSelectAll()"
              >
            </th>
            <th class="px-4 py-3 text-left font-semibold">Klantnr.</th>
            <th class="px-4 py-3 text-left font-semibold">Naam</th>
            <th class="hidden px-4 py-3 text-left font-semibold md:table-cell">
              Contact
            </th>
            <th class="hidden px-4 py-3 text-left font-semibold lg:table-cell">
              Login
            </th>
            <th class="px-4 py-3 text-left font-semibold whitespace-nowrap">CRM data</th>
            <th class="hidden px-4 py-3 text-left font-semibold whitespace-nowrap lg:table-cell">
              Laatste bestelling
            </th>
            <th class="hidden px-4 py-3 text-right font-semibold lg:table-cell">Aantal</th>
            <th class="px-4 py-3"/>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="c in items"
            :key="c.id"
            class="border-b border-(--color-border) last:border-0 hover:bg-(--color-hover)"
          >
            <td v-if="isAgencyAdmin" class="px-4 py-2.5">
              <input
                type="checkbox"
                :checked="selected.has(c.id)"
                aria-label="Klant selecteren"
                @change="toggleSelect(c.id)"
              >
            </td>
            <td class="px-4 py-2.5 font-mono text-sm text-(--color-text-muted)">{{ c.customerNr }}</td>
            <td class="px-4 py-2.5 text-(--color-text-strong)">{{ c.name }}</td>
            <td class="hidden px-4 py-2.5 text-(--color-text-muted) md:table-cell">
              {{ c.contactEmail ?? "—" }}
            </td>
            <td class="hidden px-4 py-2.5 whitespace-nowrap text-(--color-text-muted) lg:table-cell">
              {{ loginStatusLabel[c.loginStatus] }}
            </td>
            <td class="px-4 py-2.5 whitespace-nowrap text-(--color-text-muted)">
              <template v-if="c.lastPurchasedAt">
                {{ formatDate(c.lastPurchasedAt) }}
                <span class="text-sm">
                  · {{ c.productCount }} product{{ c.productCount !== 1 ? "en" : "" }}
                </span>
              </template>
              <template v-else>—</template>
            </td>
            <td class="hidden px-4 py-2.5 whitespace-nowrap text-(--color-text-muted) lg:table-cell">
              <template v-if="c.lastOrderedAt">
                {{ formatDate(c.lastOrderedAt) }}
                <span class="text-sm">· #{{ c.orderCount }}</span>
              </template>
              <template v-else>—</template>
            </td>
            <td class="hidden px-4 py-2.5 text-right text-(--color-text-strong) lg:table-cell">
              {{ c.orderCount ? c.orderedQuantity : "—" }}
            </td>
            <td class="px-4 py-2.5">
              <div class="flex items-center justify-end gap-3 whitespace-nowrap">
                <NuxtLink
                  :to="`/admin/klanten/${c.id}`"
                  class="text-sm font-semibold tracking-[0.08em] text-(--color-accent) uppercase hover:text-[#e8c97a]"
                >
                  Bekijken
                </NuxtLink>
                <NuxtLink
                  :to="`/admin/klanten/${c.id}?bewerken=1`"
                  :aria-label="`${c.name} bewerken`"
                  title="Bewerken"
                  class="rounded-md p-1.5 text-(--color-text-muted) transition-colors hover:bg-(--color-hover) hover:text-(--color-accent)"
                >
                  <svg
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </NuxtLink>
              </div>
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td :colspan="isAgencyAdmin ? 9 : 8" class="px-4 py-10 text-center text-(--color-text-muted)">
              Geen klanten gevonden.
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
        class="rounded-lg border border-(--color-border-strong) px-4 py-2 text-sm font-semibold tracking-[0.08em] text-(--color-text) uppercase transition-colors hover:bg-(--color-hover) disabled:cursor-not-allowed disabled:opacity-40"
        @click="page--"
      >
        Vorige
      </button>
      <span class="text-sm text-(--color-text-muted)">
        Pagina {{ page }} van {{ pagination.pageCount }}
      </span>
      <button
        type="button"
        :disabled="page >= pagination.pageCount"
        class="rounded-lg border border-(--color-border-strong) px-4 py-2 text-sm font-semibold tracking-[0.08em] text-(--color-text) uppercase transition-colors hover:bg-(--color-hover) disabled:cursor-not-allowed disabled:opacity-40"
        @click="page++"
      >
        Volgende
      </button>
    </div>

    <!-- Nieuwe klant -->
    <Teleport to="body">
      <div
        v-if="createOpen"
        class="fixed inset-0 z-220 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
        @click.self="closeCreate"
      >
        <div
          class="my-auto w-full max-w-md overflow-hidden rounded-2xl border border-[#c89868]/30 shadow-2xl"
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

            <p v-if="createError" class="text-sm text-[#e06a6a]">{{ createError }}</p>

            <div class="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                class="rounded-lg border border-(--color-border-strong) px-4 py-2.5 text-sm font-semibold tracking-[0.08em] text-(--color-text) uppercase transition-colors hover:bg-(--color-hover)"
                @click="closeCreate"
              >
                Annuleren
              </button>
              <button
                type="submit"
                :disabled="creating"
                class="rounded-lg bg-[#b8252a] px-5 py-2.5 text-sm font-semibold tracking-widest text-white uppercase transition-colors hover:bg-[#8b1f1f] disabled:cursor-not-allowed disabled:opacity-50"
              >
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
definePageMeta({ layout: "main", middleware: "admin" });
useHead({ title: "Klanten — Vleeswaren Vermeir" });

const auth = useAuth();
/**
 * Bulkacties (lanceringsmail/verwijderen) zijn voorbehouden aan de
 * agency-admin — zelfde adres als server/utils/session.ts requireAgencyAdmin.
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

const search = ref("");
const debouncedSearch = ref("");
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
const form = reactive({ customerNr: "", name: "", email: "" });
const customerNrInput = ref<HTMLInputElement | null>(null);

function openCreate() {
  form.customerNr = "";
  form.name = "";
  form.email = "";
  createError.value = "";
  createOpen.value = true;
  nextTick(() => customerNrInput.value?.focus());
}

function closeCreate() {
  if (!creating.value) createOpen.value = false;
}

async function submitCreate() {
  if (creating.value) return;
  creating.value = true;
  createError.value = "";

  try {
    const result = await $fetch<CreateCustomerResponse>("/api/admin/customers", {
      method: "POST",
      body: {
        customerNr: form.customerNr,
        name: form.name.trim() || undefined,
        email: form.email,
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

// Selectie + bulkacties (enkel bruikbaar door de agency-admin, zie isAgencyAdmin).
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

const menuOpen = ref(false);
const actionMenuRef = ref<HTMLElement | null>(null);
watch(
  () => selected.value.size,
  (n) => {
    if (n === 0) menuOpen.value = false;
  },
);

onMounted(() => {
  const onClickOutside = (e: MouseEvent) => {
    if (menuOpen.value && !actionMenuRef.value?.contains(e.target as Node)) {
      menuOpen.value = false;
    }
  };
  document.addEventListener("mousedown", onClickOutside);
  onUnmounted(() => document.removeEventListener("mousedown", onClickOutside));
});

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

  menuOpen.value = false;
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

  menuOpen.value = false;
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
.adm-label {
  display: block;
  margin-bottom: 0.4rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
}
</style>
