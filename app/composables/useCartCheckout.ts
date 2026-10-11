/**
 * Bestellen + "lijst opslaan"-flow rond het winkelmandje, dat volledig op de
 * productenpagina leeft (zie CartCheckoutModals.vue). Losstaand van useCart
 * zodat de foutafhandeling (niet meer beschikbare producten) op één plek
 * blijft.
 *
 * State via `useState` i.p.v. lokale `ref`s: de knoppen (producten-pagina)
 * en de modals (CartCheckoutModals.vue) roepen deze composable elk apart
 * aan, en moeten daarbij wél naar dezelfde open/dicht-status kijken —
 * anders opent een klik op "Bestelling plaatsen" een modal-instantie die
 * nergens gerenderd wordt.
 */
import type { DeliveryAddress } from "#shared/address";

export function useCartCheckout() {
  const cart = useCart();
  const orderLists = useOrderLists();
  const auth = useAuth();
  const authModal = useAuthModal();

  const placing = useState<boolean>("checkout-placing", () => false);
  const orderError = useState<string>("checkout-order-error", () => "");

  const saveModalOpen = useState<boolean>("checkout-save-modal-open", () => false);
  const saveName = useState<string>("checkout-save-name", () => "");

  const importModalOpen = useState<boolean>("checkout-import-modal-open", () => false);

  const clearConfirmOpen = useState<boolean>("checkout-clear-confirm-open", () => false);

  const orderModalOpen = useState<boolean>("checkout-order-modal-open", () => false);
  const orderName = useState<string>("checkout-order-name", () => "");
  const orderNote = useState<string>("checkout-order-note", () => "");
  // Leveringsadres van deze bestelling: de klant kiest uit zijn adressen
  // (standaard het primaire) en kan ze in de popup ook aanmaken of wijzigen.
  const orderIsCustomer = useState<boolean>("checkout-order-is-customer", () => false);
  const orderAddresses = useState<DeliveryAddress[]>("checkout-order-addresses", () => []);
  const orderAddressId = useState<string | null>("checkout-order-address-id", () => null);

  function requireLogin(): boolean {
    if (auth.isLoggedIn.value) return true;
    authModal.open();
    return false;
  }

  function defaultOrderName(): string {
    const d = new Date();
    return `Bestelling ${d.toLocaleDateString("nl-BE", { day: "2-digit", month: "short" })}`;
  }

  /**
   * Haalt de leveringsadressen op (het primaire eerst). Mislukt dat, dan
   * blijft bestellen mogelijk: de server neemt dan zelf het primaire adres.
   */
  async function loadOrderAddresses() {
    try {
      const contact = await $fetch("/api/account/contact");
      orderIsCustomer.value = contact.isCustomer;
      orderAddresses.value = contact.addresses;
    } catch {
      orderIsCustomer.value = false;
      orderAddresses.value = [];
    }
    if (!orderAddresses.value.some((a) => a.id === orderAddressId.value)) {
      orderAddressId.value = orderAddresses.value[0]?.id ?? null;
    }
  }

  function openOrderModal() {
    if (cart.items.value.length === 0) return;
    if (!requireLogin()) return;
    orderError.value = "";
    orderName.value = defaultOrderName();
    orderNote.value = "";
    orderAddressId.value = null;
    orderModalOpen.value = true;
    loadOrderAddresses();
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
          addressId: orderAddressId.value ?? undefined,
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

      if (code === "PRODUCTEN_NIET_BESCHIKBAAR") {
        const names = error.data?.data?.names ?? [];
        orderError.value = `Niet meer beschikbaar: ${names.join(", ")}. Verwijder deze artikelen en probeer opnieuw.`;
        return;
      }

      if (code === "LEVERINGSADRES_ONBEKEND") {
        await loadOrderAddresses();
        orderError.value =
          "Het gekozen leveringsadres bestaat niet meer. Controleer het adres en probeer opnieuw.";
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
    orderIsCustomer,
    orderAddresses,
    orderAddressId,
    loadOrderAddresses,
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
