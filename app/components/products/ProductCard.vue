<template>
  <div
    class="group rounded-xl border border-site bg-surface hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden flex flex-col"
  >
    <!-- Color top bar -->
    <div
      class="h-1 w-full"
      style="
        background: linear-gradient(
          90deg,
          var(--color-primary),
          var(--color-primary-light)
        );
      "
    />

    <div class="p-4 flex flex-col gap-2 flex-1">
      <!-- Article nr + supplier row -->
      <div class="flex items-center justify-between gap-2 text-xs text-muted">
        <span class="font-mono bg-surface-2 px-2 py-0.5 rounded-md">{{
          product.articleNr
        }}</span>
        <span class="truncate text-right">{{ product.supplier }}</span>
      </div>

      <!-- Name -->
      <p class="text-sm font-semibold text-site leading-snug flex-1">
        {{ product.name }}
      </p>

      <!-- Category badge -->
      <div>
        <span
          class="inline-block text-xs px-2 py-0.5 rounded-full"
          style="
            background: var(--color-surface-2);
            color: var(--color-text-muted);
          "
        >
          {{ categoryName }}
        </span>
      </div>
    </div>

    <!-- Add button -->
    <div class="px-4 pb-4">
      <button
        @click="addToCart"
        class="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:shadow-md active:scale-95"
        style="
          background: linear-gradient(
            135deg,
            var(--color-primary-dark),
            var(--color-primary)
          );
        "
        :class="justAdded ? 'opacity-80' : ''"
      >
        <svg
          v-if="!justAdded"
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
        {{ justAdded ? "Toegevoegd!" : "Toevoegen" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product } from "~/data/products";
import { categories } from "~/data/categories";

const props = defineProps<{ product: Product }>();
const cart = useCart();
const justAdded = ref(false);

const categoryName = computed(
  () => categories.find((c) => c.id === props.product.categoryId)?.name ?? "",
);

function addToCart() {
  cart.addItem({
    id: props.product.id,
    articleNr: props.product.articleNr,
    name: props.product.name,
    supplier: props.product.supplier,
  });
  justAdded.value = true;
  setTimeout(() => {
    justAdded.value = false;
  }, 1500);
}
</script>
