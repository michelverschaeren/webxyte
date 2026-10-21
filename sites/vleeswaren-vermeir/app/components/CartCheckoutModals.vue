<template>
  <Teleport to="body">
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
            style="background: linear-gradient(135deg, var(--color-surface-strong) 0%, var(--color-surface) 100%)"
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
        class="pointer-events-none fixed inset-0 z-211 flex items-center justify-center overflow-y-auto p-4"
      >
        <div
          class="pointer-events-auto my-auto w-full max-w-md rounded-2xl border border-[#c89868]/30 shadow-2xl overflow-hidden"
          style="background: var(--color-surface)"
        >
          <div
            class="border-b border-(--color-border) px-5 py-4"
            style="background: linear-gradient(135deg, var(--color-surface-strong) 0%, var(--color-surface) 100%)"
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
            <!-- Enkel voor klanten: een login zonder klant (beheerder) heeft
                 geen leveringsadressen. -->
            <div v-if="checkout.orderIsCustomer.value">
              <p class="mb-2 text-xs font-medium text-(--color-text-muted)">
                Leveringsadres
              </p>
              <DeliveryAddresses
                v-model:selected="checkout.orderAddressId.value"
                endpoint="/api/account/addresses"
                :addresses="checkout.orderAddresses.value"
                selectable
                @changed="checkout.loadOrderAddresses()"
              />
            </div>
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
            style="background: linear-gradient(135deg, var(--color-surface-strong) 0%, var(--color-surface) 100%)"
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
