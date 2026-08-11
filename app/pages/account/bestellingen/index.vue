<template>
  <AccountShell
    title="Mijn bestellingen"
    subtitle="Bekijk wat u eerder bestelde en start er in één klik een nieuwe bestelling mee."
  >
    <div
      v-if="!data || data.items.length === 0"
      class="flex flex-col items-center gap-4 rounded-xl border border-(--color-border) bg-(--color-surface-2) px-6 py-16 text-center"
    >
      <p class="font-semibold text-(--color-text-strong)">U heeft nog geen bestellingen</p>
      <p class="max-w-md text-sm text-(--color-text-muted)">
        Zodra u een bestelling plaatst, vindt u ze hier terug en kunt u ze
        herhalen zonder alles opnieuw te zoeken.
      </p>
      <NuxtLink
        to="/producten"
        class="mt-2 rounded-lg bg-[#b8252a] px-6 py-3 text-xs font-semibold tracking-widest text-white uppercase transition-colors hover:bg-[#8b1f1f]"
      >
        Naar de producten
      </NuxtLink>
    </div>

    <ul v-else class="space-y-3">
      <li
        v-for="order in data.items"
        :key="order.id"
        class="rounded-xl border border-(--color-border) bg-(--color-surface-2) transition-colors hover:border-[#c89868]/40"
      >
        <NuxtLink
          :to="`/account/bestellingen/${order.id}`"
          class="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4 sm:px-6"
        >
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold text-(--color-text-strong)">
              {{ order.name || formatDate(order.createdAt) }}
            </p>
            <p class="mt-0.5 text-xs text-(--color-text-muted)">
              {{ formatDate(order.createdAt) }} ·
              {{ order.lineCount }} artikel{{ order.lineCount !== 1 ? "en" : "" }}
              · {{ order.totalQuantity }} stuks
            </p>
          </div>
          <AccountOrderStatus :status="order.status" />
          <span
            class="text-xs font-semibold tracking-[0.08em] text-(--color-accent) uppercase"
          >
            Bekijken →
          </span>
        </NuxtLink>
      </li>
    </ul>

    <div
      v-if="data && data.pagination.pageCount > 1"
      class="mt-8 flex items-center justify-center gap-4"
    >
      <button
        type="button"
        :disabled="page <= 1"
        class="rounded-lg border border-(--color-border-strong) px-4 py-2 text-xs font-semibold tracking-[0.08em] text-(--color-text) uppercase transition-colors hover:bg-(--color-hover) disabled:cursor-not-allowed disabled:opacity-40"
        @click="page--"
      >
        Vorige
      </button>
      <span class="text-xs text-(--color-text-muted)">
        Pagina {{ page }} van {{ data.pagination.pageCount }}
      </span>
      <button
        type="button"
        :disabled="page >= data.pagination.pageCount"
        class="rounded-lg border border-(--color-border-strong) px-4 py-2 text-xs font-semibold tracking-[0.08em] text-(--color-text) uppercase transition-colors hover:bg-(--color-hover) disabled:cursor-not-allowed disabled:opacity-40"
        @click="page++"
      >
        Volgende
      </button>
    </div>
  </AccountShell>
</template>

<script setup lang="ts">
definePageMeta({ layout: "main", middleware: "account" });
useHead({ title: "Mijn bestellingen — Vleeswaren Vermeir" });

const page = ref(1);

const { data } = await useFetch("/api/account/orders", {
  query: { page },
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
