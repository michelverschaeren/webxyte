<template>
  <Teleport to="body">
    <transition name="backdrop-fade">
      <div
        v-if="orderLists.panelOpen.value"
        class="fixed inset-0 z-190 bg-black/60 backdrop-blur-sm"
        @click="orderLists.closePanel()"
      />
    </transition>

    <transition name="drawer-slide">
      <div
        v-if="orderLists.panelOpen.value"
        class="fixed top-0 right-0 h-full z-200 shadow-2xl flex flex-col border-l border-[#c89868]/20 transition-[width,max-width] duration-300"
        :class="
          orderLists.panelMaximized.value
            ? 'w-full max-w-none'
            : 'w-full sm:w-md max-w-full'
        "
        style="background: var(--color-surface)"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-5 py-4 border-b border-(--color-border) shrink-0"
          style="
            background: linear-gradient(
              135deg,
              var(--color-surface-strong) 0%,
              var(--color-surface) 100%
            );
          "
        >
          <!-- Breadcrumb / title area -->
          <div class="flex items-center gap-3 min-w-0">
            <svg
              class="w-5 h-5 text-(--color-accent) shrink-0"
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
                class="uppercase tracking-[0.2em] text-[0.65rem] text-(--color-accent) font-semibold"
              >
                — Bestellijsten —
              </p>
              <!-- Normal overview title -->
              <h2 v-if="!isEditing" class="font-bold text-(--color-text-strong)">
                Mijn bestellijsten
              </h2>
              <!-- Breadcrumb when editing -->
              <nav
                v-else
                class="flex items-center gap-1.5 min-w-0"
                aria-label="Breadcrumb"
              >
                <button
                  type="button"
                  @click="orderLists.closeEditor()"
                  class="font-bold text-(--color-accent) hover:text-(--color-text-strong) transition-colors whitespace-nowrap"
                >
                  Mijn bestellijsten
                </button>
                <span class="text-(--color-text-muted) select-none">/</span>
                <input
                  v-model="editorDraftName"
                  type="text"
                  class="bg-transparent text-(--color-text-strong) font-bold focus:outline-none border-b border-transparent focus:border-[#c89868]/50 py-0.5 min-w-0 truncate"
                  :class="
                    orderLists.panelMaximized.value
                      ? 'text-base max-w-64'
                      : 'text-sm max-w-40'
                  "
                  placeholder="Naam van de lijst"
                />
              </nav>
            </div>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <!-- Back button when editing -->
            <button
              v-if="isEditing"
              type="button"
              @click="orderLists.closeEditor()"
              class="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-(--color-accent) transition-colors hover:bg-(--color-hover) hover:text-(--color-text-strong)"
              title="Terug naar overzicht"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Overzicht
            </button>
            <!-- Cart switch (overview only) -->
            <button
              v-if="!isEditing"
              type="button"
              @click="switchToCart()"
              class="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-(--color-accent) transition-colors hover:bg-(--color-hover) hover:text-(--color-text-strong)"
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
              class="rounded-lg p-1.5 text-(--color-text) transition-colors hover:bg-(--color-hover) hover:text-(--color-text-strong)"
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
              class="p-1.5 text-(--color-text) hover:text-(--color-text-strong) hover:bg-(--color-hover) transition-colors"
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

        <!-- Body: inline editor when editing, otherwise list overview -->
        <ListEditorModal
          v-if="isEditing"
          :maximized="orderLists.panelMaximized.value"
          class="flex-1 min-h-0 overflow-hidden flex flex-col"
        />

        <div v-else class="flex-1 overflow-y-auto">
          <div
            class="mx-auto"
            :class="
              orderLists.panelMaximized.value
                ? 'px-8 sm:px-12 py-8'
                : 'px-4 py-4'
            "
          >
            <ListsSavedListsGrid
              :large="orderLists.panelMaximized.value"
              @done="orderLists.closePanel()"
            />
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
const cart = useCart();
const orderLists = useOrderLists();

const isEditing = computed(() => orderLists.editingListId.value !== null);
const editorDraftName = computed({
  get: () => orderLists.editorDraftName.value,
  set: (v: string) => {
    orderLists.editorDraftName.value = v;
  },
});

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

