<template>
  <AdminShell
    :title="order ? `Bestelling ${order.id.slice(0, 8).toUpperCase()}` : 'Bestelling'"
    :subtitle="order ? `Geplaatst op ${formatDate(order.createdAt)}` : ''"
  >
    <template #actions>
      <NuxtLink to="/admin/bestellingen" class="adm-btn adm-btn--secondary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Alle bestellingen
      </NuxtLink>
      <NuxtLink
        v-if="order?.customer.customerId"
        :to="`/admin/klanten/${order.customer.customerId}`"
        class="adm-btn adm-btn--secondary"
      >
        Klantprofiel
      </NuxtLink>
      <a
        v-if="order"
        :href="`/api/admin/orders/${order.id}/pdf`"
        download
        class="adm-btn adm-btn--primary"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" />
        </svg>
        Bestelbon (PDF)
      </a>
      <!-- Enkel voor de agency-admin; de server controleert dat opnieuw. -->
      <button
        v-if="order && isAgencyAdmin"
        type="button"
        class="adm-btn adm-btn--danger"
        aria-label="Bestelling verwijderen"
        title="Bestelling verwijderen"
        @click="openDelete"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M10 11v6m4-6v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
        </svg>
      </button>
    </template>

    <template v-if="order">
      <div class="adm-stats">
        <div class="adm-stat">
          <p class="adm-stat-label">Artikelen</p>
          <p class="adm-stat-value">{{ order.items.length }}</p>
        </div>
        <div class="adm-stat">
          <p class="adm-stat-label">Stuks in totaal</p>
          <p class="adm-stat-value">{{ totalQuantity }}</p>
        </div>
        <div class="adm-stat">
          <p class="adm-stat-label">Besteld op</p>
          <p class="adm-stat-value">{{ formatShortDate(order.createdAt) }}</p>
          <p class="adm-stat-sub">{{ formatTime(order.createdAt) }}</p>
        </div>
        <div class="adm-stat">
          <p class="adm-stat-label">Met promotie</p>
          <p class="adm-stat-value" :class="{ 'text-(--color-primary)': promotionCount > 0 }">
            {{ promotionCount }}
          </p>
        </div>
        <div class="adm-stat">
          <p class="adm-stat-label">Niet meer beschikbaar</p>
          <p class="adm-stat-value" :class="{ 'text-(--color-warning)': unavailableCount > 0 }">
            {{ unavailableCount }}
          </p>
        </div>
      </div>

      <div class="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
        <!-- Artikelen -->
        <section class="adm-card">
          <div class="adm-card-head">
            <h2 class="adm-card-title">Bestelde artikelen</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="adm-table">
              <thead>
                <tr>
                  <th>Artikelnr.</th>
                  <th class="w-full">Product</th>
                  <th class="hidden sm:table-cell">Eenheid</th>
                  <th class="hidden md:table-cell">Leverancier</th>
                  <th class="adm-num">Aantal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in order.items" :key="item.id">
                  <td class="font-mono text-[0.8125rem] text-(--color-text-muted)">{{ item.articleNr }}</td>
                  <td>
                    <p class="font-medium text-(--color-text-strong)">{{ item.name }}</p>
                    <!-- Smal scherm: eenheid en leverancier onder de naam i.p.v. in hun kolom -->
                    <p class="text-[0.8125rem] text-(--color-text-muted) md:hidden">
                      <span v-if="item.unit" class="sm:hidden">{{ item.unit }} · </span>{{ item.supplier }}
                    </p>
                    <!-- Promotie die gold bij het bestellen: rood = minimum gehaald -->
                    <p
                      v-for="promo in item.promotions"
                      :key="promo.label"
                      class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5"
                    >
                      <span class="adm-badge" :class="promo.reached ? 'adm-badge--danger' : 'adm-badge--neutral'">
                        Promotie: {{ promo.label }}
                      </span>
                      <span class="text-[0.8125rem] text-(--color-text-muted)">{{ promo.note }}</span>
                    </p>
                    <span v-if="!item.available" class="adm-badge adm-badge--warning mt-1">
                      Niet meer beschikbaar
                    </span>
                  </td>
                  <td class="hidden whitespace-nowrap text-(--color-text-muted) sm:table-cell">
                    {{ item.unit ?? "—" }}
                  </td>
                  <td class="hidden whitespace-nowrap text-(--color-text-muted) md:table-cell">
                    {{ item.supplier }}
                  </td>
                  <td class="adm-num font-semibold text-(--color-text-strong)">{{ item.quantity }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" class="hidden border-t border-(--color-border) text-right text-(--color-text-muted) md:table-cell">
                    Totaal
                  </td>
                  <td colspan="3" class="hidden border-t border-(--color-border) text-right text-(--color-text-muted) sm:table-cell md:hidden">
                    Totaal
                  </td>
                  <td colspan="2" class="border-t border-(--color-border) text-right text-(--color-text-muted) sm:hidden">
                    Totaal
                  </td>
                  <td class="adm-num border-t border-(--color-border) font-bold text-(--color-text-strong)">
                    {{ totalQuantity }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <div class="space-y-6">
          <!-- Klant -->
          <section class="adm-card">
            <div class="adm-card-head">
              <h2 class="adm-card-title">Klant</h2>
              <span v-if="order.customer.customerNr" class="font-mono text-[0.8125rem] text-(--color-text-muted)">
                {{ order.customer.customerNr }}
              </span>
            </div>
            <dl class="adm-dl adm-card-body">
              <div>
                <dt>Naam</dt>
                <dd>
                  <NuxtLink
                    v-if="order.customer.customerId"
                    :to="`/admin/klanten/${order.customer.customerId}`"
                    class="hover:text-(--color-accent)"
                  >
                    {{ order.customer.name }}
                  </NuxtLink>
                  <template v-else>{{ order.customer.name }}</template>
                </dd>
              </div>
              <div>
                <dt>E-mail</dt>
                <dd>{{ order.customer.email }}</dd>
              </div>
              <!-- Naam zoals bevroren op de bestelling; enkel als de klant
                   intussen anders heet. -->
              <div v-if="order.billing.companyName && order.billing.companyName !== order.customer.name">
                <dt>Naam bij bestelling</dt>
                <dd>{{ order.billing.companyName }}</dd>
              </div>
              <div v-if="order.billing.vatNumber">
                <dt>Btw-nummer</dt>
                <dd>{{ order.billing.vatNumber }}</dd>
              </div>
              <div
                v-if="order.billing.invoiceEmail && order.billing.invoiceEmail.toLowerCase() !== order.customer.email.toLowerCase()"
              >
                <dt>Facturatie-e-mail</dt>
                <dd>{{ order.billing.invoiceEmail }}</dd>
              </div>
            </dl>
          </section>

          <!-- Levering: zoals bevroren op de bestelling, niet het huidige adres. -->
          <section class="adm-card">
            <div class="adm-card-head">
              <h2 class="adm-card-title">Levering</h2>
            </div>
            <dl class="adm-dl adm-card-body">
              <div>
                <dt>Leveringsadres</dt>
                <dd v-if="order.billing.street || order.billing.city">
                  {{ order.billing.street }}<br>
                  {{ order.billing.postalCode }} {{ order.billing.city }}
                </dd>
                <dd v-else class="text-(--color-text-muted)">Niet ingevuld</dd>
              </div>
              <div>
                <dt>Telefoon</dt>
                <dd>{{ order.billing.phone ?? "—" }}</dd>
              </div>
            </dl>
            <p class="adm-card-hint">Zoals op het moment van bestellen, ook als de klant het adres later wijzigt.</p>
          </section>
        </div>
      </div>
    </template>

    <!-- Verwijderen: bestelnummer overtypen ter bevestiging -->
    <Teleport to="body">
      <div
        v-if="deleteOpen && order"
        class="fixed inset-0 z-220 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
        @click.self="closeDelete"
      >
        <div
          class="my-auto w-full max-w-md overflow-hidden rounded-2xl border border-(--color-border) shadow-2xl"
          style="background: var(--color-surface)"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-order-title"
          aria-describedby="delete-order-desc"
        >
          <div class="border-b border-(--color-border) px-5 py-4 sm:px-6">
            <h3
              id="delete-order-title"
              class="font-['Playfair_Display',Georgia,serif] text-xl text-(--color-text-strong)"
            >
              Bestelling verwijderen
            </h3>
          </div>

          <form class="space-y-4 px-5 py-5 sm:px-6" @submit.prevent="submitDelete">
            <p id="delete-order-desc" class="text-sm text-(--color-text-muted)">
              Bestelling <strong class="text-(--color-text-strong)">{{ orderNr }}</strong>
              van {{ order.customer.name }} ({{ order.items.length }}
              artikel{{ order.items.length !== 1 ? "en" : "" }}) wordt definitief
              verwijderd, ook bij de klant onder "Mijn bestellingen". Dit kan niet
              ongedaan gemaakt worden.
            </p>
            <label class="block">
              <span class="adm-label">Typ <strong>{{ orderNr }}</strong> om te bevestigen</span>
              <input
                ref="deleteInput"
                v-model="deleteConfirm"
                type="text"
                required
                autocomplete="off"
                spellcheck="false"
                :placeholder="orderNr"
                class="adm-input w-full font-mono uppercase"
              >
            </label>

            <p v-if="deleteError" class="text-sm text-(--color-error)">{{ deleteError }}</p>

            <div class="flex items-center justify-end gap-2 pt-1">
              <button type="button" class="adm-btn adm-btn--secondary" @click="closeDelete">
                Annuleren
              </button>
              <button
                type="submit"
                :disabled="!deleteMatches || deleting"
                class="adm-btn adm-btn--danger"
              >
                {{ deleting ? "Bezig…" : "Definitief verwijderen" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </AdminShell>
</template>

<script setup lang="ts">
import { isAgencyAdminEmail } from "#layers/auth/shared/agency-admin";
import type { OrderLinePromotion } from "#shared/promotion";

const route = useRoute();
definePageMeta({ layout: "admin", middleware: "admin" });

interface OrderDetail {
  id: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
    customerId: string | null;
    customerNr: string | null;
  };
  billing: {
    companyName: string;
    vatNumber: string | null;
    phone: string | null;
    invoiceEmail: string;
    street?: string | null;
    postalCode?: string | null;
    city?: string | null;
  };
  items: {
    id: string;
    articleNr: string;
    name: string;
    supplier: string;
    unit: string | null;
    quantity: number;
    /** Promoties die bij het bestellen golden; leeg op oudere bestellingen. */
    promotions: OrderLinePromotion[];
    available: boolean;
  }[];
}

const { data } = await useFetch<OrderDetail>(
  `/api/admin/orders/${route.params.id}`,
);

if (!data.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Bestelling niet gevonden.",
    fatal: true,
  });
}

const order = computed(() => data.value ?? null);
useHead({ title: "Bestelling — Beheer — Vleeswaren Vermeir" });

/**
 * Verwijderen is voorbehouden aan de agency-admin (packages/auth/shared/agency-admin.ts);
 * DELETE /api/admin/orders/:id controleert dat opnieuw.
 */
const auth = useAuth();
const isAgencyAdmin = computed(() => isAgencyAdminEmail(auth.user.value?.email));

const orderNr = computed(() => order.value?.id.slice(0, 8).toUpperCase() ?? "");
const deleteOpen = ref(false);
const deleteConfirm = ref("");
const deleting = ref(false);
const deleteError = ref("");
const deleteInput = ref<HTMLInputElement | null>(null);
const deleteMatches = computed(
  () => deleteConfirm.value.trim().toUpperCase() === orderNr.value,
);

function openDelete() {
  deleteConfirm.value = "";
  deleteError.value = "";
  deleteOpen.value = true;
  nextTick(() => deleteInput.value?.focus());
}

function closeDelete() {
  if (!deleting.value) deleteOpen.value = false;
}

async function submitDelete() {
  if (!order.value || !deleteMatches.value || deleting.value) return;
  deleting.value = true;
  deleteError.value = "";
  try {
    await $fetch(`/api/admin/orders/${order.value.id}`, { method: "DELETE" });
    deleteOpen.value = false;
    await navigateTo("/admin/bestellingen");
  } catch (err) {
    deleteError.value =
      (err as { data?: { statusMessage?: string } })?.data?.statusMessage ||
      "Verwijderen mislukt. Probeer het later opnieuw.";
  } finally {
    deleting.value = false;
  }
}

onMounted(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && deleteOpen.value) closeDelete();
  };
  window.addEventListener("keydown", onKey);
  onUnmounted(() => window.removeEventListener("keydown", onKey));
});

const totalQuantity = computed(() =>
  (order.value?.items ?? []).reduce((sum, item) => sum + item.quantity, 0),
);
const promotionCount = computed(
  () => (order.value?.items ?? []).filter((item) => item.promotions.length > 0).length,
);
const unavailableCount = computed(
  () => (order.value?.items ?? []).filter((item) => !item.available).length,
);

function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("nl-BE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("nl-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string | Date): string {
  // Vaste tijdzone: de server (UTC) en de browser moeten hetzelfde uur tonen.
  return new Date(value).toLocaleTimeString("nl-BE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Brussels",
  });
}
</script>
