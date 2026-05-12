<template>
  <div
    class="flex flex-col gap-1 p-1 rounded-2xl border border-site overflow-y-auto bg-surface"
    style="max-height: calc(100vh - 6rem)"
  >
    <!-- All -->
    <button
      @click="$emit('select', null)"
      class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all duration-150"
      :class="selected === null ? 'text-white' : 'text-site hover:bg-surface-2'"
      :style="
        selected === null
          ? `background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));`
          : ''
      "
    >
      <span class="text-xl w-6 text-center">🛒</span>
      <span>Alle producten</span>
      <span
        class="ml-auto text-xs px-1.5 py-0.5 rounded-full font-semibold"
        :style="
          selected === null
            ? 'background:rgba(255,255,255,0.2); color:#fff;'
            : `background: var(--color-surface-2); color: var(--color-text-muted);`
        "
        >{{ totalCount }}</span
      >
    </button>

    <div class="h-px my-1" style="background: var(--color-border)" />

    <!-- Categories -->
    <button
      v-for="cat in categories"
      :key="cat.id"
      @click="$emit('select', cat.id)"
      class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all duration-150"
      :class="
        selected === cat.id ? 'text-white' : 'text-site hover:bg-surface-2'
      "
      :style="
        selected === cat.id
          ? `background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));`
          : ''
      "
    >
      <span class="text-xl w-6 text-center">{{ cat.emoji }}</span>
      <span class="flex-1 truncate">{{ cat.name }}</span>
      <span
        class="text-xs px-1.5 py-0.5 rounded-full font-semibold shrink-0"
        :style="
          selected === cat.id
            ? 'background:rgba(255,255,255,0.2); color:#fff;'
            : `background: var(--color-surface-2); color: var(--color-text-muted);`
        "
        >{{ countFor(cat.id) }}</span
      >
    </button>
  </div>
</template>

<script setup lang="ts">
import { categories } from "~/data/categories";
import { products } from "~/data/products";

defineProps<{ selected: string | null }>();
defineEmits<{ select: [id: string | null] }>();

const totalCount = products.length;

function countFor(catId: string) {
  return products.filter((p) => p.categoryId === catId).length;
}
</script>
