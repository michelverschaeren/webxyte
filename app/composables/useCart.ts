export interface CartItem {
  id: string;
  articleNr: string;
  name: string;
  supplier: string;
  unit?: string;
  quantity: number;
}

export type CartProductInput = Omit<CartItem, "quantity">;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Winkelmandje. Voor gasten puur browser-geheugen (zoals voorheen). Voor
 * ingelogde klanten staat het mandje in de database (via /api/account/cart),
 * zodat het op elk toestel hetzelfde is. Elke schrijfactie doet eerst een
 * optimistische lokale update voor directe feedback, en herlaadt daarna het
 * mandje vanuit de server zodat `items` altijd de bron van waarheid volgt —
 * zelfde patroon als `useOrderLists`.
 */
export function useCart() {
  const auth = useAuth();

  const items = useState<CartItem[]>("cart", () => []);
  const isOpen = useState<boolean>("cart-open", () => false);
  const toastVisible = useState<boolean>("cart-toast", () => false);
  const loaded = useState<boolean>("cart-loaded", () => false);
  const loading = useState<boolean>("cart-loading", () => false);

  const totalItems = computed(() =>
    items.value.reduce((sum, i) => sum + i.quantity, 0),
  );

  async function fetchCart() {
    loading.value = true;
    try {
      const res = await $fetch<{ items: CartItem[] }>("/api/account/cart");
      items.value = res.items;
      loaded.value = true;
    } finally {
      loading.value = false;
    }
  }

  async function ensureLoaded() {
    if (!auth.isLoggedIn.value || loaded.value || loading.value) return;
    if (!import.meta.client) return;
    await fetchCart();
  }

  /** Leegt de lokale kopie, bv. na uitloggen. */
  function reset() {
    items.value = [];
    loaded.value = false;
  }

  /** Voegt het gastenmandje samen met het account bij het inloggen. */
  async function syncAfterLogin() {
    const guestItems = items.value.map((i) => ({
      articleNr: i.articleNr,
      quantity: i.quantity,
    }));

    if (guestItems.length === 0) {
      await fetchCart();
      return;
    }

    const res = await $fetch<{ items: CartItem[] }>("/api/account/cart/bulk", {
      method: "POST",
      body: { items: guestItems, mode: "merge" },
    });
    items.value = res.items;
    loaded.value = true;
  }

  function mergeLocal(product: CartProductInput, qty: number) {
    const existing = items.value.find((i) => i.id === product.id);
    if (existing) existing.quantity += qty;
    else items.value.push({ ...product, quantity: qty });
  }

  function addItem(
    product: CartProductInput,
    quantity: number = 1,
    openDrawer: boolean = true,
  ) {
    const qty = Math.max(1, Math.floor(quantity));
    mergeLocal(product, qty);
    if (openDrawer && !isOpen.value) toastVisible.value = true;

    if (!auth.isLoggedIn.value) return;
    $fetch("/api/account/cart/items", {
      method: "POST",
      body: { articleNr: product.articleNr, quantity: qty },
    })
      .then(() => fetchCart())
      .catch(() => fetchCart());
  }

  function addItems(
    list: Array<CartProductInput & { quantity: number }>,
    openDrawer: boolean = true,
  ) {
    for (const it of list) {
      const existing = items.value.find((i) => i.id === it.id);
      if (existing) {
        existing.quantity += Math.max(1, Math.floor(it.quantity));
      } else {
        const { quantity, ...rest } = it;
        items.value.push({
          ...rest,
          quantity: Math.max(1, Math.floor(quantity)),
        });
      }
    }
    if (openDrawer && !isOpen.value) toastVisible.value = true;

    if (!auth.isLoggedIn.value || list.length === 0) return;
    $fetch("/api/account/cart/bulk", {
      method: "POST",
      body: {
        items: list.map((i) => ({ articleNr: i.articleNr, quantity: i.quantity })),
        mode: "merge",
      },
    })
      .then(() => fetchCart())
      .catch(() => fetchCart());
  }

  function replaceItems(
    list: Array<CartProductInput & { quantity: number }>,
    openDrawer: boolean = true,
  ) {
    items.value = list.map((it) => {
      const { quantity, ...rest } = it;
      return { ...rest, quantity: Math.max(1, Math.floor(quantity)) };
    });
    if (openDrawer && !isOpen.value) toastVisible.value = true;

    if (!auth.isLoggedIn.value) return;
    $fetch("/api/account/cart/bulk", {
      method: "POST",
      body: {
        items: list.map((i) => ({ articleNr: i.articleNr, quantity: i.quantity })),
        mode: "replace",
      },
    })
      .then(() => fetchCart())
      .catch(() => fetchCart());
  }

  function removeItem(id: string) {
    const idx = items.value.findIndex((i) => i.id === id);
    if (idx !== -1) items.value.splice(idx, 1);

    if (!auth.isLoggedIn.value || !UUID_RE.test(id)) return;
    $fetch(`/api/account/cart/items/${id}`, { method: "DELETE" })
      .then(() => fetchCart())
      .catch(() => fetchCart());
  }

  function updateQuantity(id: string, qty: number) {
    if (qty <= 0) {
      removeItem(id);
      return;
    }
    const item = items.value.find((i) => i.id === id);
    if (item) item.quantity = qty;

    if (!auth.isLoggedIn.value || !UUID_RE.test(id)) return;
    $fetch(`/api/account/cart/items/${id}`, {
      method: "PATCH",
      body: { quantity: qty },
    })
      .then(() => fetchCart())
      .catch(() => fetchCart());
  }

  function clearCart() {
    items.value = [];

    if (!auth.isLoggedIn.value) return;
    $fetch("/api/account/cart", { method: "DELETE" }).catch(() => {});
  }

  return {
    items,
    isOpen,
    toastVisible,
    loading,
    totalItems,
    ensureLoaded,
    syncAfterLogin,
    reset,
    addItem,
    addItems,
    replaceItems,
    removeItem,
    updateQuantity,
    clearCart,
  };
}
