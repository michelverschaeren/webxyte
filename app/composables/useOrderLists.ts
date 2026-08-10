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

  async function fetchLists() {
    loading.value = true;
    try {
      lists.value = await $fetch<SavedList[]>("/api/account/lists", { headers });
      loaded.value = true;
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
  }

  function closeEditor() {
    editingListId.value = null;
    editorDraftName.value = "";
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
  };
}
