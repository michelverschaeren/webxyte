<template>
  <AccountShell
    title="Mijn lijsten"
    subtitle="Bewaar vaste selecties — bijvoorbeeld 'Kazen' of 'Kerstmis' — en zet ze in één klik in uw winkelmandje."
  >
    <!-- Editor -->
    <section v-if="isEditing" class="border border-white/10 bg-[#150f0f]">
      <div
        class="flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-6"
      >
        <button
          type="button"
          class="text-xs font-semibold tracking-[0.08em] text-[#c89868] uppercase transition-colors hover:text-white"
          @click="orderLists.closeEditor()"
        >
          ← Overzicht
        </button>
        <span class="text-white/20">/</span>
        <input
          v-model="editorDraftName"
          type="text"
          class="min-w-0 flex-1 border-b border-transparent bg-transparent py-1 font-semibold text-white focus:border-[#c89868]/50 focus:outline-none"
          placeholder="Naam van de lijst"
        />
      </div>
      <ListEditorModal class="min-h-100" />
    </section>

    <!-- Overview -->
    <template v-else>
      <div class="mb-6 flex flex-wrap items-center gap-3">
        <p class="text-sm text-[#a89a8e]">
          Vink meerdere lijsten aan om ze samen aan uw mandje toe te voegen.
        </p>
        <button
          type="button"
          class="ml-auto border border-[#c89868] px-4 py-2 text-[0.7rem] font-semibold tracking-[0.08em] text-[#c89868] uppercase transition-colors hover:bg-[#c89868] hover:text-[#1a0a0a]"
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
