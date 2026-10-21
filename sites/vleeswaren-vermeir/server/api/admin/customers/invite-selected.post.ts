import { inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { customers } from "~~/server/database/schema";
import { inviteCustomer, loginStatusSql } from "~~/server/utils/customer-login";
import { requireAdmin } from "#layers/auth/server/utils/session";

/**
 * POST /api/admin/customers/invite-selected — stuurt de lanceringsmail naar
 * een door de beheerder gekozen selectie klanten, i.p.v. in één keer naar
 * iedereen (zie invite-all.post.ts). Voor elke beheerder (rol "admin").
 *
 * Klanten zonder e-mailadres en klanten die al actief zijn (wachtwoord
 * gekozen of al eens ingelogd) worden overgeslagen en apart geteld. Wie
 * uitgenodigd is maar nog nooit inlogde, krijgt de mail opnieuw.
 *
 * Bewust één voor één: één mislukte mail houdt de rest niet tegen.
 */
const bodySchema = z.object({ ids: z.array(z.uuid()).min(1).max(200) });

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { ids } = await readValidatedBody(event, (data) => bodySchema.parse(data));

  const selection = await db
    .select({ id: customers.id, loginStatus: loginStatusSql })
    .from(customers)
    .where(inArray(customers.id, ids));

  const skipped = { noEmail: 0, active: 0 };
  const failed: { id: string; reason: string }[] = [];
  let invited = 0;
  for (const { id, loginStatus } of selection) {
    if (loginStatus === "no-email") {
      skipped.noEmail++;
      continue;
    }
    if (loginStatus === "active") {
      skipped.active++;
      continue;
    }
    try {
      await inviteCustomer(id, { mail: "launch" });
      invited++;
    } catch (err) {
      const reason =
        (err as { statusMessage?: string }).statusMessage ?? "Mail niet verstuurd.";
      console.error(`[admin] Lanceringsmail voor klant ${id} mislukt:`, err);
      failed.push({ id, reason });
    }
  }

  return { invited, skipped, failed };
});
