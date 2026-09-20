<template>
  <div>
    <button
      type="button"
      aria-haspopup="dialog"
      :aria-expanded="open"
      :disabled="disabled"
      :class="['inline-flex items-center gap-2 transition-colors', triggerClass]"
      @click="openModal"
    >
      <span class="min-w-0 truncate">{{ selectedLabel }}</span>
      <svg
        class="pointer-events-none w-3 h-3 shrink-0 text-(--color-accent)"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <Teleport to="body">
      <transition name="backdrop-fade">
        <div
          v-if="open"
          class="fixed inset-0 z-210 bg-black/70"
          @click="close"
        />
      </transition>
      <transition name="modal-pop">
        <div
          v-if="open"
          class="pointer-events-none fixed inset-0 z-211 flex items-center justify-center p-4"
        >
          <div
            role="dialog"
            aria-modal="true"
            :aria-label="title"
            class="pointer-events-auto flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#c89868]/30 shadow-2xl"
            style="background: var(--color-surface)"
          >
            <div
              class="flex items-start justify-between gap-4 border-b border-(--color-border) px-5 py-4"
              style="background: linear-gradient(135deg, var(--color-surface-strong) 0%, var(--color-surface) 100%)"
            >
              <div>
                <p
                  v-if="eyebrow"
                  class="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-(--color-accent)"
                >
                  — {{ eyebrow }} —
                </p>
                <h3 class="text-base font-bold text-(--color-text-strong)">
                  {{ title }}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Sluiten"
                class="-mr-1 shrink-0 rounded-lg px-2 py-1 text-(--color-text-muted) transition-colors hover:text-(--color-text-strong)"
                @click="close"
              >
                ✕
              </button>
            </div>

            <ul role="listbox" class="flex-1 overflow-y-auto p-2">
              <template
                v-for="(opt, i) in options"
                :key="opt.value ?? '__null__'"
              >
              <li
                v-if="opt.group && opt.group !== options[i - 1]?.group"
                role="presentation"
                class="px-4 pb-1 pt-3 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-(--color-accent) first:pt-2"
              >
                {{ opt.group }}
              </li>
              <li>
                <button
                  type="button"
                  role="option"
                  :aria-selected="opt.value === modelValue"
                  class="flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left text-sm transition-colors"
                  :class="
                    opt.value === modelValue
                      ? 'bg-(--color-hover) font-medium text-(--color-accent)'
                      : 'text-(--color-text) hover:bg-(--color-hover)'
                  "
                  @click="select(opt.value)"
                >
                  <span>{{ opt.label }}</span>
                  <svg
                    v-if="opt.value === modelValue"
                    class="w-4 h-4 shrink-0"
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
                </button>
              </li>
              </template>
              <li
                v-if="loading"
                class="px-4 py-3 text-sm text-(--color-text-muted)"
              >
                Laden…
              </li>
              <li
                v-else-if="emptyLabel && !options.some((o) => o.value !== null)"
                class="px-4 py-3 text-sm text-(--color-text-muted)"
              >
                {{ emptyLabel }}
              </li>
            </ul>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
export interface SelectMenuOption {
  value: string | null;
  label: string;
  /** Opeenvolgende opties met dezelfde groep krijgen één kopje. */
  group?: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: string | null;
    options: SelectMenuOption[];
    title: string;
    eyebrow?: string;
    placeholder?: string;
    disabled?: boolean;
    loading?: boolean;
    emptyLabel?: string;
    triggerClass?: string;
  }>(),
  {
    eyebrow: "",
    placeholder: "",
    disabled: false,
    loading: false,
    emptyLabel: "",
    triggerClass: "",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string | null];
  open: [];
}>();

const open = ref(false);

const selectedLabel = computed(() => {
  const match = props.options.find((o) => o.value === props.modelValue);
  return match?.label ?? props.placeholder;
});

function openModal() {
  if (props.disabled) return;
  open.value = true;
  emit("open");
}

function close() {
  open.value = false;
}

function select(value: string | null) {
  emit("update:modelValue", value);
  close();
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") close();
}

onMounted(() => document.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));
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
