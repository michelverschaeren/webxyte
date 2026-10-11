<template>
  <AccountShell
    title="Gegevens"
    subtitle="Deze gegevens vermelden wij op uw bestellingen."
  >
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
      </fieldset>

      <fieldset class="space-y-5">
        <legend
          class="mb-4 text-[0.8rem] font-semibold tracking-[0.2em] text-(--color-accent) uppercase"
        >
          — Contact —
        </legend>

        <div class="grid gap-5 sm:grid-cols-2">
          <!-- Het nummer hoort bij de klant; een login zonder klant
               (beheerder) heeft er geen. -->
          <label v-if="contact?.isCustomer" class="block">
            <span class="acc-label">Telefoon</span>
            <input
              v-model="form.phone"
              type="tel"
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

      <!-- Net als het telefoonnummer: hoort bij de klant, dus niet voor een
           login zonder klant (beheerder). Elk adres wordt meteen opgeslagen,
           los van de knop onderaan. -->
      <fieldset v-if="contact?.isCustomer" class="space-y-5">
        <legend
          class="mb-4 text-[0.8rem] font-semibold tracking-[0.2em] text-(--color-accent) uppercase"
        >
          — Leveringsadres —
        </legend>
        <DeliveryAddresses
          endpoint="/api/account/addresses"
          :addresses="contact.addresses"
          @changed="refreshContact()"
        />
      </fieldset>

      <p
        class="rounded-r-xl border-l-2 border-[#c89868] bg-(--color-surface-2) px-5 py-4 text-base leading-relaxed text-(--color-text-muted)"
      >
        Wijzigingen aan uw facturatieadres of btw-nummer kunt u
        steeds doorgeven via
        <a
          href="mailto:vleeswarenvermeir@telenet.be"
          class="text-(--color-accent) hover:underline"
          >vleeswarenvermeir@telenet.be</a
        >.
      </p>

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
          {{ pending ? "Opslaan…" : "Gegevens opslaan" }}
        </button>
        <NuxtLink
          to="/account"
          class="px-4 py-3 text-sm font-semibold tracking-widest text-(--color-text-muted) uppercase transition-colors hover:text-(--color-text-strong)"
        >
          Terug naar overzicht
        </NuxtLink>
      </div>
    </form>

    <section class="max-w-2xl mx-auto mt-12 space-y-4 border-t border-(--color-border) pt-8">
      <h2
        class="text-[0.8rem] font-semibold tracking-[0.2em] text-(--color-accent) uppercase"
      >
        — Wachtwoord —
      </h2>
      <p class="text-base leading-relaxed text-(--color-text-muted)">
        Wij mailen een link naar
        <strong class="text-(--color-text-strong)">{{ auth.user.value?.email }}</strong
        >. Via die link kiest u een nieuw wachtwoord; de link is 15 minuten
        geldig.
      </p>

      <p v-if="passwordError" class="text-base text-[#e06a6a]">{{ passwordError }}</p>
      <p v-if="passwordSent" class="text-base text-[#8fc98f]">
        De mail is onderweg. Check uw mailbox.
      </p>

      <button
        type="button"
        :disabled="passwordPending || passwordSent"
        class="rounded-lg border border-(--color-border-strong) px-6 py-3 text-sm font-semibold tracking-widest text-(--color-text-strong) uppercase transition-colors hover:border-[#c89868] disabled:cursor-not-allowed disabled:opacity-50"
        @click="requestPasswordLink()"
      >
        {{ passwordPending ? "Even geduld…" : "Wachtwoord wijzigen" }}
      </button>
    </section>
  </AccountShell>
</template>

<script setup lang="ts">
import { PHONE_ERROR, isValidPhone } from "#shared/phone";

definePageMeta({ layout: "main", middleware: "account" });
useHead({ title: "Gegevens — Vleeswaren Vermeir" });

const [{ data: existing, refresh }, { data: contact, refresh: refreshContact }] =
  await Promise.all([
    useFetch("/api/account/billing"),
    useFetch("/api/account/contact"),
  ]);

// Nog niets opgeslagen? Dan staat klaar wat we al van de klant weten.
const auth = useAuth();
const form = reactive({
  companyName: auth.user.value?.name ?? "",
  phone: "",
  invoiceEmail: auth.user.value?.email ?? "",
});

watchEffect(() => {
  if (!existing.value) return;
  form.companyName = existing.value.companyName;
  form.invoiceEmail = existing.value.invoiceEmail;
});

// Zelfde nummer als de beheerder ziet in het klantprofiel.
watchEffect(() => {
  form.phone = contact.value?.phone ?? "";
});

const pending = ref(false);
const error = ref("");
const saved = ref(false);

async function save() {
  if (pending.value) return;
  error.value = "";
  saved.value = false;

  const phone = form.phone.trim();
  if (phone && !isValidPhone(phone)) {
    error.value = PHONE_ERROR;
    return;
  }

  pending.value = true;
  try {
    await $fetch("/api/account/billing", {
      method: "PUT",
      body: { ...form, phone: contact.value?.isCustomer ? phone : undefined },
    });
    await Promise.all([refresh(), refreshContact()]);
    saved.value = true;
  } catch (err) {
    error.value =
      (err as { data?: { statusMessage?: string } })?.data?.statusMessage ||
      "Opslaan mislukt. Controleer de ingevulde gegevens.";
  } finally {
    pending.value = false;
  }
}

const passwordPending = ref(false);
const passwordError = ref("");
const passwordSent = ref(false);

/**
 * Zelfde herstellink als "Wachtwoord vergeten" in de login-popup: na de klik
 * opent `?wachtwoord=nieuw` het scherm "new-password" (zie AuthModal).
 */
async function requestPasswordLink() {
  const email = auth.user.value?.email;
  if (passwordPending.value || !email) return;
  passwordPending.value = true;
  passwordError.value = "";

  try {
    const { error: linkError } = await authClient.signIn.magicLink({
      email,
      callbackURL: "/account/gegevens?wachtwoord=nieuw",
      errorCallbackURL: "/account/gegevens?login=fout",
      metadata: { purpose: "reset" },
    });

    if (linkError) {
      passwordError.value =
        linkError.status === 429
          ? "Te veel aanvragen. Probeer het over een minuutje opnieuw."
          : "Er ging iets mis. Probeer het later opnieuw.";
      return;
    }
    passwordSent.value = true;
  } catch {
    passwordError.value = "Er ging iets mis. Probeer het later opnieuw.";
  } finally {
    passwordPending.value = false;
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
