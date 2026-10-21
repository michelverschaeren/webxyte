export interface SavedListItem {
  id: string;
  articleNr: string;
  name: string;
  supplier: string;
  unit?: string;
  quantity: number;
  /** Zit het product nog in het assortiment? Komt live uit de catalogus. */
  available?: boolean;
}

export interface SavedList {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  items: SavedListItem[];
}

/** Zet lijst-items om naar mandje-regels (zonder het `available`-vlag). */
export function toCartItems(items: SavedListItem[]) {
  return items.map((i) => ({
    id: i.id,
    articleNr: i.articleNr,
    name: i.name,
    supplier: i.supplier,
    unit: i.unit,
    quantity: i.quantity,
  }));
}

/**
 * Bestellijstjes van de ingelogde klant. Sinds de klantenzone staan die in
 * de database (niet meer in localStorage), zodat ze op elk toestel
 * beschikbaar zijn. Alle schrijfacties gaan via /api/account/lists.
 */
export function useOrderLists() {
  // SSR-fetches erven de browsercookies niet vanzelf; zonder deze header
  // krijgt de server een 401 en blijft de lijst leeg (zie ook useAuth).
  const headers = import.meta.server
    ? useRequestHeaders(["cookie"])
    : undefined;

  const lists = useState<SavedList[]>("order-lists", () => []);
  const loaded = useState<boolean>("order-lists-loaded", () => false);
  const loading = useState<boolean>("order-lists-loading", () => false);
  const panelOpen = useState<boolean>("order-lists-panel", () => false);
  const panelMaximized = useState<boolean>(
    "order-lists-panel-max",
    () => false,
  );
  const editingListId = useState<string | null>(
    "order-lists-editing",
    () => null,
  );
  const editorDraftName = useState<string>(
    "order-lists-editing-name",
    () => "",
  );
  /** Werkkopie van de items van de lijst die net bewerkt wordt — losstaand
   * van de opgeslagen lijst, zodat "Toevoegen" de bewerkte versie in het
   * mandje kan zetten zonder meteen op te slaan. */
  const draftItems = useState<SavedListItem[]>(
    "order-lists-draft-items",
    () => [],
  );

  async function fetchLists() {
    loading.value = true;
    try {
      lists.value = await $fetch<SavedList[]>("/api/account/lists", { headers });
      loaded.value = true;
      // Teruggeven i.p.v. `undefined`: anders haalt useAsyncData (account-
      // pagina's) de lijsten in de browser nog eens op (NUXT_E3006).
      return lists.value;
    } finally {
      loading.value = false;
    }
  }

  async function ensureLoaded() {
    if (loaded.value || loading.value || !import.meta.client) return;
    await fetchLists();
  }

  /** Leegt de lokale kopie, bv. na uitloggen. */
  function reset() {
    lists.value = [];
    loaded.value = false;
    editingListId.value = null;
  }

  async function saveCart(name: string, items: SavedListItem[]) {
    await $fetch("/api/account/lists", {
      method: "POST",
      body: {
        name: name.trim() || "Naamloze lijst",
        items: items.map((i) => ({ articleNr: i.articleNr, quantity: i.quantity })),
      },
    });
    await fetchLists();
  }

  async function updateList(
    id: string,
    patch: { name?: string; items?: SavedListItem[] },
  ) {
    await $fetch(`/api/account/lists/${id}`, {
      method: "PUT",
      body: {
        name: patch.name?.trim() || undefined,
        items: patch.items?.map((i) => ({
          articleNr: i.articleNr,
          quantity: i.quantity,
        })),
      },
    });
    await fetchLists();
  }

  async function deleteList(id: string) {
    await $fetch(`/api/account/lists/${id}`, { method: "DELETE" });
    lists.value = lists.value.filter((l) => l.id !== id);
  }

  function getList(id: string): SavedList | undefined {
    return lists.value.find((l) => l.id === id);
  }

  function openPanel() {
    panelOpen.value = true;
    ensureLoaded();
  }

  function closePanel() {
    panelOpen.value = false;
  }

  function openEditor(id: string) {
    editingListId.value = id;
    editorDraftName.value = getList(id)?.name ?? "";
    draftItems.value = getList(id)?.items.map((i) => ({ ...i })) ?? [];
  }

  function closeEditor() {
    editingListId.value = null;
    editorDraftName.value = "";
    draftItems.value = [];
  }

  const isDraftDirty = computed(() => {
    const list = editingListId.value ? getList(editingListId.value) : null;
    if (!list) return false;
    if (list.name !== editorDraftName.value.trim()) return true;
    if (list.items.length !== draftItems.value.length) return true;
    return list.items.some((orig, i) => {
      const cur = draftItems.value[i];
      return !cur || cur.id !== orig.id || cur.quantity !== orig.quantity;
    });
  });

  function updateDraftQty(idx: number, qty: number) {
    const item = draftItems.value[idx];
    if (!item) return;
    const v = Number.isFinite(qty) ? Math.floor(qty) : 1;
    if (v <= 0) draftItems.value.splice(idx, 1);
    else item.quantity = v;
  }

  function removeDraftItem(idx: number) {
    draftItems.value.splice(idx, 1);
  }

  /** Bewaart de werkkopie op de opgeslagen lijst (naam + items). */
  async function saveDraft() {
    const id = editingListId.value;
    if (!id) return;
    await updateList(id, {
      name: editorDraftName.value,
      items: draftItems.value.map((i) => ({ ...i })),
    });
  }

  /**
   * Voegt meerdere lijstjes samen tot één set mandje-regels: hetzelfde
   * product in twee lijstjes wordt één regel met opgetelde aantallen.
   * Niet-beschikbare artikelen vallen weg.
   */
  function mergeLists(ids: string[]): SavedListItem[] {
    const merged = new Map<string, SavedListItem>();

    for (const id of ids) {
      for (const item of getList(id)?.items ?? []) {
        if (item.available === false) continue;
        const existing = merged.get(item.id);
        if (existing) existing.quantity += item.quantity;
        else merged.set(item.id, { ...item });
      }
    }

    return [...merged.values()];
  }

  return {
    lists,
    loading,
    panelOpen,
    panelMaximized,
    editingListId,
    editorDraftName,
    draftItems,
    isDraftDirty,
    ensureLoaded,
    fetchLists,
    reset,
    saveCart,
    updateList,
    deleteList,
    getList,
    mergeLists,
    openPanel,
    closePanel,
    openEditor,
    closeEditor,
    updateDraftQty,
    removeDraftItem,
    saveDraft,
  };
}
