<template>
  <AccountShell :title="order.name || 'Bestelling'" :subtitle="formatDate(order.createdAt)">
    <div
      v-if="justPlaced"
      class="mx-auto mb-10 max-w-2xl rounded-xl border border-[#c89868]/30 bg-(--color-surface-2) px-6 py-10 text-center"
    >
      <p class="text-2xl font-semibold text-(--color-text-strong) sm:text-3xl">
        Bedankt voor uw bestelling!
      </p>
      <p class="mx-auto mt-3 max-w-xl text-base leading-relaxed text-(--color-text-muted) sm:text-lg">
        Ze is zonet doorgestuurd naar Vleeswaren Vermeir en wordt zo snel
        mogelijk verwerkt en geleverd.
      </p>
    </div>

    <div
      v-if="order.note"
      class="mx-auto mb-8 max-w-2xl rounded-r-xl border-l-2 border-(--color-border-strong) bg-(--color-surface-2) px-5 py-4"
    >
      <p class="text-sm font-semibold tracking-[0.08em] text-(--color-accent) uppercase">
        Notitie
      </p>
      <p class="mt-1 text-base whitespace-pre-line text-(--color-text)">{{ order.note }}</p>
    </div>

    <div class="mx-auto grid max-w-2xl gap-8">
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

    <div class="mx-auto mt-10 grid max-w-2xl gap-3 sm:grid-cols-2">
      <NuxtLink
        to="/account/bestellingen"
        class="rounded-lg border border-[#c89868] px-4 py-3 text-center text-sm font-semibold tracking-widest text-(--color-accent) uppercase transition-colors hover:bg-[#c89868] hover:text-[#1a0a0a]"
      >
        Vorige bestellingen
      </NuxtLink>
      <NuxtLink
        to="/producten"
        class="rounded-lg bg-[#b8252a] px-4 py-3 text-center text-sm font-semibold tracking-widest text-white uppercase transition-colors hover:bg-[#8b1f1f]"
        @click="cart.showCartOnly.value = false"
      >
        Nieuwe bestelling
      </NuxtLink>
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

function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("nl-BE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
</script>
