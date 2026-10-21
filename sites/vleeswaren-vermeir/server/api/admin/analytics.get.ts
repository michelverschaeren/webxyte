import { z } from "zod";
import { requireAdmin } from "~~/server/utils/session";

/**
 * GET /api/admin/analytics?days=7|30|90 — bezoekcijfers uit Vercel Web
 * Analytics voor de beheerpagina "Bezoekers".
 *
 * Vercel bewaart en telt zelf; deze route vraagt enkel de resultaten op via
 * de Web Analytics API. Het token blijft op de server (nooit in de browser).
 *
 * Zonder VERCEL_ANALYTICS_TOKEN, of als Vercel weigert, komt er geen fout
 * maar `configured: false` / `error` terug, zodat de pagina dat kan melden.
 */
const querySchema = z.object({
  days: z.enum(["7", "30", "90"]).default("30"),
});

const API = "https://api.vercel.com/v1/query/web-analytics/visits";

// Geen geheimen: de ID's van het Vercel-project en -team. Het project-ID zet
// Vercel zelf als systeemvariabele; lokaal gelden de waarden hieronder.
const PROJECT_ID = process.env.VERCEL_PROJECT_ID || "prj_mhZcspbWIYWX4UOiadrSVvUEn1S5";
const TEAM_ID = process.env.VERCEL_TEAM_ID || "team_O7SI4PmzagiBbMTMxvgg8LFj";

const PER_DAY_CHUNK_MS = 60 * 24 * 60 * 60 * 1000;

type Row = Record<string, unknown>;

interface Breakdown {
  key: string;
  pageviews: number;
  visitors: number;
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { days } = await getValidatedQuery(event, (data) => querySchema.parse(data));

  const token = process.env.VERCEL_ANALYTICS_TOKEN;
  if (!token) return { configured: false as const };

  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (Number(days) - 1));
  // Tot het begin van morgen: `count` kapt `until` af op het begin van de dag
  // en zou vandaag anders niet meetellen (de uitsplitsingen ronden wel naar boven).
  const until = new Date();
  until.setUTCHours(24, 0, 0, 0);
  const range = { since: since.toISOString(), until: until.toISOString() };

  const query = <T>(path: "count" | "aggregate", params: Record<string, string | number> = {}) =>
    $fetch<{ data: T }>(`${API}/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      query: { projectId: PROJECT_ID, teamId: TEAM_ID, ...range, ...params },
    }).then((res) => res.data);

  const breakdown = async (by: string, limit = 10): Promise<Breakdown[]> => {
    const rows = await query<Row[]>("aggregate", { by, limit });
    return rows.map((row) => ({
      key: String(row[by] ?? ""),
      pageviews: num(row.pageviews),
      visitors: num(row.visitors),
    }));
  };

  // Vercel geeft per dag hoogstens 62 dagen terug ("invalid_group_by"); een
  // langere periode vragen we daarom in stukken op en plakken we aaneen.
  const perDayRows = async () => {
    const chunks: Promise<Row[]>[] = [];
    for (let start = since.getTime(); start < until.getTime(); start += PER_DAY_CHUNK_MS) {
      const end = Math.min(start + PER_DAY_CHUNK_MS, until.getTime());
      chunks.push(
        query<Row[]>("aggregate", {
          by: "day",
          limit: 100,
          since: new Date(start).toISOString(),
          until: new Date(end).toISOString(),
        }),
      );
    }
    return (await Promise.all(chunks)).flat();
  };

  try {
    const [totals, perDay, pages, referrers, devices] = await Promise.all([
      query<Row>("count"),
      perDayRows(),
      breakdown("requestPath"),
      breakdown("referrerHostname"),
      breakdown("deviceType", 5),
    ]);

    return {
      configured: true as const,
      days: Number(days),
      totals: { pageviews: num(totals.pageviews), visitors: num(totals.visitors) },
      perDay: perDay.map((row) => ({
        date: String(row.timestamp ?? ""),
        pageviews: num(row.pageviews),
        visitors: num(row.visitors),
      })),
      pages,
      referrers,
      devices,
    };
  } catch (err) {
    const { statusCode: status, data } = err as { statusCode?: number; data?: unknown };
    // `data` is het antwoord van Vercel zelf, met de reden van de weigering.
    console.error("[analytics] Vercel Web Analytics API:", status, JSON.stringify(data), err);
    return {
      configured: true as const,
      error:
        status === 401 || status === 403
          ? "Vercel weigert de toegang. Controleer of het token geldig is en toegang heeft tot dit team."
          : "De bezoekcijfers konden niet opgehaald worden bij Vercel.",
    };
  }
});
