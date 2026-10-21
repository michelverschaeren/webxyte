// @webxyte/base — the layer every site extends.
//
// Only "plumbing" lives here: performance, security headers, images, fonts,
// Vercel Analytics. Nothing a visitor would recognise as design. A site can
// override every value below in its own nuxt.config.ts (the site wins).
//
// Each setting below was moved from the Nuxt-Projects starter, where it was
// added after measuring a regression. The reason stays next to it.

// Security headers applied to every route. Kept as a const so the verification
// script (scripts/verify-perf.mjs) can assert the exact same set at runtime.
// A site may add more (Vermeir adds CSP + HSTS): routeRules from the site and
// the layer are merged, so extra keys add up.
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
  // scripts/styles, so a strict CSP needs nonces. See .claude/rules/nuxt-config.md.
}

// A month: long enough that repeat visitors reuse the file, short enough that a
// replaced photo actually reaches people. Build output under /_nuxt/** already
// gets a year + immutable automatically because its filenames are hashed.
const contentImageCache = { 'cache-control': 'public, max-age=2592000' }

export default defineNuxtConfig({
  // Exposes this layer as the alias #layers/base.
  $meta: { name: 'base' },

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/fonts',
    // Vercel-only; no-op (and Speed Insights collects nothing) off Vercel and
    // in dev, so these are safe to leave on for every site.
    '@vercel/analytics',
    '@vercel/speed-insights'
  ],

  // Off: @nuxt/devtools 3.4.2's internal "config-retriever" plugin still uses
  // Vite's pre-Environment-API hook shape, which Vite 8 logs a warning about
  // on every dev-server start.
  devtools: {
    enabled: false
  },

  runtimeConfig: {
    public: {
      // Database branch name when it is NOT production (locally and on Vercel
      // Preview: NUXT_PUBLIC_DATABASE_ENV=development). Shows the
      // "DEVELOPMENT · TESTDATABASE" banner (components/DatabaseEnvFrame.vue).
      // Empty in production: visitors see nothing.
      databaseEnv: ''
    }
  },

  routeRules: {
    '/**': { headers: securityHeaders },

    // The security headers are repeated here on purpose: a more specific
    // routeRule REPLACES the `headers` object of '/**' instead of merging with
    // it (verified with curl). Any new rule that sets `headers` must spread
    // securityHeaders too.
    '/images/**': { headers: { ...securityHeaders, ...contentImageCache } },
    '/_ipx/**': { headers: { ...securityHeaders, ...contentImageCache } }
  },

  nitro: {
    // TEMPORARY Windows-only fix for nuxt/nuxt#36467: Nitro's externals
    // plugin matches the renderer path with a forward-slash string, but on
    // Windows the resolved id uses backslashes, so the match fails and every
    // SSR page 500s. A separator-agnostic RegExp fixes the match. Remove once
    // nitrojs/nitro#4732 ships in a Nuxt release.
    externals: {
      inline: [/[\\/]node_modules[\\/]nuxt[\\/]dist[\\/]/]
    },

    // The Nitro node server does not compress anything itself. This writes
    // .gz/.br next to each public asset at build time.
    compressPublicAssets: { gzip: true, brotli: true }
  },

  // Only switches off the DevTools "Fonts" tab (it phones fonts.google.com on
  // every dev start), not font resolution for the site itself.
  fonts: {
    devtools: false
  },

  image: {
    // Sources are usually already lossy; re-encoding at IPX' default quality
    // preserves compression artefacts at full price. Sites may raise it.
    quality: 70,

    // 'xs' is NOT in @nuxt/image's defaults (they start at sm:640). It has to
    // exist, because a `sizes` token without a `breakpoint:` prefix is filed
    // under the key "1px" -> a srcset of only `1w`/`2w`. Every `sizes` string
    // should start with `xs:`. See .claude/rules/images.md.
    screens: {
      'xs': 320,
      'sm': 640,
      'md': 768,
      'lg': 1024,
      'xl': 1280,
      '2xl': 1536
    }
  }
})
