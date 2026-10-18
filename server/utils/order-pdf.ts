import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import type { OrderLinePromotion } from "../../shared/promotion";
import type { BillingSnapshot, Order } from "~~/server/database/schema";

export interface OrderPdfItem {
  articleNr: string;
  name: string;
  supplier: string;
  unit: string | null;
  quantity: number;
  /** Promoties die bij het bestellen voor deze klant golden; leeg = geen. */
  promotions?: OrderLinePromotion[] | null;
}

/** "Promotie: 3+1 gratis (+1 gratis)" — één regel per promotie. */
export function promotionLines(item: OrderPdfItem): string[] {
  return (item.promotions ?? []).map((p) => `Promotie: ${p.label} (${p.note})`);
}

interface OrderPdfInput {
  order: Order;
  billing: BillingSnapshot;
  /** Klantnummer uit het CRM; null voor een login zonder klant (bv. test). */
  customerNr: string | null;
  customerEmail: string;
  items: OrderPdfItem[];
}

/** "bestelling-<klantnr>-<JJJJ-MM-DD>.pdf" — bijlage van de mail én download in het beheer. */
export function orderPdfFilename(order: Pick<Order, "id" | "createdAt">, customerNr: string | null) {
  const datePart = order.createdAt
    .toLocaleDateString("sv-SE", { timeZone: "Europe/Brussels" }); // JJJJ-MM-DD
  const nrPart = customerNr ?? order.id.slice(0, 8);
  return `bestelling-${nrPart}-${datePart}.pdf`;
}

/**
 * De extra klantregels bovenaan bestelbon en bestelmail: telefoon, en het
 * factuuradres enkel als het afwijkt van het account (anders staat het er al).
 */
export function contactDetails(
  billing: BillingSnapshot,
  customerEmail: string,
) {
  const details: [string, string][] = [["Telefoon", billing.phone || "—"]];
  if (billing.invoiceEmail.toLowerCase() !== customerEmail.toLowerCase()) {
    details.push(["Factuur-e-mail", billing.invoiceEmail]);
  }
  return details;
}

/** Het leveringsadres in regels: straat + nummer, dan postcode en gemeente. */
export function deliveryAddressLines(billing: BillingSnapshot): string[] {
  const lines = [
    billing.street,
    [billing.postalCode, billing.city].filter(Boolean).join(" "),
  ].filter((line): line is string => Boolean(line));
  return lines.length > 0 ? lines : ["Niet ingevuld"];
}

/**
 * Promotieregel op de bestelbon, ook zonder kleur duidelijk:
 * "PROMOTIE: 3+1 gratis (waarvan 1 gratis)" of
 * "Geen promotie: 25% korting vanaf 2 stuks (minimum niet gehaald)".
 */
function promotionText(p: OrderLinePromotion): string {
  if (p.reached) {
    return p.note === "van toepassing"
      ? `PROMOTIE: ${p.label}`
      : `PROMOTIE: ${p.label} (${p.note})`;
  }
  // "25% korting vanaf 2 stuks" noemt het minimum al; "5+1 gratis" niet.
  const why = p.label.includes("vanaf") ? "minimum niet gehaald" : p.note;
  return `Geen promotie: ${p.label} (${why})`;
}

// A4 in punten.
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const BRAND = rgb(0xb8 / 255, 0x25 / 255, 0x2a / 255);
const TEXT = rgb(0.1, 0.1, 0.1);
const MUTED = rgb(0.4, 0.4, 0.4);
const LINE = rgb(0.85, 0.85, 0.85);
// Heel lichte merkkleur achter rijen met promotie.
const PROMO_TINT = rgb(0.99, 0.93, 0.93);

// Kolommen van de artikeltabel: artikelnummer, aantal, productnaam, leverancier.
const COL_ARTICLE = MARGIN;
const COL_QTY_RIGHT = MARGIN + 140;
const COL_NAME = MARGIN + 160;
const SUPPLIER_WIDTH = 120;
const COL_SUPPLIER = PAGE_WIDTH - MARGIN - SUPPLIER_WIDTH;
const NAME_WIDTH = COL_SUPPLIER - 12 - COL_NAME;

const ROW_LINE_HEIGHT = 13;
const ROW_PADDING = 5;

/**
 * Standaardfonts (Helvetica) kennen enkel WinAnsi. Tekens daarbuiten
 * (bv. "ł" in een productnaam) zouden drawText laten crashen — die vervangen
 * we door "?" zodat een vreemd teken nooit de bestelmail blokkeert.
 */
function sanitizer(font: PDFFont) {
  const supported = new Set(font.getCharacterSet());
  return (value: string) =>
    [...value.normalize("NFC")]
      .map((ch) => (supported.has(ch.codePointAt(0)!) ? ch : "?"))
      .join("");
}

/** Breekt tekst op woordgrenzen af zodat elke regel binnen `maxWidth` past. */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  let current = "";

  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    // Eén woord dat op zich al te breed is: hard afbreken per teken.
    current = "";
    for (const ch of word) {
      if (font.widthOfTextAtSize(current + ch, size) > maxWidth && current) {
        lines.push(current);
        current = ch;
      } else {
        current += ch;
      }
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

/**
 * Genereert een bestelbon (PDF) voor de bestelmail aan de zaak.
 * Tabel: artikelnummer, aantal, productnaam, leverancier — in die volgorde,
 * zoals het magazijn de bon leest.
 */
export async function generateOrderPdf({
  order,
  billing,
  customerNr,
  customerEmail,
  items,
}: OrderPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const clean = sanitizer(regular);

  // "Vrijdag 16 oktober 2026 om 14:32"
  const day = order.createdAt.toLocaleDateString("nl-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Brussels",
  });
  const time = order.createdAt.toLocaleTimeString("nl-BE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Brussels",
  });
  const placedAt = `${day.charAt(0).toUpperCase()}${day.slice(1)} om ${time}`;

  pdf.setTitle(`Bestelbon ${billing.companyName}`);
  pdf.setAuthor("Vleeswaren Vermeir");
  pdf.setCreationDate(order.createdAt);

  let page: PDFPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const text = (
    value: string,
    x: number,
    opts: { font?: PDFFont; size?: number; color?: typeof TEXT } = {},
  ) => {
    page.drawText(clean(value), {
      x,
      y,
      font: opts.font ?? regular,
      size: opts.size ?? 10,
      color: opts.color ?? TEXT,
    });
  };

  const rightText = (
    value: string,
    right: number,
    opts: { font?: PDFFont; size?: number; color?: typeof TEXT } = {},
  ) => {
    const font = opts.font ?? regular;
    const size = opts.size ?? 10;
    text(value, right - font.widthOfTextAtSize(clean(value), size), opts);
  };

  const hr = (color = LINE, thickness = 0.75) => {
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness,
      color,
    });
  };

  // — Kop: klant links, bestelbon + tijdstip rechts —
  // Bewust zonder `order.name`: dat is een persoonlijk geheugensteuntje van
  // de klant, niet bedoeld voor de zaak.
  // Korte vorm, zoals in het beheer (Bestellingen → Bestelnr.).
  const title = `Bestelbon #${order.id.slice(0, 8).toUpperCase()}`;
  const titleSize = 13;
  const headerLeftWidth =
    CONTENT_WIDTH - bold.widthOfTextAtSize(clean(title), titleSize) - 20;
  const customer = customerNr
    ? `${billing.companyName} - ${customerNr}`
    : billing.companyName;
  const contact = [customerEmail, billing.phone].filter(Boolean).join(" - ");
  const top = y;

  rightText(title, PAGE_WIDTH - MARGIN, { font: bold, size: titleSize });
  y -= 18;
  rightText(placedAt, PAGE_WIDTH - MARGIN, { color: MUTED });
  const rightBottom = y - 13;

  y = top;
  for (const line of wrapText(clean(customer), bold, 13, headerLeftWidth)) {
    text(line, MARGIN, { font: bold, size: 13, color: BRAND });
    y -= 16;
  }
  y -= 2;
  for (const line of wrapText(clean(contact), regular, 10, headerLeftWidth)) {
    text(line, MARGIN, { color: MUTED });
    y -= 13;
  }

  y = Math.min(y, rightBottom) - 4;
  hr(BRAND, 1.5);
  y -= 24;

  // Factuur-e-mail enkel als die afwijkt van het account (dat staat al in de kop).
  if (billing.invoiceEmail.toLowerCase() !== customerEmail.toLowerCase()) {
    text("Factuur-e-mail", MARGIN, { size: 9, color: MUTED });
    text(billing.invoiceEmail, MARGIN + 90);
    y -= 25;
  }

  // — Opmerking van de klant —
  if (order.note) {
    text("Opmerking", MARGIN, { font: bold, size: 9, color: MUTED });
    y -= 14;
    for (const paragraph of order.note.split(/\r?\n/)) {
      for (const line of wrapText(
        clean(paragraph),
        regular,
        10,
        CONTENT_WIDTH,
      )) {
        if (y < MARGIN + 40) {
          page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          y = PAGE_HEIGHT - MARGIN;
        }
        text(line, MARGIN);
        y -= 13;
      }
    }
    y -= 10;
  }

  // — Samenvatting boven de tabel —
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
  const promoCount = items.filter((i) =>
    (i.promotions ?? []).some((p) => p.reached),
  ).length;
  text(`Verschillende producten: ${items.length}`, MARGIN, { font: bold });
  text(`Totaal aantal stuks: ${totalQty}`, MARGIN + 170, { font: bold });
  if (promoCount > 0) {
    text(`Met promotie: ${promoCount}`, MARGIN + 320, {
      font: bold,
      color: BRAND,
    });
  }
  y -= 24;

  // — Artikeltabel —
  const drawTableHeader = () => {
    text("Artikelnr.", COL_ARTICLE, { font: bold, size: 9, color: MUTED });
    rightText("Aantal", COL_QTY_RIGHT, { font: bold, size: 9, color: MUTED });
    text("Product", COL_NAME, { font: bold, size: 9, color: MUTED });
    text("Leverancier", COL_SUPPLIER, { font: bold, size: 9, color: MUTED });
    y -= 6;
    hr(TEXT, 0.75);
    y -= ROW_LINE_HEIGHT + 1;
  };

  drawTableHeader();

  for (const item of items) {
    const label = item.unit ? `${item.name} (${item.unit})` : item.name;
    const nameLines = wrapText(clean(label), regular, 10, NAME_WIDTH);
    // Promoties onder de productnaam. Ook in zwart-wit herkenbaar: een
    // promotie die geldt staat er als "PROMOTIE:" (vet, rij lichtrood),
    // een niet-gehaalde als "Geen promotie:" (grijs).
    const promoLines = (item.promotions ?? []).flatMap((p) =>
      wrapText(clean(promotionText(p)), bold, 9, NAME_WIDTH).map((line) => ({
        line,
        reached: p.reached,
      })),
    );
    const hasPromo = (item.promotions ?? []).some((p) => p.reached);
    const supplierLines = wrapText(
      clean(item.supplier),
      regular,
      10,
      SUPPLIER_WIDTH,
    );
    const rowHeight =
      Math.max(nameLines.length + promoLines.length, supplierLines.length) *
      ROW_LINE_HEIGHT;

    // Rij past niet meer: nieuwe pagina met herhaalde tabelkop.
    if (y - rowHeight < MARGIN + 20) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
      drawTableHeader();
    }

    // Van de lijn boven de rij tot de lijn eronder.
    const top = y + ROW_LINE_HEIGHT + 1;
    const bottom = y - (rowHeight - ROW_LINE_HEIGHT + ROW_PADDING);
    if (hasPromo) {
      page.drawRectangle({
        x: MARGIN - 6,
        y: bottom,
        width: CONTENT_WIDTH + 12,
        height: top - bottom,
        color: PROMO_TINT,
      });
    }

    text(item.articleNr, COL_ARTICLE, { font: bold });
    rightText(String(item.quantity), COL_QTY_RIGHT, { font: bold });
    nameLines.forEach((line, i) => {
      page.drawText(line, {
        x: COL_NAME,
        y: y - i * ROW_LINE_HEIGHT,
        font: regular,
        size: 10,
        color: TEXT,
      });
    });
    promoLines.forEach(({ line, reached }, i) => {
      page.drawText(line, {
        x: COL_NAME,
        y: y - (nameLines.length + i) * ROW_LINE_HEIGHT,
        font: reached ? bold : regular,
        size: 9,
        color: reached ? BRAND : MUTED,
      });
    });
    supplierLines.forEach((line, i) => {
      page.drawText(line, {
        x: COL_SUPPLIER,
        y: y - i * ROW_LINE_HEIGHT,
        font: regular,
        size: 10,
        color: TEXT,
      });
    });

    y -= rowHeight - ROW_LINE_HEIGHT + ROW_PADDING;
    hr();
    y -= ROW_LINE_HEIGHT + ROW_PADDING - 3;
  }

  // — Leveringsadres, onder de tabel —
  const addressLines = deliveryAddressLines(billing);
  y -= 10;
  if (y - 14 - addressLines.length * 13 < MARGIN + 20) {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  }
  text("Leveringsadres", MARGIN, { font: bold, size: 9, color: MUTED });
  y -= 14;
  for (const line of addressLines) {
    text(line, MARGIN);
    y -= 13;
  }

  // — Paginanummers —
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    const label = `Pagina ${i + 1} van ${pages.length}`;
    p.drawText(label, {
      x: PAGE_WIDTH - MARGIN - regular.widthOfTextAtSize(label, 8),
      y: MARGIN / 2,
      font: regular,
      size: 8,
      color: MUTED,
    });
  });

  return pdf.save();
}
