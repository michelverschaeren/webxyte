<template>
  <AccountShell
    :title="greeting"
    subtitle="Beheer hier uw bestellingen, lijsten en facturatiegegevens."
  >
    <div
      v-if="!billing"
      class="mb-8 flex flex-wrap items-center gap-4 border-l-2 border-[#c89868] bg-(--color-surface) px-5 py-4"
    >
      <p class="flex-1 text-sm text-(--color-text)">
        Vul uw facturatiegegevens in — die hebben wij nodig voor u kunt
        bestellen.
      </p>
      <NuxtLink
        to="/account/gegevens"
        class="bg-[#b8252a] px-4 py-2 text-[0.7rem] font-semibold tracking-[0.08em] text-white uppercase transition-colors hover:bg-[#8b1f1f]"
      >
        Nu invullen
      </NuxtLink>
    </div>

    <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <NuxtLink to="/account/bestellingen" class="acc-card">
        <span class="acc-card-value">{{ orderCount }}</span>
        <span class="acc-card-title">Bestellingen</span>
        <span class="acc-card-hint">Bekijk en herhaal vorige bestellingen</span>
      </NuxtLink>

      <NuxtLink to="/account/lijsten" class="acc-card">
        <span class="acc-card-value">{{ listCount }}</span>
        <span class="acc-card-title">Mijn lijsten</span>
        <span class="acc-card-hint"
          >Vaste selecties zoals "Kazen" of "Kerstmis"</span
        >
      </NuxtLink>

      <button type="button" class="acc-card" @click="cart.isOpen.value = true">
        <span class="acc-card-value">{{ cart.totalItems.value }}</span>
        <span class="acc-card-title">Winkelmandje</span>
        <span class="acc-card-hint">Bekijk en pas uw huidige bestelling aan</span>
      </button>

      <NuxtLink to="/account/gegevens" class="acc-card">
        <span class="acc-card-value">{{ billing ? "✓" : "—" }}</span>
        <span class="acc-card-title">Gegevens</span>
        <span class="acc-card-hint">{{
          billing ? billing.companyName : "Nog niet ingevuld"
        }}</span>
      </NuxtLink>
    </div>

    <!-- Recente bestellingen -->
    <section v-if="recentOrders.length > 0" class="mt-12">
      <div class="mb-4 flex items-center justify-between gap-4">
        <h2
          class="text-[0.7rem] font-semibold tracking-[0.2em] text-(--color-accent) uppercase"
        >
          — Recent besteld —
        </h2>
        <NuxtLink
          to="/account/bestellingen"
          class="text-xs font-semibold tracking-[0.08em] text-(--color-text-muted) uppercase transition-colors hover:text-(--color-text-strong)"
        >
          Alles bekijken →
        </NuxtLink>
      </div>

      <ul class="space-y-2">
        <li
          v-for="order in recentOrders"
          :key="order.id"
          class="border border-(--color-border) bg-(--color-surface-2) transition-colors hover:border-[#c89868]/40"
        >
          <NuxtLink
            :to="`/account/bestellingen/${order.id}`"
            class="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4 sm:px-6"
          >
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-(--color-text-strong)">
                {{ formatDate(order.createdAt) }}
              </p>
              <p class="mt-0.5 text-xs text-(--color-text-muted)">
                {{ order.lineCount }} artikel{{
                  order.lineCount !== 1 ? "en" : ""
                }}
                · {{ order.totalQuantity }} stuks
              </p>
            </div>
            <AccountOrderStatus :status="order.status" />
          </NuxtLink>
        </li>
      </ul>
    </section>
  </AccountShell>
</template>

<script setup lang="ts">
definePageMeta({ layout: "main", middleware: "account" });
useHead({ title: "Mijn account — Vleeswaren Vermeir" });

const auth = useAuth();
const cart = useCart();
const orderLists = useOrderLists();

const [{ data: billingData }, { data: ordersData }] = await Promise.all([
  useFetch("/api/account/billing"),
  useFetch("/api/account/orders", { query: { perPage: 3 } }),
]);

await useAsyncData("account:lists", () => orderLists.fetchLists());

const billing = computed(() => billingData.value);
const orderCount = computed(() => ordersData.value?.pagination.total ?? 0);
const recentOrders = computed(() => ordersData.value?.items ?? []);
const listCount = computed(() => orderLists.lists.value.length);

const greeting = computed(() => {
  const name = auth.user.value?.name?.trim();
  return name ? `Welkom, ${name}` : "Mijn account";
});

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
.acc-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface-2);
  padding: 1.5rem;
  text-align: left;
  text-decoration: none;
  transition:
    border-color 0.2s,
    transform 0.2s;
  cursor: pointer;
}
.acc-card:hover {
  border-color: rgba(200, 152, 104, 0.5);
  transform: translateY(-2px);
}
.acc-card-value {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 2rem;
  font-weight: 900;
  line-height: 1;
  color: var(--color-text-strong);
}
.acc-card-title {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--color-accent);
}
.acc-card-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
</style>
