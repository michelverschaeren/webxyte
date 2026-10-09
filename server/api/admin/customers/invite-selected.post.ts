import { z } from "zod";
import { inviteCustomer } from "~~/server/utils/customer-login";
import { requireAgencyAdmin } from "~~/server/utils/session";

/**
 * POST /api/admin/customers/invite-selected — stuurt de lanceringsmail naar
 * een door de beheerder gekozen selectie klanten, i.p.v. in één keer naar
 * iedereen (zie invite-all.post.ts). Voorbehouden aan de agency-admin.
 *
 * Bewust één voor één: één mislukte mail houdt de rest niet tegen.
 */
const bodySchema = z.object({ ids: z.array(z.uuid()).min(1).max(200) });

export default defineEventHandler(async (event) => {
  await requireAgencyAdmin(event);

  const { ids } = await readValidatedBody(event, (data) => bodySchema.parse(data));

  const failed: { id: string; reason: string }[] = [];
  for (const id of ids) {
    try {
      await inviteCustomer(id, { mail: "launch" });
    } catch (err) {
      const reason =
        (err as { statusMessage?: string }).statusMessage ?? "Mail niet verstuurd.";
      console.error(`[admin] Lanceringsmail voor klant ${id} mislukt:`, err);
      failed.push({ id, reason });
    }
  }

  return { invited: ids.length - failed.length, failed };
});
