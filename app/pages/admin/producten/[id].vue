<template>
  <AdminShell
    :title="product ? product.name : 'Product bewerken'"
    :subtitle="product ? `Artikelnr ${product.articleNr} · ${product.supplier}` : undefined"
  >
    <template #actions>
      <button type="button" class="adm-btn adm-btn--secondary" @click="goBack()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Terug
      </button>
      <button
        type="submit"
        form="product-form"
        :disabled="pending || !product"
        class="adm-btn adm-btn--primary"
      >
        {{ pending ? "Opslaan…" : "Wijzigingen opslaan" }}
      </button>
    </template>

    <template v-if="product">
      <div class="adm-stats">
        <div class="adm-stat">
          <p class="adm-stat-label">Status</p>
          <p class="mt-1.5">
            <span class="adm-badge" :class="product.isActive ? 'adm-badge--success' : 'adm-badge--neutral'">
              {{ product.isActive ? "Actief" : "Inactief" }}
            </span>
          </p>
        </div>
        <div class="adm-stat">
          <p class="adm-stat-label">Prijs</p>
          <p class="adm-stat-value">
            {{ product.price != null ? `€ ${product.price.toFixed(2)}` : "—" }}
          </p>
          <p v-if="product.unit" class="adm-stat-sub">{{ product.unit }}</p>
        </div>
        <div class="adm-stat">
          <p class="adm-stat-label">Ooit verkocht</p>
          <p class="adm-stat-value">{{ product.soldQuantity }}</p>
          <p class="adm-stat-sub">stuks via de webshop</p>
        </div>
        <div class="adm-stat">
          <p class="adm-stat-label">Categorie</p>
          <p class="adm-stat-value truncate text-base!">{{ categoryName }}</p>
        </div>
      </div>

      <p v-if="saved" class="adm-notice adm-notice--success" role="status">Wijzigingen opgeslagen.</p>
      <p v-if="error" class="adm-notice adm-notice--error" role="alert">{{ error }}</p>

      <form
        id="product-form"
        class="grid items-start gap-6 lg:grid-cols-[2fr_1fr]"
        @submit.prevent="save()"
      >
        <!-- Gegevens -->
        <section class="adm-card">
          <div class="adm-card-head">
            <h2 class="adm-card-title">Productgegevens</h2>
          </div>
          <div class="adm-card-body grid gap-5 sm:grid-cols-2">
            <label class="block sm:col-span-2">
              <span class="adm-label">Naam <span aria-hidden="true">*</span></span>
              <input v-model="form.name" type="text" required maxlength="200" class="adm-input">
            </label>
            <label class="block">
              <span class="adm-label">Leverancier <span aria-hidden="true">*</span></span>
              <input v-model="form.supplier" type="text" required maxlength="200" class="adm-input">
            </label>
            <label class="block">
              <span class="adm-label">Categorie <span aria-hidden="true">*</span></span>
              <select v-model="form.categoryId" required class="adm-input">
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.code }} — {{ cat.name }}
                </option>
              </select>
            </label>
            <label class="block">
              <span class="adm-label">Eenheid</span>
              <input v-model="form.unit" type="text" maxlength="64" placeholder="bv. 15x140gr." class="adm-input">
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
                    ? "Zichtbaar in de catalogus op de website."
                    : "Uit het assortiment gehaald: verborgen voor klanten, maar niet verwijderd."
                }}
              </p>
              <p
                v-if="form.isActive !== product.isActive"
                class="text-[0.8125rem] font-semibold text-(--color-warning)"
              >
                Nog niet opgeslagen — klik “Wijzigingen opslaan”.
              </p>
            </div>
          </section>

          <!-- Productfiche (pdf) -->
          <section class="adm-card">
            <div class="adm-card-head">
              <h2 class="adm-card-title">Productfiche</h2>
              <span v-if="product.infoPdf" class="adm-badge adm-badge--success">Gekoppeld</span>
            </div>
            <div class="adm-card-body space-y-3">
              <div v-if="product.infoPdf" class="flex flex-wrap items-center gap-2">
                <a :href="product.infoPdf" target="_blank" class="adm-btn adm-btn--secondary adm-btn--sm">
                  Pdf openen
                </a>
                <button
                  type="button"
                  :disabled="pdfPending"
                  class="adm-btn adm-btn--danger adm-btn--sm"
                  @click="removePdf()"
                >
                  Verwijderen
                </button>
              </div>
              <p v-else class="text-sm text-(--color-text-muted)">Nog geen productfiche gekoppeld.</p>

              <label class="block">
                <span class="adm-label">{{ product.infoPdf ? "Vervangen door" : "Pdf uploaden" }}</span>
                <input
                  ref="fileInput"
                  type="file"
                  accept="application/pdf"
                  class="adm-input adm-file"
                  @change="onFileSelected"
                >
              </label>
              <p v-if="pdfError" class="text-sm text-(--color-error)">{{ pdfError }}</p>
              <p v-if="pdfPending" class="text-sm text-(--color-text-muted)">Bezig met uploaden…</p>
            </div>
          </section>
        </div>
      </form>
    </template>
  </AdminShell>
</template>

<script setup lang="ts">
const route = useRoute();
definePageMeta({ layout: "admin", middleware: "admin" });
useHead({ title: "Product bewerken — Vleeswaren Vermeir" });

interface CategoryDto {
  id: string;
  code: string;
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

const categoryName = computed(
  () => categories.value.find((c) => c.id === product.value?.categoryId)?.name ?? "—",
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

const router = useRouter();

/** Vorige pagina; bij een rechtstreeks geopende link is er geen, dan het overzicht. */
function goBack() {
  if (window.history.state?.back) router.back();
  else navigateTo("/admin/producten");
}

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
// Vanuit "Nieuw product": het product is aangemaakt, maar de pdf niet.
const pdfError = ref(
  route.query.fiche === "mislukt"
    ? "Het product is aangemaakt, maar de productfiche kon niet geüpload worden. Probeer het hier opnieuw."
    : "",
);

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
.adm-input {
  width: 100%;
}
</style>
