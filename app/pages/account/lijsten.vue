<template>
  <AccountShell
    title="Mijn lijsten"
    subtitle="Bewaar vaste selecties — bijvoorbeeld 'Kazen' of 'Kerstmis' — en zet ze in één klik in uw winkelmandje."
  >
    <!-- Editor -->
    <section v-if="isEditing" class="border border-(--color-border) bg-(--color-surface-2)">
      <div
        class="flex flex-wrap items-center gap-3 border-b border-(--color-border) px-4 py-3 sm:px-6"
      >
        <button
          type="button"
          class="text-xs font-semibold tracking-[0.08em] text-(--color-accent) uppercase transition-colors hover:text-(--color-text-strong)"
          @click="orderLists.closeEditor()"
        >
          ← Overzicht
        </button>
        <span class="text-(--color-text-muted)">/</span>
        <input
          v-model="editorDraftName"
          type="text"
          class="min-w-0 flex-1 border-b border-transparent bg-transparent py-1 font-semibold text-(--color-text-strong) focus:border-[#c89868]/50 focus:outline-none"
          placeholder="Naam van de lijst"
        />
      </div>
      <ListEditorModal class="min-h-100" />
    </section>

    <!-- Overview -->
    <template v-else>
      <div class="mb-6 flex flex-wrap items-center gap-3">
        <p class="text-sm text-(--color-text-muted)">
          Vink meerdere lijsten aan om ze samen aan uw mandje toe te voegen.
        </p>
        <button
          type="button"
          class="ml-auto border border-[#c89868] px-4 py-2 text-[0.7rem] font-semibold tracking-[0.08em] text-(--color-accent) uppercase transition-colors hover:bg-[#c89868] hover:text-[#1a0a0a]"
          @click="cart.isOpen.value = true"
        >
          Winkelmandje ({{ cart.totalItems.value }})
        </button>
      </div>

      <ListsSavedListsGrid large @done="cart.isOpen.value = true" />
    </template>
  </AccountShell>
</template>

<script setup lang="ts">
definePageMeta({ layout: "main", middleware: "account" });
useHead({ title: "Mijn lijsten — Vleeswaren Vermeir" });

const cart = useCart();
const orderLists = useOrderLists();

const isEditing = computed(() => orderLists.editingListId.value !== null);
const editorDraftName = computed({
  get: () => orderLists.editorDraftName.value,
  set: (v: string) => {
    orderLists.editorDraftName.value = v;
  },
});

await useAsyncData("account:lists", () => orderLists.fetchLists());

onBeforeUnmount(() => orderLists.closeEditor());
</script>
