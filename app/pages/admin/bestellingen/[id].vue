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
              <p v-if="order.customer.customerNr" class="text-xs text-(--color-text-muted)">
                Klantnr. {{ order.customer.customerNr }}
              </p>
              <NuxtLink
                v-if="order.customer.customerId"
                :to="`/admin/klanten/${order.customer.customerId}`"
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

function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("nl-BE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
</script>
