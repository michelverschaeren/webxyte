<template>
  <div class="bg-(--color-bg) text-(--color-text) min-h-screen">
    <!-- Page header -->
    <div
      class="relative pt-32 pb-10 sm:pt-46.5 sm:pb-20 px-4 overflow-hidden"
      style="
        background: radial-gradient(
          ellipse at 50% 40%,
          var(--gradient-banner-1) 0%,
          var(--gradient-banner-2) 45%,
          var(--gradient-banner-3) 100%
        );
      "
    >
      <div class="relative z-1 max-w-300 mx-auto text-center">
        <h1
          class="font-['Playfair_Display',Georgia,serif] text-[clamp(2.5rem,6vw,5rem)] font-black text-white leading-[1.05] mb-4"
        >
          Privacyverklaring
        </h1>
        <p class="text-white/70 text-lg max-w-xl mx-auto">
          Welke gegevens wij van u verwerken, waarom, en wat uw rechten zijn.
        </p>
      </div>
    </div>

    <div class="max-w-200 mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <p class="mb-10 text-[0.95rem] text-(--color-text-muted)">
        Laatst bijgewerkt op {{ LAST_UPDATED }}.
      </p>

      <section
        v-for="section in sections"
        :key="section.title"
        class="mb-10 leading-[1.7] text-(--color-text-muted)"
      >
        <h2
          class="mb-3 font-['Playfair_Display',Georgia,serif] text-[1.5rem] font-bold text-(--color-text-strong)"
        >
          {{ section.title }}
        </h2>
        <template v-for="(block, i) in section.blocks" :key="i">
          <p v-if="typeof block === 'string'" class="mb-3">{{ block }}</p>
          <ul v-else class="mb-3 list-disc space-y-1.5 pl-6">
            <li v-for="item in block" :key="item">{{ item }}</li>
          </ul>
        </template>
      </section>

      <section class="leading-[1.7] text-(--color-text-muted)">
        <h2
          class="mb-3 font-['Playfair_Display',Georgia,serif] text-[1.5rem] font-bold text-(--color-text-strong)"
        >
          Contact en klachten
        </h2>
        <p class="mb-3">
          Voor vragen over deze verklaring of om uw rechten uit te oefenen,
          kan u ons bereiken via
          <a :href="`mailto:${COMPANY.email}`" class="underline">{{
            COMPANY.email
          }}</a>
          of op {{ COMPANY.phone }}.
        </p>
        <p>
          Bent u het niet eens met de manier waarop wij uw gegevens verwerken,
          dan kan u een klacht indienen bij de Gegevensbeschermingsautoriteit,
          Drukpersstraat 35, 1000 Brussel, via
          <a href="mailto:contact@apd-gba.be" class="underline"
            >contact@apd-gba.be</a
          >
          of
          <a
            href="https://www.gegevensbeschermingsautoriteit.be"
            target="_blank"
            rel="noopener"
            class="underline"
            >www.gegevensbeschermingsautoriteit.be</a
          >.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { COMPANY } from "#shared/company";

definePageMeta({ layout: "main" });

useSeoMeta({
  title: "Privacyverklaring",
  description:
    "Welke persoonsgegevens Vleeswaren Vermeir verwerkt via deze website, waarom, hoe lang, en welke rechten u heeft.",
});

const LAST_UPDATED = "6 oktober 2026";

/** Een blok is een alinea (tekst) of een opsomming (lijst van teksten). */
interface Section {
  title: string;
  blocks: (string | string[])[];
}

const sections: Section[] = [
  {
    title: "Wie is verantwoordelijk voor uw gegevens?",
    blocks: [
      `${COMPANY.legalName}, ${COMPANY.street}, ${COMPANY.postalCode} ${COMPANY.city}, België, is de verwerkingsverantwoordelijke voor de persoonsgegevens die via deze website worden verwerkt. Wij verwerken uw gegevens volgens de Algemene Verordening Gegevensbescherming (AVG) en de Belgische privacywetgeving.`,
      "Deze website richt zich tot handelaars. Ook gegevens van contactpersonen binnen een bedrijf zijn persoonsgegevens; deze verklaring geldt daar dus evengoed voor.",
    ],
  },
  {
    title: "Welke gegevens verwerken wij, en waarom?",
    blocks: [
      "Contactformulier. Wanneer u ons een bericht stuurt, verwerken wij uw naam, bedrijfsnaam, e-mailadres, telefoonnummer en de inhoud van uw bericht. Dat doen wij om uw vraag te beantwoorden (ons gerechtvaardigd belang, of de stappen vóór het sluiten van een overeenkomst). Het bericht komt bij ons toe als e-mail en wordt niet in de website zelf bewaard.",
      "Klantenzone. Een account wordt door ons aangemaakt voor bestaande klanten; u kan zich niet zelf registreren. Voor uw account verwerken wij:",
      [
        "uw klantnummer, bedrijfsnaam, e-mailadres en telefoonnummer;",
        "uw lever- en facturatiegegevens, waaronder adres en btw-nummer;",
        "uw wachtwoord, dat enkel versleuteld (gehasht) wordt bewaard en door niemand kan worden gelezen;",
        "uw bestellingen, uw winkelmandje en uw bewaarde bestellijstjes;",
        "een overzicht van de producten die u eerder bij ons afnam, zodat u ze snel opnieuw kan bestellen.",
      ],
      "Deze gegevens zijn nodig om de overeenkomst met u uit te voeren: uw bestellingen ontvangen, klaarmaken en leveren. Bestelgegevens bewaren wij daarnaast omdat de boekhoudwetgeving dat van ons vraagt.",
      "Beveiliging. Bij het inloggen bewaren wij het IP-adres en het type browser van de sessie. Zo kunnen wij misbruik opsporen en uw account beveiligen (ons gerechtvaardigd belang).",
      "Statistieken. Wij meten hoeveel bezoekers de website heeft en hoe snel de pagina's laden. Dat gebeurt zonder cookies en zonder dat wij u als persoon kunnen herkennen of over verschillende websites heen kunnen volgen.",
    ],
  },
  {
    title: "Cookies",
    blocks: [
      "Deze website plaatst zelf enkel cookies die technisch noodzakelijk zijn: wanneer u inlogt in de klantenzone, houdt een sessiecookie u aangemeld. Die cookie verdwijnt wanneer u zich afmeldt en vervalt ten laatste na 30 dagen. Voor noodzakelijke cookies is geen toestemming vereist.",
      "Uw keuze voor het lichte of donkere thema wordt in uw eigen browser onthouden en niet naar ons verstuurd.",
      "Wij gebruiken geen advertentie- of trackingcookies. Op de contactpagina kan u een kaart van Google Maps tonen. Die kaart laadt pas nadat u zelf op \"Toon kaart\" klikt. Vanaf dan ontvangt Google uw IP-adres en kan Google eigen cookies plaatsen; daarop is het privacybeleid van Google van toepassing.",
    ],
  },
  {
    title: "Met wie delen wij uw gegevens?",
    blocks: [
      "Wij verkopen uw gegevens niet en geven ze niet door voor reclame. Wij doen enkel een beroep op dienstverleners die de gegevens in onze opdracht verwerken, en met wie wij daarover afspraken hebben gemaakt:",
      [
        "Vercel, voor de hosting van de website en de bezoekersstatistieken;",
        "Neon, voor de databank met klant- en bestelgegevens, op servers in Frankfurt (Duitsland);",
        "Lettermint, voor het versturen van e-mails zoals inloglinks en bestelmeldingen;",
        "Google, voor de kaart op de contactpagina, enkel wanneer u die zelf laadt.",
      ],
      "Uw gegevens worden zoveel mogelijk binnen de Europese Economische Ruimte verwerkt. Sommige van deze dienstverleners zijn Amerikaanse bedrijven. Geven zij gegevens door buiten de EER, dan gebeurt dat op basis van het EU-VS-kader voor gegevensbescherming of de modelcontractbepalingen van de Europese Commissie.",
      "Daarnaast geven wij gegevens door wanneer de wet ons daartoe verplicht.",
    ],
  },
  {
    title: "Hoe lang bewaren wij uw gegevens?",
    blocks: [
      [
        "Berichten via het contactformulier: tot uw vraag is afgehandeld, en ten hoogste twee jaar daarna.",
        "Accountgegevens: zolang u klant bent. Na het einde van de samenwerking verwijderen wij uw account op uw verzoek, of ten laatste na twee jaar zonder activiteit.",
        "Bestellingen en facturatiegegevens: zeven jaar, de wettelijke bewaartermijn voor boekhoudkundige stukken.",
        "Sessiegegevens (IP-adres en browsertype): tot de sessie vervalt, ten laatste na 30 dagen.",
      ],
    ],
  },
  {
    title: "Hoe beveiligen wij uw gegevens?",
    blocks: [
      "De verbinding met de website is versleuteld. De klantenzone is enkel toegankelijk na inloggen, wachtwoorden worden uitsluitend gehasht bewaard, en alleen onze eigen beheerders kunnen klant- en bestelgegevens inzien. Stellen wij toch een inbreuk vast die een risico voor u inhoudt, dan melden wij die aan de Gegevensbeschermingsautoriteit en brengen wij u op de hoogte, zoals de wet voorschrijft.",
    ],
  },
  {
    title: "Wat zijn uw rechten?",
    blocks: [
      "U heeft het recht om:",
      [
        "uw gegevens in te zien en er een kopie van te krijgen;",
        "onjuiste gegevens te laten verbeteren; uw facturatiegegevens kan u ook zelf aanpassen in de klantenzone;",
        "uw gegevens te laten wissen, voor zover wij ze niet wettelijk moeten bewaren;",
        "de verwerking te laten beperken of er bezwaar tegen te maken;",
        "uw gegevens in een gangbaar formaat te ontvangen om ze aan een andere partij over te dragen.",
      ],
      "Wij antwoorden binnen een maand op uw verzoek. Om misbruik te voorkomen, kunnen wij u vragen om uw identiteit te bevestigen.",
    ],
  },
  {
    title: "Wijzigingen",
    blocks: [
      "Wij kunnen deze verklaring aanpassen, bijvoorbeeld wanneer de website of de wetgeving verandert. De datum bovenaan geeft aan wanneer de tekst voor het laatst werd bijgewerkt.",
    ],
  },
];
</script>
