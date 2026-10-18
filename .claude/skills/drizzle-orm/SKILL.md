---
name: drizzle-orm
description: Drizzle ORM (drizzle-orm 0.45, postgres.js, Neon Postgres) zoals dit project het gebruikt - db-client, schema, query-builder vs relationele API, transacties, raw SQL, types van numeric/date/jsonb, joins en aggregaties. Gebruik bij elke query of schemacode in server/, bij imports uit "drizzle-orm" of "~~/server/database", en bij databasefouten. Voor migraties zie de skill db-migration.
---

# Drizzle in dit project

Controleer bij twijfel de geïnstalleerde versie (`node_modules/drizzle-orm/package.json`)
en de documentatie op orm.drizzle.team (of via de context7-MCP) voor die versie.

## Client

```ts
import { db } from "~~/server/database/client";
import { orders, orderItems, customers, user } from "~~/server/database/schema";
```

- `drizzle-orm/postgres-js` met `casing: "snake_case"`: schrijf kolommen in
  TS als camelCase (`createdAt`); Postgres krijgt `created_at`.
- Op Vercel: kleine pool (`max: 3`), `prepare: false` (Neon-pooler =
  PgBouncer in transaction mode, geen prepared statements). Zelf geen extra
  `postgres()`-clients aanmaken.
- Scripts in `server/database/*.ts` draaien met `npx tsx` en `dotenv/config`,
  dus tegen de `DATABASE_URL` uit `.env`. Die wijst naar **productie**.

## Twee API's

**Relationeel** (`db.query.x.findFirst/findMany`) voor één object met relaties:

```ts
const order = await db.query.orders.findFirst({
  where: eq(orders.id, id),
  with: { items: { orderBy: orderItems.createdAt, with: { product: true } } },
});
```

Relaties staan in het schema (`relations(...)`); `schema` is aan `drizzle()`
meegegeven.

**Query-builder** (`db.select().from()`) voor lijsten, filters, joins en
aggregaties:

```ts
import { and, count, desc, eq, ilike, or, sql as raw } from "drizzle-orm";

const customerName = raw<string>`coalesce(${customers.name}, ${user.name})`;
const rows = await db
  .select({
    id: orders.id,
    customerName,
    lineCount: raw<number>`count(${orderItems.id})::int`,
  })
  .from(orders)
  .innerJoin(user, eq(orders.userId, user.id))
  .leftJoin(customers, eq(customers.userId, user.id))
  .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
  .where(and(...filters))          // undefined-filters eerst wegfilteren
  .groupBy(orders.id, user.id, customers.id)
  .orderBy(desc(orders.createdAt))
  .limit(perPage)
  .offset((page - 1) * perPage);
```

- `sql` wordt hier `raw` genoemd (`import { sql as raw }`), zodat het niet
  botst met de `sql`-client.
- `count()` en `sum()` geven in Postgres `bigint`/`numeric` terug, en die
  komen als string binnen. Cast in SQL (`::int`) of zet om met `Number()`.
- Telquery voor paginering: dezelfde joins en `where`, zonder `limit`.
- Elke `leftJoin` kan rijen verdubbelen. Join enkel op een unieke kolom, of
  groepeer. (`customers.user_id` is uniek.)
- Filters bouwen als array met `undefined` voor "niet van toepassing", dan
  `.filter((f) => f !== undefined)` en `and(...filters)`.

## Schrijven

- `insert(...).values(...).returning()`; upsert met
  `.onConflictDoUpdate({ target, set })`.
- `delete(...).where(...).returning({ id })`; geen rij terug → 404.
- Meerdere schrijfacties die samen horen → `db.transaction(async (tx) => …)`
  en binnen de callback **`tx`** gebruiken, niet `db`.
- Een mail of een andere externe actie hoort **na** de transactie, in een
  eigen `try/catch`.

## Types

| Kolom | In TS | Let op |
|---|---|---|
| `numeric` | `string` | lezen met `Number()`, schrijven met `.toFixed(2)` |
| `date` | `"JJJJ-MM-DD"` (string) | vergelijken als tekst; vandaag = `todayInBrussels()` |
| `timestamp({ withTimezone: true })` | `Date` | kalenderdag in SQL: `(x at time zone 'Europe/Brussels')::date` |
| `jsonb().$type<T>()` | `T` | geen validatie door Postgres; bevroren snapshots (`billingSnapshot`, `promotions`) |
| `uuid().defaultRandom()` | `string` | params valideren met `z.uuid()` |

## Valkuilen

- `inArray(col, [])` met een lege lijst: vang dat vooraf af en geef meteen een
  leeg resultaat terug.
- `ilike` op een expressie mag: `ilike(raw\`coalesce(...)\`, like)`.
- Nooit gebruikersinvoer in `raw` plakken buiten de `${}`-parameters om:
  `${value}` wordt een parameter, string-concatenatie niet.
