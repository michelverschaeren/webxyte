<template>
  <article
    class="flex flex-col border bg-[#1a1414] transition-colors"
    :class="[
      large ? 'gap-4 p-6' : 'gap-3 p-4',
      selected ? 'border-[#c89868]' : 'border-white/10',
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
        />
        <span class="min-w-0">
          <span
            class="block truncate font-semibold text-white"
            :class="large ? 'text-base' : 'text-sm'"
            >{{ list.name }}</span
          >
          <span
            class="mt-0.5 block text-[#a89a8e]"
            :class="large ? 'text-xs' : 'text-[0.7rem]'"
            >{{ summary }}</span
          >
        </span>
      </label>

      <div v-else class="min-w-0">
        <h3
          class="truncate font-semibold text-white"
          :class="large ? 'text-base' : 'text-sm'"
        >
          {{ list.name }}
        </h3>
        <p
          class="mt-0.5 text-[#a89a8e]"
          :class="large ? 'text-xs' : 'text-[0.7rem]'"
        >
          {{ summary }}
        </p>
      </div>

      <button
        class="text-[#a89a8e] transition-colors hover:bg-white/5 hover:text-[#b8252a]"
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

    <div :class="large ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-2 gap-2'">
      <button
        class="bg-[#b8252a] font-semibold tracking-[0.08em] text-white uppercase transition-colors hover:bg-[#8b1f1f]"
        :class="large ? 'px-4 py-3 text-xs' : 'px-3 py-2 text-[0.7rem]'"
        @click="emit('replace')"
      >
        Vervang mandje
      </button>
      <button
        class="border border-[#c89868] font-semibold tracking-[0.08em] text-[#c89868] uppercase transition-colors hover:bg-[#c89868] hover:text-[#1a0a0a]"
        :class="large ? 'px-4 py-3 text-xs' : 'px-3 py-2 text-[0.7rem]'"
        @click="emit('append')"
      >
        Toevoegen
      </button>
      <button
        class="col-span-2 border border-white/15 font-semibold tracking-[0.08em] text-[#e8e2dc] uppercase transition-colors hover:bg-white/5"
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
          class="bg-[#b8252a] px-2 py-0.5 text-white"
          @click="
            confirming = false;
            emit('delete');
          "
        >
          Ja
        </button>
        <button
          class="border border-white/20 px-2 py-0.5 text-[#e8e2dc]"
          @click="confirming = false"
        >
          Nee
        </button>
      </span>
    </p>
  </article>
</template>

<script setup lang="ts">
import type { SavedList } from "~/composables/useOrderLists";

const props = defineProps<{
  list: SavedList;
  large?: boolean;
  selectable?: boolean;
  selected?: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
  replace: [];
  append: [];
  edit: [];
  delete: [];
}>();

const confirming = ref(false);

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
