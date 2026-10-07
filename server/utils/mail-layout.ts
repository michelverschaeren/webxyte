import { COMPANY } from "~~/shared/company";

/**
 * Gedeeld "jasje" voor alle e-mails: kleine header met logo, centrale
 * inhoud en een footer met contactgegevens.
 *
 * Mailclients (Outlook!) kennen geen moderne CSS: daarom tabellen en
 * inline styles, en geen externe stylesheet.
 */

/**
 * Publieke site-URL voor het logo en de footerlink. Bewust niet
 * BETTER_AUTH_URL: lokaal is dat localhost, en dat laadt geen enkele
 * mailclient. Zelfde waarde als `site.url` in nuxt.config.ts.
 */
export const SITE_URL = "https://vleeswarenvermeir.be";

export const MAIL_BRAND = "#b8252a";
export const MAIL_TEXT = "#1a1a1a";
export const MAIL_MUTED = "#666666";
const TEXT = MAIL_TEXT;
const MUTED = MAIL_MUTED;
const BORDER = "#e5e5e5";
export const MAIL_FONT = "Helvetica, Arial, sans-serif";
const FONT = MAIL_FONT;

const CONTACT = {
  name: COMPANY.legalName,
  address: `${COMPANY.street}, ${COMPANY.postalCode} ${COMPANY.city}`,
  phone: COMPANY.phone,
  mobile: `${COMPANY.mobileName} ${COMPANY.mobile} · GSM ${COMPANY.mobile2Name} ${COMPANY.mobile2}`,
  email: COMPANY.email,
};

/** Escapet tekst voor gebruik in HTML (bedrijfsnamen, opmerkingen, …). */
export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Rode knop als link; werkt ook in Outlook dankzij de tabel eromheen. */
export function mailButton(label: string, url: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0">
  <tr>
    <td style="border-radius:8px;background:${MAIL_BRAND}">
      <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 24px;font-family:${FONT};font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}

interface MailLayout {
  /** Grote titel bovenaan de inhoud. */
  title: string;
  /** Inhoud als HTML; aanroeper escapet zelf de variabele delen. */
  content: string;
  /** Korte voorbeeldtekst die mailclients naast het onderwerp tonen. */
  preheader?: string;
  /** Optionele HTML over de volle breedte tussen header en inhoud (bv. een banner). */
  banner?: string;
}

/** Verpakt `content` in de standaard-layout en geeft een volledig HTML-document terug. */
export function renderMailLayout({ title, content, preheader, banner }: MailLayout) {
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4">
  <tr>
    <td align="center" style="padding:24px 12px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden">
        <!-- Header -->
        <tr>
          <td style="padding:20px 32px;border-bottom:3px solid ${MAIL_BRAND}">
            <a href="${SITE_URL}" style="text-decoration:none">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:12px;vertical-align:middle">
                    <img src="${SITE_URL}/images/logo-light.png" width="40" height="36" alt="Vleeswaren Vermeir" style="display:block;border:0">
                  </td>
                  <td style="vertical-align:middle;font-family:${FONT};font-size:18px;font-weight:700;color:${TEXT}">
                    Vleeswaren <span style="color:${MAIL_BRAND}">Vermeir</span>
                  </td>
                </tr>
              </table>
            </a>
          </td>
        </tr>
        ${banner ? `<tr><td style="padding:0">${banner}</td></tr>` : ""}
        <!-- Inhoud -->
        <tr>
          <td style="padding:32px;font-family:${FONT};font-size:16px;line-height:1.5;color:${TEXT}">
            <h1 style="margin:0 0 16px;font-family:${FONT};font-size:22px;line-height:1.3;color:${TEXT}">${escapeHtml(title)}</h1>
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;background:#fafafa;border-top:1px solid ${BORDER};font-family:${FONT};font-size:13px;line-height:1.6;color:${MUTED}">
            <strong style="color:${TEXT}">${CONTACT.name}</strong><br>
            ${CONTACT.address}<br>
            Tel. ${CONTACT.phone} · GSM ${CONTACT.mobile}<br>
            <a href="mailto:${CONTACT.email}" style="color:${MAIL_BRAND};text-decoration:none">${CONTACT.email}</a>
            · <a href="${SITE_URL}" style="color:${MAIL_BRAND};text-decoration:none">vleeswarenvermeir.be</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/** Zelfde footer voor de platte-tekstversie van een mail. */
export function withTextFooter(text: string) {
  return [
    text,
    "",
    "--",
    CONTACT.name,
    CONTACT.address,
    `Tel. ${CONTACT.phone} · GSM ${CONTACT.mobile}`,
    CONTACT.email,
    SITE_URL.replace("https://", ""),
  ].join("\n");
}
