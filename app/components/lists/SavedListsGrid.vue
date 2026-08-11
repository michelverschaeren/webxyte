<template>
  <div>
    <!-- Loading -->
    <div
      v-if="orderLists.loading.value && orderLists.lists.value.length === 0"
      class="py-12 text-center text-sm text-(--color-text-muted)"
    >
      Lijsten laden…
    </div>

    <!-- Empty -->
    <div
      v-else-if="orderLists.lists.value.length === 0"
      class="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center"
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <div>
        <p class="text-sm font-semibold text-(--color-text-strong)">
          Nog geen lijsten opgeslagen
        </p>
        <p class="mt-2 text-xs leading-relaxed text-(--color-text-muted)">
          Zet producten in uw bestellijst en gebruik "Lijst opslaan" in het
          winkelmandje om een vaste selectie te bewaren — bijvoorbeeld "Kazen"
          of "Kerstmis".
        </p>
      </div>
    </div>

    <!-- Lists -->
    <div
      v-else
      :class="
        horizontal
          ? 'space-y-3'
          : large
            ? 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'space-y-3'
      "
    >
      <ListsSavedListCard
        v-for="list in orderLists.lists.value"
        :key="list.id"
        :list="list"
        :large="large"
        :horizontal="horizontal"
        :inline-edit="inlineEdit"
        selectable
        :selected="selected.includes(list.id)"
        @toggle="toggle(list.id)"
        @append="appendCart(list.id, $event)"
        @edit="orderLists.openEditor(list.id)"
        @delete="orderLists.deleteList(list.id)"
      />
    </div>

    <!-- Combine action bar -->
    <Transition name="bar-slide">
      <div
        v-if="selected.length > 0"
        class="sticky bottom-0 z-10 -mx-1 mt-4 flex flex-wrap items-center gap-3 border-t border-[#c89868]/30 bg-(--color-surface-strong) px-4 py-3"
      >
        <p class="text-xs text-(--color-text)">
          <span class="font-semibold text-(--color-accent)">{{ selected.length }}</span>
          lijst{{ selected.length !== 1 ? "en" : "" }} geselecteerd ·
          {{ mergedItems.length }} artikel{{
            mergedItems.length !== 1 ? "en" : ""
          }}
        </p>
        <div class="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            class="px-3 py-2 text-[0.7rem] font-semibold tracking-[0.08em] text-(--color-text-muted) uppercase transition-colors hover:text-(--color-text-strong)"
            @click="selected = []"
          >
            Wissen
          </button>
          <button
            type="button"
            :disabled="mergedItems.length === 0"
            class="rounded-lg bg-[#b8252a] px-4 py-2 text-[0.7rem] font-semibold tracking-[0.08em] text-white uppercase transition-colors hover:bg-[#8b1f1f] disabled:cursor-not-allowed disabled:opacity-40"
            @click="addSelectedToCart()"
          >
            Toevoegen aan winkelmandje
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { SavedListItem } from "~/composables/useOrderLists";

defineProps<{ large?: boolean; horizontal?: boolean; inlineEdit?: boolean }>();
const emit = defineEmits<{ done: [] }>();

const cart = useCart();
const orderLists = useOrderLists();

const selected = ref<string[]>([]);

const mergedItems = computed(() => orderLists.mergeLists(selected.value));

function toggle(id: string) {
  const idx = selected.value.indexOf(id);
  if (idx === -1) selected.value.push(id);
  else selected.value.splice(idx, 1);
}

function appendCart(id: string, items?: SavedListItem[]) {
  const source = items ?? orderLists.getList(id)?.items;
  if (!source) return;
  cart.addItems(toCartItems(source.filter((i) => i.available !== false)));
  emit("done");
}

function addSelectedToCart() {
  cart.addItems(toCartItems(mergedItems.value));
  selected.value = [];
  emit("done");
}
</script>

<style scoped>
.bar-slide-enter-active,
.bar-slide-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.bar-slide-enter-from,
.bar-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
