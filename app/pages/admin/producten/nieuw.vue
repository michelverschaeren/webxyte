<template>
  <AdminShell title="Nieuw product" subtitle="Voeg een product toe aan de catalogus.">
    <form class="max-w-2xl space-y-6" @submit.prevent="save()">
      <label class="block">
        <span class="adm-label">Artikelnummer <span aria-hidden="true">*</span></span>
        <input
          v-model="form.articleNr"
          type="text"
          required
          maxlength="32"
          placeholder="bv. 10000"
          class="adm-input"
        />
      </label>

      <label class="block">
        <span class="adm-label">Naam <span aria-hidden="true">*</span></span>
        <input
          v-model="form.name"
          type="text"
          required
          maxlength="200"
          class="adm-input"
        />
      </label>

      <label class="block">
        <span class="adm-label">Leverancier <span aria-hidden="true">*</span></span>
        <input
          v-model="form.supplier"
          type="text"
          required
          maxlength="200"
          class="adm-input"
        />
      </label>

      <label class="block">
        <span class="adm-label">Categorie <span aria-hidden="true">*</span></span>
        <select v-model="form.categoryId" required class="adm-input">
          <option value="" disabled>Kies een categorie</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>
      </label>

      <div class="grid gap-5 sm:grid-cols-2">
        <label class="block">
          <span class="adm-label">Eenheid</span>
          <input
            v-model="form.unit"
            type="text"
            maxlength="64"
            placeholder="bv. KG, ST, 6x80gr."
            class="adm-input"
          />
        </label>
        <label class="block">
          <span class="adm-label">Prijs (€)</span>
          <input
            v-model="form.price"
            type="number"
            min="0"
            step="0.01"
            placeholder="optioneel"
            class="adm-input"
          />
        </label>
      </div>

      <label class="block">
        <span class="adm-label">Notitie</span>
        <textarea
          v-model="form.notes"
          rows="3"
          maxlength="2000"
          placeholder="Interne notitie, niet zichtbaar voor klanten"
          class="adm-input"
        />
      </label>

      <p v-if="error" class="text-sm text-[#e06a6a]">{{ error }}</p>

      <div class="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          :disabled="pending"
          class="bg-[#b8252a] px-6 py-3 text-sm font-semibold tracking-widest text-white uppercase transition-colors hover:bg-[#8b1f1f] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ pending ? "Opslaan…" : "Product aanmaken" }}
        </button>
        <NuxtLink
          to="/admin/producten"
          class="px-4 py-3 text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase transition-colors hover:text-(--color-text-strong)"
        >
          Annuleren
        </NuxtLink>
      </div>
    </form>
  </AdminShell>
</template>

<script setup lang="ts">
definePageMeta({ layout: "main", middleware: "admin" });
useHead({ title: "Nieuw product — Vleeswaren Vermeir" });

interface CategoryDto {
  id: string;
  name: string;
}

const { data: categoriesData } = await useFetch<CategoryDto[]>("/api/categories");
const categories = computed(() => categoriesData.value ?? []);

const form = reactive({
  articleNr: "",
  name: "",
  supplier: "",
  categoryId: "",
  unit: "",
  price: "",
  notes: "",
});

const pending = ref(false);
const error = ref("");

async function save() {
  if (pending.value) return;
  pending.value = true;
  error.value = "";

  try {
    const product = await $fetch<{ id: string }>("/api/products", {
      method: "POST",
      body: {
        articleNr: form.articleNr.trim(),
        name: form.name.trim(),
        supplier: form.supplier.trim(),
        categoryId: form.categoryId,
        unit: form.unit.trim() || undefined,
        price: form.price ? Number(form.price) : undefined,
        notes: form.notes.trim() || undefined,
      },
    });
    await navigateTo(`/admin/producten/${product.id}`);
  } catch (err) {
    error.value =
      (err as { data?: { statusMessage?: string } })?.data?.statusMessage ||
      "Aanmaken mislukt. Controleer de ingevulde gegevens.";
  } finally {
    pending.value = false;
  }
}
</script>

<style scoped>
.adm-label {
  display: block;
  margin-bottom: 0.4rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
}
.adm-input {
  width: 100%;
  border: 1px solid var(--color-border-strong);
  background: var(--color-surface-2);
  padding: 0.7rem 0.85rem;
  font-size: 0.9rem;
  color: var(--color-text-strong);
}
.adm-input::placeholder {
  color: var(--color-text-muted);
  opacity: 0.6;
}
.adm-input:focus {
  outline: none;
  border-color: #c89868;
}
</style>
