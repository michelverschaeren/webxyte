// https://nuxt.com/docs/api/configuration/nuxt-config

// Security headers applied to every route. Kept as a const so the verification
// script (scripts/verify-perf.mjs) can assert the exact same set at runtime.
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  // 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  //   Enable ONLY when HTTPS is guaranteed for the apex domain AND every
  //   subdomain. A single plain-HTTP subdomain locks visitors out for a year.
  //
  // Content-Security-Policy is deliberately absent: Nuxt hydrates with inline
  // scripts/styles, so a strict CSP needs nonces. See CLAUDE.md ("Security
  // headers") before adding one — either install nuxt-security to manage the
  // nonces, or start with Content-Security-Policy-Report-Only.
}

// A month: long enough that repeat visitors reuse the file, short enough that a
// replaced photo actually reaches people. Build output under /_nuxt/** already
// gets a year + immutable automatically because its filenames are hashed.
const contentImageCache = { 'cache-control': 'public, max-age=2592000' }

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxt/fonts',
    '@vueuse/nuxt',
    '@vueuse/motion/nuxt',
    // Vercel-only; no-op (and Speed Insights collects nothing) off Vercel and
    // in dev, so these are safe to leave on for every clone.
    '@vercel/analytics',
    '@vercel/speed-insights',
    'nuxt-lettermint'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/**': { headers: securityHeaders },

    // The security headers are repeated here on purpose: a more specific
    // routeRule REPLACES the `headers` object of '/**' instead of merging with
    // it (verified with curl — without this spread, /images/** came back with
    // only cache-control). Any new rule that sets `headers` must spread
    // securityHeaders too.
    '/images/**': { headers: { ...securityHeaders, ...contentImageCache } },
    '/_ipx/**': { headers: { ...securityHeaders, ...contentImageCache } }
  },

  compatibilityDate: '2026-06-30',

  nitro: {
    // TEMPORARY Windows-only fix for nuxt/nuxt#36467: Nitro's externals
    // plugin matches the renderer path with a forward-slash string, but on
    // Windows the resolved id uses backslashes, so the match fails and the
    // renderer is left external with a stub manifest -> every SSR page 500s
    // with "Either manifest or precomputed data must be provided". A
    // separator-agnostic RegExp fixes the match. Remove this once nitrojs/
    // nitro#4732 lands and ships in a Nuxt release (tracked as hotfixed
    // upstream in commit 21657c6, expected in the next 4.x).
    externals: {
      inline: [/[\\/]node_modules[\\/]nuxt[\\/]dist[\\/]/]
    },

    // The Nitro node server does not compress anything itself. Without a proxy
    // in front that does, every asset goes over the wire raw. This writes
    // .gz/.br next to each public asset at build time; the node server then
    // serves those when the client sends a matching Accept-Encoding.
    compressPublicAssets: { gzip: true, brotli: true },

    // Brochure site: render once at build time instead of per request.
    // crawlLinks follows internal <a href> from the seed routes.
    prerender: {
      routes: ['/'],
      crawlLinks: true
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  image: {
    // Sources are usually already lossy; re-encoding at IPX' default quality
    // preserves compression artefacts at full price.
    quality: 70,

    // 'xs' is NOT in @nuxt/image's defaults (they start at sm:640). It has to
    // exist, because a `sizes` token without a `breakpoint:` prefix is filed
    // under the key "1px" -> a 1-pixel-wide synthetic screen -> a srcset of
    // only `1w`/`2w`. Every `sizes` string in this project starts with `xs:`.
    // See CLAUDE.md ("Image rules") for the full explanation.
    screens: {
      'xs': 320,
      'sm': 640,
      'md': 768,
      'lg': 1024,
      'xl': 1280,
      '2xl': 1536
    }
  },

  // autoEndpoint exposes POST /api/lettermint/send so a contact form can call
  // useLettermint().send(...) from the client — the NUXT_LETTERMINT_API_KEY
  // token itself is only ever read server-side. See .claude/rules/integrations.md.
  lettermint: {
    autoEndpoint: true
  }
})
