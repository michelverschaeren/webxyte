<template>
  <!-- Horizontal row layout (full-width lists page) -->
  <article
    v-if="horizontal"
    class="overflow-hidden rounded-xl border bg-(--color-surface) transition-colors"
    :class="selected ? 'border-[#c89868]' : 'border-(--color-border)'"
  >
    <div class="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap sm:gap-4">
      <label
        v-if="selectable"
        class="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
      >
        <input
          type="checkbox"
          :checked="selected"
          class="h-4 w-4 shrink-0 accent-[#c89868]"
          @change="emit('toggle')"
        >
        <span class="min-w-0">
          <span class="block truncate text-sm font-semibold text-(--color-text-strong)">{{
            list.name
          }}</span>
          <span class="mt-0.5 block truncate text-[0.7rem] text-(--color-text-muted)">
            {{ summary }}
            <span v-if="unavailableCount > 0" class="text-[#d9a05b]">
              · {{ unavailableCount }} niet meer beschikbaar</span
            >
          </span>
        </span>
      </label>

      <div v-else class="min-w-0 flex-1">
        <h3 class="truncate text-sm font-semibold text-(--color-text-strong)">
          {{ list.name }}
        </h3>
        <p class="mt-0.5 truncate text-[0.7rem] text-(--color-text-muted)">
          {{ summary }}
          <span v-if="unavailableCount > 0" class="text-[#d9a05b]">
            · {{ unavailableCount }} niet meer beschikbaar</span
          >
        </p>
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-2">
        <template v-if="!confirming">
          <button
            class="rounded-lg border border-[#c89868] px-3 py-2 text-[0.7rem] font-semibold tracking-[0.08em] text-(--color-accent) uppercase transition-colors hover:bg-[#c89868] hover:text-[#1a0a0a] disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="expanded && orderLists.draftItems.value.length === 0"
            @click="onToevoegenClick"
          >
            Toevoegen aan winkelmandje
          </button>
          <button
            v-if="!expanded"
            class="rounded-lg border border-(--color-border-strong) px-3 py-2 text-[0.7rem] font-semibold tracking-[0.08em] text-(--color-text) uppercase transition-colors hover:bg-(--color-hover)"
            @click="emit('edit')"
          >
            Bewerken
          </button>
          <button
            v-else
            class="rounded-lg border border-[#c89868] px-3 py-2 text-[0.7rem] font-semibold tracking-[0.08em] text-(--color-accent) uppercase transition-colors hover:bg-[#c89868] hover:text-[#1a0a0a]"
            @click="onOpslaanClick"
          >
            Opslaan
          </button>
          <button
            class="rounded-lg p-2 text-(--color-text-muted) transition-colors hover:bg-(--color-hover) hover:text-[#b8252a]"
            :aria-label="`Verwijder ${list.name}`"
            title="Verwijderen"
            @click="confirming = true"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </template>
        <template v-else>
          <span class="text-[0.7rem] text-[#b8252a]">Verwijderen?</span>
          <button
            class="rounded-md bg-[#b8252a] px-2 py-1 text-xs text-white"
            @click="
              confirming = false;
              emit('delete');
            "
          >
            Ja
          </button>
          <button
            class="rounded-md border border-(--color-border-strong) px-2 py-1 text-xs text-(--color-text)"
            @click="confirming = false"
          >
            Nee
          </button>
        </template>
      </div>
    </div>

    <!-- Inline editor: expands in place instead of navigating away -->
    <div
      v-if="expanded"
      class="border-t border-(--color-border) px-4 py-4 sm:px-6"
    >
      <ListEditorModal bare />
    </div>
  </article>

  <!-- Block layout (card grid / drawer panel) -->
  <article
    v-else
    class="flex flex-col rounded-xl border bg-(--color-surface) transition-colors"
    :class="[
      large ? 'gap-4 p-6' : 'gap-3 p-4',
      selected ? 'border-[#c89868]' : 'border-(--color-border)',
    ]"
  >
    <div class="flex items-start justify-between gap-3">
      <label
        v-if="selectable"
        class="flex min-w-0 flex-1 cursor-pointer items-start gap-3"
      >
        <input
          type="checkbox"
          :checked="selected"
          class="mt-1 h-4 w-4 shrink-0 accent-[#c89868]"
          @change="emit('toggle')"
        >
        <span class="min-w-0">
          <span
            class="block truncate font-semibold text-(--color-text-strong)"
            :class="large ? 'text-base' : 'text-sm'"
            >{{ list.name }}</span
          >
          <span
            class="mt-0.5 block text-(--color-text-muted)"
            :class="large ? 'text-xs' : 'text-[0.7rem]'"
            >{{ summary }}</span
          >
        </span>
      </label>

      <div v-else class="min-w-0">
        <h3
          class="truncate font-semibold text-(--color-text-strong)"
          :class="large ? 'text-base' : 'text-sm'"
        >
          {{ list.name }}
        </h3>
        <p
          class="mt-0.5 text-(--color-text-muted)"
          :class="large ? 'text-xs' : 'text-[0.7rem]'"
        >
          {{ summary }}
        </p>
      </div>

      <button
        class="rounded-lg text-(--color-text-muted) transition-colors hover:bg-(--color-hover) hover:text-[#b8252a]"
        :class="large ? 'p-2' : 'p-1.5'"
        :aria-label="`Verwijder ${list.name}`"
        title="Verwijderen"
        @click="confirming = true"
      >
        <svg
          :class="large ? 'h-5 w-5' : 'h-4 w-4'"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>

    <p
      v-if="unavailableCount > 0"
      class="text-[0.7rem] text-[#d9a05b]"
    >
      {{ unavailableCount }} artikel{{ unavailableCount !== 1 ? "en" : "" }} niet
      meer beschikbaar
    </p>

    <div class="grid grid-cols-1 gap-2">
      <button
        class="rounded-lg border border-[#c89868] font-semibold tracking-[0.08em] text-(--color-accent) uppercase transition-colors hover:bg-[#c89868] hover:text-[#1a0a0a]"
        :class="large ? 'px-4 py-3 text-xs' : 'px-3 py-2 text-[0.7rem]'"
        @click="emit('append')"
      >
        Toevoegen aan winkelmandje
      </button>
      <button
        class="rounded-lg border border-(--color-border-strong) font-semibold tracking-[0.08em] text-(--color-text) uppercase transition-colors hover:bg-(--color-hover)"
        :class="large ? 'px-4 py-3 text-xs' : 'px-3 py-2 text-[0.7rem]'"
        @click="emit('edit')"
      >
        Bewerken
      </button>
    </div>

    <p
      v-if="confirming"
      class="flex items-center justify-between gap-2 text-[0.7rem] text-[#b8252a]"
    >
      <span>Verwijderen?</span>
      <span class="flex gap-2">
        <button
          class="rounded-md bg-[#b8252a] px-2 py-0.5 text-white"
          @click="
            confirming = false;
            emit('delete');
          "
        >
          Ja
        </button>
        <button
          class="rounded-md border border-(--color-border-strong) px-2 py-0.5 text-(--color-text)"
          @click="confirming = false"
        >
          Nee
        </button>
      </span>
    </p>
  </article>
</template>

<script setup lang="ts">
import type { SavedList, SavedListItem } from "~/composables/useOrderLists";

const props = defineProps<{
  list: SavedList;
  large?: boolean;
  horizontal?: boolean;
  selectable?: boolean;
  selected?: boolean;
  /** Laat "Bewerken" openklappen tot een inline editor i.p.v. te emit'en. */
  inlineEdit?: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
  append: [items?: SavedListItem[]];
  edit: [];
  delete: [];
}>();

const orderLists = useOrderLists();

const confirming = ref(false);

const expanded = computed(
  () => props.inlineEdit === true && orderLists.editingListId.value === props.list.id,
);

function onToevoegenClick() {
  if (expanded.value) emit("append", orderLists.draftItems.value);
  else emit("append");
}

async function onOpslaanClick() {
  await orderLists.saveDraft();
  orderLists.closeEditor();
}

const unavailableCount = computed(
  () => props.list.items.filter((i) => i.available === false).length,
);

const summary = computed(() => {
  const count = props.list.items.length;
  const qty = props.list.items.reduce((sum, i) => sum + i.quantity, 0);
  return `${count} artikel${count !== 1 ? "en" : ""} · ${qty} stuks · ${formatDate(props.list.updatedAt)}`;
});

function formatDate(ts: number): string {
  try {
    return new Date(ts).toLocaleDateString("nl-BE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}
</script>
