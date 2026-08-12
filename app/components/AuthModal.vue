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
            style="
              background: linear-gradient(
                135deg,
                var(--color-surface-strong) 0%,
                var(--color-surface) 100%
              );
            "
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
              {{ isLogin ? "Welkom terug" : "Account aanmaken" }}
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

          <!-- Tabs -->
          <div class="grid grid-cols-2 border-b border-(--color-border)">
            <button
              v-for="option in tabs"
              :key="option.value"
              type="button"
              class="px-4 py-3 text-xs font-semibold tracking-[0.12em] uppercase transition-colors"
              :class="
                authModal.tab.value === option.value
                  ? 'border-b-2 border-[#c89868] text-(--color-accent)'
                  : 'text-(--color-text-muted) hover:text-(--color-text-strong)'
              "
              @click="switchTab(option.value)"
            >
              {{ option.label }}
            </button>
          </div>

          <!-- Social login -->
          <div class="space-y-2 px-5 pt-5 sm:px-6">
            <button
              type="button"
              :disabled="socialPending !== null"
              class="flex w-full items-center justify-center gap-2.5 rounded-lg border border-(--color-border-strong) bg-(--color-bg) px-4 py-2.5 text-sm font-medium text-(--color-text) transition-colors hover:bg-(--color-hover) disabled:cursor-not-allowed disabled:opacity-50"
              @click="loginWithSocial('google')"
            >
              <svg class="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 01-2.4 3.63v2.98h3.87c2.27-2.09 3.58-5.17 3.58-8.8z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.87-2.98c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.07A11.998 11.998 0 0012 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.29a7.2 7.2 0 010-4.58V6.64H1.27a12 12 0 000 10.72l4-3.07z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.64l4 3.07C6.22 6.86 8.87 4.75 12 4.75z"
                />
              </svg>
              {{ socialPending === "google" ? "Even geduld…" : "Doorgaan met Google" }}
            </button>

            <div class="flex items-center gap-3 pt-1">
              <span class="h-px flex-1 bg-(--color-border)" />
              <span class="text-[0.65rem] text-(--color-text-muted) uppercase">of</span>
              <span class="h-px flex-1 bg-(--color-border)" />
            </div>
          </div>

          <!-- Form -->
          <form class="space-y-4 px-5 pt-4 pb-5 sm:px-6" @submit.prevent="submit()">
            <label v-if="!isLogin" class="block">
              <span class="mb-1.5 block text-xs font-medium text-(--color-text-muted)"
                >Naam of bedrijfsnaam</span
              >
              <input
                v-model="name"
                type="text"
                required
                autocomplete="organization"
                placeholder="bv. Restaurant De Kroon"
                class="w-full rounded-lg border border-(--color-border-strong) bg-(--color-bg) px-3 py-2.5 text-sm text-(--color-text-strong) placeholder-(--color-text-muted)/60 focus:border-[#c89868] focus:outline-none"
              >
            </label>

            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-(--color-text-muted)"
                >E-mailadres</span
              >
              <input
                ref="emailInputRef"
                v-model="email"
                type="email"
                required
                autocomplete="email"
                placeholder="naam@bedrijf.be"
                class="w-full rounded-lg border border-(--color-border-strong) bg-(--color-bg) px-3 py-2.5 text-sm text-(--color-text-strong) placeholder-(--color-text-muted)/60 focus:border-[#c89868] focus:outline-none"
              >
            </label>

            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-(--color-text-muted)"
                >Wachtwoord</span
              >
              <input
                v-model="password"
                type="password"
                required
                :minlength="8"
                :autocomplete="isLogin ? 'current-password' : 'new-password'"
                placeholder="Minimaal 8 tekens"
                class="w-full rounded-lg border border-(--color-border-strong) bg-(--color-bg) px-3 py-2.5 text-sm text-(--color-text-strong) placeholder-(--color-text-muted)/60 focus:border-[#c89868] focus:outline-none"
              >
            </label>

            <p v-if="error" class="text-xs text-[#e06a6a]">{{ error }}</p>

            <button
              type="submit"
              :disabled="pending"
              class="w-full rounded-lg bg-[#b8252a] px-4 py-3 text-sm font-semibold tracking-widest text-white uppercase transition-colors hover:bg-[#8b1f1f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{
                pending
                  ? "Even geduld…"
                  : isLogin
                    ? "Inloggen"
                    : "Account aanmaken"
              }}
            </button>

            <p class="text-center text-[0.7rem] text-(--color-text-muted)">
              {{ isLogin ? "Nog geen account?" : "Al een account?" }}
              <button
                type="button"
                class="text-(--color-accent) underline-offset-2 hover:underline"
                @click="switchTab(isLogin ? 'register' : 'login')"
              >
                {{ isLogin ? "Registreer hier" : "Log hier in" }}
              </button>
            </p>
          </form>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { AuthModalTab } from "~/composables/useAuthModal";

const authModal = useAuthModal();
const auth = useAuth();
const cart = useCart();
const route = useRoute();

const tabs: Array<{ value: AuthModalTab; label: string }> = [
  { value: "login", label: "Inloggen" },
  { value: "register", label: "Registreren" },
];

const name = ref("");
const email = ref("");
const password = ref("");
const error = ref("");
const pending = ref(false);
const socialPending = ref<"google" | "microsoft" | null>(null);
const emailInputRef = ref<HTMLInputElement | null>(null);

const isLogin = computed(() => authModal.tab.value === "login");

function switchTab(target: AuthModalTab) {
  authModal.tab.value = target;
  error.value = "";
}

async function submit() {
  if (pending.value) return;
  pending.value = true;
  error.value = "";

  try {
    const result = isLogin.value
      ? await auth.login(email.value, password.value)
      : await auth.register(name.value, email.value, password.value);

    if (result.error) {
      error.value =
        result.error.message ||
        (isLogin.value
          ? "Inloggen mislukt. Controleer uw e-mailadres en wachtwoord."
          : "Registreren mislukt. Probeer het opnieuw.");
      return;
    }

    password.value = "";
    authModal.close();
    // Mag het inloggen zelf nooit laten mislukken.
    cart.syncAfterLogin().catch(() => {});
  } catch {
    error.value = "Er ging iets mis. Probeer het later opnieuw.";
  } finally {
    pending.value = false;
  }
}

/**
 * Stuurt de browser naar Google/Microsoft en terug — bij succes navigeert
 * Better Auth zelf al weg, dus er is geen "closeModal + syncAfterLogin" zoals
 * bij submit(): dat gebeurt pas op de pagina waar de gebruiker terugkomt.
 */
async function loginWithSocial(provider: "google" | "microsoft") {
  if (socialPending.value) return;
  error.value = "";
  socialPending.value = provider;

  try {
    const result = await authClient.signIn.social({
      provider,
      callbackURL: route.fullPath,
    });

    if (result.error) {
      error.value =
        result.error.message ||
        "Inloggen mislukt. Is deze aanmeldmethode al geconfigureerd?";
      socialPending.value = null;
    }
  } catch {
    error.value = "Er ging iets mis. Probeer het later opnieuw.";
    socialPending.value = null;
  }
}

watch(authModal.isOpen, (open) => {
  if (!open) {
    error.value = "";
    password.value = "";
    return;
  }
  nextTick(() => emailInputRef.value?.focus());
});

onMounted(() => {
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
