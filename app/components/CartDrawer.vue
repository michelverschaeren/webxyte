<template>
  <!-- Click-outside catcher (invisible: the page behind the panel must
       never dim or blur), only active once fully expanded -->
  <Teleport to="body">
    <div
      v-if="cart.isOpen.value"
      class="fixed inset-0 z-190"
      @click="cart.isOpen.value = false"
    />

    <!-- Unified floating panel: a small "added to cart" toast that grows
         in place into the full-height cart, instead of a separate drawer
         sliding in from off-screen. -->
    <transition name="panel-pop">
      <div
        v-if="visible"
        class="fixed right-4 bottom-4 z-200 flex flex-col overflow-hidden rounded-2xl shadow-2xl transition-[width,height,right,bottom,border-radius] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
        :class="
          expanded
            ? 'right-0 bottom-0 w-[min(24rem,100vw)] h-dvh rounded-none'
            : 'right-4 bottom-4 w-[min(24rem,calc(100vw-2rem))] h-30'
        "
        style="background: var(--color-surface)"
      >
        <!-- Collapsed: "added to cart" toast -->
        <template v-if="!expanded">
          <div class="flex items-start gap-3 p-4">
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style="background: rgba(184, 37, 42, 0.12)"
            >
              <svg
                class="h-5 w-5 text-[#b8252a]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-(--color-text-strong)">
                Toegevoegd aan winkelmandje
              </p>
              <p class="mt-0.5 text-xs text-(--color-text-muted)">
                {{ cart.totalItems.value }} stuk{{ cart.totalItems.value !== 1 ? "s" : "" }}
                in uw bestellijst
              </p>
            </div>
            <button
              aria-label="Sluiten"
              class="shrink-0 rounded-md p-1 text-(--color-text-muted) transition-colors hover:bg-(--color-hover) hover:text-(--color-text-strong)"
              @click="cart.toastVisible.value = false"
            >
              <svg
                class="h-4 w-4"
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
          <button
            type="button"
            class="block w-full border-t border-(--color-border) px-4 py-3 text-center text-xs font-semibold tracking-[0.08em] text-(--color-accent) uppercase transition-colors hover:bg-(--color-hover)"
            @click="expand()"
          >
            Bekijk winkelmandje
          </button>
        </template>

        <!-- Expanded: full cart -->
        <template v-else>
          <!-- Header -->
          <div
            class="flex items-center justify-between border-b border-(--color-border) px-5 py-4"
            style="
              background: linear-gradient(
                135deg,
                var(--color-surface-strong) 0%,
                var(--color-surface) 100%
              );
            "
          >
            <div class="flex items-center gap-3 min-w-0">
              <svg
                class="h-5 w-5 text-(--color-accent) shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h2 class="font-bold text-(--color-text-strong)">Bestellijst</h2>
              <span class="text-xs text-(--color-text-muted)"
                >({{ cart.totalItems.value }} artikel{{
                  cart.totalItems.value !== 1 ? "en" : ""
                }})</span
              >
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button
                type="button"
                class="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-(--color-text) transition-colors hover:bg-(--color-hover) hover:text-(--color-text-strong)"
                title="Wissel naar mijn bestellijsten"
                @click="checkout.openLists()"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Lijsten
              </button>
              <button
                class="rounded-lg p-1.5 text-(--color-text) transition-colors hover:bg-(--color-hover) hover:text-(--color-text-strong)"
                aria-label="Sluit"
                @click="cart.isOpen.value = false"
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
          </div>

          <!-- Items -->
          <div class="flex-1 overflow-y-auto">
            <div class="space-y-3 px-4 py-4">
            <!-- Empty state -->
            <div
              v-if="cart.items.value.length === 0"
              class="flex h-48 flex-col items-center justify-center gap-4 text-center"
            >
              <div
                class="flex h-16 w-16 items-center justify-center rounded-full border border-[#c89868]/30"
              >
                <svg
                  class="h-7 w-7 text-(--color-accent)"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <p class="text-sm font-semibold text-(--color-text-strong)">
                  Uw bestellijst is leeg
                </p>
                <p class="mt-1 text-xs text-(--color-text-muted)">
                  Voeg producten toe via het productenoverzicht
                </p>
              </div>
            </div>

            <!-- Cart items -->
            <div
              v-for="item in cart.items.value"
              :key="item.id"
              class="rounded-xl border border-(--color-border) bg-(--color-surface) p-3"
            >
              <div class="flex items-start gap-3">
                <div class="min-w-0 flex-1">
                  <p
                    class="truncate text-sm leading-snug font-semibold text-(--color-text-strong)"
                  >
                    {{ item.name }}
                  </p>
                  <!-- Tijdelijk verborgen: fabrikant -->
                  <!-- <p class="text-xs text-(--color-text-muted)">{{ item.supplier }}</p> -->
                  <p class="mt-0.5 font-mono text-xs text-(--color-accent)">
                    Artikelnr. {{ item.articleNr }}
                  </p>
                </div>

                <!-- Quantity + remove -->
                <div class="flex shrink-0 flex-col items-end gap-2">
                  <button
                    class="rounded-md p-1 text-(--color-text-muted) transition-colors hover:bg-(--color-hover) hover:text-[#b8252a]"
                    @click="confirmingRemoveId = item.id"
                  >
                    <svg
                      class="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                  <!-- Qty stepper -->
                  <div class="flex items-center gap-1">
                    <button
                      class="flex h-7 w-7 items-center justify-center rounded-md border border-(--color-border) text-sm font-bold text-(--color-accent) transition-colors hover:bg-(--color-hover)"
                      @click="cart.updateQuantity(item.id, item.quantity - 1)"
                    >
                      −
                    </button>
                    <span
                      class="text-center text-sm font-semibold text-(--color-text-strong)"
                      >{{ item.quantity }}<span
                        v-if="item.unit"
                        class="text-(--color-text-muted)"
                        > {{ item.unit }}</span
                      ></span
                    >
                    <button
                      class="flex h-7 w-7 items-center justify-center rounded-md border border-(--color-border) text-sm font-bold text-(--color-accent) transition-colors hover:bg-(--color-hover)"
                      @click="cart.updateQuantity(item.id, item.quantity + 1)"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <!-- Verwijder-bevestiging -->
              <p
                v-if="confirmingRemoveId === item.id"
                class="mt-2 flex items-center justify-between gap-2 border-t border-(--color-border) pt-2 text-[0.7rem] text-[#b8252a]"
              >
                <span>Artikel verwijderen?</span>
                <span class="flex gap-2">
                  <button
                    class="rounded-md bg-[#b8252a] px-2 py-0.5 text-white"
                    @click="
                      confirmingRemoveId = null;
                      cart.removeItem(item.id);
                    "
                  >
                    Ja
                  </button>
                  <button
                    class="rounded-md border border-(--color-border-strong) px-2 py-0.5 text-(--color-text)"
                    @click="confirmingRemoveId = null"
                  >
                    Nee
                  </button>
                </span>
              </p>
            </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="border-t border-(--color-border) px-5 py-4"
            style="background: var(--color-surface-strong)"
          >
            <div class="space-y-3">
            <div
              v-if="cart.items.value.length > 0"
              class="flex justify-between text-sm"
            >
              <span class="text-(--color-text-muted)">Totaal artikelen</span>
              <span class="font-bold text-(--color-text-strong)">{{ cart.totalItems.value }}</span>
            </div>

            <button
              v-if="cart.items.value.length > 0"
              class="w-full rounded-lg bg-[#b8252a] py-3.5 text-sm font-semibold tracking-widest text-white uppercase transition-colors hover:bg-[#8b1f1f]"
              @click="checkout.openOrderModal()"
            >
              Bestelling plaatsen
            </button>
            <NuxtLink
              v-if="cart.items.value.length > 0"
              to="/winkelmandje"
              class="block w-full rounded-lg border border-(--color-border-strong) py-3 text-center text-sm font-semibold tracking-widest text-(--color-text) uppercase transition-colors hover:bg-(--color-hover)"
              @click="cart.isOpen.value = false"
            >
              Winkelmandje bekijken
            </NuxtLink>
            <p
              v-if="cart.items.value.length > 0"
              class="text-center text-[0.7rem] leading-relaxed text-(--color-text-muted)"
            >
              Wordt rechtstreeks doorgestuurd naar Vleeswaren Vermeir voor
              verwerking en levering — geen online betaling nodig.
            </p>

            <!-- Lists actions -->
            <div class="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                :disabled="cart.items.value.length === 0"
                class="rounded-lg border border-[#c89868] px-3 py-2 text-xs font-semibold tracking-[0.08em] text-(--color-accent) uppercase transition-colors hover:bg-[#c89868] hover:text-[#1a0a0a] disabled:cursor-not-allowed disabled:opacity-40"
                @click="checkout.openSaveModal()"
              >
                Lijst opslaan
              </button>
              <button
                type="button"
                class="rounded-lg border border-(--color-border-strong) px-3 py-2 text-xs font-semibold tracking-[0.08em] text-(--color-text) uppercase transition-colors hover:bg-(--color-hover)"
                @click="checkout.openLists()"
              >
                Mijn lijsten
              </button>
            </div>

            <button
              v-if="cart.items.value.length > 0"
              class="w-full rounded-lg py-2 text-xs font-medium text-(--color-text-muted) transition-colors hover:bg-(--color-hover) hover:text-(--color-text-strong)"
              @click="checkout.openClearConfirm()"
            >
              Bestellijst wissen
            </button>
            </div>
          </div>
        </template>
      </div>
    </transition>

    <!-- Save-as-list modal -->
    <transition name="backdrop-fade">
      <div
        v-if="checkout.saveModalOpen.value"
        class="fixed inset-0 z-210 bg-black/70"
        @click="checkout.closeSaveModal()"
      />
    </transition>
    <transition name="modal-pop">
      <div
        v-if="checkout.saveModalOpen.value"
        class="pointer-events-none fixed inset-0 z-211 flex items-center justify-center p-4"
      >
        <div
          class="pointer-events-auto w-full max-w-md rounded-2xl border border-[#c89868]/30 shadow-2xl overflow-hidden"
          style="background: var(--color-surface)"
        >
          <div
            class="border-b border-(--color-border) px-5 py-4"
            style="
            background: linear-gradient(
              135deg,
              var(--color-surface-strong) 0%,
              var(--color-surface) 100%
            );
          "
          >
            <p
              class="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-(--color-accent)"
            >
              — Bestellijst —
            </p>
            <h3 class="text-base font-bold text-(--color-text-strong)">
              Lijst opslaan voor later
            </h3>
          </div>
          <form class="space-y-4 px-5 py-5" @submit.prevent="checkout.confirmSave()">
            <label class="block">
              <span class="mb-2 block text-xs font-medium text-(--color-text-muted)"
                >Naam van de lijst</span
              >
              <input
                ref="saveInputRef"
                v-model="checkout.saveName.value"
                type="text"
                maxlength="60"
                required
                placeholder="bv. Wekelijkse bestelling"
                class="w-full rounded-lg border border-(--color-border-strong) bg-(--color-bg) px-3 py-2.5 text-sm text-(--color-text-strong) placeholder-(--color-text-muted)/60 focus:border-[#c89868] focus:outline-none"
              >
            </label>
            <p class="text-[0.7rem] text-(--color-text-muted)">
              {{ cart.totalItems.value }} stuks in
              {{ cart.items.value.length }} artikel{{
                cart.items.value.length !== 1 ? "en" : ""
              }}
              worden bewaard.
            </p>
            <div class="flex justify-end gap-2 pt-1">
              <button
                type="button"
                class="rounded-lg px-4 py-2 text-xs font-medium text-(--color-text-muted) hover:text-(--color-text-strong)"
                @click="checkout.closeSaveModal()"
              >
                Annuleren
              </button>
              <button
                type="submit"
                :disabled="!checkout.saveName.value.trim()"
                class="rounded-lg bg-[#b8252a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#8b1f1f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Opslaan
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- Place-order modal -->
    <transition name="backdrop-fade">
      <div
        v-if="checkout.orderModalOpen.value"
        class="fixed inset-0 z-210 bg-black/70"
        @click="checkout.closeOrderModal()"
      />
    </transition>
    <transition name="modal-pop">
      <div
        v-if="checkout.orderModalOpen.value"
        class="pointer-events-none fixed inset-0 z-211 flex items-center justify-center p-4"
      >
        <div
          class="pointer-events-auto w-full max-w-md rounded-2xl border border-[#c89868]/30 shadow-2xl overflow-hidden"
          style="background: var(--color-surface)"
        >
          <div
            class="border-b border-(--color-border) px-5 py-4"
            style="
            background: linear-gradient(
              135deg,
              var(--color-surface-strong) 0%,
              var(--color-surface) 100%
            );
          "
          >
            <p
              class="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-(--color-accent)"
            >
              — Bestellijst —
            </p>
            <h3 class="text-base font-bold text-(--color-text-strong)">
              Bestelling plaatsen
            </h3>
          </div>
          <form class="space-y-4 px-5 py-5" @submit.prevent="checkout.placeOrder()">
            <label class="block">
              <span class="mb-2 block text-xs font-medium text-(--color-text-muted)"
                >Naam van de bestelling</span
              >
              <input
                ref="orderNameInputRef"
                v-model="checkout.orderName.value"
                type="text"
                maxlength="200"
                required
                placeholder="bv. Weekbestelling"
                class="w-full rounded-lg border border-(--color-border-strong) bg-(--color-bg) px-3 py-2.5 text-sm text-(--color-text-strong) placeholder-(--color-text-muted)/60 focus:border-[#c89868] focus:outline-none"
              >
            </label>
            <label class="block">
              <span class="mb-2 block text-xs font-medium text-(--color-text-muted)"
                >Notitie (optioneel)</span
              >
              <textarea
                v-model="checkout.orderNote.value"
                maxlength="2000"
                rows="3"
                placeholder="Extra opmerkingen voor uw bestelling…"
                class="w-full resize-none rounded-lg border border-(--color-border-strong) bg-(--color-bg) px-3 py-2.5 text-sm text-(--color-text-strong) placeholder-(--color-text-muted)/60 focus:border-[#c89868] focus:outline-none"
              />
            </label>
            <p v-if="checkout.orderError.value" class="text-xs text-[#e06a6a]">
              {{ checkout.orderError.value }}
            </p>
            <div class="flex justify-end gap-2 pt-1">
              <button
                type="button"
                class="rounded-lg px-4 py-2 text-xs font-medium text-(--color-text-muted) hover:text-(--color-text-strong)"
                @click="checkout.closeOrderModal()"
              >
                Annuleren
              </button>
              <button
                type="submit"
                :disabled="checkout.placing.value || !checkout.orderName.value.trim()"
                class="rounded-lg bg-[#b8252a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#8b1f1f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {{ checkout.placing.value ? "Bezig met versturen…" : "Bestelling plaatsen" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- Clear-cart confirm -->
    <transition name="backdrop-fade">
      <div
        v-if="checkout.clearConfirmOpen.value"
        class="fixed inset-0 z-210 bg-black/70"
        @click="checkout.closeClearConfirm()"
      />
    </transition>
    <transition name="modal-pop">
      <div
        v-if="checkout.clearConfirmOpen.value"
        class="pointer-events-none fixed inset-0 z-211 flex items-center justify-center p-4"
      >
        <div
          class="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border border-[#b8252a]/40 shadow-2xl"
          style="background: var(--color-surface)"
        >
          <div
            class="border-b border-(--color-border) px-5 py-4"
            style="
            background: linear-gradient(
              135deg,
              var(--color-surface-strong) 0%,
              var(--color-surface) 100%
            );
          "
          >
            <p
              class="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#b8252a]"
            >
              — Bestellijst —
            </p>
            <h3 class="text-base font-bold text-(--color-text-strong)">
              Winkelmandje wissen?
            </h3>
          </div>
          <div class="space-y-4 px-5 py-5">
            <p class="text-sm text-(--color-text-muted)">
              Alle {{ cart.items.value.length }} artikel{{
                cart.items.value.length !== 1 ? "en" : ""
              }}
              worden verwijderd uit uw bestellijst. Dit kan niet ongedaan
              worden gemaakt.
            </p>
            <div class="flex justify-end gap-2 pt-1">
              <button
                type="button"
                class="rounded-lg px-4 py-2 text-xs font-medium text-(--color-text-muted) hover:text-(--color-text-strong)"
                @click="checkout.closeClearConfirm()"
              >
                Annuleren
              </button>
              <button
                type="button"
                class="rounded-lg bg-[#b8252a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#8b1f1f]"
                @click="checkout.confirmClear()"
              >
                Winkelmandje wissen
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
const cart = useCart();
const checkout = useCartCheckout();

const saveInputRef = ref<HTMLInputElement | null>(null);
const orderNameInputRef = ref<HTMLInputElement | null>(null);
const confirmingRemoveId = ref<string | null>(null);

/** Zichtbaar als klein "toegevoegd"-kaartje óf uitgeklapt als volledig mandje. */
const visible = computed(() => cart.toastVisible.value || cart.isOpen.value);
const expanded = computed(() => cart.isOpen.value);

function expand() {
  cart.toastVisible.value = false;
  cart.isOpen.value = true;
}

let hideTimer: ReturnType<typeof setTimeout> | null = null;

function clearHideTimer() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}

/** Het kleine kaartje verdwijnt vanzelf als er niet op geklikt wordt. */
watch(
  () => cart.toastVisible.value,
  (isToast) => {
    clearHideTimer();
    if (isToast) {
      hideTimer = setTimeout(() => {
        cart.toastVisible.value = false;
      }, 4000);
    }
  },
);
onUnmounted(clearHideTimer);

watch(
  () => checkout.saveModalOpen.value,
  (open) => {
    if (open) nextTick(() => saveInputRef.value?.focus());
  },
);

watch(
  () => checkout.orderModalOpen.value,
  (open) => {
    if (open) nextTick(() => orderNameInputRef.value?.focus());
  },
);
</script>

<style scoped>
.panel-pop-enter-active,
.panel-pop-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.panel-pop-enter-from,
.panel-pop-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

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
