<template>
  <button
    type="button"
    role="switch"
    :aria-checked="model"
    :aria-label="label"
    :disabled="disabled"
    class="adm-switch"
    :class="{ 'adm-switch--on': model }"
    @click="model = !model"
  >
    <span class="adm-switch-track" aria-hidden="true">
      <span class="adm-switch-thumb" />
    </span>
    <span class="adm-switch-text">{{ model ? onText : offText }}</span>
  </button>
</template>

<script setup lang="ts">
/**
 * Aan/uit-schakelaar met de toestand in tekst ernaast (bv. "Actief" /
 * "Inactief"), zodat de stand ook zonder kleur duidelijk is.
 */
withDefaults(
  defineProps<{
    /** Toegankelijke naam, bv. "Product actief". */
    label: string;
    onText?: string;
    offText?: string;
    disabled?: boolean;
  }>(),
  { onText: "Aan", offText: "Uit", disabled: false },
);

const model = defineModel<boolean>({ required: true });
</script>

<style scoped>
.adm-switch {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  cursor: pointer;
}
.adm-switch:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.adm-switch-track {
  position: relative;
  width: 2.75rem;
  height: 1.5rem;
  flex-shrink: 0;
  border-radius: 9999px;
  background: var(--color-border-strong);
  transition: background-color 0.2s;
}
.adm-switch-thumb {
  position: absolute;
  top: 0.1875rem;
  left: 0.1875rem;
  width: 1.125rem;
  height: 1.125rem;
  border-radius: 9999px;
  background: #fff;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.3);
  transition: transform 0.2s;
}
.adm-switch--on .adm-switch-track {
  background: #3f8f55;
}
.adm-switch--on .adm-switch-thumb {
  transform: translateX(1.25rem);
}
.adm-switch:focus-visible .adm-switch-track {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
.adm-switch-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-muted);
}
.adm-switch--on .adm-switch-text {
  color: #3f8f55;
}
:root:not([data-theme="light"]) .adm-switch--on .adm-switch-text {
  color: #8fc98f;
}
</style>
