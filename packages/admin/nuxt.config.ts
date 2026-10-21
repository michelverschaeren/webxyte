// @webxyte/admin — de beheeromgeving (/admin) zonder site-specifieke pagina's.
//
// Levert: layout "admin" (zijbalk, lade op mobiel), components AdminShell,
// AdminPagination, AdminSearchField, AdminSwitch, een lege AdminSearch (een
// site met zoekfunctie levert er zelf één), useAdminNavLinks/useAdminDrawer/
// useAdminWide, useTheme (licht/donker) en app/assets/css/admin.css.
//
// Vereist @webxyte/auth (middleware "admin", useAuth).
//
// De site configureert via app.config.ts → `admin`: merk, menu-items, zoeken.
// Pagina's onder pages/admin/ en de API's onder server/api/admin/ maakt de
// site zelf (skill admin-conventions).
export default defineNuxtConfig({
  $meta: { name: 'admin' }
})
