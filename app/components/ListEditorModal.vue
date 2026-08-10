<template>
  <!-- Inline editor — rendered inside SavedListsPanel, no modal/teleport -->
  <div class="flex flex-col h-full">
    <!-- Items -->
    <div
      class="flex-1 overflow-y-auto"
      :class="maximized ? 'px-8 sm:px-12 py-6' : 'px-4 py-4'"
    >
      <div :class="maximized ? 'max-w-4xl mx-auto space-y-3' : 'space-y-2'">
        <div
          v-if="draftItems.length === 0"
          class="py-10 text-center text-sm text-(--color-text-muted)"
        >
          Deze lijst is leeg.
        </div>

        <div
          v-for="(item, idx) in draftItems"
          :key="item.id"
          class="flex items-center gap-3 border border-(--color-border) bg-(--color-surface)"
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
              <span class="font-mono text-[#c89868]">{{ item.articleNr }}</span>
              · {{ item.supplier }}
              <span v-if="item.unit"> · {{ item.unit }}</span>
            </p>
          </div>

          <div class="flex items-center select-none shrink-0">
            <button
              type="button"
              @click="updateQty(idx, item.quantity - 1)"
              class="text-[#c89868] hover:bg-(--color-hover) transition-colors border border-(--color-border)"
              :class="maximized ? 'w-10 h-10 text-xl' : 'w-8 h-8 text-lg'"
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
              class="bg-transparent text-center text-(--color-text) focus:outline-none border-y border-(--color-border) [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              :class="maximized ? 'w-16 h-10 text-base' : 'w-12 h-8 text-sm'"
            />
            <button
              type="button"
              @click="updateQty(idx, item.quantity + 1)"
              class="text-[#c89868] hover:bg-(--color-hover) transition-colors border border-(--color-border)"
              :class="maximized ? 'w-10 h-10 text-xl' : 'w-8 h-8 text-lg'"
            >
              +
            </button>
          </div>

          <button
            @click="removeItem(idx)"
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
      class="border-t border-(--color-border) flex flex-col gap-2 shrink-0"
      :class="maximized ? 'px-8 sm:px-12 py-5' : 'px-5 py-4'"
      style="background: var(--color-surface-strong)"
    >
      <div :class="maximized ? 'max-w-4xl mx-auto w-full space-y-3' : ''">
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            :disabled="draftItems.length === 0"
            @click="replaceCart()"
            class="bg-[#b8252a] text-white font-semibold uppercase tracking-[0.08em] hover:bg-[#8b1f1f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            :class="
              maximized ? 'px-4 py-3 text-xs' : 'px-3 py-2.5 text-[0.7rem]'
            "
          >
            Vervang mandje
          </button>
          <button
            type="button"
            :disabled="draftItems.length === 0"
            @click="appendCart()"
            class="border border-[#c89868] text-[#c89868] font-semibold uppercase tracking-[0.08em] hover:bg-[#c89868] hover:text-[#1a0a0a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            :class="
              maximized ? 'px-4 py-3 text-xs' : 'px-3 py-2.5 text-[0.7rem]'
            "
          >
            Voeg toe aan mandje
          </button>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            @click="saveChanges()"
            :disabled="!isDirty || saving"
            class="flex-1 border border-(--color-border-strong) text-(--color-text) font-semibold uppercase tracking-[0.08em] hover:bg-(--color-hover) transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
import type { SavedListItem } from "~/composables/useOrderLists";

const props = defineProps<{
  maximized?: boolean;
}>();

const cart = useCart();
const orderLists = useOrderLists();

const sourceList = computed(() => {
  const id = orderLists.editingListId.value;
  return id ? (orderLists.getList(id) ?? null) : null;
});

const draftItems = ref<SavedListItem[]>([]);

const isDirty = computed(() => {
  if (!sourceList.value) return false;
  if (sourceList.value.name !== orderLists.editorDraftName.value.trim())
    return true;
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
      return;
    }
    const list = orderLists.getList(id);
    if (!list) return;
    draftItems.value = list.items.map((i) => ({ ...i }));
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

const saving = ref(false);

async function saveChanges() {
  const id = orderLists.editingListId.value;
  if (!id || saving.value) return;
  saving.value = true;
  try {
    await orderLists.updateList(id, {
      name: orderLists.editorDraftName.value,
      items: draftItems.value.map((i) => ({ ...i })),
    });
  } finally {
    saving.value = false;
  }
}

function replaceCart() {
  cart.replaceItems(toCartItems(draftItems.value));
  orderLists.closeEditor();
  orderLists.closePanel();
}

function appendCart() {
  cart.addItems(toCartItems(draftItems.value));
  orderLists.closeEditor();
  orderLists.closePanel();
}
</script>
