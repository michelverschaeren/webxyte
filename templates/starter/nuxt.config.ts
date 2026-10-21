// Brochure-site starter. Kopieer deze map naar sites/<klant> (skill /new-site).
// De gedeelde instellingen (security headers, images, fonts, compressie,
// Vercel Analytics) komen uit packages/base; hier staat enkel wat specifiek is
// voor dit type site. Zie .claude/rules/nuxt-config.md.
export default defineNuxtConfig({
  extends: ['@webxyte/base', '@webxyte/mail'],

  modules: [
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@vueuse/motion/nuxt'
  ],

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2026-06-30',

  nitro: {
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
  }
})
