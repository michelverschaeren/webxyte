# Vleewaren Vermeir

Nuxt 4 webshop met Tailwind CSS v4, Naive UI, PostgreSQL (Drizzle ORM) en Better Auth.

## Stack

| Laag       | Keuze                                        |
| ---------- | -------------------------------------------- |
| Framework  | Nuxt 4 (Vue 3, Nitro server engine)          |
| Database   | PostgreSQL op VPS, beheerd via Dokploy       |
| ORM        | Drizzle ORM + Drizzle Kit (`postgres.js`)    |
| Auth       | Better Auth, met Drizzle-adapter             |
| Validatie  | Zod                                          |
| Styling    | Tailwind CSS v4 + Naive UI                   |

---

## 1. Setup

```bash
pnpm install
cp .env.example .env   # PowerShell: Copy-Item .env.example .env
```

Vul daarna `.env` in (zie hoofdstuk 2), en test de databaseverbinding:

```bash
pnpm db:ping
```

Start de dev-server op `http://localhost:3000`:

```bash
pnpm dev
```

---

## 2. Omgevingsvariabelen

`.env` staat in `.gitignore` en komt **nooit** in git. `.env.example` is de sjabloon
die wél gecommit wordt — voeg daar elke nieuwe variabele aan toe (zonder waarde).

| Variabele                    | Waarvoor                                              |
| ---------------------------- | ----------------------------------------------------- |
| `DATABASE_URL`               | Postgres-verbinding (verschilt lokaal vs. productie)  |
| `BETTER_AUTH_SECRET`         | Ondertekent sessies. 32 random bytes, base64.         |
| `BETTER_AUTH_URL`            | Publieke basis-URL van de app                         |
| `NUXT_PUBLIC_SITE_PASSWORD`  | Wachtwoord van de site-lock (bestaande functie)       |
| `NUXT_PUBLIC_CUSTOMER_ACCESS_TOKEN` | Token voor `/toegang/<token>`: eenmalige klantlink die de site-lock omzeilt |

### DATABASE_URL: twee verschillende waarden

Dit is het belangrijkste om te onthouden. Het adres verschilt per omgeving:

**Lokaal** (migraties en seeds draaien vanaf je eigen machine) — gebruik het
**externe** adres. In Dokploy: `Database → dbvermeir → External Credentials`.
De externe poort moet daar expliciet opengezet zijn.

```
postgresql://USER:WACHTWOORD@72.61.21.31:5432/DB_Vermeir
```

**Productie** (de Nuxt-container draait in hetzelfde Docker-netwerk als de
database) — gebruik de **interne** servicenaam. Sneller, en de poort hoeft niet
naar buiten open te staan. Zet deze waarde in Dokploy onder
`Application → Environment`:

```
postgresql://USER:WACHTWOORD@vleerwaren-vermeir-dbvermeir-f9vchd:5432/DB_Vermeir
```

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
│   ├── client.ts              # Drizzle-client (singleton, postgres.js pool)
│   ├── schema/
│   │   ├── auth.ts            # user, session, account, verification
│   │   ├── catalog.ts         # categories, products (+ relations)
│   │   └── index.ts           # bundelt alle schema's — één import-punt
│   ├── migrations/            # gegenereerde SQL, hoort in git
│   └── seed.ts                # vult de database met startdata
├── utils/
│   ├── auth.ts                # Better Auth server-instantie
│   └── session.ts             # helpers om de sessie in endpoints te lezen
└── api/
    ├── auth/[...all].ts       # catch-all: alle Better Auth-routes
    ├── categories.get.ts
    ├── products.get.ts
    ├── products.post.ts
    └── products/[id].get.ts

app/
├── utils/auth-client.ts       # Better Auth client (browser)
└── composables/useAuth.ts     # Vue-wrapper rond de auth-client

drizzle.config.ts              # config voor de Drizzle Kit CLI
scripts/db-check.mjs           # losse verbindingstest (pnpm db:ping)
```

Alles in `server/utils/` wordt door Nitro **auto-geïmporteerd** — in een endpoint
kan je `auth` en `db` direct gebruiken zonder importregel.

---

## 4. Database-scripts

| Commando            | Wat het doet                                                        |
| ------------------- | ------------------------------------------------------------------- |
| `pnpm db:ping`      | Test de verbinding en toont welke tabellen bestaan                  |
| `pnpm db:generate`  | Leest `schema/` en schrijft een nieuw SQL-migratiebestand           |
| `pnpm db:migrate`   | Voert openstaande migraties uit op de database                      |
| `pnpm db:push`      | Duwt het schema rechtstreeks door, zónder migratiebestand           |
| `pnpm db:pull`      | Leest een bestaande database uit en genereert er schema-code van    |
| `pnpm db:check`     | Controleert migraties op conflicten                                 |
| `pnpm db:studio`    | Opent Drizzle Studio (grafische database-browser)                   |

### Werkwijze bij een schemawijziging

1. Pas het schema aan in `server/database/schema/`.
2. `pnpm db:generate` — controleer de gegenereerde SQL in `migrations/`.
3. `pnpm db:migrate` — voer uit tegen de database.
4. Commit zowel de schemawijziging als het migratiebestand.

> Gebruik `db:push` alleen tijdens vroege ontwikkeling. Het laat geen spoor na in
> `migrations/`, waardoor productie en lokaal uit elkaar kunnen lopen.

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

`useFetch` leidt het returntype af uit het endpoint — `data` is volledig getypeerd,
zonder generics of handmatige interfaces.

```vue
<script setup lang="ts">
const { data: products, pending } = await useFetch("/api/products");
</script>
```

Het pad `/api/products` wordt gecontroleerd tegen de bestanden in `server/api/`;
een typefout in de URL is meteen een TypeScript-fout.

---

## 6. Lokaal verbinden met de privé Dokploy-database

De database staat op je VPS en heeft **geen publieke poort** — dat is bewust, om
veiligheidsredenen. Toch moet je er lokaal bij kunnen voor migraties, seeds en
Drizzle Studio. Dat gaat via een SSH-tunnel.

### Waarom een brug én een tunnel nodig zijn

Dokploy draait op **Docker Swarm**. De database zit op een overlay-netwerk
(`dokploy-network`) met een intern IP (`10.0.1.52`). Dat netwerk is onbereikbaar
voor:

- het publieke internet (goed — zo hoort het),
- én de VPS-host zelf.

Swarm laat bovendien niet toe om een gepubliceerde poort aan `127.0.0.1` te
binden — elke Swarm-poort zou op `0.0.0.0` (publiek) staan. Een **gewone**
`docker run` kan dat wél. Daarom draait er op de VPS één klein, persistent
bruggetje (`pgbridge`, een `socat`-container) dat:

- aan `dokploy-network` hangt en de database bij naam bereikt,
- enkel op `127.0.0.1` van de VPS luistert (onbereikbaar van buiten zonder SSH),
- een VPS-herstart overleeft (`--restart=unless-stopped`).

```
laptop:5433  →(ssh)→  VPS 127.0.0.1:15432  →(pgbridge)→  dbvermeir:5432
```

### Eenmalig: de brug opzetten

Draai dit één keer (en opnieuw als de servicenaam/poort wijzigt):

```bash
pnpm db:bridge
```

Daarna draait de brug permanent op de VPS-loopback. Verwijderen kan met
`ssh root@<vps> "docker rm -f pgbridge"`.

### Dagelijks: de tunnel openen

```bash
pnpm db:tunnel        # kale SSH-tunnel; laat open staan, Ctrl-C sluit
```

In een tweede terminal werkt de database — `.env` wijst al naar `127.0.0.1:5433`:

```bash
pnpm db:ping          # ✓ Verbonden
pnpm db:migrate       # tabellen aanmaken
pnpm db:studio        # grafische browser
```

### Via een GUI-client (DBeaver, TablePlus, VS Code DB Client)

Doordat de brug altijd op de VPS-loopback staat, hoef je `db:tunnel` niet te
draaien — de client regelt de tunnel zelf:

- **Host / poort:** `127.0.0.1` : `15432` (de situatie *op de VPS*)
- **SSH-tunnel-tab:** inschakelen, met VPS-IP + SSH-user + private key
- **Database / user / wachtwoord:** `DB_Vermeir` / `USER_Vermeir` / …

> **Herbruikbaar voor andere projecten.** Open `scripts/db-bridge-setup.ps1` en
> `scripts/db-tunnel.ps1` en pas bovenaan alleen `$VPS`, `$Network` en `$Service`
> aan. De servicenaam vind je met `docker service ls` op de VPS, het netwerk met
> `docker inspect <container> --format '{{json .NetworkSettings.Networks}}'`.

> De brug/tunnel is **alleen een dev-hulpmiddel**. In productie praat de
> Nuxt-container rechtstreeks met de database via de interne hostnaam (zie
> hoofdstuk 2) — daar is geen tunnel bij betrokken.

---

## 7. Deploy naar Dokploy

1. Push naar de gekoppelde git-branch.
2. Zet in Dokploy onder `Application → Environment` alle variabelen uit hoofdstuk 2 —
   met `DATABASE_URL` op de **interne** hostname en `BETTER_AUTH_URL` op het
   echte https-domein.
3. Build: `pnpm build` · Start: `pnpm start` (draait `.output/server/index.mjs`).
4. Migraties draai je vanaf je eigen machine via de tunnel (hoofdstuk 6), vóór of
   vlak na de deploy.

---

## 8. Problemen oplossen

Open eerst de tunnel (`pnpm db:tunnel`), draai dan `pnpm db:ping` — die maakt
onderscheid tussen de foutsoorten hieronder.

| Melding                                     | Oorzaak                                                                                 |
| ------------------------------------------- | --------------------------------------------------------------------------------------- |
| `ECONNREFUSED 127.0.0.1:5433`               | De tunnel draait niet. Start `pnpm db:tunnel` in een apart venster.                      |
| `password authentication failed` (`28P01`)   | Tunnel staat, maar gebruiker of wachtwoord klopt niet. Vergelijk met de credentials in Dokploy. |
| `ETIMEDOUT` / `ECONNREFUSED`                | Externe poort staat niet open in Dokploy, of de firewall blokkeert.                      |
| `database "..." does not exist` (`3D000`)    | Databasenaam in de URL klopt niet.                                                       |
| `relation "..." does not exist` (`42P01`)    | Migraties zijn nog niet uitgevoerd → `pnpm db:migrate`.                                  |

Let bij Postgres op hoofdletters: `USER_Vermeir` en `user_vermeir` zijn niet
hetzelfde als de rol met hoofdletters is aangemaakt.

---

## Productie-build lokaal testen

```bash
pnpm build
pnpm preview
```
