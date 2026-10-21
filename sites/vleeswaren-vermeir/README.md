# Vleewaren Vermeir

Nuxt 4 webshop met Tailwind CSS v4, Naive UI, PostgreSQL (Drizzle ORM) en Better Auth.

## Stack

| Laag       | Keuze                                                  |
| ---------- | ------------------------------------------------------ |
| Framework  | Nuxt 4 (Vue 3, Nitro server engine)                    |
| Hosting    | Vercel                                                 |
| Database   | Neon Postgres (branches `production` en `development`) |
| Bestanden  | Neon Object Storage (productfiches, PDF)               |
| ORM        | Drizzle ORM + Drizzle Kit (`postgres.js`)              |
| Auth       | Better Auth, met Drizzle-adapter                       |
| Mail       | Lettermint                                             |
| Validatie  | Zod                                                    |
| Styling    | Tailwind CSS v4 + Naive UI                             |

---

## 1. Setup

Vanuit de root van de monorepo:

```bash
pnpm install
cp sites/vleeswaren-vermeir/.env.example sites/vleeswaren-vermeir/.env
pnpm dev vermeir       # http://localhost:3000
```

Vul daarna `.env` in (zie hoofdstuk 2).

---

## 2. Omgevingsvariabelen

`.env` en `.env.live` staan in `.gitignore` en komen **nooit** in git.
`.env.example` is de sjabloon die wél gecommit wordt: voeg daar elke nieuwe
variabele aan toe (zonder waarde). De uitleg per variabele staat in
`.env.example` zelf.

| Bestand / plek      | Waarvoor                                                              |
| ------------------- | --------------------------------------------------------------------- |
| `.env`              | Development: lokaal, wijst naar de Neon-branch `development`          |
| `.env.live`         | Productiewaarden, enkel gelezen door `pnpm db:migrate:production`     |
| Vercel Production   | De live site                                                          |
| Vercel Preview      | Elke taakbranch: Neon-branch `development`, mail naar `MAIL_REDIRECT_TO` |

`DATABASE_URL` is altijd de **pooled** Neon-URL (host met `-pooler`). Op Vercel
gebruikt `server/database/client.ts` automatisch een kleine pool zonder prepared
statements.

> Bevat het wachtwoord tekens als `@`, `:`, `/`, `#` of `?`, dan moeten die
> URL-encoded worden (`@` → `%40`, enz.), anders breekt de connection string.

### Secret genereren

```bash
pnpm auth:secret
```

---

## 3. Mapstructuur

```
server/
├── database/
│   ├── client.ts              # Drizzle-client (postgres.js pool)
│   ├── schema/                # één bestand per domein, index.ts bundelt ze
│   ├── migrations/            # gegenereerde SQL, hoort in git
│   └── *.ts                   # losse import-/onderhoudsscripts
├── utils/                     # auth, mail, promoties, productfiches, …
├── routes/docs/               # productfiches uit de bucket (/docs/products/…)
└── api/                       # publieke, account- en admin-endpoints

app/
├── utils/auth-client.ts       # Better Auth client (browser)
└── composables/               # winkelmand, bestellijsten, login-popup

drizzle.config.ts              # Drizzle Kit tegen .env (development)
drizzle.production.config.ts   # Drizzle Kit tegen .env.live (productie)
```

Alles in `server/utils/` wordt door Nitro **auto-geïmporteerd**: in een endpoint
kan je `auth` en `db` direct gebruiken zonder importregel. Gedeelde code
(sessies, beheer, mail, analytics) komt uit de layers in `packages/`.

---

## 4. Database-scripts

| Commando                      | Wat het doet                                                     |
| ----------------------------- | ---------------------------------------------------------------- |
| `pnpm db:generate`            | Leest `schema/` en schrijft een nieuw SQL-migratiebestand        |
| `pnpm db:migrate`             | Voert openstaande migraties uit op de branch `development`       |
| `pnpm db:migrate:production`  | Idem op productie (`.env.live`), enkel bewust en na akkoord      |
| `pnpm db:push`                | Duwt het schema rechtstreeks door, zónder migratiebestand        |
| `pnpm db:pull`                | Leest een bestaande database uit en genereert er schema-code van |
| `pnpm db:check`               | Controleert migraties op conflicten                              |
| `pnpm db:studio`              | Opent Drizzle Studio (grafische database-browser)                |

### Werkwijze bij een schemawijziging

1. Pas het schema aan in `server/database/schema/`.
2. `pnpm db:generate`: controleer de gegenereerde SQL in `migrations/`.
3. `pnpm db:migrate`: test op de branch `development`.
4. Commit zowel de schemawijziging als het migratiebestand.
5. Bij de release: `pnpm db:migrate:production` (zie skill `db-migration`).

> Gebruik `db:push` niet: het laat geen spoor na in `migrations/`, waardoor
> productie en development uit elkaar lopen.

---

## 5. Codepatronen

### Query in een endpoint

`server/database/client.ts` exporteert `db`; Nitro importeert die automatisch.

```ts
// server/api/products.get.ts
export default defineEventHandler(async () => {
  return db.query.products.findMany({
    where: eq(products.isActive, true),
    with: { category: true },
  });
});
```

### Ophalen in een component

`useFetch` leidt het returntype af uit het endpoint: `data` is volledig getypeerd,
zonder generics of handmatige interfaces.

```vue
<script setup lang="ts">
const { data: products, pending } = await useFetch("/api/products");
</script>
```

Het pad `/api/products` wordt gecontroleerd tegen de bestanden in `server/api/`;
een typefout in de URL is meteen een TypeScript-fout.

---

## 6. Deploy (Vercel + Neon)

Een merge naar `main` zet de site live; elke push naar een taakbranch geeft een
Vercel Preview. Zie de skill `release`.

1. **Neon.** Project in een EU-regio (Frankfurt), met de branches `production`
   en `development` (kopie van productie).
2. **Neon Object Storage** (S3-compatibel). Een **private** bucket en een
   credential met `storage:read` + `storage:write`. Zet `S3_BUCKET`,
   `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID` en `S3_SECRET_ACCESS_KEY`
   (niet de `AWS_*`-namen: die reserveert Vercel). De productfiches (PDF) staan
   enkel daar en worden geserveerd door `server/routes/docs/products/[file].get.ts`
   onder `/docs/products/<artikelnr>.pdf`.
3. **Environment Variables** in Vercel: alles uit `.env.example`, per omgeving
   (Production / Preview), met `BETTER_AUTH_URL` op het echte https-domein.
4. **Beperking:** een Vercel-functie aanvaardt maximaal 4,5 MB per request; een
   fiche uploaden via het admin-scherm is daar dus begrensd op 4 MB.

---

## 7. Problemen oplossen

| Melding                                     | Oorzaak                                                                 |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| `password authentication failed` (`28P01`)  | Gebruiker of wachtwoord in `DATABASE_URL` klopt niet. Vergelijk met Neon. |
| `ETIMEDOUT` / `ENOTFOUND`                   | Host in `DATABASE_URL` klopt niet, of de Neon-compute is gepauzeerd/onbereikbaar. |
| `database "..." does not exist` (`3D000`)   | Databasenaam in de URL klopt niet.                                      |
| `relation "..." does not exist` (`42P01`)   | Migraties zijn nog niet uitgevoerd → `pnpm db:migrate`.                 |

---

## Productie-build lokaal testen

```bash
pnpm build
pnpm preview
```
