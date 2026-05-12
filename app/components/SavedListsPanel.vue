<template>
  <Teleport to="body">
    <transition name="backdrop-fade">
      <div
        v-if="orderLists.panelOpen.value"
        class="fixed inset-0 z-[190] bg-black/60 backdrop-blur-sm"
        @click="orderLists.closePanel()"
      />
    </transition>

    <transition name="drawer-slide">
      <div
        v-if="orderLists.panelOpen.value"
        class="fixed top-0 right-0 h-full z-[200] shadow-2xl flex flex-col border-l border-[#c89868]/20 transition-[width,max-width] duration-300"
        :class="
          orderLists.panelMaximized.value
            ? 'w-full max-w-none'
            : 'w-full sm:w-[28rem] max-w-full'
        "
        style="background: #1a0a0a"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-5 py-4 border-b border-white/10"
          style="background: linear-gradient(135deg, #0a0808 0%, #1a0a0a 100%)"
        >
          <div class="flex items-center gap-3 min-w-0">
            <svg
              class="w-5 h-5 text-[#c89868] shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <div class="min-w-0">
              <p
                class="uppercase tracking-[0.2em] text-[0.65rem] text-[#c89868] font-semibold"
              >
                — Bestellijsten —
              </p>
              <h2 class="font-bold text-white">Mijn bestellijsten</h2>
            </div>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button
              type="button"
              @click="switchToCart()"
              class="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[#c89868] transition-colors hover:bg-white/10 hover:text-white"
              title="Wissel naar het winkelmandje"
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
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Mandje
              <span
                v-if="cart.totalItems.value > 0"
                class="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#b8252a] px-1 text-[0.6rem] font-bold text-white"
                >{{ cart.totalItems.value }}</span
              >
            </button>
            <button
              type="button"
              @click="
                orderLists.panelMaximized.value =
                  !orderLists.panelMaximized.value
              "
              class="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              :title="
                orderLists.panelMaximized.value ? 'Verkleinen' : 'Maximaliseren'
              "
              :aria-label="
                orderLists.panelMaximized.value ? 'Verkleinen' : 'Maximaliseren'
              "
            >
              <svg
                v-if="!orderLists.panelMaximized.value"
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
              @click="orderLists.closePanel()"
              class="p-1.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Sluit"
            >
              <svg
                class="w-5 h-5"
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

        <!-- Body -->
        <div class="flex-1 overflow-y-auto">
          <div
            class="px-4 py-4 mx-auto"
            :class="orderLists.panelMaximized.value ? 'max-w-3xl' : ''"
          >
          <div
            v-if="orderLists.lists.value.length === 0"
            class="flex flex-col items-center justify-center h-full gap-4 text-center px-6 py-12"
          >
            <div
              class="w-16 h-16 rounded-full flex items-center justify-center border border-[#c89868]/30"
            >
              <svg
                class="w-7 h-7 text-[#c89868]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-white">
                Nog geen lijsten opgeslagen
              </p>
              <p class="text-xs text-[#a89a8e] mt-2 leading-relaxed">
                Voeg producten toe aan uw bestellijst en gebruik "Lijst
                opslaan" in het winkelmandje om uw selectie te bewaren voor
                later.
              </p>
            </div>
          </div>

          <div
            v-else
            :class="
              orderLists.panelMaximized.value
                ? 'grid grid-cols-1 md:grid-cols-2 gap-3'
                : 'space-y-3'
            "
          >
            <article
              v-for="list in sortedLists"
              :key="list.id"
              class="border border-white/10 bg-[#1a1414] p-4 flex flex-col gap-3"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h3 class="text-white font-semibold text-sm truncate">
                    {{ list.name }}
                  </h3>
                  <p class="text-[0.7rem] text-[#a89a8e] mt-0.5">
                    {{ list.items.length }} artikel{{
                      list.items.length !== 1 ? "en" : ""
                    }}
                    · {{ totalQty(list) }} stuks ·
                    {{ formatDate(list.updatedAt) }}
                  </p>
                </div>
                <button
                  @click="confirmDelete(list.id)"
                  class="p-1.5 text-[#a89a8e] hover:text-[#b8252a] hover:bg-white/5 transition-colors"
                  :aria-label="`Verwijder ${list.name}`"
                  title="Verwijderen"
                >
                  <svg
                    class="w-4 h-4"
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

              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="replaceCart(list.id)"
                  class="px-3 py-2 bg-[#b8252a] text-white text-[0.7rem] font-semibold uppercase tracking-[0.08em] hover:bg-[#8b1f1f] transition-colors"
                >
                  Vervang mandje
                </button>
                <button
                  @click="appendCart(list.id)"
                  class="px-3 py-2 border border-[#c89868] text-[#c89868] text-[0.7rem] font-semibold uppercase tracking-[0.08em] hover:bg-[#c89868] hover:text-[#1a0a0a] transition-colors"
                >
                  Toevoegen
                </button>
                <button
                  @click="orderLists.openEditor(list.id)"
                  class="col-span-2 px-3 py-2 border border-white/15 text-[#e8e2dc] text-[0.7rem] font-semibold uppercase tracking-[0.08em] hover:bg-white/5 transition-colors"
                >
                  Bewerken
                </button>
              </div>

              <p
                v-if="confirmId === list.id"
                class="text-[0.7rem] text-[#b8252a] flex items-center justify-between gap-2"
              >
                <span>Verwijderen?</span>
                <span class="flex gap-2">
                  <button
                    @click="orderLists.deleteList(list.id); confirmId = null"
                    class="px-2 py-0.5 bg-[#b8252a] text-white"
                  >
                    Ja
                  </button>
                  <button
                    @click="confirmId = null"
                    class="px-2 py-0.5 border border-white/20 text-[#e8e2dc]"
                  >
                    Nee
                  </button>
                </span>
              </p>
            </article>
          </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { SavedList } from "~/composables/useOrderLists";

const cart = useCart();
const orderLists = useOrderLists();

const confirmId = ref<string | null>(null);

const sortedLists = computed(() =>
  [...orderLists.lists.value].sort((a, b) => b.updatedAt - a.updatedAt),
);

function totalQty(list: SavedList): number {
  return list.items.reduce((s, i) => s + i.quantity, 0);
}

function formatDate(ts: number): string {
  try {
    return new Date(ts).toLocaleDateString("nl-BE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function confirmDelete(id: string) {
  confirmId.value = id;
}

function replaceCart(id: string) {
  const list = orderLists.getList(id);
  if (!list) return;
  cart.replaceItems(list.items.map((i) => ({ ...i })));
  orderLists.closePanel();
}

function appendCart(id: string) {
  const list = orderLists.getList(id);
  if (!list) return;
  cart.addItems(list.items.map((i) => ({ ...i })));
  orderLists.closePanel();
}

function switchToCart() {
  orderLists.closePanel();
  cart.isOpen.value = true;
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
</style>
