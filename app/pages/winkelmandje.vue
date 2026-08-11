<template>
  <div class="bg-(--color-bg) text-(--color-text) min-h-screen">
    <!-- Page header -->
    <div
      class="relative pt-46.5 pb-20 px-4 overflow-hidden"
      style="
        background: radial-gradient(
          ellipse at 50% 40%,
          var(--gradient-banner-1) 0%,
          var(--gradient-banner-2) 45%,
          var(--gradient-banner-3) 100%
        );
      "
    >
      <div class="relative z-1 max-w-300 mx-auto text-center">
        <h1
          class="font-['Playfair_Display',Georgia,serif] text-[clamp(2.5rem,6vw,5rem)] font-black text-white leading-[1.05] mb-4"
        >
          Winkelmandje
        </h1>
        <p class="text-white/70 text-lg max-w-xl mx-auto">
          {{ cart.totalItems.value }} artikel{{
            cart.totalItems.value !== 1 ? "en" : ""
          }}
          in uw bestellijst
        </p>
      </div>
    </div>

    <div class="max-w-300 mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <!-- Empty state -->
      <div
        v-if="cart.items.value.length === 0"
        class="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center"
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
        <div class="mt-2 flex flex-wrap items-center justify-center gap-3">
          <NuxtLink
            to="/producten"
            class="rounded-lg bg-[#b8252a] px-5 py-2.5 text-xs font-semibold tracking-[0.08em] text-white uppercase transition-colors hover:bg-[#8b1f1f]"
          >
            Bekijk producten
          </NuxtLink>
          <button
            type="button"
            class="rounded-lg border border-[#c89868] px-5 py-2.5 text-xs font-semibold tracking-[0.08em] text-(--color-accent) uppercase transition-colors hover:bg-[#c89868] hover:text-[#1a0a0a]"
            @click="checkout.openImportModal()"
          >
            Lijst importeren
          </button>
          <button
            type="button"
            class="rounded-lg border border-(--color-border-strong) px-5 py-2.5 text-xs font-semibold tracking-[0.08em] text-(--color-text) uppercase transition-colors hover:bg-(--color-hover)"
            @click="checkout.openLists()"
          >
            Bekijk mijn lijsten
          </button>
        </div>
      </div>

      <!-- Items -->
      <template v-else>
        <!-- Top actions -->
        <div class="mb-6 flex flex-wrap items-center gap-3">
          <p class="text-sm text-(--color-text-muted)">
            {{ cart.totalItems.value }} stuks in {{ cart.items.value.length }}
            artikel{{ cart.items.value.length !== 1 ? "en" : "" }}
          </p>
          <div class="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="rounded-lg border border-[#c89868] px-4 py-2 text-[0.7rem] font-semibold tracking-[0.08em] text-(--color-accent) uppercase transition-colors hover:bg-[#c89868] hover:text-[#1a0a0a]"
              @click="checkout.openImportModal()"
            >
              Lijst importeren
            </button>
            <button
              type="button"
              class="rounded-lg border border-[#c89868] px-4 py-2 text-[0.7rem] font-semibold tracking-[0.08em] text-(--color-accent) uppercase transition-colors hover:bg-[#c89868] hover:text-[#1a0a0a]"
              @click="checkout.openSaveModal()"
            >
              Lijst opslaan
            </button>
            <button
              type="button"
              class="rounded-lg border border-(--color-border-strong) px-4 py-2 text-[0.7rem] font-semibold tracking-[0.08em] text-(--color-text) uppercase transition-colors hover:bg-(--color-hover)"
              @click="checkout.openLists()"
            >
              Mijn lijsten
            </button>
            <button
              type="button"
              class="rounded-lg px-3 py-2 text-[0.7rem] font-medium text-(--color-text-muted) transition-colors hover:bg-(--color-hover) hover:text-(--color-text-strong)"
              @click="checkout.openClearConfirm()"
            >
              Wissen
            </button>
          </div>
        </div>

        <!-- Full-width item list -->
        <div class="space-y-3">
          <div
            v-for="item in cart.items.value"
            :key="item.id"
            class="flex flex-wrap items-center gap-4 rounded-xl border border-(--color-border) bg-(--color-surface) p-4 sm:flex-nowrap"
          >
            <div class="min-w-0 basis-full sm:basis-auto sm:flex-1">
              <p class="truncate text-sm font-semibold text-(--color-text-strong)">
                {{ item.name }}
              </p>
              <!-- Tijdelijk verborgen: fabrikant -->
              <!-- <p class="text-xs text-(--color-text-muted)">{{ item.supplier }}</p> -->
              <p class="mt-0.5 font-mono text-xs text-(--color-accent)">
                Artikelnr. {{ item.articleNr }}
              </p>
            </div>

            <div class="flex shrink-0 items-center gap-2">
              <button
                class="flex h-8 w-8 items-center justify-center rounded-md border border-(--color-border) text-sm font-bold text-(--color-accent) transition-colors hover:bg-(--color-hover)"
                @click="cart.updateQuantity(item.id, item.quantity - 1)"
              >
                −
              </button>
              <span class="text-center text-sm font-semibold text-(--color-text-strong)"
                >{{ item.quantity
                }}<span v-if="item.unit" class="text-(--color-text-muted)">
                  {{ item.unit }}</span
                ></span
              >
              <button
                class="flex h-8 w-8 items-center justify-center rounded-md border border-(--color-border) text-sm font-bold text-(--color-accent) transition-colors hover:bg-(--color-hover)"
                @click="cart.updateQuantity(item.id, item.quantity + 1)"
              >
                +
              </button>
            </div>

            <template v-if="confirmingRemoveId === item.id">
              <span class="shrink-0 text-[0.7rem] whitespace-nowrap text-[#b8252a]"
                >Verwijderen?</span
              >
              <button
                class="shrink-0 rounded-md bg-[#b8252a] px-2 py-1 text-xs text-white"
                @click="
                  confirmingRemoveId = null;
                  cart.removeItem(item.id);
                "
              >
                Ja
              </button>
              <button
                class="shrink-0 rounded-md border border-(--color-border-strong) px-2 py-1 text-xs text-(--color-text)"
                @click="confirmingRemoveId = null"
              >
                Nee
              </button>
            </template>
            <button
              v-else
              class="shrink-0 rounded-lg p-2 text-(--color-text-muted) transition-colors hover:bg-(--color-hover) hover:text-[#b8252a]"
              :aria-label="`Verwijder ${item.name}`"
              title="Verwijderen"
              @click="confirmingRemoveId = item.id"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Order bar: floats to the bottom of the viewport while scrolling,
         but stays pinned above the footer once you reach it (sticky, not
         fixed, so it respects the page's own bottom edge). -->
    <div
      v-if="cart.items.value.length > 0"
      class="sticky bottom-0 z-20 mt-6 border-t border-(--color-border) bg-(--color-surface-strong)/95 backdrop-blur-md"
    >
      <div class="max-w-300 mx-auto flex flex-wrap items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div class="text-sm">
          <span class="text-(--color-text-muted)">Totaal artikelen</span>
          <span class="ml-2 font-bold text-(--color-text-strong)">{{
            cart.totalItems.value
          }}</span>
        </div>
        <p class="hidden max-w-xs text-[0.7rem] leading-snug text-(--color-text-muted) sm:block">
          Wordt rechtstreeks doorgestuurd naar Vleeswaren Vermeir — geen
          online betaling nodig.
        </p>
        <button
          class="ml-auto rounded-lg bg-[#b8252a] px-8 py-3.5 text-sm font-semibold tracking-widest text-white uppercase transition-colors hover:bg-[#8b1f1f]"
          @click="checkout.openOrderModal()"
        >
          Bestelling plaatsen
        </button>
      </div>
    </div>

    <!-- Save-as-list modal -->
    <Teleport to="body">
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
            class="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border border-[#c89868]/30 shadow-2xl"
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
              <p class="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-(--color-accent)">
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
    </Teleport>

    <!-- Place-order modal -->
    <Teleport to="body">
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
            class="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border border-[#c89868]/30 shadow-2xl"
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
              <p class="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-(--color-accent)">
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
    </Teleport>

    <!-- Import list modal -->
    <Teleport to="body">
      <transition name="backdrop-fade">
        <div
          v-if="checkout.importModalOpen.value"
          class="fixed inset-0 z-210 bg-black/70"
          @click="checkout.closeImportModal()"
        />
      </transition>
      <transition name="modal-pop">
        <div
          v-if="checkout.importModalOpen.value"
          class="pointer-events-none fixed inset-0 z-211 flex items-center justify-center p-4"
        >
          <div
            class="pointer-events-auto flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#c89868]/30 shadow-2xl"
            style="background: var(--color-surface)"
          >
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
              <div>
                <p class="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-(--color-accent)">
                  — Bestellijst —
                </p>
                <h3 class="text-base font-bold text-(--color-text-strong)">
                  Lijst importeren
                </h3>
              </div>
              <button
                aria-label="Sluiten"
                class="rounded-lg p-1.5 text-(--color-text-muted) transition-colors hover:bg-(--color-hover) hover:text-(--color-text-strong)"
                @click="checkout.closeImportModal()"
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
            <div class="flex-1 overflow-y-auto px-5 py-5">
              <ListsSavedListsGrid horizontal inline-edit @done="checkout.closeImportModal()" />
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Clear-cart confirm -->
    <Teleport to="body">
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
              <p class="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#b8252a]">
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
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "main" });
useHead({ title: "Winkelmandje — Vleeswaren Vermeir" });

const cart = useCart();
const checkout = useCartCheckout();

const saveInputRef = ref<HTMLInputElement | null>(null);
const orderNameInputRef = ref<HTMLInputElement | null>(null);
const confirmingRemoveId = ref<string | null>(null);

if (import.meta.client) cart.ensureLoaded();

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
