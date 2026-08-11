<template>
  <Teleport to="body">
    <transition name="backdrop-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
        @click="$emit('close')"
      />
    </transition>

    <transition name="modal-pop">
      <div
        v-if="open"
        class="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          class="pointer-events-auto w-full max-w-4xl h-[85vh] flex flex-col rounded-2xl border border-[#c89868]/30 shadow-2xl overflow-hidden"
          style="background: var(--color-surface)"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between px-5 py-4 border-b border-(--color-border)"
            style="
              background: linear-gradient(
                135deg,
                var(--color-surface-strong) 0%,
                var(--color-surface) 100%
              );
            "
          >
            <div class="min-w-0">
              <p
                class="uppercase tracking-[0.2em] text-[0.65rem] text-(--color-accent) font-semibold"
              >
                Productfiche
              </p>
              <h3
                class="text-(--color-text-strong) font-semibold text-base leading-tight truncate"
              >
                {{ title }}
              </h3>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <a
                :href="pdfUrl"
                target="_blank"
                rel="noopener"
                class="px-3 py-1.5 rounded-lg border border-[#c89868] text-(--color-accent) text-[0.7rem] font-semibold uppercase tracking-[0.1em] hover:bg-[#c89868] hover:text-[#1a0a0a] transition-colors"
                >Nieuw tabblad</a
              >
              <button
                @click="$emit('close')"
                class="rounded-lg p-1.5 text-(--color-text-muted) hover:text-(--color-text-strong) hover:bg-(--color-hover) transition-colors"
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

          <!-- PDF viewer -->
          <div class="flex-1 bg-black">
            <iframe
              v-if="open && pdfUrl"
              :src="pdfUrl"
              class="w-full h-full border-0"
              :title="`Productfiche ${title}`"
            />
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean;
  title: string;
  pdfUrl: string;
}>();

defineEmits<{ (e: "close"): void }>();
</script>

<style scoped>
.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
  transition: opacity 0.2s ease;
}
.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
  opacity: 0;
}
.modal-pop-enter-active,
.modal-pop-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.modal-pop-enter-from,
.modal-pop-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
