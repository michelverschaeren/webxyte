<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <transition name="backdrop-fade">
      <div
        v-if="cart.isOpen.value"
        class="fixed inset-0 z-190 bg-black/40 backdrop-blur-sm"
        @click="cart.isOpen.value = false"
      />
    </transition>

    <!-- Drawer -->
    <transition name="drawer-slide">
      <div
        v-if="cart.isOpen.value"
        class="fixed top-0 right-0 z-200 flex h-full flex-col shadow-2xl transition-[width,max-width] duration-300"
        :class="
          cart.isMaximized.value
            ? 'w-full max-w-none'
            : 'w-full sm:w-96 max-w-full'
        "
        style="background: #1a0a0a"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between border-b border-white/10 px-5 py-4"
          style="background: linear-gradient(135deg, #0a0808 0%, #1a0a0a 100%)"
        >
          <div class="flex items-center gap-3 min-w-0">
            <svg
              class="h-5 w-5 text-[#c89868] shrink-0"
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
            <h2 class="font-bold text-white">Bestellijst</h2>
            <span class="text-xs text-[#a89a8e]"
              >({{ cart.totalItems.value }} artikel{{
                cart.totalItems.value !== 1 ? "en" : ""
              }})</span
            >
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button
              type="button"
              @click="openLists()"
              class="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-white/90 transition-colors hover:bg-white/10 hover:text-white"
              title="Wissel naar mijn bestellijsten"
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
              type="button"
              @click="cart.isMaximized.value = !cart.isMaximized.value"
              class="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              :title="cart.isMaximized.value ? 'Verkleinen' : 'Maximaliseren'"
              :aria-label="
                cart.isMaximized.value ? 'Verkleinen' : 'Maximaliseren'
              "
            >
              <svg
                v-if="!cart.isMaximized.value"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"
                />
              </svg>
              <svg
                v-else
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 9H5m5-4v4m5 0h4m-4 0V5m-5 10H5m5 4v-4m5 0h4m-4 0v4"
                />
              </svg>
            </button>
            <button
              @click="cart.isOpen.value = false"
              class="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Sluit"
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
          <div
            class="space-y-3 px-4 py-4 mx-auto"
            :class="cart.isMaximized.value ? 'max-w-3xl' : ''"
          >
          <!-- Empty state -->
          <div
            v-if="cart.items.value.length === 0"
            class="flex h-48 flex-col items-center justify-center gap-4 text-center"
          >
            <div
              class="flex h-16 w-16 items-center justify-center rounded-full border border-[#c89868]/30"
            >
              <svg
                class="h-7 w-7 text-[#c89868]"
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
              <p class="text-sm font-semibold text-white">
                Uw bestellijst is leeg
              </p>
              <p class="mt-1 text-xs text-[#a89a8e]">
                Voeg producten toe via het productenoverzicht
              </p>
            </div>
          </div>

          <!-- Cart items -->
          <div
            v-for="item in cart.items.value"
            :key="item.id"
            class="flex items-start gap-3 border border-white/10 bg-[#1a1414] p-3"
          >
            <!-- Icon -->
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center text-xs font-bold text-white"
              style="background: linear-gradient(135deg, #8b1f1f, #b8252a)"
            >
              {{ item.articleNr.slice(-2) }}
            </div>

            <div class="min-w-0 flex-1">
              <p class="truncate text-sm leading-snug font-semibold text-white">
                {{ item.name }}
              </p>
              <p class="text-xs text-[#a89a8e]">{{ item.supplier }}</p>
              <p v-if="item.unit" class="mt-0.5 text-xs text-[#c89868]">
                {{ item.unit }}
              </p>
              <p class="mt-0.5 font-mono text-xs text-[#c89868]">
                {{ item.articleNr }}
              </p>
            </div>

            <!-- Quantity + remove -->
            <div class="flex shrink-0 flex-col items-end gap-2">
              <button
                @click="cart.removeItem(item.id)"
                class="p-1 text-[#a89a8e] transition-colors hover:bg-white/5 hover:text-[#b8252a]"
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
                  @click="cart.updateQuantity(item.id, item.quantity - 1)"
                  class="flex h-7 w-7 items-center justify-center border border-white/10 text-sm font-bold text-[#c89868] transition-colors hover:bg-white/5"
                >
                  −
                </button>
                <span class="w-8 text-center text-sm font-semibold text-white">{{
                  item.quantity
                }}</span>
                <button
                  @click="cart.updateQuantity(item.id, item.quantity + 1)"
                  class="flex h-7 w-7 items-center justify-center border border-white/10 text-sm font-bold text-[#c89868] transition-colors hover:bg-white/5"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="border-t border-white/10 px-5 py-4"
          style="background: #0a0808"
        >
          <div
            class="space-y-3 mx-auto"
            :class="cart.isMaximized.value ? 'max-w-3xl' : ''"
          >
          <div
            v-if="cart.items.value.length > 0"
            class="flex justify-between text-sm"
          >
            <span class="text-[#a89a8e]">Totaal artikelen</span>
            <span class="font-bold text-white">{{ cart.totalItems.value }}</span>
          </div>

          <button
            v-if="cart.items.value.length > 0"
            :disabled="placing"
            class="w-full bg-[#b8252a] py-3.5 text-sm font-semibold tracking-widest text-white uppercase transition-colors hover:bg-[#8b1f1f] disabled:cursor-not-allowed disabled:opacity-50"
            @click="placeOrder()"
          >
            {{ placing ? "Bezig met versturen…" : "Bestelling bevestigen" }}
          </button>

          <p v-if="orderError" class="text-center text-xs text-[#e06a6a]">
            {{ orderError }}
          </p>

          <!-- Lists actions -->
          <div class="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              :disabled="cart.items.value.length === 0"
              @click="openSaveModal()"
              class="border border-[#c89868] px-3 py-2 text-xs font-semibold tracking-[0.08em] text-[#c89868] uppercase transition-colors hover:bg-[#c89868] hover:text-[#1a0a0a] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Lijst opslaan
            </button>
            <button
              type="button"
              @click="openLists()"
              class="border border-white/15 px-3 py-2 text-xs font-semibold tracking-[0.08em] text-[#e8e2dc] uppercase transition-colors hover:bg-white/5"
            >
              Mijn lijsten
            </button>
          </div>

          <button
            v-if="cart.items.value.length > 0"
            @click="cart.clearCart()"
            class="w-full py-2 text-xs font-medium text-[#a89a8e] transition-colors hover:bg-white/5 hover:text-white"
          >
            Bestellijst wissen
          </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Save-as-list modal -->
    <transition name="backdrop-fade">
      <div
        v-if="saveModalOpen"
        class="fixed inset-0 z-210 bg-black/70 backdrop-blur-sm"
        @click="closeSaveModal()"
      />
    </transition>
    <transition name="modal-pop">
      <div
        v-if="saveModalOpen"
        class="pointer-events-none fixed inset-0 z-211 flex items-center justify-center p-4"
      >
        <div
          class="pointer-events-auto w-full max-w-md border border-[#c89868]/30 shadow-2xl"
          style="background: #1a0a0a"
        >
          <div
            class="border-b border-white/10 px-5 py-4"
            style="background: linear-gradient(135deg, #0a0808 0%, #1a0a0a 100%)"
          >
            <p
              class="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#c89868]"
            >
              — Bestellijst —
            </p>
            <h3 class="text-base font-bold text-white">
              Lijst opslaan voor later
            </h3>
          </div>
          <form @submit.prevent="confirmSave()" class="space-y-4 px-5 py-5">
            <label class="block">
              <span class="mb-2 block text-xs font-medium text-[#a89a8e]"
                >Naam van de lijst</span
              >
              <input
                ref="saveInputRef"
                v-model="saveName"
                type="text"
                maxlength="60"
                required
                placeholder="bv. Wekelijkse bestelling"
                class="w-full border border-white/15 bg-[#0f0808] px-3 py-2.5 text-sm text-white placeholder-[#a89a8e]/60 focus:border-[#c89868] focus:outline-none"
              />
            </label>
            <p class="text-[0.7rem] text-[#a89a8e]">
              {{ cart.totalItems.value }} stuks in
              {{ cart.items.value.length }} artikel{{
                cart.items.value.length !== 1 ? "en" : ""
              }}
              worden bewaard.
            </p>
            <div class="flex justify-end gap-2 pt-1">
              <button
                type="button"
                @click="closeSaveModal()"
                class="px-4 py-2 text-xs font-medium text-[#a89a8e] hover:text-white"
              >
                Annuleren
              </button>
              <button
                type="submit"
                :disabled="!saveName.trim()"
                class="bg-[#b8252a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#8b1f1f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Opslaan
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
const cart = useCart();
const orderLists = useOrderLists();
const auth = useAuth();
const authModal = useAuthModal();

const placing = ref(false);
const orderError = ref("");

const saveModalOpen = ref(false);
const saveName = ref("");
const saveInputRef = ref<HTMLInputElement | null>(null);

/** Lijsten en bestellen horen bij een account: eerst inloggen. */
function requireLogin(): boolean {
  if (auth.isLoggedIn.value) return true;
  authModal.open("login");
  return false;
}

async function placeOrder() {
  if (placing.value || cart.items.value.length === 0) return;
  orderError.value = "";
  if (!requireLogin()) return;

  placing.value = true;
  try {
    const order = await $fetch<{ id: string }>("/api/account/orders", {
      method: "POST",
      body: {
        items: cart.items.value.map((i) => ({
          articleNr: i.articleNr,
          quantity: i.quantity,
        })),
      },
    });

    cart.clearCart();
    cart.isOpen.value = false;
    await navigateTo(`/account/bestellingen/${order.id}`);
  } catch (err) {
    const error = err as {
      statusMessage?: string;
      data?: { statusMessage?: string; data?: { names?: string[] } };
    };
    const code = error.data?.statusMessage ?? error.statusMessage;

    if (code === "FACTURATIEGEGEVENS_ONTBREKEN") {
      cart.isOpen.value = false;
      await navigateTo("/account/gegevens?next=cart");
      return;
    }

    if (code === "PRODUCTEN_NIET_BESCHIKBAAR") {
      const names = error.data?.data?.names ?? [];
      orderError.value = `Niet meer beschikbaar: ${names.join(", ")}. Verwijder deze artikelen en probeer opnieuw.`;
      return;
    }

    orderError.value = "Bestellen mislukt. Probeer het straks opnieuw.";
  } finally {
    placing.value = false;
  }
}

function openSaveModal() {
  if (cart.items.value.length === 0) return;
  if (!requireLogin()) return;
  saveName.value = defaultListName();
  saveModalOpen.value = true;
  nextTick(() => saveInputRef.value?.focus());
}

function closeSaveModal() {
  saveModalOpen.value = false;
}

function defaultListName(): string {
  const d = new Date();
  return `Lijst ${d.toLocaleDateString("nl-BE", { day: "2-digit", month: "short" })}`;
}

async function confirmSave() {
  const name = saveName.value.trim();
  if (!name || !requireLogin()) return;

  await orderLists.saveCart(
    name,
    cart.items.value.map((i) => ({
      id: i.id,
      articleNr: i.articleNr,
      name: i.name,
      supplier: i.supplier,
      unit: i.unit,
      quantity: i.quantity,
    })),
  );
  saveModalOpen.value = false;
}

function openLists() {
  if (!requireLogin()) return;
  cart.isOpen.value = false;
  orderLists.openPanel();
}
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

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
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
