<template>
  <AdminShell
    :title="product ? product.name : 'Product bewerken'"
    :subtitle="product ? `Artikelnr ${product.articleNr} · ${product.soldQuantity} stuks ooit verkocht` : undefined"
  >
    <form v-if="form" class="max-w-2xl space-y-6" @submit.prevent="save()">
      <label class="block">
        <span class="adm-label">Naam <span aria-hidden="true">*</span></span>
        <input
          v-model="form.name"
          type="text"
          required
          maxlength="200"
          class="adm-input"
        >
      </label>

      <label class="block">
        <span class="adm-label">Leverancier <span aria-hidden="true">*</span></span>
        <input
          v-model="form.supplier"
          type="text"
          required
          maxlength="200"
          class="adm-input"
        >
      </label>

      <label class="block">
        <span class="adm-label">Categorie <span aria-hidden="true">*</span></span>
        <select v-model="form.categoryId" required class="adm-input">
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>
      </label>

      <div class="grid gap-5 sm:grid-cols-2">
        <label class="block">
          <span class="adm-label">Eenheid</span>
          <input v-model="form.unit" type="text" maxlength="64" class="adm-input" >
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
          >
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

      <label class="flex items-center gap-3">
        <input v-model="form.isActive" type="checkbox" class="h-4 w-4" >
        <span class="text-base text-(--color-text)"
          >Actief (zichtbaar op de site)</span
        >
      </label>

      <!-- Productfiche (pdf) -->
      <fieldset class="space-y-3 border-t border-(--color-border) pt-6">
        <legend
          class="mb-2 text-[0.8rem] font-semibold tracking-[0.2em] text-(--color-accent) uppercase"
        >
          — Productfiche (pdf) —
        </legend>

        <div v-if="product?.infoPdf" class="flex flex-wrap items-center gap-3">
          <a
            :href="product.infoPdf"
            target="_blank"
            class="text-base text-(--color-accent) underline hover:text-[#e8c97a]"
          >
            Huidige pdf openen →
          </a>
          <button
            type="button"
            :disabled="pdfPending"
            class="text-sm font-semibold tracking-[0.08em] text-(--color-text-muted) uppercase hover:text-[#b8252a]"
            @click="removePdf()"
          >
            Verwijderen
          </button>
        </div>
        <p v-else class="text-base text-(--color-text-muted)">
          Nog geen productfiche gekoppeld.
        </p>

        <input
          ref="fileInput"
          type="file"
          accept="application/pdf"
          class="adm-input"
          @change="onFileSelected"
        >
        <p v-if="pdfError" class="text-base text-[#e06a6a]">{{ pdfError }}</p>
        <p v-if="pdfPending" class="text-base text-(--color-text-muted)">
          Bezig met uploaden…
        </p>
      </fieldset>

      <p v-if="error" class="text-base text-[#e06a6a]">{{ error }}</p>
      <p v-if="saved" class="text-base text-[#8fc98f]">Wijzigingen opgeslagen.</p>

      <div class="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          :disabled="pending"
          class="rounded-lg bg-[#b8252a] px-6 py-3 text-sm font-semibold tracking-widest text-white uppercase transition-colors hover:bg-[#8b1f1f] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ pending ? "Opslaan…" : "Wijzigingen opslaan" }}
        </button>
        <NuxtLink
          to="/admin/producten"
          class="px-4 py-3 text-sm font-semibold tracking-widest text-(--color-text-muted) uppercase transition-colors hover:text-(--color-text-strong)"
        >
          Terug naar overzicht
        </NuxtLink>
      </div>
    </form>
  </AdminShell>
</template>

<script setup lang="ts">
const route = useRoute();
definePageMeta({ layout: "main", middleware: "admin" });
useHead({ title: "Product bewerken — Vleeswaren Vermeir" });

interface CategoryDto {
  id: string;
  name: string;
}

interface AdminProductDetail {
  id: string;
  articleNr: string;
  name: string;
  supplier: string;
  categoryId: string;
  unit: string | null;
  infoPdf: string | null;
  price: number | null;
  notes: string | null;
  isActive: boolean;
  soldQuantity: number;
}

const { data: categoriesData } = await useFetch<CategoryDto[]>("/api/categories");
const categories = computed(() => categoriesData.value ?? []);

const { data: product, refresh } = await useFetch<AdminProductDetail>(
  `/api/admin/products/${route.params.id}`,
);

const form = reactive({
  name: "",
  supplier: "",
  categoryId: "",
  unit: "",
  price: "",
  notes: "",
  isActive: true,
});

watchEffect(() => {
  if (!product.value) return;
  form.name = product.value.name;
  form.supplier = product.value.supplier;
  form.categoryId = product.value.categoryId;
  form.unit = product.value.unit ?? "";
  form.price = product.value.price != null ? String(product.value.price) : "";
  form.notes = product.value.notes ?? "";
  form.isActive = product.value.isActive;
});

const pending = ref(false);
const error = ref("");
const saved = ref(false);

async function save() {
  if (pending.value || !product.value) return;
  pending.value = true;
  error.value = "";
  saved.value = false;

  try {
    await $fetch(`/api/admin/products/${product.value.id}`, {
      method: "PATCH",
      body: {
        name: form.name.trim(),
        supplier: form.supplier.trim(),
        categoryId: form.categoryId,
        unit: form.unit.trim() || null,
        price: form.price ? Number(form.price) : null,
        notes: form.notes.trim() || null,
        isActive: form.isActive,
      },
    });
    await refresh();
    saved.value = true;
  } catch (err) {
    error.value =
      (err as { data?: { statusMessage?: string } })?.data?.statusMessage ||
      "Opslaan mislukt. Controleer de ingevulde gegevens.";
  } finally {
    pending.value = false;
  }
}

const fileInput = ref<HTMLInputElement | null>(null);
const pdfPending = ref(false);
const pdfError = ref("");

async function onFileSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file || !product.value) return;

  pdfPending.value = true;
  pdfError.value = "";

  const body = new FormData();
  body.append("file", file);

  try {
    await $fetch(`/api/admin/products/${product.value.id}/pdf`, {
      method: "POST",
      body,
    });
    await refresh();
  } catch (err) {
    pdfError.value =
      (err as { data?: { statusMessage?: string } })?.data?.statusMessage ||
      "Uploaden mislukt.";
  } finally {
    pdfPending.value = false;
    if (fileInput.value) fileInput.value.value = "";
  }
}

async function removePdf() {
  if (!product.value) return;
  pdfPending.value = true;
  pdfError.value = "";

  try {
    await $fetch(`/api/admin/products/${product.value.id}/pdf`, {
      method: "DELETE",
    });
    await refresh();
  } catch {
    pdfError.value = "Verwijderen mislukt.";
  } finally {
    pdfPending.value = false;
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
  border-radius: 0.5rem;
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
