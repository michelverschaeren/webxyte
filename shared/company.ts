/**
 * Bedrijfsfeiten voor alles wat machines lezen: Schema.org, llms.txt en de
 * FAQ-pagina. De teksten komen uit wat al op de site staat (Over ons,
 * Levering, "Van bestelling tot nalevering", Contact) — voeg hier dus alleen
 * feiten toe die kloppen, want AI-engines citeren ze letterlijk.
 *
 * Bewust een gewoon TS-bestand zonder Nuxt-imports, zodat zowel
 * nuxt.config.ts, de app als de Nitro-server het kunnen laden.
 */
export const COMPANY = {
  name: "Vleeswaren Vermeir",
  legalName: "Vleeswaren Vermeir BV",
  foundingYear: 1958,
  street: "Schoolstraat 51",
  postalCode: "1980",
  city: "Zemst",
  country: "BE",
  phone: "015 / 61 15 39",
  phoneIntl: "+32 15 61 15 39",
  mobile: "0475 97 13 70",
  mobileIntl: "+32 475 97 13 70",
  email: "vleeswarenvermeir@telenet.be",
  // Zelfde coördinaten als de Google Maps-embed op de contactpagina.
  geo: { latitude: 50.981381, longitude: 4.462458 },
  productCount: "5000",
} as const;

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ: FaqItem[] = [
  {
    question: "Wat is Vleeswaren Vermeir?",
    answer: `Vleeswaren Vermeir is een familiebedrijf uit Zemst dat al sinds ${COMPANY.foundingYear} bestaat en nu door de derde generatie wordt gerund. Wij leveren meer dan ${COMPANY.productCount} vleeswaren en aanverwante producten aan handelaars in België, met een persoonlijke service als uitgangspunt.`,
  },
  {
    question: "Aan wie levert Vleeswaren Vermeir?",
    answer:
      "Wij leveren aan handelaars in België. Bent u handelaar en wilt u onze producten aanbieden, neem dan contact met ons op.",
  },
  {
    question: "Welke producten bieden jullie aan?",
    answer: `Ons gamma telt meer dan ${COMPANY.productCount} producten: van fijne vleeswaren tot bereide gerechten, van sauzen tot verpakkingsmateriaal. Het volledige assortiment vindt u op de pagina Producten.`,
  },
  {
    question: "Hoe kan ik bestellen?",
    answer: `U kunt uw bestelling doorgeven via mail, fax, telefoon of online. Telefonisch bereikt u ons op ${COMPANY.phone} of ${COMPANY.mobile}, via mail op ${COMPANY.email}.`,
  },
  {
    question: "Wanneer wordt mijn bestelling geleverd?",
    answer:
      "U kunt met uw bestelling altijd bij ons terecht voor een levering de dag nadien.",
  },
  {
    question: "Kan ik een bestelling nog aanvullen?",
    answer:
      "Ja. Heeft u voor de huidige dag al een bestelling geplaatst, dan kunt u voor 8 uur nog producten toevoegen. Wij raden aan dit telefonisch te melden, zodat wij uw bestelling naar uw behoeften kunnen afleveren.",
  },
  {
    question: "Wie levert mijn bestelling af?",
    answer:
      "Uw bestelling wordt afgeleverd door één van onze eigen in-huis chauffeurs. Bij problemen met uw bestelling helpen zij u om een oplossing op maat te vinden.",
  },
  {
    question: "Wat als er een artikel ontbreekt in mijn bestelling?",
    answer:
      "Wij zorgen ervoor dat ontbrekende artikelen dezelfde week worden nageleverd.",
  },
  {
    question: "Waar is Vleeswaren Vermeir gevestigd?",
    answer: `${COMPANY.street}, ${COMPANY.postalCode} ${COMPANY.city}, België.`,
  },
];
