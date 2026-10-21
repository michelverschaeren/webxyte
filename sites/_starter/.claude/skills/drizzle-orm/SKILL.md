---
name: drizzle-orm
description: Drizzle ORM with postgres.js on Neon Postgres as used in sites from this starter - the db client for Vercel, schema, query builder vs relational API, transactions, raw SQL, numeric/date/jsonb types, joins and aggregates. Use for any query or schema code in server/, imports from "drizzle-orm", and database errors. For migrations see db-migration.
---

# Drizzle in this stack

Check the installed version (`node_modules/drizzle-orm/package.json`) and the
docs for that version (orm.drizzle.team, or the context7 MCP) when unsure.

## Client (`server/database/client.ts`)

```ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const serverless = Boolean(process.env.VERCEL)
// Neon's pooled URL is PgBouncer in transaction mode: no prepared statements.
const sql = postgres(process.env.DATABASE_URL!, {
  max: serverless ? 3 : 10,
  prepare: !serverless,
  idle_timeout: 20,
  connect_timeout: 10
})
export const db = drizzle(sql, { schema, casing: 'snake_case' })
```

- In dev, cache the `postgres()` instance on `globalThis`: Nitro reloads modules
  and would otherwise open a new pool per reload ("too many clients").
- Never create extra clients elsewhere. Query only from `server/**`.

## Two APIs

**Relational** (`db.query.x.findFirst/findMany` + `with`) for one object with
its relations. **Query builder** (`db.select().from()`) for lists, filters,
joins and aggregates:

```ts
import { and, desc, eq, sql as raw } from 'drizzle-orm'

const rows = await db
  .select({ id: orders.id, lines: raw<number>`count(${orderItems.id})::int` })
  .from(orders)
  .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
  .where(and(...filters))   // filters: array with undefined for "n/a", filtered out first
  .groupBy(orders.id)
  .orderBy(desc(orders.createdAt))
  .limit(perPage)
  .offset((page - 1) * perPage)
```

- Import `sql` as `raw` so it never clashes with the postgres client.
- `count()`/`sum()` return bigint/numeric → strings. Cast in SQL (`::int`) or `Number()`.
- Pagination count query: same joins and `where`, no `limit`.
- Every `leftJoin` can duplicate rows: join on a unique column or group.
- `inArray(col, [])`: short-circuit an empty list before querying.

## Writing

- `insert().values().returning()`; upsert with `.onConflictDoUpdate({ target, set })`.
- `delete().where().returning({ id })`; no row back → 404.
- Writes that belong together → `db.transaction(async (tx) => …)` and use
  **`tx`** inside, not `db`.
- Mail and other external calls go **after** the transaction, in their own `try/catch`.

## Types

| Column | In TS | Note |
|---|---|---|
| `numeric` | `string` | `Number()` to read, `.toFixed(2)` to write |
| `date` | `"YYYY-MM-DD"` | compare as text |
| `timestamp({ withTimezone: true })` | `Date` | local day in SQL: `(x at time zone 'Europe/Brussels')::date` |
| `jsonb().$type<T>()` | `T` | not validated by Postgres — good for frozen snapshots |
| `uuid().defaultRandom()` | `string` | validate route params as UUIDs |

## Safety

- User input only via `${value}` inside `raw\`…\`` (becomes a parameter), never
  string concatenation.
- Freeze what an order/record must remember (names, prices, addresses) on the
  record itself instead of recomputing from current data.
