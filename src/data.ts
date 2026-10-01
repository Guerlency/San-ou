export type Risk = "wnv" | "dengue" | "chikungunya" | "paludisme" | "chagas" | "zika" | "arbovirus";
export type SourceId = "belgium" | "wnv" | "dengue" | "travel";

export type Entry = {
  place: string;
  country: string;
  risk: Risk;
  source: SourceId;
  delay: string;
  plasma: string;
  platelets: string;
  note?: string;
  screening?: boolean;
};

export const sources: Record<SourceId, { title: string; date: string; href: string; detail: string }> = {
  belgium: {
    title: "WNV · Communes belges",
    date: "25 sept. 2026",
    href: "/documents/wnv-belgique-25-09-2026.pdf",
    detail: "Liste des communes par arrondissement · Dr MICHEL Guerlency",
  },
  wnv: {
    title: "WNV · Régions affectées",
    date: "23 sept. 2026",
    href: "/documents/wnv-regions-23-09-2026.pdf",
    detail: "Mise à jour épidémiologique · Dr MICHEL Guerlency",
  },
  dengue: {
    title: "Dengue & Chikungunya",
    date: "23 sept. 2026",
    href: "/documents/dengue-chikungunya-23-09-2026.pdf",
    detail: "Zones affectées et exclusion obligatoire · Dr MICHEL Guerlency",
  },
  travel: {
    title: "Voyages à risque · Référentiel",
    date: "Version 6",
    href: "/documents/voyages-risques-v6.pdf",
    detail: "MED-SEM-LI-02A · Don de Sang ASBL · 13 pages",
  },
};

const belgianCommunes: Record<string, string[]> = {
  "Arr. Antwerpen": [
    "Aartselaar", "Anvers (Antwerpen)", "Boechout", "Boom", "Brasschaat", "Brecht", "Edegem", "Essen", "Hemiksem", "Hove", "Kalmthout", "Kapellen", "Kontich", "Lint", "Malle", "Mortsel", "Niel", "Ranst", "Rumst", "Schilde", "Schoten", "Stabroek", "Wijnegem", "Wommelgem", "Wuustwezel", "Zandhoven", "Zoersel", "Zwijndrecht",
  ],
  "Arr. Halle-Vilvoorde": [
    "Affligem", "Asse", "Beersel", "Biévène (Bever)", "Dilbeek", "Drogenbos", "Galmaarden", "Gooik", "Grimbergen", "Hal (Halle)", "Herne", "Hoeilaart", "Kampenhout", "Kapelle-op-den-Bos", "Kraainem", "Lennik", "Liedekerke", "Linkebeek", "Londerzeel", "Machelen", "Meise", "Merchtem", "Opwijk", "Overijse", "Pepingen", "Rhode-Saint-Genèse", "Roosdaal", "Sint-Pieters-Leeuw", "Steenokkerzeel", "Ternat", "Vilvorde (Vilvoorde)", "Wemmel", "Wezembeek-Oppem", "Zaventem", "Zemst",
  ],
  "Arr. Mechelen": [
    "Berlaar", "Bonheiden", "Bornem", "Duffel", "Heist-op-den-Berg", "Lier (Lierre)", "Malines (Mechelen)", "Nijlen", "Putte", "Puurs-Sint-Amands", "Sint-Katelijne-Waver", "Willebroek",
  ],
};

const belgiumEntries: Entry[] = Object.entries(belgianCommunes).flatMap(([district, communes]) =>
  communes.map((place) => ({
    place,
    country: `Belgique · ${district}`,
    risk: "wnv" as const,
    source: "belgium" as const,
    delay: "Dépistage WNV obligatoire",
    plasma: "Voir protocole de dépistage",
    platelets: "Voir protocole de dépistage",
    screening: true,
    note: "Résidence ou séjour d’au moins une nuit : dépistage obligatoire, sans restriction de date du séjour (y compris depuis juin). Ne pas assimiler cette règle à un simple délai de 28 jours.",
  })),
);

function outbreak(places: string[], country: string, risk: Risk, source: SourceId = "dengue"): Entry[] {
  return places.map((place) => ({
    place,
    country,
    risk,
    source,
    delay: "28 jours",
    plasma: "Exception : plasma destiné au fractionnement",
    platelets: "28 jours",
    note: "Exclusion de 28 jours selon la mise à jour épidémiologique. L’exception concerne uniquement le plasma destiné au fractionnement.",
  }));
}

const outbreakEntries: Entry[] = [
  ...outbreak(["Prignac-et-Marcamps (Gironde)", "Talence (Gironde)", "Prayssac (Lot)", "Nogent-sur-Marne (Val-de-Marne)", "Cavignac (Gironde)", "Arcachon (Gironde)", "Bordeaux (Gironde)", "Étauliers (Gironde)", "Portets (Gironde)", "Biscarrosse (Landes)", "Créon (Gironde)"], "France", "chikungunya"),
  ...outbreak(["Rome"], "Italie", "chikungunya"),
  ...outbreak(["Marseille (Bouches-du-Rhône)"], "France", "dengue"),
  ...outbreak(["Alliste (Lecce)", "Ugento (Lecce)", "Piombino (Livorno)"], "Italie", "dengue"),
  ...outbreak(["Arr. de Bruxelles-Capitale"], "Belgique", "wnv", "wnv"),
  ...outbreak(["Bouches-du-Rhône", "Gironde", "Seine-et-Marne", "Seine-Saint-Denis", "Val-de-Marne", "Var", "Vaucluse", "Yvelines"], "France", "wnv", "wnv"),
  ...outbreak(["Roma", "Milano", "Lecce", "Venezia", "Torino", "Bologna", "Firenze", "Napoli"], "Italie", "wnv", "wnv"),
  ...outbreak(["Berlin", "Leipzig, Kreisfreie Stadt", "Rhein-Pfalz-Kreis"], "Allemagne", "wnv", "wnv"),
  ...outbreak(["Nordburgenland", "Wien"], "Autriche", "wnv", "wnv"),
  ...outbreak(["Budapest", "Pest"], "Hongrie", "wnv", "wnv"),
];

const travelEntries: Entry[] = [
  { place: "Inde", country: "Asie", risk: "paludisme", source: "travel", delay: "4 mois", plasma: "28 jours", platelets: "6 mois", note: "Le tableau indique aussi le risque Zika. Vérifier les antécédents de paludisme, la fièvre et les indications de test dans la procédure." },
  { place: "Thaïlande", country: "Asie", risk: "paludisme", source: "travel", delay: "4 mois", plasma: "28 jours", platelets: "6 mois", note: "Le tableau indique aussi le risque Zika. Les situations particulières de paludisme nécessitent une évaluation médicale." },
  { place: "Sénégal", country: "Afrique", risk: "paludisme", source: "travel", delay: "4 mois", plasma: "28 jours", platelets: "6 mois", note: "Le tableau indique aussi le risque Zika. Les situations particulières de paludisme nécessitent une évaluation médicale." },
  { place: "Tanzanie", country: "Afrique", risk: "paludisme", source: "travel", delay: "4 mois", plasma: "28 jours", platelets: "6 mois" },
  { place: "Turquie · sud-est", country: "Asie", risk: "paludisme", source: "travel", delay: "4 mois", plasma: "28 jours", platelets: "6 mois", note: "Le reste de la Turquie est indiqué « Ok » dans le tableau général. Vérifier les mises à jour épidémiologiques distinctes." },
  { place: "Colombie · séjour en plein air / habitation précaire", country: "Amérique du Sud", risk: "chagas", source: "travel", delay: "6 mois + test", plasma: "6 mois", platelets: "6 mois", note: "Le séjour et les autres risques (paludisme, Zika) influencent le délai. Se référer au tableau et à la procédure Chagas." },
  { place: "Colombie · autre type de séjour", country: "Amérique du Sud", risk: "paludisme", source: "travel", delay: "4 mois", plasma: "28 jours", platelets: "6 mois", note: "Exemple donné : hôtel. Le tableau indique aussi le risque Zika ; évaluer les conditions exactes du séjour." },
  { place: "Cuba", country: "Amérique", risk: "zika", source: "travel", delay: "28 jours", plasma: "28 jours", platelets: "28 jours", note: "Le tableau indique aussi un risque tropical." },
  { place: "Curaçao", country: "Amérique", risk: "arbovirus", source: "travel", delay: "28 jours", plasma: "28 jours", platelets: "28 jours", note: "Le tableau indique aussi le risque Zika." },
  { place: "États-Unis (USA)", country: "Amérique du Nord", risk: "arbovirus", source: "travel", delay: "28 jours", plasma: "28 jours", platelets: "28 jours", note: "Indication du tableau général ; vérifier la mise à jour WNV pour les régions concernées." },
];

export const entries = [...belgiumEntries, ...outbreakEntries, ...travelEntries];

export const riskNames: Record<Risk, string> = {
  wnv: "West Nile Virus",
  dengue: "Dengue",
  chikungunya: "Chikungunya",
  paludisme: "Paludisme",
  chagas: "Chagas",
  zika: "Zika",
  arbovirus: "Arbovirus",
};
