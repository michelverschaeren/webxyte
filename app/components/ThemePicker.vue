<template>
  <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
    <!-- Panel -->
    <transition name="fade-up">
      <div
        v-if="open"
        class="rounded-2xl p-4 shadow-2xl border border-site bg-surface min-w-48"
      >
        <p
          class="text-xs font-semibold uppercase tracking-wider text-muted mb-3"
        >
          Kies thema
        </p>
        <div class="flex flex-col gap-2">
          <button
            v-for="theme in themes"
            :key="theme.id"
            @click="select(theme.id)"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 hover:bg-surface-2"
            :class="currentTheme === theme.id ? 'ring-2' : ''"
            :style="
              currentTheme === theme.id ? `ring-color: ${theme.primary};` : ''
            "
          >
            <!-- Color swatch -->
            <div class="flex gap-1 shrink-0">
              <span
                class="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                :style="`background: ${theme.primary};`"
              />
              <span
                class="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                :style="`background: ${theme.accent};`"
              />
            </div>
            <span class="text-site">{{ theme.label }}</span>
            <svg
              v-if="currentTheme === theme.id"
              class="w-3.5 h-3.5 ml-auto"
              :style="`color: ${theme.primary};`"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </transition>

    <!-- Trigger button -->
    <button
      @click="open = !open"
      class="w-12 h-12 rounded-full shadow-xl flex items-center justify-center text-white transition-all duration-200 hover:scale-110 hover:shadow-2xl"
      style="
        background: linear-gradient(
          135deg,
          var(--color-primary-dark),
          var(--color-primary)
        );
      "
      :title="open ? 'Sluit thema-kiezer' : 'Kies thema'"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
        />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Theme } from "~/composables/useTheme";

const { currentTheme, themes, setTheme } = useTheme();
const open = ref(false);

function select(id: Theme) {
  setTheme(id);
  open.value = false;
}
</script>

<style scoped>
.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.2s ease;
}
.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}
</style>
