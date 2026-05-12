export interface Product {
  id: string;
  articleNr: string;
  name: string;
  supplier: string;
  categoryId: string;
  /** Verpakkingsinfo: gewicht, aantal stuks of afmetingen (bv. "15x140gr.", "100st.", "1kg"). */
  unit?: string;
  /** Optionele URL naar een productfiche (PDF) van de producent. */
  infoPdf?: string;
}

export const products: Product[] = [
  // Salami's (10)
  {
    id: "1",
    articleNr: "10000",
    name: "Salami Extra zonder look",
    supplier: "Ter Beke nv",
    categoryId: "10",
  },
  {
    id: "2",
    articleNr: "10010",
    name: "Salami Extra met look",
    supplier: "Ter Beke nv",
    categoryId: "10",
  },
  {
    id: "3",
    articleNr: "10020",
    name: "Salami Hongrois",
    supplier: "Ter Beke nv",
    categoryId: "10",
  },
  {
    id: "4",
    articleNr: "10030",
    name: "Edelkost",
    supplier: "Ter Beke nv",
    categoryId: "10",
  },
  {
    id: "5",
    articleNr: "10500",
    name: "Salami Extra",
    supplier: "Imperial",
    categoryId: "10",
  },
  {
    id: "6",
    articleNr: "10510",
    name: "Salami met look",
    supplier: "Imperial",
    categoryId: "10",
  },
  {
    id: "7",
    articleNr: "11020",
    name: "Milano",
    supplier: "Imperial",
    categoryId: "10",
  },
  {
    id: "8",
    articleNr: "13300",
    name: "Bolzano 1/2",
    supplier: "Ivan",
    categoryId: "10",
  },
  {
    id: "9",
    articleNr: "14150",
    name: "Saltufo",
    supplier: "Bedford",
    categoryId: "10",
    unit: "6x80gr.",
    infoPdf: "/docs/demo.pdf",
  },
  {
    id: "10",
    articleNr: "14160",
    name: "Truffelsalami",
    supplier: "Bedford",
    categoryId: "10",
  },
  {
    id: "11",
    articleNr: "11700",
    name: "Salami Selva",
    supplier: "Can Duran",
    categoryId: "10",
  },
  {
    id: "12",
    articleNr: "13700",
    name: "Rosette de Lyon",
    supplier: "Bertrand P.",
    categoryId: "10",
  },
  {
    id: "13",
    articleNr: "13710",
    name: "Montagne Salami",
    supplier: "Bertrand P.",
    categoryId: "10",
  },
  {
    id: "14",
    articleNr: "14200",
    name: "Salami Duroc d'Olives",
    supplier: "Duroc",
    categoryId: "10",
  },
  {
    id: "15",
    articleNr: "13860",
    name: "Coppa Stagionata Mezza",
    supplier: "Villani",
    categoryId: "10",
  },

  // Hespen (15)
  {
    id: "16",
    articleNr: "20000",
    name: "Gekookte Ham Extra",
    supplier: "Ter Beke nv",
    categoryId: "15",
  },
  {
    id: "17",
    articleNr: "20010",
    name: "Gerookte Ham",
    supplier: "Ter Beke nv",
    categoryId: "15",
  },
  {
    id: "18",
    articleNr: "20020",
    name: "Parmaham 24 mnd",
    supplier: "Villani",
    categoryId: "15",
    unit: "1/2 ham ±4kg",
    infoPdf: "/docs/demo.pdf",
  },
  {
    id: "19",
    articleNr: "20030",
    name: "Serranoham Bonito",
    supplier: "Casademont",
    categoryId: "15",
    unit: "±7kg",
  },
  {
    id: "20",
    articleNr: "20040",
    name: "Hesp Ardeens Gerookt",
    supplier: "Imperial",
    categoryId: "15",
  },
  {
    id: "21",
    articleNr: "20050",
    name: "Prosciutto Crudo 18 mnd",
    supplier: "Fravanel N.V.",
    categoryId: "15",
  },
  {
    id: "22",
    articleNr: "20060",
    name: "Coburgerham",
    supplier: "Peeters",
    categoryId: "15",
  },
  {
    id: "23",
    articleNr: "20070",
    name: "Ham van de Kempen",
    supplier: "De Wulf",
    categoryId: "15",
  },

  // Worstwaren (20)
  {
    id: "24",
    articleNr: "30000",
    name: "Boudin Noir Classique",
    supplier: "Imperial",
    categoryId: "20",
  },
  {
    id: "25",
    articleNr: "30010",
    name: "Witte Pensen",
    supplier: "Ter Beke nv",
    categoryId: "20",
  },
  {
    id: "26",
    articleNr: "30020",
    name: "Bloedworst met rozijnen",
    supplier: "Peeters",
    categoryId: "20",
  },
  {
    id: "27",
    articleNr: "30030",
    name: "Gelderse Rookworst",
    supplier: "Zwan",
    categoryId: "20",
  },
  {
    id: "28",
    articleNr: "30040",
    name: "Knakworst Duo",
    supplier: "Bocklunder",
    categoryId: "20",
    unit: "10x2st.",
  },
  {
    id: "29",
    articleNr: "30050",
    name: "Bierworst",
    supplier: "Hartog N.V.",
    categoryId: "20",
  },
  {
    id: "30",
    articleNr: "30060",
    name: "Merguez 100% Rund",
    supplier: "Belgian Import Service bvba",
    categoryId: "20",
    unit: "1kg",
  },

  // Kookwaren (25)
  {
    id: "31",
    articleNr: "40000",
    name: "Presskopf",
    supplier: "Imperial",
    categoryId: "25",
  },
  {
    id: "32",
    articleNr: "40010",
    name: "Kop met stukjes",
    supplier: "Peeters",
    categoryId: "25",
  },
  {
    id: "33",
    articleNr: "40020",
    name: "Varkensgebraad",
    supplier: "Ter Beke nv",
    categoryId: "25",
  },
  {
    id: "34",
    articleNr: "40030",
    name: "Rollade Natuur",
    supplier: "Ter Beke nv",
    categoryId: "25",
  },
  {
    id: "35",
    articleNr: "40040",
    name: "Bouilli de Luxe",
    supplier: "Imperial",
    categoryId: "25",
  },

  // Zoutwaren (30)
  {
    id: "36",
    articleNr: "50000",
    name: "Spek Natuur 1kg",
    supplier: "Ter Beke nv",
    categoryId: "30",
  },
  {
    id: "37",
    articleNr: "50010",
    name: "Gerookt Spek",
    supplier: "Peeters",
    categoryId: "30",
  },
  {
    id: "38",
    articleNr: "50020",
    name: "Pancetta Arrotolata",
    supplier: "Villani",
    categoryId: "30",
  },
  {
    id: "39",
    articleNr: "50030",
    name: "Guanciale",
    supplier: "Fravanel N.V.",
    categoryId: "30",
  },

  // Rookwaren (35)
  {
    id: "40",
    articleNr: "60000",
    name: "Gerookte Kip",
    supplier: "Ter Beke nv",
    categoryId: "35",
  },
  {
    id: "41",
    articleNr: "60010",
    name: "Gerookte Eend",
    supplier: "Belgian Import Service bvba",
    categoryId: "35",
  },
  {
    id: "42",
    articleNr: "60020",
    name: "Rookspek Ardense stijl",
    supplier: "Imperial",
    categoryId: "35",
  },

  // Pâté's (40)
  {
    id: "43",
    articleNr: "70000",
    name: "Paté de Campagne",
    supplier: "Bertrand P.",
    categoryId: "40",
  },
  {
    id: "44",
    articleNr: "70010",
    name: "Paté au Poivre Vert",
    supplier: "Bertrand P.",
    categoryId: "40",
  },
  {
    id: "45",
    articleNr: "70020",
    name: "Mousse de Canard",
    supplier: "Belgian Import Service bvba",
    categoryId: "40",
  },
  {
    id: "46",
    articleNr: "70030",
    name: "Rillettes de Porc",
    supplier: "Larden Salaisons SA",
    categoryId: "40",
  },

  // Gevogelte (45)
  {
    id: "47",
    articleNr: "80000",
    name: "Kalkoensalami Pepino",
    supplier: "Imperial",
    categoryId: "45",
  },
  {
    id: "48",
    articleNr: "80010",
    name: "Kipfilet Natuur",
    supplier: "Ter Beke nv",
    categoryId: "45",
  },
  {
    id: "49",
    articleNr: "80020",
    name: "Eendenborst",
    supplier: "Belgian Import Service bvba",
    categoryId: "45",
  },
  {
    id: "50",
    articleNr: "80030",
    name: "Kalkoenborstwors",
    supplier: "Peeters",
    categoryId: "45",
  },

  // Salades (50)
  {
    id: "51",
    articleNr: "90000",
    name: "Huzarensalade",
    supplier: "Ter Beke nv",
    categoryId: "50",
  },
  {
    id: "52",
    articleNr: "90010",
    name: "Krabsalade",
    supplier: "Ter Beke nv",
    categoryId: "50",
  },
  {
    id: "53",
    articleNr: "90020",
    name: "Tonijnsalade",
    supplier: "Imperial",
    categoryId: "50",
  },

  // Traiteur (55)
  {
    id: "54",
    articleNr: "100000",
    name: "Quiche Lorraine",
    supplier: "Belgian Import Service bvba",
    categoryId: "55",
  },
  {
    id: "55",
    articleNr: "100010",
    name: "Vol-au-vent klaar",
    supplier: "Peeters",
    categoryId: "55",
  },
  {
    id: "56",
    articleNr: "100020",
    name: "Cannelloni bolognese",
    supplier: "Ter Beke nv",
    categoryId: "55",
  },

  // Kazen (60)
  {
    id: "57",
    articleNr: "110000",
    name: "Gouda Jong 48+",
    supplier: "Velda N.V.",
    categoryId: "60",
  },
  {
    id: "58",
    articleNr: "110010",
    name: "Emmentaler blok",
    supplier: "Velda N.V.",
    categoryId: "60",
  },
  {
    id: "59",
    articleNr: "110020",
    name: "Parmigiano Reggiano 24 mnd",
    supplier: "Villani",
    categoryId: "60",
  },
  {
    id: "60",
    articleNr: "110030",
    name: "Brie de Meaux",
    supplier: "Bertrand P.",
    categoryId: "60",
  },

  // Conserven (65)
  {
    id: "61",
    articleNr: "120000",
    name: "Tonijn in olie 3x80gr.",
    supplier: "Belgian Import Service bvba",
    categoryId: "65",
  },
  {
    id: "62",
    articleNr: "120010",
    name: "Ansjovis gefileerd",
    supplier: "Joka bvba",
    categoryId: "65",
  },
  {
    id: "63",
    articleNr: "120020",
    name: "Sardinettes aan boord",
    supplier: "Michielssen L. bvba",
    categoryId: "65",
  },

  // Drank (70)
  {
    id: "64",
    articleNr: "130000",
    name: "Frisdrank Blik 33cl 24st.",
    supplier: "Allerlei",
    categoryId: "70",
  },
  {
    id: "65",
    articleNr: "130010",
    name: "Water plat 1,5L 6st.",
    supplier: "Allerlei",
    categoryId: "70",
  },

  // Verpakking (73)
  {
    id: "66",
    articleNr: "140000",
    name: "Vleeswarenfolie 30cm",
    supplier: "Verpak Pro",
    categoryId: "73",
  },
  {
    id: "67",
    articleNr: "140010",
    name: "Plastic schaaltjes 100st.",
    supplier: "Verpak Pro",
    categoryId: "73",
  },

  // Soepen (80)
  {
    id: "68",
    articleNr: "150000",
    name: "Tomatensoep 1L",
    supplier: "Ter Beke nv",
    categoryId: "80",
  },
  {
    id: "69",
    articleNr: "150010",
    name: "Groentesoep 1L",
    supplier: "Ter Beke nv",
    categoryId: "80",
  },

  // Diepvries (85)
  {
    id: "70",
    articleNr: "160000",
    name: "Diepvries Frites 2,5kg",
    supplier: "Belgian Import Service bvba",
    categoryId: "85",
  },
  {
    id: "71",
    articleNr: "160010",
    name: "Bladerdeegbodem 4st.",
    supplier: "Peeters",
    categoryId: "85",
  },

  // Sauzen (90)
  {
    id: "72",
    articleNr: "170000",
    name: "Mayonaise Ambri 10L",
    supplier: "Imperial",
    categoryId: "90",
  },
  {
    id: "73",
    articleNr: "170010",
    name: "Mosterd Dijon 5kg",
    supplier: "Bertrand P.",
    categoryId: "90",
  },
  {
    id: "74",
    articleNr: "170020",
    name: "Cocktailsaus 3kg",
    supplier: "Ter Beke nv",
    categoryId: "90",
  },

  // Tapas (95)
  {
    id: "75",
    articleNr: "180000",
    name: "Tapas Fuet Bodega Walnuts",
    supplier: "Joka bvba",
    categoryId: "95",
  },
  {
    id: "76",
    articleNr: "180010",
    name: "Manchego Mini Cuñas",
    supplier: "Casademont",
    categoryId: "95",
  },
  {
    id: "77",
    articleNr: "180020",
    name: "Chorizo Iberico Velita",
    supplier: "Joka bvba",
    categoryId: "95",
  },

  // Verse bereidingen (98)
  {
    id: "78",
    articleNr: "190000",
    name: "Gehakt gemengd 500gr.",
    supplier: "Peeters",
    categoryId: "98",
  },
  {
    id: "79",
    articleNr: "190010",
    name: "Varkenssteak nature",
    supplier: "Ter Beke nv",
    categoryId: "98",
  },
  {
    id: "80",
    articleNr: "190020",
    name: "Kalkoenescalope",
    supplier: "Ter Beke nv",
    categoryId: "98",
  },

  // Allerlei (75)
  {
    id: "81",
    articleNr: "200000",
    name: "Olijven Groen gevuld",
    supplier: "Joka bvba",
    categoryId: "75",
  },
  {
    id: "82",
    articleNr: "200010",
    name: "Zure Augurken 1kg",
    supplier: "Belgian Import Service bvba",
    categoryId: "75",
  },

  // Slizing (84)
  {
    id: "83",
    articleNr: "210000",
    name: "Gesneden Fiocco Delicato",
    supplier: "Villani",
    categoryId: "84",
  },
  {
    id: "84",
    articleNr: "210010",
    name: "Gesneden Mortadella",
    supplier: "Fravanel N.V.",
    categoryId: "84",
  },
];
