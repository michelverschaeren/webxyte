<template>
  <AdminShell title="Nieuw product" subtitle="Voeg een product toe aan de catalogus.">
    <template #actions>
      <NuxtLink to="/admin/producten" class="adm-btn adm-btn--secondary">Annuleren</NuxtLink>
      <button type="submit" form="new-product-form" :disabled="pending" class="adm-btn adm-btn--primary">
        {{ pending ? (pdfFile ? "Opslaan en uploaden…" : "Opslaan…") : "Product aanmaken" }}
      </button>
    </template>

    <p v-if="error" class="adm-notice adm-notice--error" role="alert">{{ error }}</p>

    <form
      id="new-product-form"
      class="grid items-start gap-6 lg:grid-cols-[2fr_1fr]"
      @submit.prevent="save()"
    >
      <section class="adm-card">
        <div class="adm-card-head">
          <h2 class="adm-card-title">Productgegevens</h2>
          <span class="text-[0.8125rem] text-(--color-text-muted)">* verplicht</span>
        </div>
        <div class="adm-card-body grid gap-5 sm:grid-cols-[1fr_2fr]">
          <label class="block">
            <span class="adm-label">Artikelnummer <span aria-hidden="true">*</span></span>
            <input
              v-model="form.articleNr"
              type="text"
              required
              maxlength="32"
              placeholder="bv. 10000"
              class="adm-input font-mono"
            >
          </label>
          <label class="block">
            <span class="adm-label">Naam <span aria-hidden="true">*</span></span>
            <input v-model="form.name" type="text" required maxlength="200" class="adm-input">
          </label>
          <label class="block sm:col-span-2">
            <span class="adm-label">Leverancier <span aria-hidden="true">*</span></span>
            <input
              v-model="form.supplier"
              type="text"
              required
              maxlength="200"
              list="known-suppliers"
              autocomplete="off"
              placeholder="Kies een bestaande of typ een nieuwe"
              class="adm-input"
            >
            <!-- Bestaande namen voorstellen: voorkomt varianten als "Imperial" / "IMPERIAL". -->
            <datalist id="known-suppliers">
              <option v-for="s in suppliers" :key="s.name" :value="s.name" />
            </datalist>
          </label>
          <label class="block sm:col-span-2">
            <span class="adm-label">Categorie <span aria-hidden="true">*</span></span>
            <select v-model="form.categoryId" required class="adm-input">
              <option value="" disabled>Kies een categorie</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.code }} — {{ cat.name }}
              </option>
            </select>
          </label>
          <label class="block">
            <span class="adm-label">Eenheid</span>
            <input
              v-model="form.unit"
              type="text"
              maxlength="64"
              placeholder="bv. KG, ST, 6x80gr."
              class="adm-input"
            >
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
          <label class="block sm:col-span-2">
            <span class="adm-label">Interne notitie</span>
            <textarea
              v-model="form.notes"
              rows="3"
              maxlength="2000"
              placeholder="Niet zichtbaar voor klanten"
              class="adm-input"
            />
          </label>
        </div>
      </section>

      <div class="space-y-6">
        <!-- Zichtbaarheid -->
        <section class="adm-card">
          <div class="adm-card-head">
            <h2 class="adm-card-title">Zichtbaarheid</h2>
          </div>
          <div class="adm-card-body space-y-2">
            <AdminSwitch
              v-model="form.isActive"
              label="Product actief"
              on-text="Actief"
              off-text="Inactief"
            />
            <p class="text-[0.8125rem] text-(--color-text-muted)">
              {{
                form.isActive
                  ? "Het product staat meteen in de catalogus op de website."
                  : "Het product wordt aangemaakt maar blijft verborgen voor klanten."
              }}
            </p>
          </div>
        </section>

        <!-- Productfiche -->
        <section class="adm-card">
          <div class="adm-card-head">
            <h2 class="adm-card-title">Productfiche</h2>
            <span class="text-[0.8125rem] text-(--color-text-muted)">optioneel</span>
          </div>
          <div class="adm-card-body space-y-2">
            <label class="block">
              <span class="adm-label">Pdf (max. {{ MAX_PDF_MB }} MB)</span>
              <input
                ref="fileInput"
                type="file"
                accept="application/pdf"
                class="adm-input adm-file"
                @change="onFileSelected"
              >
            </label>
            <div v-if="pdfFile" class="flex items-center justify-between gap-2 text-[0.8125rem]">
              <span class="min-w-0 truncate text-(--color-text-strong)" :title="pdfFile.name">
                {{ pdfFile.name }}
                <span class="text-(--color-text-muted)">· {{ formatSize(pdfFile.size) }}</span>
              </span>
              <button
                type="button"
                class="shrink-0 font-semibold text-(--color-text-muted) hover:text-(--color-error)"
                @click="clearFile"
              >
                Verwijderen
              </button>
            </div>
            <p v-if="pdfError" class="text-[0.8125rem] text-(--color-error)">{{ pdfError }}</p>
          </div>
          <p class="adm-card-hint">
            Het artikelnummer kan na het aanmaken niet meer gewijzigd worden: het
            staat ook op bestellingen.
          </p>
        </section>
      </div>
    </form>
  </AdminShell>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });
useHead({ title: "Nieuw product — Vleeswaren Vermeir" });

interface CategoryDto {
  id: string;
  code: string;
  name: string;
}

const { data: categoriesData } = await useFetch<CategoryDto[]>("/api/categories");
const categories = computed(() => categoriesData.value ?? []);

const { data: suppliersData } = await useFetch<{ name: string }[]>("/api/admin/suppliers");
const suppliers = computed(() => suppliersData.value ?? []);

const form = reactive({
  articleNr: "",
  name: "",
  supplier: "",
  categoryId: "",
  unit: "",
  price: "",
  notes: "",
  isActive: true,
});

/**
 * Bovengrens van de upload. Op Vercel weigert het platform al alles boven
 * 4,5 MB (zie server/api/admin/products/[id]/pdf.post.ts), dus hier 4 MB:
 * beter meteen een duidelijke melding dan een mislukte upload achteraf.
 */
const MAX_PDF_MB = 4;

const fileInput = ref<HTMLInputElement | null>(null);
const pdfFile = ref<File | null>(null);
const pdfError = ref("");

function onFileSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null;
  pdfError.value = "";
  if (file && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    pdfError.value = "Kies een pdf-bestand.";
    clearFile();
    return;
  }
  if (file && file.size > MAX_PDF_MB * 1024 * 1024) {
    pdfError.value = `Dit bestand is groter dan ${MAX_PDF_MB} MB.`;
    clearFile();
    return;
  }
  pdfFile.value = file;
}

function clearFile() {
  pdfFile.value = null;
  if (fileInput.value) fileInput.value.value = "";
}

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toLocaleString("nl-BE", { maximumFractionDigits: 1 })} MB`
    : `${Math.ceil(bytes / 1024)} kB`;
}

const pending = ref(false);
const error = ref("");

async function save() {
  if (pending.value) return;
  pending.value = true;
  error.value = "";

  let productId: string;
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
        isActive: form.isActive,
      },
    });
    productId = product.id;
  } catch (err) {
    error.value =
      (err as { data?: { statusMessage?: string } })?.data?.statusMessage ||
      "Aanmaken mislukt. Controleer de ingevulde gegevens.";
    pending.value = false;
    return;
  }

  // Het product bestaat nu. Mislukt de pdf, dan toch doorgaan naar de
  // productpagina, met een melding: daar kan de upload opnieuw.
  let pdfFailed = false;
  if (pdfFile.value) {
    const body = new FormData();
    body.append("file", pdfFile.value);
    try {
      await $fetch(`/api/admin/products/${productId}/pdf`, { method: "POST", body });
    } catch {
      pdfFailed = true;
    }
  }

  await navigateTo({
    path: `/admin/producten/${productId}`,
    query: pdfFailed ? { fiche: "mislukt" } : undefined,
  });
  pending.value = false;
}
</script>

<style scoped>
.adm-input {
  width: 100%;
}
</style>
