<template>
  <AccountShell :title="order.name || 'Bestelling'" :subtitle="formatDate(order.createdAt)">
    <div
      v-if="justPlaced"
      class="mb-8 rounded-r-xl border-l-2 border-[#c89868] bg-(--color-surface-2) px-5 py-4"
    >
      <p class="font-semibold text-(--color-text-strong)">
        Bedankt voor uw bestelling!
      </p>
      <p class="mt-1 text-base text-(--color-text-muted)">
        Ze is zonet doorgestuurd naar Vleeswaren Vermeir en wordt zo snel
        mogelijk verwerkt en geleverd. U vindt de bestelling hier steeds
        terug.
      </p>
    </div>

    <div
      v-if="order.note"
      class="mb-8 rounded-r-xl border-l-2 border-(--color-border-strong) bg-(--color-surface-2) px-5 py-4"
    >
      <p class="text-sm font-semibold tracking-[0.08em] text-(--color-accent) uppercase">
        Notitie
      </p>
      <p class="mt-1 text-base whitespace-pre-line text-(--color-text)">{{ order.note }}</p>
    </div>

    <div class="mb-6 flex flex-wrap items-center gap-4">
      <NuxtLink
        to="/account/bestellingen"
        class="text-sm font-semibold tracking-[0.08em] text-(--color-accent) uppercase transition-colors hover:text-(--color-text-strong)"
      >
        ← Alle bestellingen
      </NuxtLink>
    </div>

    <div class="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <!-- Items -->
      <section>
        <h2
          class="mb-4 text-[0.8rem] font-semibold tracking-[0.2em] text-(--color-accent) uppercase"
        >
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
              <p class="mt-0.5 text-[0.8rem] text-(--color-text-muted)">
                <span class="font-mono text-(--color-accent)">{{
                  item.articleNr
                }}</span>
                · {{ item.supplier }}
                <span v-if="item.unit"> · {{ item.unit }}</span>
              </p>
              <p v-if="!item.available" class="mt-1 text-[0.8rem] text-[#d9a05b]">
                Niet meer beschikbaar
              </p>
            </div>
            <span class="shrink-0 font-semibold text-(--color-text)"
              >{{ item.quantity }}×</span
            >
          </li>
        </ul>

        <!-- Reorder -->
        <div class="mt-6 rounded-xl border border-[#c89868]/30 bg-(--color-surface-2) p-5">
          <h3 class="font-semibold text-(--color-text-strong)">Opnieuw bestellen</h3>
          <p class="mt-1 text-base text-(--color-text-muted)">
            {{ reorderSummary }}
          </p>
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              :disabled="reorderItems.length === 0"
              class="rounded-lg bg-[#b8252a] px-4 py-3 text-sm font-semibold tracking-widest text-white uppercase transition-colors hover:bg-[#8b1f1f] disabled:cursor-not-allowed disabled:opacity-40"
              @click="reorder('replace')"
            >
              Vervang mandje
            </button>
            <button
              type="button"
              :disabled="reorderItems.length === 0"
              class="rounded-lg border border-[#c89868] px-4 py-3 text-sm font-semibold tracking-widest text-(--color-accent) uppercase transition-colors hover:bg-[#c89868] hover:text-[#1a0a0a] disabled:cursor-not-allowed disabled:opacity-40"
              @click="reorder('append')"
            >
              Toevoegen aan mandje
            </button>
          </div>
        </div>
      </section>

      <!-- Billing snapshot -->
      <section>
        <h2
          class="mb-4 text-[0.8rem] font-semibold tracking-[0.2em] text-(--color-accent) uppercase"
        >
          — Gefactureerd aan —
        </h2>
        <div
          class="space-y-1 rounded-xl border border-(--color-border) bg-(--color-surface-2) px-5 py-5 text-base text-(--color-text)"
        >
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
        <p class="mt-3 text-[0.8rem] leading-relaxed text-(--color-text-muted)">
          Dit zijn de gegevens zoals ze golden op het moment van bestellen.
          Wijzigingen aanpassen doet u bij
          <NuxtLink to="/account/gegevens" class="text-(--color-accent) hover:underline"
            >uw facturatiegegevens</NuxtLink
          >.
        </p>
      </section>
    </div>
  </AccountShell>
</template>

<script setup lang="ts">
definePageMeta({ layout: "main", middleware: "account" });

const route = useRoute();
const cart = useCart();

const { data } = await useFetch(`/api/account/orders/${route.params.id}`);

if (!data.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Bestelling niet gevonden.",
    fatal: true,
  });
}

const order = data.value;
const justPlaced = route.query.nieuw === "1";

useHead({ title: "Bestelling — Vleeswaren Vermeir" });

const reorderItems = computed(() =>
  order.items
    .filter((i) => i.available)
    .map((i) => ({
      id: i.articleNr,
      articleNr: i.articleNr,
      name: i.name,
      supplier: i.supplier,
      unit: i.unit ?? undefined,
      quantity: i.quantity,
    })),
);

const reorderSummary = computed(() => {
  const total = order.items.length;
  const usable = reorderItems.value.length;
  if (usable === total) {
    return `Alle ${total} artikel${total !== 1 ? "en" : ""} kunnen opnieuw besteld worden.`;
  }
  return `${usable} van de ${total} artikelen kunnen opnieuw besteld worden — ${total - usable} zijn niet meer beschikbaar.`;
});

function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("nl-BE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function reorder(mode: "replace" | "append") {
  if (reorderItems.value.length === 0) return;
  if (mode === "replace") cart.replaceItems(reorderItems.value, false);
  else cart.addItems(reorderItems.value, false);
  cart.showCartOnly.value = true;
  navigateTo("/producten");
}
</script>
