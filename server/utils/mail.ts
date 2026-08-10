import type { BillingDetails, Order } from "~~/server/database/schema";

interface OrderMailItem {
  articleNr: string;
  name: string;
  supplier: string;
  unit: string | null;
  quantity: number;
}

interface OrderNotification {
  order: Order;
  billing: BillingDetails;
  items: OrderMailItem[];
  customerEmail: string;
}

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

/**
 * Stuurt een bestelmelding naar de zaak via Brevo (transactionele API).
 *
 * Bewust zonder SDK: één HTTP-call heeft geen extra dependency nodig.
 * Zonder BREVO_API_KEY (bv. lokale ontwikkeling) gebeurt er niets behalve
 * een logregel — bestellen mag nooit stukgaan omdat mail niet ingesteld is.
 */
export async function sendOrderNotification({
  order,
  billing,
  items,
  customerEmail,
}: OrderNotification) {
  const apiKey = process.env.BREVO_API_KEY;
  const to = process.env.ORDER_NOTIFICATION_EMAIL;
  const from = process.env.BREVO_FROM_EMAIL;
  const fromName = process.env.BREVO_FROM_NAME || "Bestellingen Vermeir";

  if (!apiKey || !to || !from) {
    console.info(
      `[mail] Bestelling ${order.id} opgeslagen; geen e-mail verstuurd (BREVO_API_KEY / ORDER_NOTIFICATION_EMAIL / BREVO_FROM_EMAIL niet ingesteld).`,
    );
    return;
  }

  const placedAt = order.createdAt.toLocaleString("nl-BE", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Brussels",
  });

  const lines = items
    .map(
      (i) =>
        `${i.quantity}× ${i.name} (${i.articleNr}, ${i.supplier}${i.unit ? `, ${i.unit}` : ""})`,
    )
    .join("\n");

  const textContent = [
    `Nieuwe bestelling van ${billing.companyName}`,
    ``,
    `Geplaatst op: ${placedAt}`,
    `Account: ${customerEmail}`,
    ``,
    `— Facturatiegegevens —`,
    billing.companyName,
    billing.vatNumber ? `BTW: ${billing.vatNumber}` : null,
    `${billing.street}, ${billing.postalCode} ${billing.city}, ${billing.country}`,
    `Tel: ${billing.phone}`,
    `Factuur-e-mail: ${billing.invoiceEmail}`,
    ``,
    `— Bestelde artikelen —`,
    lines,
    ``,
    `Referentie: ${order.id}`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const response = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: from, name: fromName },
      to: [{ email: to }],
      // Antwoorden gaat rechtstreeks naar de klant, niet naar de afzender.
      replyTo: { email: billing.invoiceEmail, name: billing.companyName },
      subject: `Nieuwe bestelling — ${billing.companyName}`,
      textContent,
    }),
  });

  if (!response.ok) {
    // Wordt opgevangen door de aanroeper: de bestelling blijft overeind.
    throw new Error(
      `Brevo gaf ${response.status}: ${await response.text().catch(() => "")}`,
    );
  }
}
