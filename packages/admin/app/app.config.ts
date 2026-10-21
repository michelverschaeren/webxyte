export default defineAppConfig({
  admin: {
    /**
     * Globale zoekbalk in de topbalk. Zet op true als de site
     * components/admin/Search.vue levert (met /api/admin/search).
     */
    search: false,
    /** Merk bovenaan de zijbalk. Logo's uit public/ van de site. */
    brand: {
      /** Volledige naam, voor paginatitels ("Bezoekers — <siteName>"). */
      siteName: "Website",
      name: "Website",
      accent: "Beheer",
      /** Logo voor het donkere thema (lichte tekening); leeg = geen logo. */
      logoDark: "",
      /** Logo voor het lichte thema. */
      logoLight: "",
      logoAlt: "",
    },
    nav: {
      overview: {
        to: "/admin",
        label: "Overzicht",
        icon: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
        order: 0,
      },
    },
  },
});
