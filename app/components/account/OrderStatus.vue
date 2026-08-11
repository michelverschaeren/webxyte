<template>
  <span
    class="inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-[0.65rem] font-semibold tracking-[0.12em] uppercase"
    :style="{ color: style.color, borderColor: style.color }"
  >
    {{ style.label }}
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{ status: string }>();

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  nieuw: { label: "Nieuw", color: "var(--color-accent)" },
  in_behandeling: { label: "In behandeling", color: "#6ba3d9" },
  voltooid: { label: "Voltooid", color: "#8fc98f" },
  geannuleerd: { label: "Geannuleerd", color: "#b8252a" },
};

const style = computed(
  () =>
    STATUS_STYLES[props.status] ?? {
      label: props.status,
      color: "var(--color-text-muted)",
    },
);
</script>
