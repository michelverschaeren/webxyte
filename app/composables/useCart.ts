export interface CartItem {
  id: string;
  articleNr: string;
  name: string;
  supplier: string;
  unit?: string;
  quantity: number;
}

export type CartProductInput = Omit<CartItem, "quantity">;

export function useCart() {
  const items = useState<CartItem[]>("cart", () => []);
  const isOpen = useState<boolean>("cart-open", () => false);
  const isMaximized = useState<boolean>("cart-maximized", () => false);

  const totalItems = computed(() =>
    items.value.reduce((sum, i) => sum + i.quantity, 0),
  );

  function addItem(
    product: CartProductInput,
    quantity: number = 1,
    openDrawer: boolean = true,
  ) {
    const qty = Math.max(1, Math.floor(quantity));
    const existing = items.value.find((i) => i.id === product.id);
    if (existing) {
      existing.quantity += qty;
    } else {
      items.value.push({ ...product, quantity: qty });
    }
    if (openDrawer) isOpen.value = true;
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
    if (openDrawer) isOpen.value = true;
  }

  function replaceItems(
    list: Array<CartProductInput & { quantity: number }>,
    openDrawer: boolean = true,
  ) {
    items.value = list.map((it) => {
      const { quantity, ...rest } = it;
      return { ...rest, quantity: Math.max(1, Math.floor(quantity)) };
    });
    if (openDrawer) isOpen.value = true;
  }

  function removeItem(id: string) {
    const idx = items.value.findIndex((i) => i.id === id);
    if (idx !== -1) items.value.splice(idx, 1);
  }

  function updateQuantity(id: string, qty: number) {
    const item = items.value.find((i) => i.id === id);
    if (item) {
      if (qty <= 0) removeItem(id);
      else item.quantity = qty;
    }
  }

  function clearCart() {
    items.value = [];
  }

  return {
    items,
    isOpen,
    isMaximized,
    totalItems,
    addItem,
    addItems,
    replaceItems,
    removeItem,
    updateQuantity,
    clearCart,
  };
}
