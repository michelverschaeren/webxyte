<template>
  <AdminShell title="Bestellingen" subtitle="Alle bestellingen van alle klanten.">
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <input
        v-model="search"
        type="search"
        name="bestellingen-zoeken"
        autocomplete="off"
        data-protonpass-ignore="true"
        data-1p-ignore
        data-lpignore="true"
        placeholder="Zoek op klant, e-mail of bedrijf…"
        class="adm-input max-w-sm flex-1"
      >
    </div>

    <p class="mb-3 text-sm text-(--color-text-muted)">
      {{ pagination?.total ?? 0 }} bestellingen
    </p>

    <!-- Kaarten (mobiel) -->
    <ul v-if="items.length > 0" class="space-y-2 sm:hidden">
      <li
        v-for="o in items"
        :key="o.id"
        class="rounded-xl border border-(--color-border) bg-(--color-surface-2) overflow-hidden"
      >
        <NuxtLink
          :to="`/admin/bestellingen/${o.id}`"
          class="flex flex-col gap-2 px-4 py-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-semibold text-(--color-text-strong)">
                {{ o.customerName }}
              </p>
              <p class="truncate text-sm text-(--color-text-muted)">
                {{ o.customerEmail }}
              </p>
            </div>
          </div>
          <div
            class="flex items-center justify-between gap-3 text-sm text-(--color-text-muted)"
          >
            <span>{{ formatDate(o.createdAt) }}</span>
            <span>{{ o.lineCount }} artikel{{ o.lineCount !== 1 ? "en" : "" }} · {{ o.totalQuantity }} st.</span>
          </div>
        </NuxtLink>
      </li>
    </ul>
    <p
      v-else
      class="rounded-xl border border-(--color-border) bg-(--color-surface-2) px-4 py-10 text-center text-base text-(--color-text-muted) sm:hidden"
    >
      Geen bestellingen gevonden.
    </p>

    <!-- Tabel (desktop) -->
    <div class="hidden rounded-xl border border-(--color-border) overflow-hidden sm:block">
      <div class="overflow-x-auto">
      <table class="w-full text-base border-collapse">
        <thead>
          <tr
            class="border-b border-(--color-border) text-[0.8rem] uppercase tracking-widest text-(--color-text-muted)"
          >
            <th class="px-4 py-3 text-left font-semibold">Datum</th>
            <th class="px-4 py-3 text-left font-semibold">Klant</th>
            <th class="hidden px-4 py-3 text-left font-semibold md:table-cell">
              Bedrijf
            </th>
            <th class="hidden px-4 py-3 text-right font-semibold sm:table-cell">
              Artikelen
            </th>
            <th class="px-4 py-3"/>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="o in items"
            :key="o.id"
            class="border-b border-(--color-border) last:border-0 hover:bg-(--color-hover)"
          >
            <td class="px-4 py-2.5 text-(--color-text)">
              {{ formatDate(o.createdAt) }}
            </td>
            <td class="px-4 py-2.5 text-(--color-text-strong)">
              {{ o.customerName }}
              <span class="block text-sm text-(--color-text-muted)">{{
                o.customerEmail
              }}</span>
            </td>
            <td class="hidden px-4 py-2.5 text-(--color-text-muted) md:table-cell">
              {{ o.companyName ?? "—" }}
            </td>
            <td class="hidden px-4 py-2.5 text-right text-(--color-text-muted) sm:table-cell">
              {{ o.lineCount }} · {{ o.totalQuantity }} st.
            </td>
            <td class="px-4 py-2.5 text-right">
              <NuxtLink
                :to="`/admin/bestellingen/${o.id}`"
                class="text-sm font-semibold tracking-[0.08em] text-(--color-accent) uppercase hover:text-[#e8c97a]"
              >
                Bekijken →
              </NuxtLink>
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td colspan="5" class="px-4 py-10 text-center text-(--color-text-muted)">
              Geen bestellingen gevonden.
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
  </AdminShell>
</template>

<script setup lang="ts">
definePageMeta({ layout: "main", middleware: "admin" });
useHead({ title: "Bestellingen — Vleeswaren Vermeir" });

interface OrderDto {
  id: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  companyName: string | null;
  lineCount: number;
  totalQuantity: number;
}

interface OrdersResponse {
  items: OrderDto[];
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

const { data } = await useFetch<OrdersResponse>("/api/admin/orders", {
  query,
});

const items = computed(() => data.value?.items ?? []);
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
</style>
