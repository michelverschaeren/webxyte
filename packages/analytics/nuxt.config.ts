// @webxyte/analytics — bezoekcijfers uit Vercel Web Analytics in het beheer.
//
// Levert GET /api/admin/analytics en de pagina /admin/bezoekers (+ menu-item).
// Vercel telt en bewaart zelf; deze layer vraagt enkel de cijfers op.
// Vereist @webxyte/auth en @webxyte/admin.
//
// Env:
// - VERCEL_ANALYTICS_TOKEN (geheim): een Vercel-token met leesrechten op het
//   team. Zonder token toont de pagina "niet ingesteld" in plaats van een fout.
// - VERCEL_PROJECT_ID: zet Vercel zelf als systeemvariabele. Lokaal geeft de
//   site het project-ID mee via runtimeConfig.vercelAnalytics.projectId.
export default defineNuxtConfig({
  $meta: { name: 'analytics' },

  runtimeConfig: {
    vercelAnalytics: {
      // Geen geheimen: ID's van het team (webxytes-projects) en het project.
      // Overschrijfbaar met NUXT_VERCEL_ANALYTICS_TEAM_ID / _PROJECT_ID.
      teamId: 'team_O7SI4PmzagiBbMTMxvgg8LFj',
      projectId: ''
    }
  }
})
