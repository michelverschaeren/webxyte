<template>
  <Transition name="uc-fade">
    <div v-if="locked" class="uc-overlay" role="dialog" aria-modal="true" aria-labelledby="uc-title">
      <div class="uc-card" :class="{ 'uc-card--shake': isShaking }">
        <div class="uc-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
            />
          </svg>
        </div>

        <!-- Geen h1: de pagina erachter heeft de echte h1, en tijdens de
             bouwfase staat deze overlay in de HTML van élke pagina. -->
        <h2 id="uc-title" class="uc-title">Website in aanbouw</h2>
        <p class="uc-text">
          We werken hard aan een gloednieuwe website voor Vleeswaren Vermeir.
          Binnenkort zijn we weer online.
        </p>

        <div class="uc-contact">
          <p class="uc-contact-lead">Wilt u ons ondertussen bereiken?</p>
          <a href="tel:015611539" class="uc-contact-item">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"
              />
            </svg>
            015 / 61 15 39
          </a>
          <a href="tel:0475971370" class="uc-contact-item">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M7.5 3.375c0-.621.504-1.125 1.125-1.125h6.75c.621 0 1.125.504 1.125 1.125v17.25c0 .621-.504 1.125-1.125 1.125h-6.75A1.125 1.125 0 017.5 20.625V3.375zM8.625.75A2.625 2.625 0 006 3.375v17.25A2.625 2.625 0 008.625 23.25h6.75A2.625 2.625 0 0018 20.625V3.375A2.625 2.625 0 0015.375.75h-6.75z"
                clip-rule="evenodd"
              />
              <path d="M10.5 18.75a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" />
            </svg>
            0475 97 13 70
          </a>
          <a href="mailto:vleeswarenvermeir@telenet.be" class="uc-contact-item">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"
              />
              <path
                d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"
              />
            </svg>
            vleeswarenvermeir@telenet.be
          </a>
          <span class="uc-contact-item uc-contact-item--static">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.030.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                clip-rule="evenodd"
              />
            </svg>
            Schoolstraat 51, 1980 Zemst
          </span>
        </div>

        <button
          type="button"
          class="uc-toggle"
          :aria-expanded="showLogin"
          @click="showLogin = !showLogin"
        >
          <span>Al toegang? Log hier in</span>
          <svg
            class="uc-chevron"
            :class="{ 'uc-chevron--open': showLogin }"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clip-rule="evenodd"
            />
          </svg>
        </button>

        <Transition name="uc-collapse">
          <form v-if="showLogin" class="uc-login" @submit.prevent="submit">
            <input
              ref="passwordInput"
              v-model="password"
              type="password"
              placeholder="Wachtwoord"
              class="uc-input"
              :class="{ 'uc-input--error': error }"
              autocomplete="off"
              @input="error = false"
            >
            <button type="submit" class="uc-submit">Inloggen</button>
            <p v-if="error" class="uc-error">Onjuist wachtwoord. Probeer opnieuw.</p>
          </form>
        </Transition>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const { locked, tryUnlock } = useSiteLock();

const showLogin = ref(false);
const password = ref("");
const error = ref(false);
const isShaking = ref(false);
const passwordInput = ref<HTMLInputElement | null>(null);

watch(showLogin, async (open) => {
  if (open) {
    await nextTick();
    passwordInput.value?.focus();
  }
});

function submit() {
  if (tryUnlock(password.value)) {
    error.value = false;
    password.value = "";
  } else {
    error.value = true;
    triggerShake();
  }
}

function triggerShake() {
  isShaking.value = true;
  setTimeout(() => {
    isShaking.value = false;
  }, 400);
}
</script>

<style scoped>
.uc-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  overflow-y: auto;
  background: rgba(10, 8, 8, 0.72);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.uc-card {
  width: 100%;
  max-width: 440px;
  margin: auto;
  background: var(--color-surface);
  border: 1px solid rgba(200, 152, 104, 0.25);
  border-radius: 1rem;
  padding: 2.5rem 2rem;
  text-align: center;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
}

/* Kleine telefoons: minder padding en kleinere titel, zodat de kaart
   ruimte overhoudt en niets afgekapt wordt op korte viewports. */
@media (max-width: 400px) {
  .uc-overlay {
    padding: 1rem;
  }
  .uc-card {
    padding: 1.75rem 1.25rem;
    border-radius: 0.85rem;
  }
  .uc-icon {
    width: 46px;
    height: 46px;
    margin-bottom: 1rem;
  }
  .uc-icon svg {
    width: 22px;
    height: 22px;
  }
  .uc-title {
    font-size: 1.3rem;
  }
  .uc-text {
    font-size: 0.85rem;
    margin-bottom: 1.4rem;
  }
  .uc-contact {
    padding: 0.9rem 0 1.25rem;
    margin-bottom: 1.25rem;
  }
  .uc-contact-item {
    font-size: 0.8rem;
    text-align: left;
  }
}

.uc-card--shake {
  animation: uc-shake 0.4s ease;
}

@keyframes uc-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20%,
  60% {
    transform: translateX(-8px);
  }
  40%,
  80% {
    transform: translateX(8px);
  }
}

.uc-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(200, 152, 104, 0.12);
  color: var(--color-accent);
}
.uc-icon svg {
  width: 28px;
  height: 28px;
}

.uc-title {
  font-family: "Playfair Display", serif;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--color-text-strong);
  margin-bottom: 0.75rem;
}

.uc-text {
  font-size: 0.92rem;
  line-height: 1.6;
  color: var(--color-text-muted);
  margin-bottom: 1.75rem;
}

.uc-contact {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
  padding: 1.1rem 0 1.5rem;
  margin-bottom: 1.5rem;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.uc-contact-lead {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin: 0 0 0.3rem;
}

.uc-contact-item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  max-width: 100%;
  font-size: 0.85rem;
  color: var(--color-text);
  overflow-wrap: anywhere;
  text-decoration: none;
  transition: color 0.2s;
}
a.uc-contact-item:hover {
  color: var(--color-accent);
}
.uc-contact-item--static {
  color: var(--color-text-muted);
}
.uc-contact-item svg {
  width: 14px;
  height: 14px;
  color: var(--color-accent);
  flex-shrink: 0;
  opacity: 0.85;
}

.uc-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: transparent;
  border: none;
  color: var(--color-accent);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  padding: 0.4rem 0.2rem;
  transition: color 0.2s;
}
.uc-toggle:hover {
  color: #e8c97a;
}
.uc-chevron {
  width: 16px;
  height: 16px;
  transition: transform 0.25s ease;
}
.uc-chevron--open {
  transform: rotate(180deg);
}

.uc-login {
  margin-top: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow: hidden;
}

.uc-input {
  width: 100%;
  padding: 0.65rem 0.9rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border-strong);
  background: var(--color-hover);
  color: var(--color-text-strong);
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}
.uc-input::placeholder {
  color: var(--color-text-muted);
}
.uc-input:focus {
  border-color: #c89868;
}
.uc-input--error {
  border-color: #b8252a;
}

.uc-submit {
  width: 100%;
  padding: 0.65rem 0.9rem;
  border-radius: 0.5rem;
  border: none;
  background: #b8252a;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}
.uc-submit:hover {
  background: #8b1a1a;
}

.uc-error {
  font-size: 0.78rem;
  color: #e07a7e;
  margin: 0;
}

/* Transitions */
.uc-fade-enter-active,
.uc-fade-leave-active {
  transition: opacity 0.3s ease;
}
.uc-fade-enter-from,
.uc-fade-leave-to {
  opacity: 0;
}

.uc-collapse-enter-active,
.uc-collapse-leave-active {
  transition:
    max-height 0.25s ease,
    opacity 0.2s ease;
  max-height: 160px;
}
.uc-collapse-enter-from,
.uc-collapse-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
