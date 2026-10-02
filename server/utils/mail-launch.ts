import { COMPANY } from "~~/shared/company";
import {
  MAIL_BRAND,
  MAIL_FONT,
  MAIL_MUTED,
  MAIL_TEXT,
  SITE_URL,
  escapeHtml,
  mailButton,
  renderMailLayout,
  withTextFooter,
} from "./mail-layout";

/**
 * Aankondiging van de nieuwe website aan bestaande klanten, met hun
 * persoonlijke uitnodigingslink (zelfde link als `sendCustomerInvite`:
 * 7 dagen geldig, daarna meteen een wachtwoord kiezen).
 *
 * Nog niet gekoppeld aan een verzendactie: eerst het ontwerp goedkeuren.
 */
interface LaunchMail {
  /** Bedrijfsnaam van de klant voor de aanhef; zonder valt het terug op "Beste klant". */
  companyName: string | null;
  url: string;
}

const SUBJECT = `Onze nieuwe website: bestel voortaan online bij ${COMPANY.name}`;

const BENEFITS = [
  {
    title: "Bestellen wanneer het u past",
    text: "Ook 's avonds of in het weekend. Uw bestelling komt rechtstreeks bij ons binnen, zonder misverstanden over artikels of aantallen.",
  },
  {
    title: `Ons volledige gamma`,
    text: `Zoek en blader door meer dan ${COMPANY.productCount} producten, met de productfiches erbij.`,
  },
  {
    title: "Bestellijsten",
    text: "Bewaar uw vaste producten in een lijst en bestel ze telkens opnieuw in een paar klikken.",
  },
  {
    title: "Vorige bestellingen herhalen",
    text: "Start een nieuwe bestelling vanuit een eerdere, zonder alles opnieuw te zoeken.",
  },
];

const STEPS = [
  "Klik op de knop \"Activeer mijn account\": u wordt meteen ingelogd.",
  "Kies een eigen wachtwoord.",
  "Klaar. Voortaan logt u in met uw e-mailadres en dat wachtwoord.",
];

export function renderLaunchMail({ companyName, url }: LaunchMail) {
  const e = escapeHtml;
  const greeting = companyName ? `Beste ${companyName}` : "Beste klant";
  const h2 = `margin:32px 0 12px;font-family:${MAIL_FONT};font-size:18px;color:${MAIL_TEXT}`;
  const p = "margin:0 0 16px";

  const banner = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" bgcolor="#1c1414" style="background:#1c1414;padding:36px 32px 32px">
      <img src="${SITE_URL}/images/herobanner-big.png" width="420" alt="Vleeswaren Vermeir" style="display:block;width:100%;max-width:420px;height:auto;border:0;color:#ffffff;font-family:${MAIL_FONT};font-size:24px;font-weight:700">
      <p style="margin:20px 0 0;font-family:${MAIL_FONT};font-size:15px;letter-spacing:2px;text-transform:uppercase;color:#c89868">Onze website in een nieuw jasje</p>
    </td>
  </tr>
</table>`;

  const benefits = BENEFITS.map(
    (b) => `<tr>
    <td width="28" style="vertical-align:top;padding:2px 0 14px;font-family:${MAIL_FONT};font-size:16px;font-weight:700;color:${MAIL_BRAND}">&#10003;</td>
    <td style="vertical-align:top;padding:0 0 14px;font-family:${MAIL_FONT};font-size:15px;line-height:1.5;color:${MAIL_TEXT}">
      <strong>${e(b.title)}</strong><br>
      <span style="color:${MAIL_MUTED}">${e(b.text)}</span>
    </td>
  </tr>`,
  ).join("\n  ");

  const steps = STEPS.map(
    (s, i) => `<tr>
    <td width="36" style="vertical-align:top;padding:0 0 10px">
      <div style="width:26px;height:26px;line-height:26px;border-radius:13px;background:${MAIL_BRAND};color:#ffffff;text-align:center;font-family:${MAIL_FONT};font-size:14px;font-weight:700">${i + 1}</div>
    </td>
    <td style="vertical-align:top;padding:3px 0 10px;font-family:${MAIL_FONT};font-size:15px;color:${MAIL_TEXT}">${e(s)}</td>
  </tr>`,
  ).join("\n  ");

  const content = `<p style="${p}">${e(greeting)},</p>
<p style="${p}">Al sinds ${COMPANY.foundingYear} mogen wij u en vele andere handelaars voorzien van kwaliteitsvolle vleeswaren. Daar zijn we u dankbaar voor. Om het u nog makkelijker te maken, hebben we onze website volledig vernieuwd. Vanaf nu kan u er ook <strong>online bestellen</strong>.</p>
<p style="${p}">Voor u staat er al een persoonlijk klantenaccount klaar.</p>

${mailButton("Activeer mijn account", url)}

<h2 style="${h2}">Wat kan u voortaan online?</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  ${benefits}
</table>

<h2 style="${h2}">In drie stappen aan de slag</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  ${steps}
</table>
<p style="margin:8px 0 0;font-size:13px;color:${MAIL_MUTED}">Deze persoonlijke link is 7 dagen geldig en werkt één keer. Verlopen? Vraag dan via "Wachtwoord vergeten" op <a href="${SITE_URL}" style="color:${MAIL_BRAND}">vleeswarenvermeir.be</a> een nieuwe link aan.</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 0">
  <tr>
    <td style="background:#f7f1ea;border-left:4px solid #c89868;border-radius:4px;padding:20px 24px;font-family:${MAIL_FONT};font-size:15px;line-height:1.6;color:${MAIL_TEXT}">
      <strong style="font-size:16px">Vertrouwd, ook online</strong><br>
      Vleeswaren Vermeir blijft het familiebedrijf dat u kent, vandaag met de derde generatie aan het roer. U bestelt, onze eigen chauffeurs leveren de dag nadien. Ontbreekt er een artikel? Dan wordt het dezelfde week nageleverd.
    </td>
  </tr>
</table>

<p style="margin:24px 0 16px">Liever persoonlijk? Bellen, mailen of een WhatsApp-bericht blijft altijd mogelijk. Online bestellen helpt ons wel om uw bestelling sneller en foutloos te verwerken. U bereikt ons op <strong>${COMPANY.phone}</strong> of <strong>${COMPANY.mobile}</strong>.</p>

<p style="margin:0">Met vriendelijke groeten,<br>
<strong>Het team van ${COMPANY.name}</strong></p>`;

  const text = withTextFooter(
    [
      `${greeting},`,
      "",
      `Al sinds ${COMPANY.foundingYear} mogen wij u en vele andere handelaars voorzien van kwaliteitsvolle vleeswaren. Daar zijn we u dankbaar voor. Om het u nog makkelijker te maken, hebben we onze website volledig vernieuwd. Vanaf nu kan u er ook online bestellen.`,
      "",
      "Voor u staat er al een persoonlijk klantenaccount klaar. Activeer het via deze link:",
      url,
      "",
      "Wat kan u voortaan online?",
      ...BENEFITS.map((b) => `- ${b.title}: ${b.text}`),
      "",
      "In drie stappen aan de slag:",
      ...STEPS.map((s, i) => `${i + 1}. ${s}`),
      "",
      `Deze persoonlijke link is 7 dagen geldig en werkt één keer. Verlopen? Vraag dan via "Wachtwoord vergeten" op vleeswarenvermeir.be een nieuwe link aan.`,
      "",
      "Vleeswaren Vermeir blijft het familiebedrijf dat u kent, vandaag met de derde generatie aan het roer. U bestelt, onze eigen chauffeurs leveren de dag nadien. Ontbreekt er een artikel? Dan wordt het dezelfde week nageleverd.",
      "",
      `Liever persoonlijk? Bellen, mailen of een WhatsApp-bericht blijft altijd mogelijk. U bereikt ons op ${COMPANY.phone} of ${COMPANY.mobile}.`,
      "",
      "Met vriendelijke groeten,",
      `Het team van ${COMPANY.name}`,
    ].join("\n"),
  );

  return {
    subject: SUBJECT,
    text,
    html: renderMailLayout({
      title: "Bestel voortaan ook online",
      preheader: "Uw persoonlijke klantenaccount staat klaar. Activeer het in een paar klikken.",
      banner,
      content,
    }),
  };
}
