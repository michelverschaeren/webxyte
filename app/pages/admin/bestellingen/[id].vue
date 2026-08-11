<template>
  <AdminShell title="Bestelling" :subtitle="order ? formatDate(order.createdAt) : ''">
    <template v-if="order">
      <div class="mb-6 flex flex-wrap items-center gap-4">
        <NuxtLink
          to="/admin/bestellingen"
          class="text-xs font-semibold tracking-[0.08em] text-(--color-accent) uppercase transition-colors hover:text-(--color-text-strong)"
        >
          ← Alle bestellingen
        </NuxtLink>
        <AccountOrderStatus :status="order.status" class="ml-auto" />
      </div>

      <!-- Status wijzigen -->
      <div class="mb-10 rounded-xl border border-(--color-border) bg-(--color-surface-2) px-5 py-5 sm:px-8">
        <p class="mb-3 text-[0.7rem] font-semibold tracking-[0.2em] text-(--color-accent) uppercase">
          — Status —
        </p>
        <div class="flex flex-wrap items-center gap-3">
          <select v-model="selectedStatus" class="adm-input w-auto">
            <option v-for="s in ORDER_STATUSES" :key="s" :value="s">
              {{ statusLabel(s) }}
            </option>
          </select>
          <button
            type="button"
            :disabled="selectedStatus === order.status || saving"
            class="rounded-lg bg-[#b8252a] px-5 py-2.5 text-xs font-semibold tracking-widest text-white uppercase transition-colors hover:bg-[#8b1f1f] disabled:cursor-not-allowed disabled:opacity-40"
            @click="saveStatus()"
          >
            {{ saving ? "Bezig…" : "Status opslaan" }}
          </button>
          <p v-if="saved" class="text-sm text-[#8fc98f]">Opgeslagen.</p>
        </div>
      </div>

      <div class="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <!-- Items -->
        <section>
          <h2 class="mb-4 text-[0.7rem] font-semibold tracking-[0.2em] text-(--color-accent) uppercase">
            — Bestelde artikelen —
          </h2>

          <ul class="space-y-2">
            <li
              v-for="item in order.items"
              :key="item.id"
              class="flex items-center gap-4 rounded-lg border border-(--color-border) bg-(--color-surface-2) px-4 py-3"
              :class="{ 'opacity-50': !item.available }"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate font-semibold text-(--color-text-strong)">{{ item.name }}</p>
                <p class="mt-0.5 text-[0.7rem] text-(--color-text-muted)">
                  <span class="font-mono text-(--color-accent)">{{ item.articleNr }}</span>
                  · {{ item.supplier }}
                  <span v-if="item.unit"> · {{ item.unit }}</span>
                </p>
                <p v-if="!item.available" class="mt-1 text-[0.7rem] text-[#d9a05b]">
                  Niet meer beschikbaar
                </p>
              </div>
              <span class="shrink-0 font-semibold text-(--color-text)">{{ item.quantity }}×</span>
            </li>
          </ul>
        </section>

        <!-- Klant + facturatie -->
        <section class="space-y-8">
          <div>
            <h2 class="mb-4 text-[0.7rem] font-semibold tracking-[0.2em] text-(--color-accent) uppercase">
              — Klant —
            </h2>
            <div class="rounded-xl border border-(--color-border) bg-(--color-surface-2) px-5 py-5 text-sm text-(--color-text)">
              <p class="font-semibold text-(--color-text-strong)">{{ order.customer.name }}</p>
              <p class="text-(--color-text-muted)">{{ order.customer.email }}</p>
              <NuxtLink
                :to="`/admin/klanten/${order.customer.id}`"
                class="mt-3 inline-block text-xs font-semibold tracking-[0.08em] text-(--color-accent) uppercase hover:text-[#e8c97a]"
              >
                Klantprofiel bekijken →
              </NuxtLink>
            </div>
          </div>

          <div>
            <h2 class="mb-4 text-[0.7rem] font-semibold tracking-[0.2em] text-(--color-accent) uppercase">
              — Gefactureerd aan —
            </h2>
            <div class="space-y-1 rounded-xl border border-(--color-border) bg-(--color-surface-2) px-5 py-5 text-sm text-(--color-text)">
              <p class="font-semibold text-(--color-text-strong)">{{ order.billing.companyName }}</p>
              <p v-if="order.billing.vatNumber" class="text-(--color-text-muted)">
                BTW {{ order.billing.vatNumber }}
              </p>
              <p class="pt-2">{{ order.billing.street }}</p>
              <p>{{ order.billing.postalCode }} {{ order.billing.city }}</p>
              <p>{{ order.billing.country }}</p>
              <p class="pt-2 text-(--color-text-muted)">{{ order.billing.phone }}</p>
              <p class="text-(--color-text-muted)">{{ order.billing.invoiceEmail }}</p>
            </div>
          </div>
        </section>
      </div>
    </template>
  </AdminShell>
</template>

<script setup lang="ts">
const route = useRoute();
definePageMeta({ layout: "main", middleware: "admin" });

const ORDER_STATUSES = ["nieuw", "in_behandeling", "voltooid", "geannuleerd"] as const;
const STATUS_LABELS: Record<string, string> = {
  nieuw: "Nieuw",
  in_behandeling: "In behandeling",
  voltooid: "Voltooid",
  geannuleerd: "Geannuleerd",
};
function statusLabel(s: string): string {
  return STATUS_LABELS[s] ?? s;
}

interface OrderDetail {
  id: string;
  status: string;
  createdAt: string;
  customer: { id: string; name: string; email: string };
  billing: {
    companyName: string;
    vatNumber: string | null;
    street: string;
    postalCode: string;
    city: string;
    country: string;
    phone: string;
    invoiceEmail: string;
  };
  items: {
    id: string;
    articleNr: string;
    name: string;
    supplier: string;
    unit: string | null;
    quantity: number;
    available: boolean;
  }[];
}

const { data, refresh } = await useFetch<OrderDetail>(
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

const selectedStatus = ref(data.value.status);
const saving = ref(false);
const saved = ref(false);

watch(
  () => order.value?.status,
  (status) => {
    if (status) selectedStatus.value = status;
  },
);

async function saveStatus() {
  if (!order.value || saving.value) return;
  saving.value = true;
  saved.value = false;
  try {
    await $fetch(`/api/admin/orders/${order.value.id}`, {
      method: "PATCH",
      body: { status: selectedStatus.value },
    });
    await refresh();
    saved.value = true;
  } finally {
    saving.value = false;
  }
}

function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("nl-BE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
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
</style>
