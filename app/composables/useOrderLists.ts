export interface SavedListItem {
  id: string;
  articleNr: string;
  name: string;
  supplier: string;
  unit?: string;
  quantity: number;
}

export interface SavedList {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  items: SavedListItem[];
}

const STORAGE_KEY = "vermeir.orderLists.v1";

function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readStorage(): SavedList[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedList[];
  } catch {
    return [];
  }
}

function writeStorage(lists: SavedList[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  } catch {
    // ignore quota / privacy mode
  }
}

export function useOrderLists() {
  const lists = useState<SavedList[]>("order-lists", () => []);
  const loaded = useState<boolean>("order-lists-loaded", () => false);
  const panelOpen = useState<boolean>("order-lists-panel", () => false);
  const panelMaximized = useState<boolean>(
    "order-lists-panel-max",
    () => false,
  );
  const editingListId = useState<string | null>(
    "order-lists-editing",
    () => null,
  );

  function ensureLoaded() {
    if (loaded.value || !import.meta.client) return;
    lists.value = readStorage();
    loaded.value = true;
  }

  function persist() {
    writeStorage(lists.value);
  }

  function saveCart(name: string, items: SavedListItem[]): SavedList {
    ensureLoaded();
    const now = Date.now();
    const list: SavedList = {
      id: genId(),
      name: name.trim() || "Naamloze lijst",
      createdAt: now,
      updatedAt: now,
      items: items.map((i) => ({ ...i })),
    };
    lists.value = [list, ...lists.value];
    persist();
    return list;
  }

  function updateList(
    id: string,
    patch: { name?: string; items?: SavedListItem[] },
  ) {
    ensureLoaded();
    const idx = lists.value.findIndex((l) => l.id === id);
    if (idx === -1) return;
    const current = lists.value[idx]!;
    const updated: SavedList = {
      ...current,
      name: patch.name?.trim() || current.name,
      items: patch.items ? patch.items.map((i) => ({ ...i })) : current.items,
      updatedAt: Date.now(),
    };
    lists.value.splice(idx, 1, updated);
    persist();
  }

  function deleteList(id: string) {
    ensureLoaded();
    lists.value = lists.value.filter((l) => l.id !== id);
    persist();
  }

  function getList(id: string): SavedList | undefined {
    ensureLoaded();
    return lists.value.find((l) => l.id === id);
  }

  function openPanel() {
    ensureLoaded();
    panelOpen.value = true;
  }

  function closePanel() {
    panelOpen.value = false;
  }

  function openEditor(id: string) {
    ensureLoaded();
    editingListId.value = id;
  }

  function closeEditor() {
    editingListId.value = null;
  }

  return {
    lists,
    panelOpen,
    panelMaximized,
    editingListId,
    ensureLoaded,
    saveCart,
    updateList,
    deleteList,
    getList,
    openPanel,
    closePanel,
    openEditor,
    closeEditor,
  };
}
