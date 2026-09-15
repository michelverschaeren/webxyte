<template>
  <AdminShell title="Klanten" subtitle="Klanten uit het CRM, met hun aankoophistoriek.">
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <input
        v-model="search"
        type="text"
        placeholder="Zoek op klantnr, naam of e-mail…"
        class="adm-input max-w-sm flex-1"
      >
    </div>

    <p class="mb-3 text-xs text-(--color-text-muted)">
      {{ pagination?.total ?? 0 }} klanten
    </p>

    <!-- Kaarten (mobiel) -->
    <ul v-if="items.length > 0" class="space-y-2 sm:hidden">
      <li
        v-for="c in items"
        :key="c.id"
        class="rounded-xl border border-(--color-border) bg-(--color-surface-2) overflow-hidden"
      >
        <NuxtLink
          :to="`/admin/klanten/${c.id}`"
          class="flex flex-col gap-2 px-4 py-3"
        >
          <div class="min-w-0">
            <p class="text-xs text-(--color-text-muted)">{{ c.customerNr }}</p>
            <p class="font-semibold text-(--color-text-strong)">{{ c.name }}</p>
            <p v-if="c.contactEmail" class="truncate text-xs text-(--color-text-muted)">
              {{ c.contactEmail }}
            </p>
          </div>
          <div class="flex items-center justify-between gap-3 text-xs text-(--color-text-muted)">
            <span>{{ c.productCount }} product{{ c.productCount !== 1 ? "en" : "" }}</span>
            <span>{{ c.accountEmail ? "Account gekoppeld" : "Geen account" }}</span>
          </div>
        </NuxtLink>
      </li>
    </ul>
    <p
      v-else
      class="rounded-xl border border-(--color-border) bg-(--color-surface-2) px-4 py-10 text-center text-sm text-(--color-text-muted) sm:hidden"
    >
      Geen klanten gevonden.
    </p>

    <!-- Tabel (desktop) -->
    <div class="hidden rounded-xl border border-(--color-border) overflow-hidden sm:block">
      <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr
            class="border-b border-(--color-border) text-[0.7rem] uppercase tracking-widest text-(--color-text-muted)"
          >
            <th class="px-4 py-3 text-left font-semibold">Klantnr.</th>
            <th class="px-4 py-3 text-left font-semibold">Naam</th>
            <th class="hidden px-4 py-3 text-left font-semibold md:table-cell">
              Contact
            </th>
            <th class="hidden px-4 py-3 text-left font-semibold lg:table-cell">
              Account
            </th>
            <th class="px-4 py-3 text-right font-semibold">Producten</th>
            <th class="hidden px-4 py-3 text-left font-semibold lg:table-cell">
              Laatste aankoop
            </th>
            <th class="px-4 py-3"/>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="c in items"
            :key="c.id"
            class="border-b border-(--color-border) last:border-0 hover:bg-(--color-hover)"
          >
            <td class="px-4 py-2.5 font-mono text-xs text-(--color-text-muted)">{{ c.customerNr }}</td>
            <td class="px-4 py-2.5 text-(--color-text-strong)">{{ c.name }}</td>
            <td class="hidden px-4 py-2.5 text-(--color-text-muted) md:table-cell">
              {{ c.contactEmail ?? "—" }}
            </td>
            <td class="hidden px-4 py-2.5 text-(--color-text-muted) lg:table-cell">
              {{ c.accountEmail ?? "—" }}
            </td>
            <td class="px-4 py-2.5 text-right text-(--color-text-strong)">
              {{ c.productCount }}
            </td>
            <td class="hidden px-4 py-2.5 text-(--color-text-muted) lg:table-cell">
              {{ c.lastPurchasedAt ? formatDate(c.lastPurchasedAt) : "—" }}
            </td>
            <td class="px-4 py-2.5 text-right">
              <NuxtLink
                :to="`/admin/klanten/${c.id}`"
                class="text-xs font-semibold tracking-[0.08em] text-(--color-accent) uppercase hover:text-[#e8c97a]"
              >
                Bekijken →
              </NuxtLink>
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td colspan="7" class="px-4 py-10 text-center text-(--color-text-muted)">
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
        class="rounded-lg border border-(--color-border-strong) px-4 py-2 text-xs font-semibold tracking-[0.08em] text-(--color-text) uppercase transition-colors hover:bg-(--color-hover) disabled:cursor-not-allowed disabled:opacity-40"
        @click="page--"
      >
        Vorige
      </button>
      <span class="text-xs text-(--color-text-muted)">
        Pagina {{ page }} van {{ pagination.pageCount }}
      </span>
      <button
        type="button"
        :disabled="page >= pagination.pageCount"
        class="rounded-lg border border-(--color-border-strong) px-4 py-2 text-xs font-semibold tracking-[0.08em] text-(--color-text) uppercase transition-colors hover:bg-(--color-hover) disabled:cursor-not-allowed disabled:opacity-40"
        @click="page++"
      >
        Volgende
      </button>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
definePageMeta({ layout: "main", middleware: "admin" });
useHead({ title: "Klanten — Vleeswaren Vermeir" });

interface CustomerDto {
  id: string;
  customerNr: string;
  name: string;
  contactEmail: string | null;
  phone: string | null;
  accountEmail: string | null;
  productCount: number;
  lastPurchasedAt: string | null;
}

interface CustomersResponse {
  items: CustomerDto[];
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

const { data } = await useFetch<CustomersResponse>("/api/admin/customers", {
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
