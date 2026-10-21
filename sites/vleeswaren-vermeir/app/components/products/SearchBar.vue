<template>
  <div class="relative w-full">
    <!-- Search icon -->
    <div class="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
      <svg
        class="w-5 h-5"
        style="color: var(--color-text-muted)"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>

    <input
      :value="modelValue"
      type="text"
      placeholder="Zoek op naam, artikelnummer of leverancier…"
      class="w-full pl-12 pr-12 py-3.5 rounded-xl text-sm border border-site bg-surface text-site placeholder:text-muted focus:outline-none transition-all duration-200"
      :style="`focus:ring: 2px solid var(--color-primary); focus:border-color: var(--color-primary);`"
      :class="focused ? 'ring-2' : ''"
      :style-focus="`ring-color: var(--color-primary);`"
      @input="
        $emit('update:modelValue', ($event.target as HTMLInputElement).value)
      "
      @focus="focused = true"
      @blur="focused = false"
    >

    <!-- Clear button -->
    <button
      v-if="modelValue"
      class="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-surface-2 transition-colors"
      @click="$emit('update:modelValue', '')"
    >
      <svg
        class="w-4 h-4"
        style="color: var(--color-text-muted)"
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
</template>

<script setup lang="ts">
defineProps<{ modelValue: string }>();
defineEmits<{ "update:modelValue": [value: string] }>();
const focused = ref(false);
</script>
