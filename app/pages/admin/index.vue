<template>
  <AdminShell
    title="Beheer"
    subtitle="Overzicht van de productcatalogus, verkoop en klanten."
  >
    <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <NuxtLink to="/admin/producten" class="adm-card">
        <span class="adm-card-value">{{ stats?.totalProducts ?? "—" }}</span>
        <span class="adm-card-title">Producten</span>
        <span class="adm-card-hint"
          >{{ stats?.activeProducts ?? 0 }} actief</span
        >
      </NuxtLink>

      <NuxtLink to="/admin/klanten" class="adm-card">
        <span class="adm-card-value">{{ stats?.customerCount ?? "—" }}</span>
        <span class="adm-card-title">Klanten</span>
        <span class="adm-card-hint">Geregistreerde klantaccounts</span>
      </NuxtLink>

      <div class="adm-card">
        <span class="adm-card-value">{{ stats?.soldQuantity ?? "—" }}</span>
        <span class="adm-card-title">Stuks verkocht</span>
        <span class="adm-card-hint">Totaal, geannuleerd niet meegeteld</span>
      </div>

      <NuxtLink to="/admin/producten/nieuw" class="adm-card adm-card--action">
        <span class="adm-card-value">+</span>
        <span class="adm-card-title">Nieuw product</span>
        <span class="adm-card-hint">Toevoegen aan de catalogus</span>
      </NuxtLink>
    </div>

    <section v-if="stats && stats.topProducts.length > 0" class="mt-12">
      <h2
        class="mb-4 text-[0.7rem] font-semibold tracking-[0.2em] text-[#c89868] uppercase"
      >
        — Meest verkocht —
      </h2>

      <div class="overflow-x-auto border border-(--color-border)">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr
              class="border-b border-(--color-border) text-[0.7rem] uppercase tracking-[0.1em] text-(--color-text-muted)"
            >
              <th class="px-4 py-3 text-left font-semibold">Artikelnr</th>
              <th class="px-4 py-3 text-left font-semibold">Product</th>
              <th class="px-4 py-3 text-right font-semibold">Aantal verkocht</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in stats.topProducts"
              :key="p.articleNr"
              class="border-b border-(--color-border) last:border-0 hover:bg-(--color-hover)"
            >
              <td class="px-4 py-2.5 text-[#c89868]">{{ p.articleNr }}</td>
              <td class="px-4 py-2.5 text-(--color-text-strong)">{{ p.name }}</td>
              <td class="px-4 py-2.5 text-right font-semibold text-(--color-text-strong)">
                {{ p.totalQuantity }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </AdminShell>
</template>

<script setup lang="ts">
definePageMeta({ layout: "main", middleware: "admin" });
useHead({ title: "Beheer — Vleeswaren Vermeir" });

interface Stats {
  totalProducts: number;
  activeProducts: number;
  customerCount: number;
  soldQuantity: number;
  topProducts: { articleNr: string; name: string; totalQuantity: number }[];
}

const { data: stats } = await useFetch<Stats>("/api/admin/stats");
</script>

<style scoped>
.adm-card {
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
}
a.adm-card:hover {
  border-color: rgba(200, 152, 104, 0.5);
  transform: translateY(-2px);
}
.adm-card--action {
  border-style: dashed;
  color: #c89868;
}
.adm-card-value {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 2rem;
  font-weight: 900;
  line-height: 1;
  color: var(--color-text-strong);
}
.adm-card--action .adm-card-value {
  color: #c89868;
}
.adm-card-title {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #c89868;
}
.adm-card-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
</style>
