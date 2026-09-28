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

const LETTERMINT_ENDPOINT = "https://api.lettermint.co/v1/send";

interface MailMessage {
  /** Weergavenaam van de afzender; het adres komt uit MAIL_FROM_EMAIL. */
  fromName: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

/** Of Lettermint geconfigureerd is (token + afzender). */
function mailConfigured() {
  return Boolean(process.env.LETTERMINT_API_TOKEN && process.env.MAIL_FROM_EMAIL);
}

/**
 * Verstuurt één mail via Lettermint (Sending API). Bewust zonder SDK: één
 * HTTP-call heeft geen extra dependency nodig. Controleer eerst
 * `mailConfigured()`; de aanroeper beslist wat er zonder config gebeurt.
 */
async function sendMail({ fromName, to, subject, text, html, replyTo }: MailMessage) {
  const response = await fetch(LETTERMINT_ENDPOINT, {
    method: "POST",
    headers: {
      "x-lettermint-token": process.env.LETTERMINT_API_TOKEN!,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${process.env.MAIL_FROM_EMAIL}>`,
      to: [to],
      subject,
      text,
      html,
      reply_to: replyTo ? [replyTo] : undefined,
    }),
  });

  if (!response.ok) {
    // Wordt opgevangen door de aanroeper.
    throw new Error(
      `Lettermint gaf ${response.status}: ${await response.text().catch(() => "")}`,
    );
  }
}

/**
 * Stuurt een bestelmelding naar de zaak.
 *
 * Zonder LETTERMINT_API_TOKEN (bv. lokale ontwikkeling) gebeurt er niets
 * behalve een logregel — bestellen mag nooit stukgaan omdat mail niet
 * ingesteld is.
 */
export async function sendOrderNotification({
  order,
  billing,
  items,
  customerEmail,
}: OrderNotification) {
  const to = process.env.ORDER_NOTIFICATION_EMAIL;

  if (!mailConfigured() || !to) {
    console.info(
      `[mail] Bestelling ${order.id} opgeslagen; geen e-mail verstuurd (LETTERMINT_API_TOKEN / MAIL_FROM_EMAIL / ORDER_NOTIFICATION_EMAIL niet ingesteld).`,
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

  const text = [
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

  await sendMail({
    fromName: process.env.MAIL_FROM_NAME || "Bestellingen Vermeir",
    to,
    // Antwoorden gaat rechtstreeks naar de klant, niet naar de afzender.
    // Enkel het adres: een bedrijfsnaam met komma breekt "Naam <adres>".
    replyTo: billing.invoiceEmail,
    subject: `Nieuwe bestelling — ${billing.companyName}`,
    text,
  });
}

interface AuthLinkMail {
  email: string;
  url: string;
  /** "reset" = wachtwoord vergeten; bepaalt enkel de tekst van de mail. */
  purpose: "login" | "reset";
}

/**
 * Stuurt een inloglink (magic link) naar de klant. Zonder Lettermint-config
 * (lokaal) wordt de link in de serverlog gezet, zodat je de flow toch kan
 * testen — in productie nooit, want de link geeft toegang tot het account.
 */
export async function sendAuthLinkMail({ email, url, purpose }: AuthLinkMail) {
  if (!mailConfigured()) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        `[mail] Inloglink voor ${email} niet verstuurd (LETTERMINT_API_TOKEN / MAIL_FROM_EMAIL niet ingesteld).`,
      );
    } else {
      console.info(`[mail] Inloglink (${purpose}) voor ${email}:\n${url}`);
    }
    return;
  }

  const isReset = purpose === "reset";
  const subject = isReset
    ? "Nieuw wachtwoord instellen — Vleeswaren Vermeir"
    : "Uw inloglink — Vleeswaren Vermeir";
  const intro = isReset
    ? "U vroeg een nieuw wachtwoord aan. Via onderstaande link wordt u ingelogd en kan u meteen een nieuw wachtwoord kiezen."
    : "Via onderstaande link wordt u meteen ingelogd in de klantenzone.";
  const buttonLabel = isReset ? "Nieuw wachtwoord instellen" : "Inloggen";
  const outro =
    "De link is 15 minuten geldig en werkt maar één keer. Heeft u dit niet zelf aangevraagd? Dan mag u deze mail negeren.";

  await sendMail({
    // Niet MAIL_FROM_NAME: die is "Bestellingen …" en bedoeld voor bestelmails.
    fromName: "Vleeswaren Vermeir",
    to: email,
    subject,
    text: [intro, "", url, "", outro].join("\n"),
    html: `<p>${intro}</p>
<p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#b8252a;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">${buttonLabel}</a></p>
<p style="color:#666;font-size:13px">${outro}</p>`,
  });
}
