import { and, asc, desc, eq, exists, gt, gte, ilike, inArray, lt, lte, or, sql as raw } from "drizzle-orm";
import { z } from "zod";
import { isoDateSchema, promotionStatus, todayInBrussels } from "#shared/promotion";
import { db } from "~~/server/database/client";
import {
  categories,
  customers,
  promotionCustomers,
  promotionGroups,
  promotions,
  products,
} from "~~/server/database/schema";
import { requireAdmin } from "~~/server/utils/session";

/**
 * GET /api/admin/promotions — promoties met product, korting, periode en
 * de klanten die er recht op hebben, per lijn (`entries`): een groep met al
 * haar promoties, of één promotie zonder groep. De paginering telt lijnen.
 * Filters (gelden per promotie; een groep toont enkel wat overblijft):
 * - `search`: groepsnaam, productnaam/artikelnr of naam/nummer van een
 *   gekoppelde klant;
 * - `status`: gepland, actief of verlopen t.o.v. vandaag (Belgische tijd);
 * - `from`/`to`: promoties waarvan de periode deze dagen overlapt;
 * - `category` (slug) en `supplier`: van het product.
 */
const querySchema = z.object({
  search: z.string().trim().min(1).optional(),
  status: z.enum(["scheduled", "active", "expired"]).optional(),
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
  category: z.string().min(1).optional(),
  supplier: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(25),
});

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { search, status, from, to, category, supplier, page, perPage } = await getValidatedQuery(
    event,
    (data) => querySchema.parse(data),
  );

  const today = todayInBrussels();
  const like = search ? `%${search}%` : undefined;

  const filters = [
    status === "scheduled" ? gt(promotions.startsOn, today) : undefined,
    status === "active"
      ? and(lte(promotions.startsOn, today), gte(promotions.endsOn, today))
      : undefined,
    status === "expired" ? lt(promotions.endsOn, today) : undefined,
    from ? gte(promotions.endsOn, from) : undefined,
    to ? lte(promotions.startsOn, to) : undefined,
    category ? eq(categories.slug, category) : undefined,
    supplier ? eq(products.supplier, supplier) : undefined,
    like
      ? or(
          ilike(promotionGroups.name, like),
          ilike(products.name, like),
          ilike(products.articleNr, like),
          exists(
            db
              .select({ one: raw`1` })
              .from(promotionCustomers)
              .innerJoin(customers, eq(customers.id, promotionCustomers.customerId))
              .where(
                and(
                  eq(promotionCustomers.promotionId, promotions.id),
                  or(ilike(customers.name, like), ilike(customers.customerNr, like)),
                ),
              ),
          ),
        )
      : undefined,
  ].filter((filter) => filter !== undefined);

  const where = and(...filters);

  // Eén lijn per groep, of per promotie zonder groep.
  const entryKey = raw<string>`coalesce(${promotions.groupId}, ${promotions.id})`;

  const perEntry = db
    .select({
      active: raw<number>`count(*) filter (where ${promotions.startsOn} <= ${today} and ${promotions.endsOn} >= ${today})`.as("active"),
      scheduled: raw<number>`count(*) filter (where ${promotions.startsOn} > ${today})`.as("scheduled"),
    })
    .from(promotions)
    .groupBy(entryKey)
    .as("per_entry");

  const [pageKeys, [total], [summary]] = await Promise.all([
    db
      .select({ key: entryKey })
      .from(promotions)
      .innerJoin(products, eq(products.id, promotions.productId))
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .leftJoin(promotionGroups, eq(promotionGroups.id, promotions.groupId))
      .where(where)
      .groupBy(entryKey)
      .orderBy(
        desc(raw`max(${promotions.startsOn})`),
        asc(raw`min(coalesce(${promotionGroups.name}, ${products.name}))`),
      )
      .limit(perPage)
      .offset((page - 1) * perPage),

    db
      .select({ value: raw<number>`count(distinct ${entryKey})::int` })
      .from(promotions)
      .innerJoin(products, eq(products.id, promotions.productId))
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .leftJoin(promotionGroups, eq(promotionGroups.id, promotions.groupId))
      .where(where),

    // Tellers voor de statusknoppen, per lijn (groep of losse promotie), los
    // van filters en paginering. Een lijn is actief zodra één promotie loopt,
    // anders gepland als er een moet starten, anders verlopen.
    db
      .select({
        active: raw<number>`count(*) filter (where ${perEntry.active} > 0)::int`,
        scheduled: raw<number>`count(*) filter (where ${perEntry.active} = 0 and ${perEntry.scheduled} > 0)::int`,
        expired: raw<number>`count(*) filter (where ${perEntry.active} = 0 and ${perEntry.scheduled} = 0)::int`,
      })
      .from(perEntry),
  ]);

  const keys = pageKeys.map((k) => k.key);
  const rows =
    keys.length > 0
      ? await db
          .select({
            id: promotions.id,
            groupId: promotions.groupId,
            groupName: promotionGroups.name,
            type: promotions.type,
            percentage: promotions.percentage,
            minQuantity: promotions.minQuantity,
            buyQuantity: promotions.buyQuantity,
            freeQuantity: promotions.freeQuantity,
            price: promotions.price,
            startsOn: promotions.startsOn,
            endsOn: promotions.endsOn,
            allCustomers: promotions.allCustomers,
            createdAt: promotions.createdAt,
            product: {
              id: products.id,
              articleNr: products.articleNr,
              name: products.name,
              unit: products.unit,
              price: products.price,
              isActive: products.isActive,
              supplier: products.supplier,
              categoryName: categories.name,
            },
          })
          .from(promotions)
          .innerJoin(products, eq(products.id, promotions.productId))
          .innerJoin(categories, eq(categories.id, products.categoryId))
          .leftJoin(promotionGroups, eq(promotionGroups.id, promotions.groupId))
          .where(and(where, inArray(entryKey, keys)))
          .orderBy(desc(promotions.startsOn), asc(products.name))
      : [];

  // Klanten van de promoties op deze pagina, in één query.
  const ids = rows.filter((r) => !r.allCustomers).map((r) => r.id);
  const links =
    ids.length > 0
      ? await db
          .select({
            promotionId: promotionCustomers.promotionId,
            id: customers.id,
            customerNr: customers.customerNr,
            name: customers.name,
          })
          .from(promotionCustomers)
          .innerJoin(customers, eq(customers.id, promotionCustomers.customerId))
          .where(inArray(promotionCustomers.promotionId, ids))
          .orderBy(asc(customers.name))
      : [];

  const customersByPromotion = new Map<string, { id: string; customerNr: string; name: string }[]>();
  for (const { promotionId, ...customer } of links) {
    const list = customersByPromotion.get(promotionId) ?? [];
    list.push(customer);
    customersByPromotion.set(promotionId, list);
  }

  const items = rows.map(({ groupId, groupName, ...r }) => ({
    ...r,
    group: groupId ? { id: groupId, name: groupName ?? "" } : null,
    percentage: r.percentage === null ? null : Number(r.percentage),
    price: r.price === null ? null : Number(r.price),
    product: {
      ...r.product,
      price: r.product.price === null ? null : Number(r.product.price),
    },
    status: promotionStatus(r.startsOn, r.endsOn, today),
    customers: customersByPromotion.get(r.id) ?? [],
  }));

  // Promoties per lijn, in de volgorde van `pageKeys`.
  const byKey = new Map<string, typeof items>();
  for (const item of items) {
    const key = item.group?.id ?? item.id;
    const list = byKey.get(key) ?? [];
    list.push(item);
    byKey.set(key, list);
  }

  return {
    entries: keys.map((key) => {
      const promos = byKey.get(key) ?? [];
      return { key, group: promos[0]?.group ?? null, items: promos };
    }),
    summary: summary ?? { scheduled: 0, active: 0, expired: 0 },
    pagination: {
      page,
      perPage,
      total: total?.value ?? 0,
      pageCount: Math.ceil((total?.value ?? 0) / perPage),
    },
  };
});
