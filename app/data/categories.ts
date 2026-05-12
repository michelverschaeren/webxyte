export interface Category {
  id: string;
  slug: string;
  name: string;
  emoji: string;
}

export const categories: Category[] = [
  { id: "10", slug: "salamis", name: "Salami's", emoji: "🧄" },
  { id: "15", slug: "hespen", name: "Hespen", emoji: "🐷" },
  { id: "20", slug: "worstwaren", name: "Worstwaren", emoji: "🌭" },
  { id: "25", slug: "kookwaren", name: "Kookwaren", emoji: "🍳" },
  { id: "30", slug: "zoutwaren", name: "Zoutwaren", emoji: "🧂" },
  { id: "35", slug: "rookwaren", name: "Rookwaren", emoji: "💨" },
  { id: "40", slug: "pates", name: "Pâté's", emoji: "🫙" },
  { id: "45", slug: "gevogelte", name: "Gevogelte", emoji: "🍗" },
  { id: "50", slug: "salades", name: "Salades", emoji: "🥗" },
  { id: "55", slug: "traiteur", name: "Traiteur", emoji: "🍱" },
  { id: "60", slug: "kazen", name: "Kazen", emoji: "🧀" },
  { id: "65", slug: "conserven", name: "Conserven", emoji: "🥫" },
  { id: "70", slug: "drank", name: "Drank", emoji: "🥤" },
  { id: "73", slug: "verpakking", name: "Verpakking", emoji: "📦" },
  { id: "75", slug: "allerlei", name: "Allerlei", emoji: "🛒" },
  { id: "80", slug: "soepen", name: "Soepen", emoji: "🍵" },
  { id: "84", slug: "slizing", name: "Slizing", emoji: "🔪" },
  { id: "85", slug: "diepvries", name: "Diepvries", emoji: "❄️" },
  { id: "90", slug: "sauzen", name: "Sauzen", emoji: "🫙" },
  { id: "95", slug: "tapas", name: "Tapas", emoji: "🫒" },
  {
    id: "98",
    slug: "verse-bereidingen",
    name: "Verse bereidingen",
    emoji: "🥩",
  },
];
