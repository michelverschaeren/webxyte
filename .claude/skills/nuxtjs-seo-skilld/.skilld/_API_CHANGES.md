## API Changes

This section documents version-specific API changes for @nuxtjs/seo v5.3.12 — prioritize recent major/minor releases.

- BREAKING: `useSiteConfig()` — v5 changed to `getSiteConfig(event)` for server-side use only. Client-side code should use the `$siteConfig` global. [source](./.skilld/docs/content/6.migration-guide/5.v4-to-v5.md:L69)

- BREAKING: `getSiteIndexable()` — v5 removed, replaced by accessing `getSiteConfig(event).indexable` directly [source](./.skilld/docs/content/6.migration-guide/5.v4-to-v5.md:L70)

- BREAKING: `SiteConfig` type — v5 renamed to `SiteConfigResolved` [source](./.skilld/docs/content/6.migration-guide/5.v4-to-v5.md:L71)

- BREAKING: `#internal/nuxt-site-config` import path — v5 removed private path, use named imports from `nuxt-site-config` instead [source](./.skilld/docs/content/6.migration-guide/5.v4-to-v5.md:L72)

- BREAKING: `site.name` now required in `nuxt.config` — v5 no longer infers site name from `package.json` or directory name. Must explicitly set `site.name` [source](./.skilld/docs/content/6.migration-guide/5.v4-to-v5.md:L36:46)

- BREAKING: Legacy runtime config keys removed — v5 drops `siteUrl`, `siteName`, and `siteDescription`. Migrate to the `site` object in `nuxt.config` [source](./.skilld/docs/content/6.migration-guide/5.v4-to-v5.md:L48:65)

- DEPRECATED: `asSeoCollection()` — v5 replaces with individual schema functions: `defineRobotsSchema()`, `defineSitemapSchema()`, `defineOgImageSchema()`, `defineSchemaOrgSchema()`. Compose directly in your Nuxt Content collection schema [source](./.skilld/docs/content/6.migration-guide/5.v4-to-v5.md:L78:110)

- DEPRECATED: `asRobotsCollection()` — v5 use `defineRobotsSchema()` instead for Nuxt Content v3 collections [source](./.skilld/docs/content/6.migration-guide/5.v4-to-v5.md:L149)

- DEPRECATED: `asSitemapCollection()` — v5 use `defineSitemapSchema()` instead for Nuxt Content v3 collections [source](./.skilld/docs/content/6.migration-guide/5.v4-to-v5.md:L150)

- DEPRECATED: `asOgImageCollection()` — v5 use `defineOgImageSchema()` instead for Nuxt Content v3 collections [source](./.skilld/docs/content/6.migration-guide/5.v4-to-v5.md:L151)

- DEPRECATED: `asSchemaOrgCollection()` — v5 use `defineSchemaOrgSchema()` instead for Nuxt Content v3 collections [source](./.skilld/docs/content/6.migration-guide/5.v4-to-v5.md:L152)

- NEW: `useShareLinks()` composable — v5 generates social sharing URLs for Twitter, Facebook, LinkedIn, WhatsApp, Telegram, Reddit, Pinterest, and Email with built-in UTM tracking support [source](./.skilld/docs/content/7.releases/1.v5.md:L63:82)

- NEW: ESLint link checking — v5 adds two new ESLint rules via `nuxt-link-checker/eslint`: `link-checker/valid-route` (validates relative URLs) and `link-checker/valid-sitemap-link` (checks sitemap presence). Auto-registers with `@nuxt/eslint` [source](./.skilld/docs/content/7.releases/1.v5.md:L39:53)

- NEW: `definePageMeta` sitemap options — v5 allows sitemap `changefreq` and `priority` configuration directly in `definePageMeta()` per-page [source](./.skilld/docs/content/7.releases/1.v5.md:L135:147)

- NEW: `nuxt-seo-utils icons` CLI command — v5 generates favicon and icon variants from a single source image, creates favicon.ico, apple-touch-icon.png (180x180), and PNG at 16, 32, 192, 512px [source](./.skilld/docs/content/7.releases/1.v5.md:L86:93)

**Also changed:** i18n multi-sitemap auto-expansion with `includeAppSources: true` · Inline minification of scripts/styles via `useHead()` · Unified DevTools across all modules · Schema.org reactive scope disposal for SSR · Link Checker ESLint "did you mean?" suggestions