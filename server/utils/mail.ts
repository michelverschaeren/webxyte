import type { BillingSnapshot, Order } from "~~/server/database/schema";
import { escapeHtml, mailButton, renderMailLayout, withTextFooter } from "./mail-layout";
import { renderLaunchMail } from "./mail-launch";
import {
  contactDetails,
  deliveryAddressLines,
  generateOrderPdf,
  orderPdfFilename,
  promotionLines,
  type OrderPdfItem,
} from "./order-pdf";

/** Zelfde vorm als een regel op de bestelbon, inclusief promoties. */
type OrderMailItem = OrderPdfItem;

interface OrderNotification {
  order: Order;
  billing: BillingSnapshot;
  items: OrderMailItem[];
  customerEmail: string;
  /** Klantnummer uit het CRM; null voor een login zonder klant (bv. test). */
  customerNr: string | null;
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
  attachments?: MailAttachment[];
}

interface MailAttachment {
  filename: string;
  /** Ruwe bytes; worden hier naar base64 omgezet zoals Lettermint verwacht. */
  content: Uint8Array;
  contentType: string;
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
async function sendMail({
  fromName,
  to,
  subject,
  text,
  html,
  replyTo,
  attachments,
}: MailMessage) {
  // Lokaal en op Vercel Preview (kopie van productie, met echte klanten):
  // alle mail naar de ontwikkelaar, met de echte ontvanger in het onderwerp.
  const redirectTo = process.env.MAIL_REDIRECT_TO;
  if (redirectTo) {
    subject = `[test → ${to}] ${subject}`;
    to = redirectTo;
    replyTo = undefined;
  }

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
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content).toString("base64"),
        content_type: a.contentType,
      })),
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
  customerNr,
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
    .map((i) =>
      [
        `${i.quantity}× ${i.name} (${i.articleNr}, ${i.supplier}${i.unit ? `, ${i.unit}` : ""})`,
        ...promotionLines(i).map((line) => `   ${line}`),
      ].join("\n"),
    )
    .join("\n");

  const promoItems = items.filter((i) => (i.promotions ?? []).length > 0);

  const text = [
    `Nieuwe bestelling van ${billing.companyName}`,
    ``,
    `Geplaatst op: ${placedAt}`,
    `Klantnummer: ${customerNr ?? "—"}`,
    `Account: ${customerEmail}`,
    ...contactDetails(billing, customerEmail).map(([k, v]) => `${k}: ${v}`),
    ``,
    `— Leveringsadres —`,
    ...deliveryAddressLines(billing),
    ``,
    ...(promoItems.length > 0
      ? [
          `De klant bestelt ${promoItems.length} artikel${promoItems.length === 1 ? "" : "en"} met een lopende promotie (zie hieronder).`,
          ``,
        ]
      : []),
    `— Bestelde artikelen —`,
    lines,
    ``,
    `Referentie: ${order.id}`,
  ].join("\n");

  const html = renderMailLayout({
    title: `Nieuwe bestelling van ${billing.companyName}`,
    preheader:
      `${items.length} artikel${items.length === 1 ? "" : "en"}` +
      (promoItems.length > 0 ? `, ${promoItems.length} met promotie` : "") +
      ` — bestelbon in bijlage`,
    content: orderMailContent({ order, billing, items, customerEmail, customerNr }, placedAt),
  });

  // Een mislukte PDF mag de bestelmail zelf niet tegenhouden.
  let attachments: MailAttachment[] | undefined;
  try {
    const pdf = await generateOrderPdf({ order, billing, customerNr, customerEmail, items });
    attachments = [
      {
        filename: orderPdfFilename(order, customerNr),
        content: pdf,
        contentType: "application/pdf",
      },
    ];
  } catch (err) {
    console.error(`[mail] PDF voor bestelling ${order.id} mislukt:`, err);
  }

  await sendMail({
    fromName: process.env.MAIL_FROM_NAME || "Bestellingen Vermeir",
    to,
    // Antwoorden gaat rechtstreeks naar de klant, niet naar de afzender.
    // Enkel het adres: een bedrijfsnaam met komma breekt "Naam <adres>".
    replyTo: billing.invoiceEmail,
    subject: `Nieuwe bestelling — ${billing.companyName}`,
    text: withTextFooter(text),
    html,
    attachments,
  });
}

/** HTML-inhoud van de bestelmail; komt in de standaard-layout. */
function orderMailContent(
  { order, billing, items, customerEmail, customerNr }: OrderNotification,
  placedAt: string,
) {
  const e = escapeHtml;
  const label = "padding:2px 16px 2px 0;color:#666;font-size:14px;white-space:nowrap;vertical-align:top";
  const head = "padding:0 8px 6px 0;border-bottom:2px solid #1a1a1a;font-size:13px;color:#666;text-align:left";
  const cell = "padding:8px 8px 8px 0;border-bottom:1px solid #e5e5e5;vertical-align:top";
  const h2 = "margin:0 0 8px;font-size:16px";

  const details: [string, string][] = [
    ["Geplaatst op", placedAt],
    ["Klantnummer", customerNr ?? "—"],
    ["Account", customerEmail],
    ...contactDetails(billing, customerEmail),
  ];
  // Bewust zonder `order.name`: dat is een persoonlijk geheugensteuntje van
  // de klant, niet bedoeld voor de zaak.

  // Promotie onder de productnaam: rood label als de voorwaarde gehaald is,
  // grijs als de klant (nog) onder het minimum zit.
  const promoHtml = (i: OrderMailItem) =>
    (i.promotions ?? [])
      .map(
        (p) => `<br><span style="display:inline-block;margin-top:4px;padding:1px 6px;border-radius:4px;font-size:12px;font-weight:600;${
          p.reached ? "background:#fbe9e9;color:#b8252a" : "background:#f0f0f0;color:#666"
        }">Promotie: ${e(p.label)}</span> <span style="font-size:12px;color:#666">${e(p.note)}</span>`,
      )
      .join("");

  const promoCount = items.filter((i) => (i.promotions ?? []).length > 0).length;

  const rows = items.map(
    (i) => `<tr>
    <td style="${cell};font-weight:600">${e(i.articleNr)}</td>
    <td style="${cell};text-align:right;font-weight:600">${i.quantity}</td>
    <td style="${cell};padding-left:12px">${e(i.name)}${i.unit ? ` <span style="color:#666">(${e(i.unit)})</span>` : ""}${promoHtml(i)}</td>
    <td style="${cell}">${e(i.supplier)}</td>
  </tr>`,
  );

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px">
  ${details.map(([k, v]) => `<tr><td style="${label}">${k}</td><td style="padding:2px 0;font-size:14px">${e(v)}</td></tr>`).join("\n  ")}
</table>
<h2 style="${h2}">Leveringsadres</h2>
<p style="margin:0 0 24px;font-size:14px">${deliveryAddressLines(billing).map(e).join("<br>")}</p>
${order.note ? `<h2 style="${h2}">Opmerking</h2>
<p style="margin:0 0 24px;font-size:14px;white-space:pre-line">${e(order.note)}</p>` : ""}
${promoCount > 0 ? `<p style="margin:0 0 16px;padding:10px 12px;border-left:3px solid #b8252a;background:#fbe9e9;font-size:14px">De klant bestelt <strong>${promoCount} artikel${promoCount === 1 ? "" : "en"} met een lopende promotie</strong>. Ze staan hieronder bij het product aangeduid.</p>` : ""}
<h2 style="${h2}">Bestelde artikelen</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px">
  <tr>
    <th style="${head}">Artikelnr.</th>
    <th style="${head};text-align:right">Aantal</th>
    <th style="${head};padding-left:12px">Product</th>
    <th style="${head}">Leverancier</th>
  </tr>
  ${rows.join("\n  ")}
</table>
<p style="margin:24px 0 0;font-size:13px;color:#666">De bestelbon zit als PDF in bijlage. Referentie: ${e(order.id)}</p>`;
}

interface ContactMessage {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  message: string;
}

/** Adres van de zaak dat de berichten van het contactformulier ontvangt. */
function contactRecipient() {
  return process.env.CONTACT_NOTIFICATION_EMAIL || process.env.ORDER_NOTIFICATION_EMAIL;
}

/**
 * Stuurt een bericht van het contactformulier door naar de zaak. Geeft
 * `false` terug als de mail niet ingesteld is: anders dan bij een bestelling
 * wordt het bericht nergens bewaard, dus de aanroeper mag dan geen succes
 * melden.
 */
export async function sendContactMail({ name, company, email, phone, message }: ContactMessage) {
  const to = contactRecipient();
  if (!mailConfigured() || !to) return false;

  const e = escapeHtml;
  const label = "padding:2px 16px 2px 0;color:#666;font-size:14px;white-space:nowrap;vertical-align:top";
  const details: [string, string][] = [
    ["Naam", name],
    ["Bedrijf", company || "—"],
    ["E-mail", email],
    ["Telefoon", phone || "—"],
  ];

  await sendMail({
    fromName: "Website Vermeir",
    to,
    // Antwoorden gaat rechtstreeks naar de afzender van het formulier.
    replyTo: email,
    subject: `Contactformulier — ${company || name}`,
    text: withTextFooter(
      [...details.map(([k, v]) => `${k}: ${v}`), "", "— Bericht —", message].join("\n"),
    ),
    html: renderMailLayout({
      title: `Bericht van ${name}`,
      preheader: message.slice(0, 120),
      content: `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px">
  ${details.map(([k, v]) => `<tr><td style="${label}">${k}</td><td style="padding:2px 0;font-size:14px">${e(v)}</td></tr>`).join("\n  ")}
</table>
<h2 style="margin:0 0 8px;font-size:16px">Bericht</h2>
<p style="margin:0;font-size:14px;white-space:pre-line">${e(message)}</p>`,
    }),
  });
  return true;
}

/** Adres van de zaak dat de aanvragen "klant worden" ontvangt. */
function customerRequestRecipient() {
  return process.env.CUSTOMER_REQUEST_EMAIL || "vleeswarenvermeir@telenet.be";
}

/**
 * Stuurt een aanvraag "klant worden" (enkel een e-mailadres) door naar de
 * zaak. Geeft `false` terug als de mail in productie niet ingesteld is: de
 * aanvraag wordt nergens bewaard, dus de aanroeper mag dan geen succes
 * melden. Lokaal komt de aanvraag in de serverlog, zodat de flow te testen is.
 */
export async function sendCustomerRequestMail({ email }: { email: string }) {
  if (!mailConfigured()) {
    if (process.env.NODE_ENV === "production") return false;
    console.info(`[mail] Aanvraag "klant worden" van ${email} (niet verstuurd: mail niet ingesteld).`);
    return true;
  }

  const intro = "Iemand vroeg via de website aan om klant te worden. Dit e-mailadres is nog niet gekend in de klantenzone.";
  const outro =
    "Beantwoord deze mail om contact op te nemen. Wordt dit een klant? Voeg hem dan toe via Beheer → Klanten; hij krijgt dan automatisch een uitnodiging om in te loggen.";

  await sendMail({
    fromName: "Website Vermeir",
    to: customerRequestRecipient(),
    // Antwoorden gaat rechtstreeks naar de aanvrager.
    replyTo: email,
    subject: `Aanvraag klant worden — ${email}`,
    text: withTextFooter([intro, "", `E-mail: ${email}`, "", outro].join("\n")),
    html: renderMailLayout({
      title: "Aanvraag: klant worden",
      preheader: email,
      content: `<p style="margin:0 0 16px">${intro}</p>
<p style="margin:0 0 16px;font-size:16px"><strong>${escapeHtml(email)}</strong></p>
<p style="margin:0;color:#666;font-size:13px">${outro}</p>`,
    }),
  });
  return true;
}

interface AuthLinkMail {
  email: string;
  url: string;
  /**
   * Bepaalt enkel de tekst van de mail: "reset" = wachtwoord vergeten,
   * "invite" = nieuw account aangemaakt door een beheerder.
   */
  purpose: "login" | "reset" | "invite";
}

const AUTH_LINK_TEXT = {
  login: {
    subject: "Uw inloglink — Vleeswaren Vermeir",
    title: "Inloggen in de klantenzone",
    intro: "Via onderstaande link wordt u meteen ingelogd in de klantenzone.",
    buttonLabel: "Inloggen",
    outro:
      "De link is 15 minuten geldig en werkt maar één keer. Heeft u dit niet zelf aangevraagd? Dan mag u deze mail negeren.",
  },
  reset: {
    subject: "Nieuw wachtwoord instellen — Vleeswaren Vermeir",
    title: "Nieuw wachtwoord instellen",
    intro:
      "U vroeg een nieuw wachtwoord aan. Via onderstaande link wordt u ingelogd en kan u meteen een nieuw wachtwoord kiezen.",
    buttonLabel: "Nieuw wachtwoord instellen",
    outro:
      "De link is 15 minuten geldig en werkt maar één keer. Heeft u dit niet zelf aangevraagd? Dan mag u deze mail negeren.",
  },
  invite: {
    subject: "Uw account bij Vleeswaren Vermeir",
    title: "Welkom in de klantenzone",
    intro:
      "Er werd een account voor u aangemaakt in de klantenzone van Vleeswaren Vermeir. Via onderstaande link wordt u ingelogd en kiest u meteen uw wachtwoord.",
    buttonLabel: "Wachtwoord instellen",
    outro:
      "De link is 7 dagen geldig en werkt maar één keer. Verlopen? Vraag dan via 'Wachtwoord vergeten' op de website een nieuwe link aan.",
  },
} as const;

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

  const { subject, title, intro, buttonLabel, outro } = AUTH_LINK_TEXT[purpose];

  await sendMail({
    // Niet MAIL_FROM_NAME: die is "Bestellingen …" en bedoeld voor bestelmails.
    fromName: "Vleeswaren Vermeir",
    to: email,
    subject,
    text: withTextFooter([intro, "", url, "", outro].join("\n")),
    html: renderMailLayout({
      title,
      preheader: intro,
      content: `<p style="margin:0">${intro}</p>
${mailButton(buttonLabel, url)}
<p style="margin:0;color:#666;font-size:13px">${outro}</p>`,
    }),
  });
}

/**
 * Stuurt de lanceringsmail (aankondiging nieuwe website) met de persoonlijke
 * uitnodigingslink. Zonder Lettermint-config: zelfde gedrag als
 * `sendAuthLinkMail`.
 */
export async function sendLaunchMail({
  email,
  url,
  companyName,
}: {
  email: string;
  url: string;
  companyName: string | null;
}) {
  if (!mailConfigured()) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        `[mail] Lanceringsmail voor ${email} niet verstuurd (LETTERMINT_API_TOKEN / MAIL_FROM_EMAIL niet ingesteld).`,
      );
    } else {
      console.info(`[mail] Lanceringsmail voor ${email}:\n${url}`);
    }
    return;
  }

  const { subject, text, html } = renderLaunchMail({ companyName, url });
  await sendMail({ fromName: "Vleeswaren Vermeir", to: email, subject, text, html });
}
