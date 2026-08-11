<template>
  <!-- Inline editor — rendered inside SavedListsPanel or SavedListCard, no modal/teleport -->
  <div class="flex flex-col h-full">
    <!-- Items -->
    <div
      class="flex-1 overflow-y-auto"
      :class="maximized ? 'px-8 sm:px-12 py-6' : 'px-4 py-4'"
    >
      <div :class="maximized ? 'max-w-4xl mx-auto space-y-3' : 'space-y-2'">
        <div
          v-if="orderLists.draftItems.value.length === 0"
          class="py-10 text-center text-sm text-(--color-text-muted)"
        >
          Deze lijst is leeg.
        </div>

        <div
          v-for="(item, idx) in orderLists.draftItems.value"
          :key="item.id"
          class="flex items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface)"
          :class="maximized ? 'p-4' : 'p-3'"
        >
          <div class="flex-1 min-w-0">
            <p
              class="text-(--color-text-strong) font-semibold truncate"
              :class="maximized ? 'text-base' : 'text-sm'"
            >
              {{ item.name }}
            </p>
            <p
              :class="maximized ? 'text-xs' : 'text-[0.7rem]'"
              class="text-(--color-text-muted)"
            >
              <span class="font-mono text-(--color-accent)">{{ item.articleNr }}</span>
              · {{ item.supplier }}
              <span v-if="item.unit"> · {{ item.unit }}</span>
            </p>
          </div>

          <div class="flex items-center select-none shrink-0">
            <button
              type="button"
              @click="orderLists.updateDraftQty(idx, item.quantity - 1)"
              class="text-(--color-accent) hover:bg-(--color-hover) transition-colors border border-(--color-border) rounded-l-lg"
              :class="maximized ? 'w-10 h-10 text-xl' : 'w-8 h-8 text-lg'"
            >
              −
            </button>
            <input
              type="number"
              min="1"
              :value="item.quantity"
              @input="
                orderLists.updateDraftQty(
                  idx,
                  Number(($event.target as HTMLInputElement).value),
                )
              "
              class="bg-transparent text-center text-(--color-text) focus:outline-none border-y border-(--color-border) [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              :class="maximized ? 'w-16 h-10 text-base' : 'w-12 h-8 text-sm'"
            />
            <button
              type="button"
              @click="orderLists.updateDraftQty(idx, item.quantity + 1)"
              class="text-(--color-accent) hover:bg-(--color-hover) transition-colors border border-(--color-border) rounded-r-lg"
              :class="maximized ? 'w-10 h-10 text-xl' : 'w-8 h-8 text-lg'"
            >
              +
            </button>
          </div>

          <button
            @click="orderLists.removeDraftItem(idx)"
            class="text-(--color-text-muted) hover:text-[#b8252a] transition-colors shrink-0"
            :class="maximized ? 'p-2' : 'p-1.5'"
            title="Verwijderen"
            aria-label="Verwijderen"
          >
            <svg
              :class="maximized ? 'w-5 h-5' : 'w-4 h-4'"
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
    </div>

    <!-- Footer -->
    <div
      v-if="!bare"
      class="border-t border-(--color-border) flex flex-col gap-2 shrink-0"
      :class="maximized ? 'px-8 sm:px-12 py-5' : 'px-5 py-4'"
      style="background: var(--color-surface-strong)"
    >
      <div :class="maximized ? 'max-w-4xl mx-auto w-full space-y-3' : ''">
        <div class="grid grid-cols-1 gap-2">
          <button
            type="button"
            :disabled="orderLists.draftItems.value.length === 0"
            @click="appendCart()"
            class="rounded-lg border border-[#c89868] text-(--color-accent) font-semibold uppercase tracking-[0.08em] hover:bg-[#c89868] hover:text-[#1a0a0a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            :class="
              maximized ? 'px-4 py-3 text-xs' : 'px-3 py-2.5 text-[0.7rem]'
            "
          >
            Toevoegen aan winkelmandje
          </button>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            @click="saveChanges()"
            :disabled="!orderLists.isDraftDirty.value || saving"
            class="flex-1 rounded-lg border border-(--color-border-strong) text-(--color-text) font-semibold uppercase tracking-[0.08em] hover:bg-(--color-hover) transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            :class="maximized ? 'px-4 py-3 text-xs' : 'px-3 py-2 text-[0.7rem]'"
          >
            {{ saving ? "Opslaan…" : "Wijzigingen opslaan" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { maximized, bare } = defineProps<{
  maximized?: boolean;
  /** Verbergt de eigen footer-knoppen — gebruikt wanneer de heading van
   * SavedListCard die acties al aanbiedt. */
  bare?: boolean;
}>();

const cart = useCart();
const orderLists = useOrderLists();

const saving = ref(false);

async function saveChanges() {
  if (saving.value) return;
  saving.value = true;
  try {
    await orderLists.saveDraft();
  } finally {
    saving.value = false;
  }
}

function appendCart() {
  cart.addItems(toCartItems(orderLists.draftItems.value));
  orderLists.closeEditor();
  orderLists.closePanel();
}
</script>
