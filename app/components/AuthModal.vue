<template>
  <Teleport to="body">
    <transition name="backdrop-fade">
      <div
        v-if="authModal.isOpen.value"
        class="fixed inset-0 z-220 bg-black/70 backdrop-blur-sm"
        @click="authModal.close()"
      />
    </transition>

    <transition name="modal-pop">
      <div
        v-if="authModal.isOpen.value"
        class="pointer-events-none fixed inset-0 z-221 flex items-center justify-center overflow-y-auto p-4"
      >
        <div
          class="pointer-events-auto my-auto w-full max-w-md rounded-2xl border border-[#c89868]/30 shadow-2xl overflow-hidden"
          style="background: var(--color-surface)"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          <!-- Header -->
          <div
            class="relative border-b border-(--color-border) px-5 py-4 sm:px-6"
            style="background: linear-gradient(135deg, var(--color-surface-strong) 0%, var(--color-surface) 100%)"
          >
            <p
              class="text-[0.65rem] font-semibold tracking-[0.2em] text-(--color-accent) uppercase"
            >
              — Klantenzone —
            </p>
            <h3
              id="auth-modal-title"
              class="font-['Playfair_Display',Georgia,serif] text-xl text-(--color-text-strong)"
            >
              {{ title }}
            </h3>
            <button
              type="button"
              class="absolute top-3 right-3 rounded-lg p-1.5 text-(--color-text-muted) transition-colors hover:text-(--color-text-strong)"
              aria-label="Sluiten"
              @click="authModal.close()"
            >
              <svg
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Bevestiging (mail verstuurd / wachtwoord opgeslagen) -->
          <div v-if="mode === 'sent'" class="space-y-4 px-5 pt-5 pb-5 sm:px-6">
            <p class="text-sm text-(--color-text)">{{ notice }}</p>
            <button
              type="button"
              class="w-full rounded-lg border border-(--color-border-strong) px-4 py-3 text-sm font-semibold tracking-widest text-(--color-text-strong) uppercase transition-colors hover:border-[#c89868]"
              @click="authModal.close()"
            >
              Sluiten
            </button>
          </div>

          <!-- Nieuw wachtwoord (na de link uit "wachtwoord vergeten") -->
          <form
            v-else-if="mode === 'new-password'"
            class="space-y-4 px-5 pt-5 pb-5 sm:px-6"
            @submit.prevent="submitNewPassword()"
          >
            <p class="text-sm text-(--color-text-muted)">
              U bent ingelogd. Kies nu een nieuw wachtwoord.
            </p>

            <!-- Gebruikersnaam voor wachtwoordmanagers: zonder dit veld weten
                 ze niet bij welk account het nieuwe wachtwoord hoort. -->
            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-(--color-text-muted)"
                >E-mailadres</span
              >
              <input
                :value="auth.user.value?.email ?? ''"
                type="email"
                name="username"
                autocomplete="username"
                readonly
                tabindex="-1"
                :class="[inputClass, 'cursor-default opacity-70']"
              >
            </label>

            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-(--color-text-muted)"
                >Nieuw wachtwoord</span
              >
              <input
                ref="firstInputRef"
                v-model="password"
                type="password"
                required
                :minlength="8"
                autocomplete="new-password"
                placeholder="Minimaal 8 tekens"
                :class="inputClass"
              >
            </label>

            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-(--color-text-muted)"
                >Herhaal wachtwoord</span
              >
              <input
                v-model="passwordRepeat"
                type="password"
                required
                :minlength="8"
                autocomplete="new-password"
                :class="inputClass"
              >
            </label>

            <p v-if="error" class="text-xs text-[#e06a6a]">{{ error }}</p>

            <button type="submit" :disabled="pending" :class="primaryButtonClass">
              {{ pending ? "Even geduld…" : "Wachtwoord opslaan" }}
            </button>
          </form>

          <!-- Inloggen / inloglink / wachtwoord vergeten / klant worden -->
          <form
            v-else
            class="space-y-4 px-5 pt-5 pb-5 sm:px-6"
            @submit.prevent="submit()"
          >
            <p v-if="mode === 'magic'" class="text-sm text-(--color-text-muted)">
              We mailen u een link waarmee u zonder wachtwoord inlogt.
            </p>
            <p v-else-if="mode === 'request'" class="text-sm text-(--color-text-muted)">
              Vul uw e-mailadres in. Bent u al klant, dan mailen we u meteen de
              info om in te loggen. Bent u nog geen klant, dan sturen we uw
              aanvraag door naar Vleeswaren Vermeir en nemen zij contact met u
              op.
            </p>
            <p v-else-if="mode === 'forgot'" class="text-sm text-(--color-text-muted)">
              We mailen u een link. Daarmee bent u meteen ingelogd en kiest u
              een nieuw wachtwoord.
            </p>

            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-(--color-text-muted)"
                >E-mailadres</span
              >
              <input
                ref="firstInputRef"
                v-model="email"
                type="email"
                required
                autocomplete="email"
                placeholder="naam@bedrijf.be"
                :class="inputClass"
              >
            </label>

            <!-- "Wachtwoord vergeten?" staat in de DOM ná het invulveld, zodat
                 Tab vanuit het e-mailadres eerst naar het wachtwoord gaat;
                 visueel blijft de link rechtsboven naast het label. -->
            <div v-if="mode === 'login'" class="relative">
              <label class="block">
                <span class="mb-1.5 block text-xs font-medium text-(--color-text-muted)"
                  >Wachtwoord</span
                >
                <input
                  v-model="password"
                  type="password"
                  required
                  :minlength="8"
                  autocomplete="current-password"
                  placeholder="Minimaal 8 tekens"
                  :class="inputClass"
                >
              </label>
              <button
                type="button"
                class="absolute top-0 right-0 text-xs font-medium text-(--color-accent) hover:underline"
                @click="switchMode('forgot')"
              >
                Wachtwoord vergeten?
              </button>
            </div>

            <p v-if="error" class="text-xs text-[#e06a6a]">{{ error }}</p>

            <button type="submit" :disabled="pending" :class="primaryButtonClass">
              {{ pending ? "Even geduld…" : submitLabel }}
            </button>

            <button
              v-if="mode === 'login'"
              type="button"
              class="w-full rounded-lg border border-(--color-border-strong) px-4 py-3 text-sm font-semibold tracking-widest text-(--color-text-strong) uppercase transition-colors hover:border-[#c89868]"
              @click="switchMode('magic')"
            >
              Inloggen via e-maillink
            </button>
            <button
              v-else
              type="button"
              class="w-full text-center text-xs text-(--color-text-muted) hover:text-(--color-text-strong)"
              @click="switchMode('login')"
            >
              ← Terug naar inloggen met wachtwoord
            </button>

            <!-- Klant worden: aanvraag naar de zaak (geen publieke registratie) -->
            <div
              v-if="mode === 'login'"
              class="space-y-3 border-t border-(--color-border) pt-4"
            >
              <p class="text-sm text-(--color-text-muted)">
                <span class="font-semibold text-(--color-text-strong)"
                  >Nog geen klant of nog geen login?</span
                >
                Vraag uw toegang aan met uw e-mailadres.
              </p>
              <button
                type="button"
                class="w-full rounded-lg border border-(--color-border-strong) px-4 py-3 text-sm font-semibold tracking-widest text-(--color-text-strong) uppercase transition-colors hover:border-[#c89868]"
                @click="switchMode('request')"
              >
                Klant worden
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { AuthModalMode } from "~/composables/useAuthModal";

const authModal = useAuthModal();
const auth = useAuth();
const cart = useCart();
const route = useRoute();
const router = useRouter();

const mode = authModal.mode;
const email = ref("");
const password = ref("");
const passwordRepeat = ref("");
const error = ref("");
const notice = ref("");
const noticeTitle = ref("");
const pending = ref(false);
const firstInputRef = ref<HTMLInputElement | null>(null);

const inputClass =
  "w-full rounded-lg border border-(--color-border-strong) bg-(--color-bg) px-3 py-2.5 text-sm text-(--color-text-strong) placeholder-(--color-text-muted)/60 focus:border-[#c89868] focus:outline-none";
const primaryButtonClass =
  "w-full rounded-lg bg-[#b8252a] px-4 py-3 text-sm font-semibold tracking-widest text-white uppercase transition-colors hover:bg-[#8b1f1f] disabled:cursor-not-allowed disabled:opacity-50";

const title = computed(() => {
  switch (mode.value) {
    case "magic":
      return "Inloggen via e-mail";
    case "forgot":
      return "Wachtwoord vergeten";
    case "request":
      return "Klant worden";
    case "sent":
      return noticeTitle.value;
    case "new-password":
      return "Nieuw wachtwoord";
    default:
      return "Welkom terug";
  }
});

const submitLabel = computed(() => {
  if (mode.value === "login") return "Inloggen";
  return mode.value === "request" ? "Verzenden" : "Stuur mij een link";
});

function submit() {
  if (mode.value === "login") return submitLogin();
  return mode.value === "request" ? submitRequest() : submitLink();
}

function switchMode(next: AuthModalMode) {
  mode.value = next;
  error.value = "";
  password.value = "";
  nextTick(() => firstInputRef.value?.focus());
}

/** Beheerders gaan na het inloggen meteen naar de adminzone. */
async function redirectAdmin() {
  if (!auth.isAdmin.value || route.path.startsWith("/admin")) return;
  await navigateTo("/admin");
}

async function submitLogin() {
  if (pending.value) return;
  pending.value = true;
  error.value = "";

  try {
    const result = await auth.login(email.value, password.value);

    if (result.error) {
      error.value =
        result.error.message ||
        "Inloggen mislukt. Controleer uw e-mailadres en wachtwoord.";
      return;
    }

    password.value = "";
    authModal.close();
    // Mag het inloggen zelf nooit laten mislukken.
    cart.syncAfterLogin().catch(() => {});
    await redirectAdmin();
  } catch {
    error.value = "Er ging iets mis. Probeer het later opnieuw.";
  } finally {
    pending.value = false;
  }
}

/**
 * Vraagt een inloglink aan ("magic") of een herstellink ("forgot"). Beide
 * zijn dezelfde magic link; enkel de terugkeer-URL verschilt: bij "forgot"
 * opent `?wachtwoord=nieuw` na het inloggen het scherm "new-password".
 */
async function submitLink() {
  if (pending.value) return;
  pending.value = true;
  error.value = "";

  const isReset = mode.value === "forgot";
  const path = route.path;

  try {
    const { error: linkError } = await authClient.signIn.magicLink({
      email: email.value,
      callbackURL: isReset ? `${path}?wachtwoord=nieuw` : `${path}?login=ok`,
      errorCallbackURL: `${path}?login=fout`,
      metadata: { purpose: isReset ? "reset" : "login" },
    });

    if (linkError) {
      error.value =
        linkError.status === 429
          ? "Te veel aanvragen. Probeer het over een minuutje opnieuw."
          : "Er ging iets mis. Probeer het later opnieuw.";
      return;
    }

    // Altijd dezelfde melding, ook voor onbekende adressen (zie server).
    noticeTitle.value = "Check uw mailbox";
    notice.value = `Als ${email.value} bij ons gekend is, ontvangt u binnen enkele minuten een mail met een link. De link is 15 minuten geldig.`;
    mode.value = "sent";
  } catch {
    error.value = "Er ging iets mis. Probeer het later opnieuw.";
  } finally {
    pending.value = false;
  }
}

/**
 * "Klant worden": een gekend adres krijgt een mail met de info om in te
 * loggen; een onbekend adres gaat als aanvraag naar de zaak (zie
 * /api/customer-request).
 */
async function submitRequest() {
  if (pending.value) return;
  pending.value = true;
  error.value = "";

  try {
    const { known } = await $fetch("/api/customer-request", {
      method: "POST",
      body: { email: email.value },
    });

    if (known) {
      noticeTitle.value = "Check uw mailbox";
      notice.value = `${email.value} is bij ons gekend. U ontvangt binnen enkele minuten een mail met de info om in te loggen.`;
    } else {
      noticeTitle.value = "Aanvraag verstuurd";
      notice.value =
        "Uw aanvraag is verstuurd naar Vleeswaren Vermeir. Zij nemen zo snel mogelijk contact met u op.";
    }
    mode.value = "sent";
  } catch (e) {
    error.value =
      (e as { statusCode?: number }).statusCode === 429
        ? "Te veel aanvragen. Probeer het over enkele minuten opnieuw."
        : "De aanvraag kon niet verstuurd worden. Probeer het later opnieuw.";
  } finally {
    pending.value = false;
  }
}

async function submitNewPassword() {
  if (pending.value) return;
  error.value = "";

  if (password.value !== passwordRepeat.value) {
    error.value = "De wachtwoorden komen niet overeen.";
    return;
  }

  pending.value = true;
  try {
    await $fetch("/api/account/password", {
      method: "POST",
      body: { newPassword: password.value },
    });
    noticeTitle.value = "Wachtwoord opgeslagen";
    notice.value = "Uw nieuwe wachtwoord is opgeslagen. Voortaan logt u daarmee in.";
    mode.value = "sent";
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    error.value =
      status === 403 || status === 401
        ? "Deze link is te oud. Vraag via 'Wachtwoord vergeten' een nieuwe aan."
        : "Opslaan mislukt. Probeer het later opnieuw.";
  } finally {
    pending.value = false;
  }
}

watch(authModal.isOpen, (open) => {
  if (!open) {
    error.value = "";
    password.value = "";
    passwordRepeat.value = "";
    return;
  }
  nextTick(() => firstInputRef.value?.focus());
});

/**
 * Terugkeer vanuit de maillink: `?login=ok` (ingelogd; beheerders gaan door
 * naar de adminzone), `?wachtwoord=nieuw` (herstellen) of
 * `?login=fout&error=…` (verlopen/gebruikte link). De parameters gaan
 * meteen uit de URL, zodat een refresh de popup niet opnieuw opent.
 */
function handleLinkReturn() {
  const { wachtwoord, login, error: linkError, ...rest } = route.query;
  if (!wachtwoord && !login) return;

  if (login === "ok" && auth.isAdmin.value && !route.path.startsWith("/admin")) {
    navigateTo("/admin", { replace: true });
    return;
  }

  router.replace({ query: rest });

  if (wachtwoord === "nieuw" && auth.isLoggedIn.value) {
    authModal.open("new-password");
  } else if (login === "fout") {
    authModal.open("magic");
    error.value =
      linkError === "INVALID_TOKEN"
        ? "Deze link is verlopen of al gebruikt. Vraag hieronder een nieuwe aan."
        : "Inloggen via de link is mislukt. Probeer het opnieuw.";
  }
}

onMounted(() => {
  handleLinkReturn();

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && authModal.isOpen.value) authModal.close();
  };
  window.addEventListener("keydown", onKey);
  onUnmounted(() => window.removeEventListener("keydown", onKey));
});
</script>

<style scoped>
.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
  transition: opacity 0.25s ease;
}
.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
  opacity: 0;
}

.modal-pop-enter-active,
.modal-pop-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.modal-pop-enter-from,
.modal-pop-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
