import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { BillingDetails, Order } from "~~/server/database/schema";

export interface OrderPdfItem {
  articleNr: string;
  name: string;
  unit: string | null;
  quantity: number;
}

interface OrderPdfInput {
  order: Order;
  billing: BillingDetails;
  /** Klantnummer uit het CRM; null voor een login zonder klant (bv. test). */
  customerNr: string | null;
  customerEmail: string;
  items: OrderPdfItem[];
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

// Kolommen van de artikeltabel: artikelnummer, aantal, productnaam.
const COL_ARTICLE = MARGIN;
const COL_QTY_RIGHT = MARGIN + 140;
const COL_NAME = MARGIN + 160;
const NAME_WIDTH = PAGE_WIDTH - MARGIN - COL_NAME;

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
 * Tabel: artikelnummer, aantal, productnaam — in die volgorde, zoals
 * het magazijn de bon leest.
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

  const placedAt = order.createdAt.toLocaleString("nl-BE", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Brussels",
  });

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

  // — Kop —
  text("Vleeswaren Vermeir", MARGIN, { font: bold, size: 11, color: BRAND });
  rightText("Bestelbon", PAGE_WIDTH - MARGIN, { font: bold, size: 20 });
  y -= 30;
  hr(BRAND, 1.5);
  y -= 24;

  // — Bestel- en klantgegevens (label/waarde-paren) —
  const details: [string, string][] = [
    ["Datum", placedAt],
    ["Klant", billing.companyName],
    ["Klantnummer", customerNr ?? "—"],
    ["Account", customerEmail],
    ["Naam bestelling", order.name || "—"],
    ["Bestelnummer", order.id],
  ];

  for (const [label, value] of details) {
    text(label, MARGIN, { size: 9, color: MUTED });
    text(value, MARGIN + 90, { font: label === "Klant" ? bold : regular });
    y -= 15;
  }

  // — Facturatiegegevens —
  y -= 10;
  text("Facturatiegegevens", MARGIN, { font: bold, size: 9, color: MUTED });
  y -= 14;
  const billingLines = [
    billing.companyName,
    billing.vatNumber ? `BTW: ${billing.vatNumber}` : null,
    billing.street,
    `${billing.postalCode} ${billing.city}, ${billing.country}`,
    `Tel: ${billing.phone}`,
    `Factuur-e-mail: ${billing.invoiceEmail}`,
  ].filter((line): line is string => line !== null);
  for (const line of billingLines) {
    text(line, MARGIN);
    y -= 13;
  }

  // — Opmerking van de klant —
  if (order.note) {
    y -= 10;
    text("Opmerking", MARGIN, { font: bold, size: 9, color: MUTED });
    y -= 14;
    for (const paragraph of order.note.split(/\r?\n/)) {
      for (const line of wrapText(clean(paragraph), regular, 10, CONTENT_WIDTH)) {
        if (y < MARGIN + 40) {
          page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          y = PAGE_HEIGHT - MARGIN;
        }
        text(line, MARGIN);
        y -= 13;
      }
    }
  }

  // — Artikeltabel —
  const drawTableHeader = () => {
    text("Artikelnr.", COL_ARTICLE, { font: bold, size: 9, color: MUTED });
    rightText("Aantal", COL_QTY_RIGHT, { font: bold, size: 9, color: MUTED });
    text("Product", COL_NAME, { font: bold, size: 9, color: MUTED });
    y -= 6;
    hr(TEXT, 0.75);
    y -= ROW_LINE_HEIGHT + 1;
  };

  y -= 20;
  drawTableHeader();

  for (const item of items) {
    const label = item.unit ? `${item.name} (${item.unit})` : item.name;
    const nameLines = wrapText(clean(label), regular, 10, NAME_WIDTH);
    const rowHeight = nameLines.length * ROW_LINE_HEIGHT;

    // Rij past niet meer: nieuwe pagina met herhaalde tabelkop.
    if (y - rowHeight < MARGIN + 20) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
      drawTableHeader();
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

    y -= rowHeight - ROW_LINE_HEIGHT + ROW_PADDING;
    hr();
    y -= ROW_LINE_HEIGHT + ROW_PADDING - 3;
  }

  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
  y -= 2;
  text(
    `${items.length} artikel${items.length === 1 ? "" : "en"} · totaal aantal: ${totalQty}`,
    MARGIN,
    { size: 9, color: MUTED },
  );

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
