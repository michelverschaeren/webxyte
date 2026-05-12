<template>
  <Teleport to="body">
    <transition name="backdrop-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-210 bg-black/70 backdrop-blur-sm"
        @click="close()"
      />
    </transition>

    <transition name="modal-pop">
      <div
        v-if="open"
        class="fixed inset-0 z-211 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          class="pointer-events-auto w-full max-w-2xl max-h-[90vh] flex flex-col border border-[#c89868]/30 shadow-2xl"
          style="background: #1a0a0a"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between px-5 py-4 border-b border-white/10"
            style="background: linear-gradient(135deg, #0a0808 0%, #1a0a0a 100%)"
          >
            <div class="min-w-0 flex-1">
              <p
                class="uppercase tracking-[0.2em] text-[0.65rem] text-[#c89868] font-semibold"
              >
                — Bestellijst bewerken —
              </p>
              <input
                v-model="draftName"
                type="text"
                class="w-full bg-transparent text-white font-semibold text-base focus:outline-none border-b border-transparent focus:border-[#c89868]/50 py-0.5"
                placeholder="Naam van de lijst"
              />
            </div>
            <button
              @click="close()"
              class="ml-3 p-1.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0"
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

          <!-- Items -->
          <div class="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            <div
              v-if="draftItems.length === 0"
              class="py-10 text-center text-sm text-[#a89a8e]"
            >
              Deze lijst is leeg.
            </div>

            <div
              v-for="(item, idx) in draftItems"
              :key="item.id"
              class="flex items-center gap-3 p-3 border border-white/10 bg-[#1a1414]"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm text-white font-semibold truncate">
                  {{ item.name }}
                </p>
                <p class="text-[0.7rem] text-[#a89a8e]">
                  <span class="font-mono text-[#c89868]">{{
                    item.articleNr
                  }}</span>
                  · {{ item.supplier }}
                  <span v-if="item.unit"> · {{ item.unit }}</span>
                </p>
              </div>

              <div class="flex items-center select-none shrink-0">
                <button
                  type="button"
                  @click="updateQty(idx, item.quantity - 1)"
                  class="w-8 h-8 text-[#c89868] hover:bg-white/4 transition-colors text-lg border border-white/10"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  :value="item.quantity"
                  @input="
                    updateQty(
                      idx,
                      Number(($event.target as HTMLInputElement).value),
                    )
                  "
                  class="w-12 h-8 bg-transparent text-center text-sm text-[#e8e2dc] focus:outline-none border-y border-white/10 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  @click="updateQty(idx, item.quantity + 1)"
                  class="w-8 h-8 text-[#c89868] hover:bg-white/4 transition-colors text-lg border border-white/10"
                >
                  +
                </button>
              </div>

              <button
                @click="removeItem(idx)"
                class="p-1.5 text-[#a89a8e] hover:text-[#b8252a] transition-colors shrink-0"
                title="Verwijderen"
                aria-label="Verwijderen"
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
          </div>

          <!-- Footer -->
          <div
            class="border-t border-white/10 px-5 py-4 flex flex-col gap-2"
            style="background: #0a0808"
          >
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                :disabled="draftItems.length === 0"
                @click="replaceCart()"
                class="px-3 py-2.5 bg-[#b8252a] text-white text-[0.7rem] font-semibold uppercase tracking-[0.08em] hover:bg-[#8b1f1f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Vervang mandje
              </button>
              <button
                type="button"
                :disabled="draftItems.length === 0"
                @click="appendCart()"
                class="px-3 py-2.5 border border-[#c89868] text-[#c89868] text-[0.7rem] font-semibold uppercase tracking-[0.08em] hover:bg-[#c89868] hover:text-[#1a0a0a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Voeg toe aan mandje
              </button>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                @click="saveChanges()"
                :disabled="!isDirty"
                class="flex-1 px-3 py-2 border border-white/15 text-[#e8e2dc] text-[0.7rem] font-semibold uppercase tracking-[0.08em] hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Wijzigingen opslaan
              </button>
              <button
                type="button"
                @click="close()"
                class="px-4 py-2 text-[0.7rem] font-medium text-[#a89a8e] hover:text-white transition-colors"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { SavedListItem } from "~/composables/useOrderLists";

const cart = useCart();
const orderLists = useOrderLists();

const open = computed(() => orderLists.editingListId.value !== null);

const sourceList = computed(() => {
  const id = orderLists.editingListId.value;
  return id ? (orderLists.getList(id) ?? null) : null;
});

const draftItems = ref<SavedListItem[]>([]);
const draftName = ref("");

const isDirty = computed(() => {
  if (!sourceList.value) return false;
  if (sourceList.value.name !== draftName.value.trim()) return true;
  if (sourceList.value.items.length !== draftItems.value.length) return true;
  return sourceList.value.items.some((orig, i) => {
    const cur = draftItems.value[i];
    return !cur || cur.id !== orig.id || cur.quantity !== orig.quantity;
  });
});

watch(
  () => orderLists.editingListId.value,
  (id) => {
    if (!id) {
      draftItems.value = [];
      draftName.value = "";
      return;
    }
    const list = orderLists.getList(id);
    if (!list) return;
    draftItems.value = list.items.map((i) => ({ ...i }));
    draftName.value = list.name;
  },
  { immediate: true },
);

function updateQty(idx: number, qty: number) {
  const item = draftItems.value[idx];
  if (!item) return;
  const v = Number.isFinite(qty) ? Math.floor(qty) : 1;
  if (v <= 0) {
    draftItems.value.splice(idx, 1);
  } else {
    item.quantity = v;
  }
}

function removeItem(idx: number) {
  draftItems.value.splice(idx, 1);
}

function close() {
  orderLists.closeEditor();
}

function saveChanges() {
  const id = orderLists.editingListId.value;
  if (!id) return;
  orderLists.updateList(id, {
    name: draftName.value,
    items: draftItems.value.map((i) => ({ ...i })),
  });
}

function replaceCart() {
  cart.replaceItems(draftItems.value.map((i) => ({ ...i })));
  close();
  orderLists.closePanel();
}

function appendCart() {
  cart.addItems(draftItems.value.map((i) => ({ ...i })));
  close();
  orderLists.closePanel();
}
</script>

<style scoped>
.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
  transition: opacity 0.2s ease;
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
