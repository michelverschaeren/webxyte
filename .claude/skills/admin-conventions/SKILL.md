---
name: admin-conventions
description: Conventions for sites from this starter that get an admin area or customer accounts - the three roles (agency admin, client admin, customer), server guards, input validation, frozen records, one source per field, confirmation dialogs for irreversible actions. Use for any page under app/pages/admin or account, any route under server/api/admin or server/api/account, or questions about who may do what.
---

# Admin and API conventions

## Roles

| Who | Recognized by | May |
|---|---|---|
| Agency admin (Xyte) | role `admin` + `isAgencyAdminEmail()` | everything, including irreversible actions (deleting customers/orders) |
| Client admin (the site owner) | role `admin` | manage content and data, nothing irreversible |
| Customer | role `customer` | the public site and their own `/account` |

- The agency address lives in **one** place: `shared/agency-admin.ts`
  (`AGENCY_ADMIN_EMAIL = "web.xyte@outlook.com"`, `isAgencyAdminEmail()`,
  case-insensitive). Never hardcode it elsewhere.
- Server: `requireUser`, `requireAdmin`, `requireAgencyAdmin` in
  `server/utils/session.ts` — the **first line** of every non-public handler.
  A route without a guard is public.
- Client: hide buttons with `isAgencyAdminEmail(user.email)` — the server
  checks again, always.
- Pages: route middleware `admin` / `account`.
- Use the email check until a second agency person needs the rights; then
  switch to a dedicated role and update every `role === "admin"` check.

## Routes (`server/api/**`)

- Nitro names: `[id].get.ts`, `[id].patch.ts`, `[id].delete.ts`,
  `[id]/pdf.get.ts`, `delete.post.ts` (bulk).
- Validate all input (params as UUID, query, body) before use; return a
  human-readable `statusMessage`; 404 when something does not exist.
- Writes that belong together → one transaction.
- The browser never sends database ids for things it should not choose
  (prices, products in an order): send a public key + quantity, look the rest
  up on the server.
- Guests see only what may be public; sensitive fields are `null` for them.

## Data model

- **One source per field.** If the customer and the admin both edit "company
  name", it is one column both screens write to — not a copy per screen.
- Compare emails case-insensitively; store them lowercase.
- **Freeze** what a record must remember (an order's name, address, prices,
  promotions) on the record itself. Show the frozen value in documents; never
  recompute an old order from current data.

## UI

- Mobile list rows are often one big link: no second button inside — put
  extra actions on the detail page.
- Icon buttons get `aria-label` and `title`; icons are inline SVG with
  `aria-hidden="true"`.
- File downloads (PDF): a plain `<a :href download>` to a guarded API route,
  not `$fetch` — the session cookie travels along.

## Irreversible actions

- Agency admin only, enforced on the server and hidden on the client.
- Own confirmation dialog (`Teleport to="body"`, `role="alertdialog"`): what
  disappears, and an input where the user types a key (e.g. the order number)
  before the confirm button enables. Escape closes. No `window.confirm`.
- Before deleting, check which tables reference the row (`pg_constraint`):
  cascade or restrict?

## Checklist for a new route

- [ ] Guard on the first line (or deliberately public, with rate limit).
- [ ] Input validated.
- [ ] Response shape changed? Every caller updated.
- [ ] `pnpm lint` and `pnpm typecheck` clean.
