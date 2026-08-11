/**
 * Bestellen + "lijst opslaan"-flow rond het winkelmandje. Gedeeld tussen de
 * mandje-drawer en de volledige /winkelmandje-pagina zodat de foutafhandeling
 * (ontbrekende facturatiegegevens, niet meer beschikbare producten) niet
 * dubbel onderhouden hoeft te worden.
 */
export function useCartCheckout() {
  const cart = useCart();
  const orderLists = useOrderLists();
  const auth = useAuth();
  const authModal = useAuthModal();

  const placing = ref(false);
  const orderError = ref("");

  const saveModalOpen = ref(false);
  const saveName = ref("");

  const importModalOpen = ref(false);

  const clearConfirmOpen = ref(false);

  const orderModalOpen = ref(false);
  const orderName = ref("");
  const orderNote = ref("");

  function requireLogin(): boolean {
    if (auth.isLoggedIn.value) return true;
    authModal.open("login");
    return false;
  }

  function defaultOrderName(): string {
    const d = new Date();
    return `Bestelling ${d.toLocaleDateString("nl-BE", { day: "2-digit", month: "short" })}`;
  }

  function openOrderModal() {
    if (cart.items.value.length === 0) return;
    if (!requireLogin()) return;
    orderError.value = "";
    orderName.value = defaultOrderName();
    orderNote.value = "";
    orderModalOpen.value = true;
  }

  function closeOrderModal() {
    orderModalOpen.value = false;
  }

  async function placeOrder() {
    if (placing.value || cart.items.value.length === 0) return;
    orderError.value = "";
    if (!requireLogin()) return;

    placing.value = true;
    try {
      const order = await $fetch<{ id: string }>("/api/account/orders", {
        method: "POST",
        body: {
          name: orderName.value.trim(),
          note: orderNote.value.trim() || undefined,
          items: cart.items.value.map((i) => ({
            articleNr: i.articleNr,
            quantity: i.quantity,
          })),
        },
      });

      orderModalOpen.value = false;
      cart.clearCart();
      cart.isOpen.value = false;
      await navigateTo(`/account/bestellingen/${order.id}?nieuw=1`);
    } catch (err) {
      const error = err as {
        statusMessage?: string;
        data?: { statusMessage?: string; data?: { names?: string[] } };
      };
      const code = error.data?.statusMessage ?? error.statusMessage;

      if (code === "FACTURATIEGEGEVENS_ONTBREKEN") {
        cart.isOpen.value = false;
        await navigateTo("/account/gegevens?next=cart");
        return;
      }

      if (code === "PRODUCTEN_NIET_BESCHIKBAAR") {
        const names = error.data?.data?.names ?? [];
        orderError.value = `Niet meer beschikbaar: ${names.join(", ")}. Verwijder deze artikelen en probeer opnieuw.`;
        return;
      }

      orderError.value = "Bestellen mislukt. Probeer het straks opnieuw.";
    } finally {
      placing.value = false;
    }
  }

  function defaultListName(): string {
    const d = new Date();
    return `Lijst ${d.toLocaleDateString("nl-BE", { day: "2-digit", month: "short" })}`;
  }

  function openSaveModal() {
    if (cart.items.value.length === 0) return;
    if (!requireLogin()) return;
    saveName.value = defaultListName();
    saveModalOpen.value = true;
  }

  function closeSaveModal() {
    saveModalOpen.value = false;
  }

  async function confirmSave() {
    const name = saveName.value.trim();
    if (!name || !requireLogin()) return;

    await orderLists.saveCart(
      name,
      cart.items.value.map((i) => ({
        id: i.id,
        articleNr: i.articleNr,
        name: i.name,
        supplier: i.supplier,
        unit: i.unit,
        quantity: i.quantity,
      })),
    );
    saveModalOpen.value = false;
  }

  function openLists() {
    if (!requireLogin()) return;
    cart.isOpen.value = false;
    navigateTo("/account/lijsten");
  }

  function openImportModal() {
    if (!requireLogin()) return;
    importModalOpen.value = true;
    orderLists.ensureLoaded();
  }

  function closeImportModal() {
    importModalOpen.value = false;
  }

  function openClearConfirm() {
    if (cart.items.value.length === 0) return;
    clearConfirmOpen.value = true;
  }

  function closeClearConfirm() {
    clearConfirmOpen.value = false;
  }

  function confirmClear() {
    cart.clearCart();
    clearConfirmOpen.value = false;
  }

  return {
    placing,
    orderError,
    saveModalOpen,
    saveName,
    importModalOpen,
    clearConfirmOpen,
    orderModalOpen,
    orderName,
    orderNote,
    placeOrder,
    openSaveModal,
    closeSaveModal,
    confirmSave,
    openLists,
    openImportModal,
    closeImportModal,
    openClearConfirm,
    closeClearConfirm,
    confirmClear,
    openOrderModal,
    closeOrderModal,
  };
}
