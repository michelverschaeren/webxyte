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
              Welkom terug
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

          <!-- Form -->
          <form class="space-y-4 px-5 pt-5 pb-5 sm:px-6" @submit.prevent="submit()">
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
                autocomplete="current-password"
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
              {{ pending ? "Even geduld…" : "Inloggen" }}
            </button>
          </form>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
const authModal = useAuthModal();
const auth = useAuth();
const cart = useCart();

const email = ref("");
const password = ref("");
const error = ref("");
const pending = ref(false);
const emailInputRef = ref<HTMLInputElement | null>(null);

async function submit() {
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
  } catch {
    error.value = "Er ging iets mis. Probeer het later opnieuw.";
  } finally {
    pending.value = false;
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
