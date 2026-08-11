<template>
  <AdminShell
    :title="data?.customer.name ?? 'Klant'"
    :subtitle="data?.customer.email"
  >
    <div v-if="data" class="space-y-10">
      <!-- Facturatiegegevens -->
      <section>
        <h2
          class="mb-4 text-[0.7rem] font-semibold tracking-[0.2em] text-(--color-accent) uppercase"
        >
          — Facturatiegegevens —
        </h2>

        <div
          v-if="!data.billing"
          class="rounded-xl border border-(--color-border) bg-(--color-surface-2) px-5 py-4 text-sm text-(--color-text-muted)"
        >
          Nog niet ingevuld.
        </div>
        <dl v-else class="grid gap-x-8 gap-y-3 rounded-xl border border-(--color-border) bg-(--color-surface-2) px-5 py-5 sm:grid-cols-2">
          <div>
            <dt class="text-xs text-(--color-text-muted)">Bedrijf</dt>
            <dd class="text-(--color-text-strong)">{{ data.billing.companyName }}</dd>
          </div>
          <div>
            <dt class="text-xs text-(--color-text-muted)">BTW-nummer</dt>
            <dd class="text-(--color-text-strong)">{{ data.billing.vatNumber ?? "—" }}</dd>
          </div>
          <div>
            <dt class="text-xs text-(--color-text-muted)">Adres</dt>
            <dd class="text-(--color-text-strong)">
              {{ data.billing.street }}, {{ data.billing.postalCode }}
              {{ data.billing.city }}, {{ data.billing.country }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-(--color-text-muted)">Telefoon</dt>
            <dd class="text-(--color-text-strong)">{{ data.billing.phone }}</dd>
          </div>
          <div>
            <dt class="text-xs text-(--color-text-muted)">Facturatie-e-mail</dt>
            <dd class="text-(--color-text-strong)">{{ data.billing.invoiceEmail }}</dd>
          </div>
        </dl>
      </section>

      <!-- Bestelhistoriek -->
      <section>
        <h2
          class="mb-4 text-[0.7rem] font-semibold tracking-[0.2em] text-(--color-accent) uppercase"
        >
          — Bestellingen ({{ data.orders.length }}) —
        </h2>

        <div
          v-if="data.orders.length === 0"
          class="rounded-xl border border-(--color-border) bg-(--color-surface-2) px-5 py-4 text-sm text-(--color-text-muted)"
        >
          Nog geen bestellingen.
        </div>
        <ul v-else class="space-y-2">
          <li
            v-for="order in data.orders"
            :key="order.id"
            class="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-(--color-border) bg-(--color-surface-2) px-4 py-4 sm:px-6"
          >
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-(--color-text-strong)">
                {{ formatDate(order.createdAt) }}
              </p>
              <p class="mt-0.5 text-xs text-(--color-text-muted)">
                {{ order.lineCount }} artikel{{ order.lineCount !== 1 ? "en" : "" }}
                · {{ order.totalQuantity }} stuks
              </p>
            </div>
            <AccountOrderStatus :status="order.status" />
          </li>
        </ul>
      </section>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
const route = useRoute();
definePageMeta({ layout: "main", middleware: "admin" });
useHead({ title: "Klant — Vleeswaren Vermeir" });

interface CustomerDetail {
  customer: { id: string; name: string; email: string; createdAt: string };
  billing: {
    companyName: string;
    vatNumber: string | null;
    street: string;
    postalCode: string;
    city: string;
    country: string;
    phone: string;
    invoiceEmail: string;
  } | null;
  orders: {
    id: string;
    status: string;
    createdAt: string;
    lineCount: number;
    totalQuantity: number;
  }[];
}

const { data } = await useFetch<CustomerDetail>(
  `/api/admin/customers/${route.params.id}`,
);

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("nl-BE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
</script>
