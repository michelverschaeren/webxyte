<template>
  <AccountShell
    title="Facturatiegegevens"
    subtitle="Deze gegevens gebruiken wij om uw bestellingen te factureren."
  >
    <div
      v-if="route.query.next"
      class="mb-8 max-w-2xl mx-auto rounded-r-xl border-l-2 border-[#c89868] bg-(--color-surface) px-5 py-4"
    >
      <p class="text-base text-(--color-text)">
        Vul eerst uw facturatiegegevens in om uw bestelling te kunnen plaatsen.
      </p>
    </div>

    <form class="max-w-2xl mx-auto space-y-6" @submit.prevent="save()">
      <fieldset class="space-y-5">
        <legend
          class="mb-4 text-[0.8rem] font-semibold tracking-[0.2em] text-(--color-accent) uppercase"
        >
          — Bedrijf —
        </legend>

        <label class="block">
          <span class="acc-label">Bedrijfsnaam <span aria-hidden="true">*</span></span>
          <input
            v-model="form.companyName"
            type="text"
            required
            maxlength="200"
            autocomplete="organization"
            placeholder="bv. Restaurant De Kroon"
            class="acc-input"
          >
        </label>

        <label class="block">
          <span class="acc-label">BTW-nummer</span>
          <input
            v-model="form.vatNumber"
            type="text"
            maxlength="32"
            placeholder="bv. BE0123.456.789 (optioneel)"
            class="acc-input"
          >
        </label>
      </fieldset>

      <fieldset class="space-y-5">
        <legend
          class="mb-4 text-[0.8rem] font-semibold tracking-[0.2em] text-(--color-accent) uppercase"
        >
          — Adres —
        </legend>

        <label class="block">
          <span class="acc-label"
            >Straat en nummer <span aria-hidden="true">*</span></span
          >
          <input
            v-model="form.street"
            type="text"
            required
            maxlength="200"
            autocomplete="street-address"
            placeholder="bv. Schoolstraat 51"
            class="acc-input"
          >
        </label>

        <div class="grid gap-5 sm:grid-cols-[1fr_2fr]">
          <label class="block">
            <span class="acc-label">Postcode <span aria-hidden="true">*</span></span>
            <input
              v-model="form.postalCode"
              type="text"
              required
              maxlength="16"
              autocomplete="postal-code"
              placeholder="1980"
              class="acc-input"
            >
          </label>
          <label class="block">
            <span class="acc-label">Gemeente <span aria-hidden="true">*</span></span>
            <input
              v-model="form.city"
              type="text"
              required
              maxlength="120"
              autocomplete="address-level2"
              placeholder="Zemst"
              class="acc-input"
            >
          </label>
        </div>

        <label class="block">
          <span class="acc-label">Land <span aria-hidden="true">*</span></span>
          <input
            v-model="form.country"
            type="text"
            required
            maxlength="120"
            autocomplete="country-name"
            class="acc-input"
          >
        </label>
      </fieldset>

      <fieldset class="space-y-5">
        <legend
          class="mb-4 text-[0.8rem] font-semibold tracking-[0.2em] text-(--color-accent) uppercase"
        >
          — Contact —
        </legend>

        <div class="grid gap-5 sm:grid-cols-2">
          <label class="block">
            <span class="acc-label">Telefoon <span aria-hidden="true">*</span></span>
            <input
              v-model="form.phone"
              type="tel"
              required
              maxlength="40"
              autocomplete="tel"
              placeholder="015 61 15 39"
              class="acc-input"
            >
          </label>
          <label class="block">
            <span class="acc-label"
              >E-mail voor facturen <span aria-hidden="true">*</span></span
            >
            <input
              v-model="form.invoiceEmail"
              type="email"
              required
              maxlength="200"
              autocomplete="email"
              placeholder="facturen@bedrijf.be"
              class="acc-input"
            >
          </label>
        </div>
      </fieldset>

      <p v-if="error" class="text-base text-[#e06a6a]">{{ error }}</p>
      <p v-if="saved" class="text-base text-[#8fc98f]">
        Uw gegevens zijn opgeslagen.
      </p>

      <div class="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          :disabled="pending"
          class="rounded-lg bg-[#b8252a] px-6 py-3 text-sm font-semibold tracking-widest text-white uppercase transition-colors hover:bg-[#8b1f1f] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{
            pending
              ? "Opslaan…"
              : resumesOrder
                ? "Opslaan en verder met bestelling"
                : "Gegevens opslaan"
          }}
        </button>
        <NuxtLink
          to="/account"
          class="px-4 py-3 text-sm font-semibold tracking-widest text-(--color-text-muted) uppercase transition-colors hover:text-(--color-text-strong)"
        >
          Terug naar overzicht
        </NuxtLink>
      </div>
    </form>
  </AccountShell>
</template>

<script setup lang="ts">
definePageMeta({ layout: "main", middleware: "account" });
useHead({ title: "Facturatiegegevens — Vleeswaren Vermeir" });

const route = useRoute();
const checkout = useCartCheckout();
const resumesOrder = computed(() => route.query.next === "cart");

const { data: existing, refresh } = await useFetch("/api/account/billing");

const form = reactive({
  companyName: "",
  vatNumber: "",
  street: "",
  postalCode: "",
  city: "",
  country: "België",
  phone: "",
  invoiceEmail: "",
});

watchEffect(() => {
  if (!existing.value) return;
  form.companyName = existing.value.companyName;
  form.vatNumber = existing.value.vatNumber ?? "";
  form.street = existing.value.street;
  form.postalCode = existing.value.postalCode;
  form.city = existing.value.city;
  form.country = existing.value.country;
  form.phone = existing.value.phone;
  form.invoiceEmail = existing.value.invoiceEmail;
});

const pending = ref(false);
const error = ref("");
const saved = ref(false);

async function save() {
  if (pending.value) return;
  pending.value = true;
  error.value = "";
  saved.value = false;

  try {
    await $fetch("/api/account/billing", { method: "PUT", body: { ...form } });
    await refresh();
    saved.value = true;

    // Kwam de klant hier via een geblokkeerde bestelling? Dan meteen terug
    // naar het mandje, met het bestelvenster weer open, zodat hij kan afronden.
    if (resumesOrder.value) {
      await checkout.resumeOrder();
      await navigateTo("/producten");
    }
  } catch (err) {
    error.value =
      (err as { statusMessage?: string })?.statusMessage ||
      "Opslaan mislukt. Controleer de ingevulde gegevens.";
  } finally {
    pending.value = false;
  }
}
</script>

<style scoped>
.acc-label {
  display: block;
  margin-bottom: 0.4rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
}
.acc-input {
  width: 100%;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.5rem;
  background: var(--color-surface-2);
  padding: 0.7rem 0.85rem;
  font-size: 0.9rem;
  color: var(--color-text-strong);
}
.acc-input::placeholder {
  color: var(--color-text-muted);
  opacity: 0.6;
}
.acc-input:focus {
  outline: none;
  border-color: #c89868;
}
</style>
