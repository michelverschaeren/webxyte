import { z } from "zod";
import { sendContactMail } from "~~/server/utils/mail";

/**
 * POST /api/contact — bericht van het contactformulier, doorgestuurd naar de
 * zaak via Lettermint. Het bericht wordt nergens bewaard.
 *
 * Publiek endpoint, dus twee drempels tegen spam: een verborgen veld dat
 * enkel bots invullen, en een limiet per IP.
 */

/** Eén regel: geen regeleindes in wat in het onderwerp van de mail komt. */
const singleLine = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value.replace(/\s+/g, " "));

const bodySchema = z.object({
  name: singleLine(120).pipe(z.string().min(1)),
  company: singleLine(200).optional(),
  email: z.string().trim().toLowerCase().pipe(z.email().max(200)),
  phone: singleLine(40).optional(),
  message: z.string().trim().min(1).max(5000),
  /** Honeypot: onzichtbaar in het formulier, een mens laat het leeg. */
  website: z.string().max(200).optional(),
});

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

/**
 * IP → tijdstippen van recente berichten. In het geheugen van de instantie:
 * genoeg om een script af te remmen, zonder een tabel voor een formulier.
 */
const recent = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    recent.set(ip, hits);
    return true;
  }
  hits.push(now);
  recent.set(ip, hits);

  // Hou de map klein: verlopen IP's opruimen zodra ze zich opstapelen.
  if (recent.size > 1000) {
    for (const [key, times] of recent) {
      if (times.every((t) => now - t >= WINDOW_MS)) recent.delete(key);
    }
  }
  return false;
}

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (data) => bodySchema.parse(data));

  // Een bot krijgt hetzelfde antwoord als een mens, maar er vertrekt niets.
  if (body.website) return { ok: true };

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? "onbekend";
  if (rateLimited(ip)) {
    throw createError({
      statusCode: 429,
      statusMessage: "Te veel berichten. Probeer het later opnieuw.",
    });
  }

  let sent = false;
  try {
    sent = await sendContactMail({
      name: body.name,
      company: body.company || undefined,
      email: body.email,
      phone: body.phone || undefined,
      message: body.message,
    });
  } catch (err) {
    console.error("[contact] Bericht niet verstuurd:", err);
  }

  if (!sent) {
    throw createError({
      statusCode: 503,
      statusMessage: "Het bericht kon niet verstuurd worden.",
    });
  }

  return { ok: true };
});
