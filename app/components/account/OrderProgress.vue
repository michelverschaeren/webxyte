<template>
  <div
    v-if="status === 'geannuleerd'"
    class="flex items-center gap-3 border border-[#b8252a]/40 bg-(--color-surface-2) px-5 py-4"
  >
    <span class="text-lg text-[#b8252a]">✕</span>
    <p class="text-sm text-(--color-text)">
      Deze bestelling is geannuleerd. Heeft u vragen? Neem contact op met
      Vleeswaren Vermeir.
    </p>
  </div>

  <ol v-else class="grid grid-cols-3 gap-2 sm:gap-4">
    <li
      v-for="(step, i) in steps"
      :key="step.key"
      class="flex flex-col items-center gap-2 text-center"
    >
      <div class="flex w-full items-center">
        <span
          class="h-px flex-1"
          :class="i === 0 ? 'opacity-0' : ''"
          :style="{
            background:
              i <= activeIndex ? '#c89868' : 'var(--color-border-strong)',
          }"
        />
        <span
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold"
          :class="
            i < activeIndex
              ? 'border-[#c89868] bg-[#c89868] text-[#1a0a0a]'
              : i === activeIndex
                ? 'border-[#c89868] text-(--color-accent)'
                : 'border-(--color-border-strong) text-(--color-text-muted)'
          "
        >
          <template v-if="i < activeIndex">✓</template>
          <template v-else>{{ i + 1 }}</template>
        </span>
        <span
          class="h-px flex-1"
          :class="i === steps.length - 1 ? 'opacity-0' : ''"
          :style="{
            background:
              i < activeIndex ? '#c89868' : 'var(--color-border-strong)',
          }"
        />
      </div>
      <div>
        <p
          class="text-[0.7rem] font-semibold tracking-[0.06em] uppercase"
          :class="
            i <= activeIndex
              ? 'text-(--color-text-strong)'
              : 'text-(--color-text-muted)'
          "
        >
          {{ step.label }}
        </p>
        <p class="mt-0.5 text-[0.65rem] text-(--color-text-muted)">
          {{ step.hint }}
        </p>
      </div>
    </li>
  </ol>
</template>

<script setup lang="ts">
const props = defineProps<{ status: string }>();

const steps = [
  {
    key: "ontvangen",
    label: "Ontvangen",
    hint: "Uw bestelling is geregistreerd",
  },
  {
    key: "verwerking",
    label: "Bij Vleeswaren Vermeir",
    hint: "Wordt verwerkt en voorbereid",
  },
  {
    key: "geleverd",
    label: "Geleverd",
    hint: "Door onze eigen chauffeurs",
  },
];

const activeIndex = computed(() => {
  if (props.status === "voltooid") return 2;
  if (props.status === "in_behandeling") return 1;
  return 0; // "nieuw"
});
</script>
