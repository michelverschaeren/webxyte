<template>
  <!-- Bewust geen <form>: dit blok staat ook ín formulieren (bestelpopup,
       gegevenspagina) en formulieren mogen niet genest worden. -->
  <div class="space-y-3">
    <p
      v-if="addresses.length === 0 && editing === null"
      class="text-sm text-(--color-text-muted)"
    >
      Nog geen leveringsadres ingevuld.
    </p>

    <ul v-if="visibleAddresses.length > 0" class="space-y-2">
      <li
        v-for="address in visibleAddresses"
        :key="address.id"
        class="flex items-start gap-3 rounded-lg border px-3 py-2.5"
        :class="
          canSelect && selected === address.id
            ? 'border-[#c89868]'
            : 'border-(--color-border-strong)'
        "
      >
        <component :is="canSelect ? 'label' : 'div'" class="flex min-w-0 flex-1 items-start gap-3">
          <input
            v-if="canSelect"
            v-model="selected"
            type="radio"
            :name="radioName"
            :value="address.id"
            class="mt-1 accent-[#b8252a]"
          >
          <span class="min-w-0 text-sm text-(--color-text-strong)">
            <span class="block">{{ address.street }}</span>
            <span class="block">{{ address.postalCode }} {{ address.city }}</span>
            <span
              v-if="address.isPrimary && addresses.length > 1"
              class="mt-1 inline-block rounded bg-(--color-hover) px-1.5 py-0.5 text-[0.7rem] font-semibold tracking-[0.08em] text-(--color-accent) uppercase"
            >
              Primair adres
            </span>
          </span>
        </component>

        <div class="flex shrink-0 flex-col items-end gap-1.5">
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="rounded-md p-1.5 text-(--color-text-muted) transition-colors hover:text-(--color-accent)"
              :aria-label="`Adres ${address.street} wijzigen`"
              title="Wijzigen"
              :disabled="busy"
              @click="startEdit(address)"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                />
              </svg>
            </button>
            <button
              type="button"
              class="rounded-md p-1.5 text-(--color-text-muted) transition-colors hover:text-[#e06a6a]"
              :aria-label="`Adres ${address.street} verwijderen`"
              title="Verwijderen"
              :disabled="busy"
              @click="confirmingDelete = address.id"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </button>
          </div>

          <p v-if="confirmingDelete === address.id" class="text-xs text-(--color-text-muted)">
            Verwijderen?
            <button type="button" class="font-semibold text-[#e06a6a] hover:underline" :disabled="busy" @click="remove(address)">
              Ja
            </button>
            ·
            <button type="button" class="hover:underline" @click="confirmingDelete = null">
              Nee
            </button>
          </p>
          <button
            v-else-if="!address.isPrimary"
            type="button"
            class="text-xs text-(--color-text-muted) underline hover:text-(--color-accent)"
            :disabled="busy"
            @click="makePrimary(address)"
          >
            Als primair instellen
          </button>
        </div>
      </li>
    </ul>

    <!-- Nieuw adres of een bestaand adres wijzigen -->
    <div
      v-if="editing !== null"
      class="space-y-3 rounded-lg border border-[#c89868]/50 px-3 py-3"
      @keydown.enter.prevent="save()"
    >
      <p class="text-xs font-medium text-(--color-text-muted)">
        {{ editing === "new" ? "Nieuw leveringsadres" : "Leveringsadres wijzigen" }}
      </p>
      <input
        ref="streetInputRef"
        v-model="form.street"
        type="text"
        maxlength="200"
        autocomplete="address-line1"
        placeholder="Straat en nummer"
        aria-label="Straat en nummer"
        :class="inputClass"
      >
      <div class="grid grid-cols-[1fr_2fr] gap-3">
        <input
          v-model="form.postalCode"
          type="text"
          inputmode="numeric"
          maxlength="4"
          autocomplete="postal-code"
          placeholder="Postcode"
          aria-label="Postcode"
          :class="inputClass"
        >
        <input
          v-model="form.city"
          type="text"
          maxlength="100"
          autocomplete="address-level2"
          placeholder="Gemeente"
          aria-label="Gemeente"
          :class="inputClass"
        >
      </div>
      <label
        v-if="showPrimaryChoice"
        class="flex items-center gap-2 text-sm text-(--color-text)"
      >
        <input v-model="form.isPrimary" type="checkbox" class="accent-[#b8252a]">
        Als primair adres instellen
      </label>
      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-xs font-medium text-(--color-text-muted) hover:text-(--color-text-strong)"
          :disabled="busy"
          @click="cancel()"
        >
          Annuleren
        </button>
        <button
          type="button"
          class="rounded-lg border border-(--color-border-strong) px-3 py-1.5 text-xs font-semibold tracking-[0.08em] text-(--color-text-strong) uppercase transition-colors hover:border-[#c89868] disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="busy"
          @click="save()"
        >
          {{ busy ? "Opslaan…" : "Adres opslaan" }}
        </button>
      </div>
    </div>

    <button
      v-else
      type="button"
      class="text-sm font-medium text-(--color-accent) hover:underline"
      @click="startNew()"
    >
      + Nieuw leveringsadres
    </button>

    <p v-if="error" class="text-xs text-[#e06a6a]">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { addressError, type DeliveryAddress } from "#shared/address";

/**
 * De leveringsadressen van één klant: tonen, toevoegen, wijzigen, verwijderen
 * en het primaire adres kiezen. Gebruikt in de bestelpopup, op "Mijn account
 * → Gegevens" en in het klantprofiel van de beheerder — telkens dezelfde
 * adressen, enkel het endpoint verschilt.
 */
const props = defineProps<{
  /** Basis-URL: POST hierop, PUT/DELETE op `${endpoint}/${id}`. */
  endpoint: string;
  /** De adressen, het primaire eerst. De ouder herlaadt ze na `changed`. */
  addresses: DeliveryAddress[];
  /** Laat kiezen op welk adres geleverd wordt (bestelpopup). */
  selectable?: boolean;
}>();

const emit = defineEmits<{ changed: [] }>();

/** Het gekozen adres (enkel met `selectable`). */
const selected = defineModel<string | null>("selected", { default: null });

const inputClass =
  "w-full rounded-lg border border-(--color-border-strong) bg-(--color-bg) px-3 py-2.5 text-sm text-(--color-text-strong) placeholder-(--color-text-muted)/60 focus:border-[#c89868] focus:outline-none";

const radioName = useId();
// Kiezen heeft pas zin vanaf twee adressen.
const canSelect = computed(() => props.selectable && props.addresses.length > 1);

/** "new", de id van het adres dat bewerkt wordt, of null. */
const editing = ref<string | null>(null);
const confirmingDelete = ref<string | null>(null);
const busy = ref(false);
const error = ref("");
const form = reactive({ street: "", postalCode: "", city: "", isPrimary: false });
const streetInputRef = ref<HTMLInputElement | null>(null);

// Het adres dat bewerkt wordt, staat in het formulier i.p.v. in de lijst.
const visibleAddresses = computed(() =>
  props.addresses.filter((address) => address.id !== editing.value),
);

// Bij een eerste adres valt er niets te kiezen (het wordt vanzelf primair),
// en een adres dat al primair is kan dat hier niet verliezen.
const showPrimaryChoice = computed(() => {
  if (editing.value === "new") return props.addresses.length > 0;
  return !props.addresses.find((a) => a.id === editing.value)?.isPrimary;
});

// Verdwijnt het gekozen adres (of is er nog niets gekozen), val dan terug op
// het primaire: dat staat eerst.
watch(
  () => props.addresses,
  (addresses) => {
    if (!props.selectable) return;
    if (!addresses.some((a) => a.id === selected.value)) {
      selected.value = addresses[0]?.id ?? null;
    }
  },
  { immediate: true },
);

function startNew() {
  Object.assign(form, { street: "", postalCode: "", city: "", isPrimary: false });
  open("new");
}

function startEdit(address: DeliveryAddress) {
  Object.assign(form, {
    street: address.street,
    postalCode: address.postalCode,
    city: address.city,
    isPrimary: address.isPrimary,
  });
  open(address.id);
}

function open(target: string) {
  error.value = "";
  confirmingDelete.value = null;
  editing.value = target;
  nextTick(() => streetInputRef.value?.focus());
}

function cancel() {
  editing.value = null;
  error.value = "";
}

function failure(err: unknown, fallback: string) {
  return (err as { data?: { statusMessage?: string } })?.data?.statusMessage || fallback;
}

async function save() {
  if (busy.value || editing.value === null) return;

  const invalid = addressError(form);
  if (invalid) {
    error.value = invalid;
    return;
  }

  busy.value = true;
  error.value = "";
  const isNew = editing.value === "new";
  try {
    const saved = await $fetch<DeliveryAddress>(
      isNew ? props.endpoint : `${props.endpoint}/${editing.value}`,
      {
        method: isNew ? "POST" : "PUT",
        body: {
          street: form.street.trim(),
          postalCode: form.postalCode.trim(),
          city: form.city.trim(),
          isPrimary: form.isPrimary || undefined,
        },
      },
    );
    // Een nieuw adres in de bestelpopup is meteen het leveradres.
    if (isNew && props.selectable) selected.value = saved.id;
    editing.value = null;
    emit("changed");
  } catch (err) {
    error.value = failure(err, "Het adres kon niet opgeslagen worden.");
  } finally {
    busy.value = false;
  }
}

async function makePrimary(address: DeliveryAddress) {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    await $fetch(`${props.endpoint}/${address.id}`, {
      method: "PUT",
      body: {
        street: address.street,
        postalCode: address.postalCode,
        city: address.city,
        isPrimary: true,
      },
    });
    emit("changed");
  } catch (err) {
    error.value = failure(err, "Het primaire adres kon niet gewijzigd worden.");
  } finally {
    busy.value = false;
  }
}

async function remove(address: DeliveryAddress) {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    await $fetch(`${props.endpoint}/${address.id}`, { method: "DELETE" });
    confirmingDelete.value = null;
    emit("changed");
  } catch (err) {
    error.value = failure(err, "Het adres kon niet verwijderd worden.");
  } finally {
    busy.value = false;
  }
}
</script>
