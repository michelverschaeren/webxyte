<template>
  <AdminShell title="Klanten" subtitle="Alle geregistreerde klantaccounts.">
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <input
        v-model="search"
        type="text"
        placeholder="Zoek op naam, e-mail of bedrijf…"
        class="adm-input max-w-sm flex-1"
      />
    </div>

    <p class="mb-3 text-xs text-(--color-text-muted)">
      {{ pagination?.total ?? 0 }} klanten
    </p>

    <!-- Kaarten (mobiel) -->
    <ul v-if="items.length > 0" class="space-y-2 sm:hidden">
      <li
        v-for="c in items"
        :key="c.id"
        class="border border-(--color-border) bg-(--color-surface-2)"
      >
        <NuxtLink
          :to="`/admin/klanten/${c.id}`"
          class="flex flex-col gap-2 px-4 py-3"
        >
          <div class="min-w-0">
            <p class="font-semibold text-(--color-text-strong)">{{ c.name }}</p>
            <p class="truncate text-xs text-(--color-text-muted)">{{ c.email }}</p>
            <p v-if="c.companyName" class="truncate text-xs text-(--color-text-muted)">
              {{ c.companyName }}
            </p>
          </div>
          <div class="flex items-center justify-between gap-3 text-xs text-(--color-text-muted)">
            <span>{{ c.orderCount }} bestelling{{ c.orderCount !== 1 ? "en" : "" }}</span>
            <span>{{ c.lastOrderAt ? formatDate(c.lastOrderAt) : "Nog geen bestelling" }}</span>
          </div>
        </NuxtLink>
      </li>
    </ul>
    <p
      v-else
      class="border border-(--color-border) bg-(--color-surface-2) px-4 py-10 text-center text-sm text-(--color-text-muted) sm:hidden"
    >
      Geen klanten gevonden.
    </p>

    <!-- Tabel (desktop) -->
    <div class="hidden overflow-x-auto border border-(--color-border) sm:block">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr
            class="border-b border-(--color-border) text-[0.7rem] uppercase tracking-[0.1em] text-(--color-text-muted)"
          >
            <th class="px-4 py-3 text-left font-semibold">Naam</th>
            <th class="hidden px-4 py-3 text-left font-semibold sm:table-cell">
              E-mail
            </th>
            <th class="hidden px-4 py-3 text-left font-semibold md:table-cell">
              Bedrijf
            </th>
            <th class="px-4 py-3 text-right font-semibold">Bestellingen</th>
            <th class="hidden px-4 py-3 text-right font-semibold lg:table-cell">
              Stuks besteld
            </th>
            <th class="hidden px-4 py-3 text-left font-semibold lg:table-cell">
              Laatste bestelling
            </th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="c in items"
            :key="c.id"
            class="border-b border-(--color-border) last:border-0 hover:bg-(--color-hover)"
          >
            <td class="px-4 py-2.5 text-(--color-text-strong)">{{ c.name }}</td>
            <td class="hidden px-4 py-2.5 text-(--color-text-muted) sm:table-cell">
              {{ c.email }}
            </td>
            <td class="hidden px-4 py-2.5 text-(--color-text-muted) md:table-cell">
              {{ c.companyName ?? "—" }}
            </td>
            <td class="px-4 py-2.5 text-right text-(--color-text-strong)">
              {{ c.orderCount }}
            </td>
            <td class="hidden px-4 py-2.5 text-right text-(--color-text-muted) lg:table-cell">
              {{ c.totalQuantity }}
            </td>
            <td class="hidden px-4 py-2.5 text-(--color-text-muted) lg:table-cell">
              {{ c.lastOrderAt ? formatDate(c.lastOrderAt) : "—" }}
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

    <div
      v-if="pagination && pagination.pageCount > 1"
      class="mt-8 flex items-center justify-center gap-4"
    >
      <button
        type="button"
        :disabled="page <= 1"
        class="border border-(--color-border-strong) px-4 py-2 text-xs font-semibold tracking-[0.08em] text-(--color-text) uppercase transition-colors hover:bg-(--color-hover) disabled:cursor-not-allowed disabled:opacity-40"
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
        class="border border-(--color-border-strong) px-4 py-2 text-xs font-semibold tracking-[0.08em] text-(--color-text) uppercase transition-colors hover:bg-(--color-hover) disabled:cursor-not-allowed disabled:opacity-40"
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
  name: string;
  email: string;
  companyName: string | null;
  orderCount: number;
  totalQuantity: number;
  lastOrderAt: string | null;
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
