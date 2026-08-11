<template>
  <AccountShell
    title="Mijn lijsten"
    subtitle="Bewaar vaste selecties — bijvoorbeeld 'Kazen' of 'Kerstmis' — en zet ze in één klik in uw winkelmandje."
  >
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <p class="text-sm text-(--color-text-muted)">
        Vink meerdere lijsten aan om ze samen aan uw mandje toe te voegen.
      </p>
      <NuxtLink
        to="/winkelmandje"
        class="ml-auto rounded-lg border border-[#c89868] px-4 py-2 text-[0.7rem] font-semibold tracking-[0.08em] text-(--color-accent) uppercase transition-colors hover:bg-[#c89868] hover:text-[#1a0a0a]"
      >
        Winkelmandje ({{ cart.totalItems.value }})
      </NuxtLink>
    </div>

    <ListsSavedListsGrid horizontal inline-edit @done="navigateTo('/winkelmandje')" />
  </AccountShell>
</template>

<script setup lang="ts">
definePageMeta({ layout: "main", middleware: "account" });
useHead({ title: "Mijn lijsten — Vleeswaren Vermeir" });

const cart = useCart();
const orderLists = useOrderLists();

await useAsyncData("account:lists", () => orderLists.fetchLists());

onBeforeUnmount(() => orderLists.closeEditor());
</script>
