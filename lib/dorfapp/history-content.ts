/**
 * Inhalte zur Dorfgeschichte – strukturierte Kurzfassungen auf Basis der Vereinsbroschüre
 * „50 Jahre Frauenweiler“ (Oktober 1987, DS Siedlerbund) und der erweiterten Chronik „75 Jahre
 * Frauenweiler“ (Juli 2012, Stadtteilverein). Historische Eckdaten zu Wiesloch/ Stadtteilen sind
 * wo angegeben mit deutschsprachiger Wikipedia zu Wiesloch abgestimmt; Detailtiefe und Urheberrecht
 * bleiben bei den Original-PDFs auf frauenweiler.org.
 */

export const HISTORY_PDF_50_JAHRE =
  'https://frauenweiler.org/wp-content/uploads/2021/10/50-Jahre-Frauenweiler.pdf';

export const HISTORY_PDF_75_JAHRE =
  'https://frauenweiler.org/wp-content/uploads/2021/10/75-Jahre-Frauenweiler.pdf';

export interface HistoryPdfSource {
  id: string;
  title: string;
  yearLabel: string;
  pages: number;
  description: string;
  href: string;
}

export const historyPdfSources: HistoryPdfSource[] = [
  {
    id: '50',
    title: '50 Jahre Frauenweiler',
    yearLabel: 'Festschrift 1987',
    pages: 41,
    description:
      'Ausgabe der Siedlergemeinschaft im Deutschen Siedlerbund: Grußworte, Selbstvorstellung des Verbands, langer Geschichtsteil zur mittelalterlichen Weilersiedlung und zur Neuplanung unter den Bedingungen der 1930er Jahre, Gemeinde- und Vereinsgeschichte sowie zahlreiche Fotos bis in die 1980er.',
    href: HISTORY_PDF_50_JAHRE,
  },
  {
    id: '75',
    title: '75 Jahre Frauenweiler',
    yearLabel: 'Chronik 2012',
    pages: 83,
    description:
      'Stadtteilverein aktualisiert die Festschrift 1987: Kapitelüberblick mit Institutionen von Gewerbe bis Feuerwehr, Vereinsportraits, ergänzte Archäologie und amtliche Grußworte zur Entwicklung des Stadtteils bis 2012.',
    href: HISTORY_PDF_75_JAHRE,
  },
];

/** Kurze, klar zugewiesene Formulierung (keine Absatzübernahmen aus den PDFs). */
export interface HistoryAttributedQuote {
  phrase: string;
  summary: string;
  speaker: string;
  via: string;
}

export interface HistoryChapterHighlight {
  headline: string;
  takeaway: string;
  tags?: string[];
}

/** Material zu einer gedruckten Chronik-Ausgabe (ohne Bildrechte neu zu vergeben – nur bereits vorhandene JPGs unter /geschichte/). */
export interface HistoryChronicleEdition {
  id: '50' | '75';
  displayTitle: string;
  publisherLine: string;
  pageCount: number;
  pdfHref: string;
  intro: string;
  chapterHighlights: HistoryChapterHighlight[];
  notableQuotes?: HistoryAttributedQuote[];
  coverImageSrc?: string;
  coverImageAlt?: string;
}

export interface HistoryMilestoneRow {
  year: string;
  title: string;
  detail: string;
  attribution: string;
}

export interface HistoryEditionComparisonAxis {
  aspect: string;
  circa1987: string;
  circa2012: string;
}

/** Kapitelfokus aus Inhaltsführung / Textfluss Festschrift 1987 – sinngemäß gekürzt (Herausgabe Stadtteilverein Siedlerbund-Ausgabe). */
export const historyChronicle50: HistoryChronicleEdition = {
  id: '50',
  displayTitle: '50 Jahre Frauenweiler – Festschrift 1987',
  publisherLine: 'Siedlergemeinschaft im Deutschen Siedlerbund (Redaktionshinweis: Gesamtredaktion in der Broschüre angegeben)',
  pageCount: 41,
  pdfHref: HISTORY_PDF_50_JAHRE,
  intro:
    'Die Broschüre knüpft Jubiläum und Alltag eines mit „kleinem Heim plus Gartenland“ angelegten Wohnmodells an die großen Linien lokaler Geschichte: mittelalterliches Frauenweiler, Aufhebung 1526 und die neue Stammarbeitersiedlung ab 1937. Politische Grußworte und Verbandsüberblicke dokumentieren Ehrenämter beim Deutschen Siedlerbund sowie den Generationenfolge beim Gemeinschaftsvorstand.',
  chapterHighlights: [
    {
      headline: 'Grußworte und Vereinsbezug',
      takeaway:
        'OB, Ministerium für Ländlichen Raum und Landesverband würdigen Siedlerselbstständigkeit und Gartenarbeit; die Rhein-Neckar-Kreisgruppe stellt ihre Rolle beim Deutschen Siedlerbund vor (Stand Mitgliederzahl und Ausflugsleben dort nachzulesen).',
      tags: ['Deutscher Siedlerbund', 'Gemeinschaftsleben'],
    },
    {
      headline: 'Geschichte Alter und Neu-Frauenweiler',
      takeaway:
        'Ausführlicher Exkurs zur Flur („Frauenweiler Wiesen“, Malschenberger Sträßel, Gänsberg), Mittelalter, Aufhebung 1526 sowie das NS-gestützte Großprojekt Frauenweiler mit Heimstättengesellschaft, Beteiligungen regionaler Arbeitgeber und typischen Hauskosten der Bauphase 1937.',
      tags: ['Archäologie', 'Politikgeschichte'],
    },
    {
      headline: 'Gemeinschaftsführung seit 1937',
      takeaway:
        'Chronologische Liste der Gemeindeleiter ab Simon Sauer; parallel Porträt des Vorstands 1987 mit Namen zur Identifikation späterer Überlieferungen im Vereinsarchiv.',
      tags: ['Ehrenamt', 'Nachbarschaft'],
    },
    {
      headline: 'Katholischer Kirchbau in der Jungensiedlung',
      takeaway:
        'Schrittfolge vom provisorischen Raum zur festen Kirche: Bittbriefe nach 1945, Stadtbürgermeister-Schreiben, Spatenstich April 1951 und Grundsteinlegung Pfingstsonntag 1951 (Maße und Zeremonien in der Broschüre dokumentiert).',
      tags: ['Nachkrieg', 'Gebäude'],
    },
    {
      headline: 'Leben zwischen Kleingarten und Handwerk',
      takeaway:
        'Nachbarschaftshilfe, Kleingartenarbeit und erste Straßenzüge (u. a. Kleinfeldstraße, Frauenweilerweg als frühes Wachstum in den folgenden Jahrzehnten) gehören zu den dokumentierten Sozialgeschichten; Vereine wie FC und Kleintiervzucht werden skizziert.',
      tags: ['Städtebau', 'Nachbarschaft'],
    },
  ],
  notableQuotes: [
    {
      phrase: '„Schmuckstück für ihre Stadt“',
      summary:
        'Würdigung des Selbstaufbaugedankens der Siedlergemeinschaft aus dem Kreisverband des Deutschen Siedlerbundes (sinngemäß im Jubiläumskontext).',
      speaker: 'Kreisgruppe Rhein-Neckar, Deutscher Siedlerbund',
      via: 'Festschrift 1987 (Grußwort)',
    },
    {
      phrase: '„Mit 20 Häusern … begonnen“',
      summary:
        'Verweis auf den besonders schmalen Start der Baufelder im Erinnerungsrückblick des Oberbürgermeisters.',
      speaker: 'Oberbürgermeister Wiesloch (1987)',
      via: 'Festschrift 1987 (Grußwort)',
    },
  ],
  coverImageSrc: '/geschichte/h50-004.jpg',
  coverImageAlt: 'Collage aus der Jubiläumsbroschüre „50 Jahre Frauenweiler“',
};

/** Kapitelbasierte Kurzüberblicke Chronik-Inhalt 2012 nach Impressums-/Titelseite strukturiert. */
export const historyChronicle75: HistoryChronicleEdition = {
  id: '75',
  displayTitle: '75 Jahre Frauenweiler – Chronik 2012',
  publisherLine: 'Stadtteilverein Frauenweiler e. V. (Georg Wittmer laut Impressum)',
  pageCount: 83,
  pdfHref: HISTORY_PDF_75_JAHRE,
  intro:
    'Die Stadtteilvereins-Chronik führt die Jubiläumsschrift 1987 fort, ordnet neue archäologische Erkenntnisse ein und lässt Kirchengemeinden, Kita, Schule, Feuerwehr, Gewerbe und zahlreiche Vereine eigene Aktualisierungen schreiben. Damit entsteht ein Panorama des strukturierten Ehrenamts ebenso wie des wirtschaftlichen Stadtteilkörpers rund um Gewerbegebiet und Vereinskorridor.',
  chapterHighlights: [
    {
      headline: 'Grußwort Oberbürgermeister Stadt Wiesloch',
      takeaway:
        'Ordnet Frauenweiler als „75-jähriges Bestehen“ der Neugründung ein und knüpft explizit an den mittelalterlichen Namen „Frawenwilre“ samt späterer Vereinigung mit Wiesloch 1526 an (Kapellenstandort und Flur dort im PDF).',
      tags: ['Stadtpolitik', 'Name'],
    },
    {
      headline: 'Grußwort Stadtteilvorsitzende/r',
      takeaway:
        'Beschreibt den Übergang von loser Siedler-/Arbeitsgemeinschaft nach dem Zweiten Weltkrieg zum später gegründeten Stadtteilverein und rechtfertigt die überarbeitete Chronik als Brücke zwischen hektischer Gegenwart und Gemeinschaftsarbeit.',
      tags: ['Stadtteilverein'],
    },
    {
      headline: 'Die alte Siedlung – der neue Stadtteil',
      takeaway:
        'Geschichtlicher Langteil mit Aktualisierungen zur Ur- und Frühgeschichte (Sandgruben, Bahndurchstich, Glockenbecher-Hockergrab Eichelweg 1973) und mittelalterlichem Gemeindeleben inklusive Abbauzonen Risiken für Bodendenkmäler.',
      tags: ['Archäologie', 'Mittelalter'],
    },
    {
      headline: 'Gewerbegebiet und öffentlicher Alltag',
      takeaway:
        'Eigenes Kapitel zum Wirtschaftspark südlich der Bahntrasse sowie angrenzend Kapitel zu Kindertagesstätte („Unterm Sternenhimmel“), Grundschule, beiden Kirchen, Feuerwehr und Wählergemeinschaft WGF.',
      tags: ['Infrastruktur', 'Ehrenämter'],
    },
    {
      headline: 'Vereinslandschaft Frauenweiler',
      takeaway:
        'Serienbeiträge u. a. zu Stadtteilverein, Gesang-, Fußball-, Kleintiervzucht-, Spielmanns-/Fanfaren-, Volkstanz-, Gymnastik-, Tennisclubs, Wanderfreunden und geschichtlicher Kurzvortrag „Mittelalterliches Bügeleisen“. Chronik dokumentiert Mitgliedszahlen dort jeweilig.',
      tags: ['Vereinsleben', 'Kultur'],
    },
  ],
  notableQuotes: [
    {
      phrase: '„Geschichtsträchtige Umgebung“',
      summary:
        'Begründet, warum regelmäßige Ausgrabungsfunde Teil der Chronik wurden – keine bloße Beilage, sondern Kontext zur Lebensrealität unter der Gemarkungsdecke.',
      speaker: 'Klaus Adam',
      via: 'Chronik 2012 (Grußwort Stadtteilverein)',
    },
    {
      phrase: '„Gemeinschaft … intensiv gelebt“',
      summary:
        'Betont gelebte Gemeinschaft jenseits des planerischen Rahmens des NS-Wohnungsbaus – Nachbarschaft und Hilfsbereitschaft als Alltagsrealität.',
      speaker: 'Franz Schaidhammer',
      via: 'Chronik 2012 (Grußwort Stadt Wiesloch)',
    },
  ],
  coverImageSrc: '/geschichte/h75-003.jpg',
  coverImageAlt: 'Auszug aus der Chronik 2012 zum archäologischen Teil',
};

export const historyEditionComparison: HistoryEditionComparisonAxis[] = [
  {
    aspect: 'Herausgeberperspektive',
    circa1987: 'Siedlergemeinschaft im Bundesverband – Fokus auf Garten, Eigenheim-Selbstständigkeit und Siedlerdokumentation.',
    circa2012: 'Stadtteilverein übernimmt die Chroniktradition als zivilgesellschaftlicher Bündner aller Stadtteilvereine.',
  },
  {
    aspect: 'Tiefgang Archäologie & Topographie',
    circa1987: 'Umfänglicher Grundlagenartikel bereits erschlossen Steinzeit bis Neuzeit; ergänzte Einzelfunde bis in die Auflage hinein.',
    circa2012:
      'Ausgrabungsprojekte (z. B. Glockenbechergrab, Sandgruben) zusätzlich eingeordnet; Risiken durch Tonabbau weiter benannt.',
  },
  {
    aspect: 'Institutionen & Vereine',
    circa1987: 'Schwerpunkte Siedlerstrukturen, erste Nachkriegs-Kirchenphase, Kindergarten/Schule, ausgewählte Vereinskapitel.',
    circa2012: 'Systematisches Kapitelschema mit Kita, beiden Konfessionen, Schule, WGF und breitem Vereinskatalog.',
  },
  {
    aspect: 'Nutzen für die DorfApp',
    circa1987: 'Klassischer Einstieg in Personen-/Straßengeschichte der „ersten Generation“ Frauenweiler.',
    circa2012: 'Aktuelle Anknüpfungspunkte für Ehrenämter bis 2012; PDF liefert höhere Detaildichte zur Vereinsarbeit.',
  },
];

/** Über Chroniken und Stadtkontext konsolidierte Stichdaten (chronologische Lesereihenfolge). */
export const historyMilestoneTable: HistoryMilestoneRow[] = [
  {
    year: '1293/94',
    title: 'Frühe Weiler-Spur im Schreibgut',
    detail:
      '„Wilre“-Nennungen in Urkunden des Klosters Schönau werden in den Chroniken dem späteren Frauenweiler zugeordnet.',
    attribution: 'Festschrift/Chronik 2012',
  },
  {
    year: '1333',
    title: 'Erste dokumentierte Frauenweiler-Namenform',
    detail:
      'Als „villa Frawenwilre juxta Wissenloch“ überliefert; Flurname und geografische Nachbarschaft dort ausgeführt.',
    attribution: 'Festschrift/Chronik 2012',
  },
  {
    year: 'nach 1480',
    title: 'Kirchen- und Pfarrorganisation vor der Aufhebung',
    detail:
      'Chroniken skizzieren Pfründendiskussion und Diözesanbezug noch vor der Auflösungsurkunde.',
    attribution: 'Chronik 2012',
  },
  {
    year: '1526',
    title: 'Auflösung des mittelalterlichen Ortes',
    detail:
      'Gemarkung mit Wiesloch vereinigt; Bewohnung soll nach Wiesloch verlagert werden und der Jahrmarkt wandert ebenfalls – parallel erwähnt in der deutschsprachigen Wikipedia.',
    attribution: 'Festschrift/Chronik; Wikipedia Wiesloch',
  },
  {
    year: '1936–37',
    title: 'Ankündigung, Planwerk und Neustart der Siedlung',
    detail:
      'Chroniken erläutern Pressemeldungen mit verfrühter Datierung im März 1936, den amtlich erinnerten Spatenstich am 1. Februar 1937 und die Unterbringung über Heimstättengesellschaft plus regionale Arbeitgeber (Stammarbeitersiedlung). Zur Neugründung 1937 vgl. auch Wikipedia.',
    attribution: 'Festschrift 1987, Chronik 2012',
  },
  {
    year: '1945–51',
    title: 'Katholische Gemeinde: Kantine zur festen Kapelle',
    detail:
      'Chroniken begleiten Gottesdienste in Kantinenräumen bis zu Spatenstich und dokumentierter Grundsteinlegung 1951.',
    attribution: 'Festschrift 1987',
  },
  {
    year: '1962',
    title: 'Kindergartenbau',
    detail:
      'In den Jubiläumstexten als Meilenstein des sozialen Infrastrukturaufbaus hervorgehoben.',
    attribution: 'Festschrift/Chronik',
  },
  {
    year: '1969/70',
    title: 'Grundschule',
    detail:
      'Schulbau schließt an wachsende Familienzahl an und bleibt bis heute strukturtragend (vgl. amtliche Schulverzeichnisse der Stadt und Chronikteil).',
    attribution: 'Festschrift/Chronik',
  },
  {
    year: '1973',
    title: 'Glockenbecher-Hockergrab Eichelweg',
    detail:
      'Ausgewiesenes Großfundensemble der jüngeren Glockenbecherzeit – dokumentiert Bodenschichten der heutigen Gemarkung.',
    attribution: 'Chronik 2012',
  },
  {
    year: '1987',
    title: '50-Jahre-Druckerzeugnis',
    detail:
      'Referenz-Broschüre mit Grußworten Bundesland bis Kreis sowie Verbandsüberblick DSB.',
    attribution: 'Festschrift 1987',
  },
  {
    year: '2012',
    title: '75 Jahre im Druck · Chronik zweite Auflage',
    detail:
      '83 Seiten, Layout gemäß Impressum (Heinrich Patheiger); Grußwort nennt Größenordnung um 2 400 Einwohner – PDF beim Stadtteilverein.',
    attribution: 'Chronik 2012 (Stadtteilverein)',
  },
];

export interface HistoryTimelineEntry {
  year: string;
  title: string;
  body: string;
  imageSrc?: string;
  imageAlt?: string;
}

export const historyTimeline: HistoryTimelineEntry[] = [
  {
    year: '14. Jh. bis 1526',
    title: 'Mittelalterliches Frauenweiler',
    body:
      'Erste spätere Frauenweiler-Nennung („Frawenwilre“ mit Marienbezug): kleine Höfergruppe mit Kapelle später Kirche samt Jahrmarktrecht bis zur auf Kurfürstliche Anordnung dokumentierten Auflösung 1526. Flurnamen wie „Frauenweiler Wiesen“ erinnern an die Lage am Gänsberg/Malschenberger Sträßel.',
  },
  {
    year: '1936 / 1937',
    title: 'Neuansiedlung im NS-Wohnungsprogramm',
    body:
      'Planungsakten 1934–37: Heimstättengesellschaft mit regionalen Industrieanteilen, Stammarbeiter-Fokus und Kleinsiedlungstypen mit Gartenland. Chronik 2012 vermerkt Medienankündigung März 1936 mit abweichendem Datum gegenüber dem später offiziell erinnerten Spatenstich 1. Februar 1937.',
  },
  {
    year: '1950er – 1960er',
    title: 'Nachkriegsaufbau entlang neuer Straßenzüge',
    body:
      'Festschriftlich sind frühe Verdichtungen u. a. Kleinfeldstraße und Frauenweilerweg genannt; katholischer Kirchenbau ab 1951 strukturiert religiöses Leben. 1962 Kindergarten, 1969/70 Grundschule – soziale Infrastruktur hält mit dem Zuzug Schritt.',
    imageSrc: '/geschichte/h50-002.jpg',
    imageAlt: 'Ausschnitt aus der Broschüre „50 Jahre Frauenweiler“ (Vereinsdokumentation)',
  },
  {
    year: '1987',
    title: '50 Jahre – Gesellschaft und Verband im Druck',
    body:
      'Jubiläumsbroschüre des Deutschen Siedlerbundes dokumentiert Generationen im Gemeinschaftsvorstand, bundesweite Verbandsleistungen und die Alltagskultur der Gärten – ein Fenster in die 1980er Jahre.',
    imageSrc: '/geschichte/h50-004.jpg',
    imageAlt: 'Collage / Seite aus der Jubiläumsbroschüre 1987',
  },
  {
    year: '1990er – 2012',
    title: 'Stadtteilverein & erweiterte Chronik',
    body:
      'Der Stadtteilverein bündelt nach Siedler-Arbeitsgemeinschaft die Vereine; die Chronik 2012 erweitert Archäologie, dokumentiert Gewerbe und beschreibt einen Einwohnerstand in der Größenordnung 2 400.',
    imageSrc: '/geschichte/h75-003.jpg',
    imageAlt: 'Fundabbildungen / Archäologie (Auszug aus der Chronik 2012)',
  },
];

export interface HistoryThemeBlock {
  title: string;
  lead: string;
  bullets: string[];
  imageSrc?: string;
  imageAlt?: string;
}

/** Sprungmarken für die Geschichtsseite (Anker ohne Client-JS) */
export const historyPageAnchors = [
  { id: 'chroniken', label: 'Chroniken (PDF)' },
  { id: 'editionen', label: '1987 vs. 2012' },
  { id: 'meilensteine', label: 'Meilensteine' },
  { id: 'zahlen', label: 'Zahlen & Fakten' },
  { id: 'zeitstrahl', label: 'Zeitstrahl' },
  { id: 'wissen', label: 'Wissenswertes' },
  { id: 'themen', label: 'Themen' },
  { id: 'weiter', label: 'Weiterlesen' },
] as const;

export interface HistoryFactCard {
  value: string;
  label: string;
  hint?: string;
}

/** Kurzprofile – sinngemäß aus Chroniken; externe Bestätigung nur wo explizit genannt */
export const historyFactCards: HistoryFactCard[] = [
  {
    value: '1333',
    label: 'Erste „Frawenwilre“-Nennung im engeren Quellenstrom',
    hint: 'Chroniken führen Urkundenfloskel und Ortsbezug nahe Wiesloch; Flurgeschichte dort breit ausgelegt.',
  },
  {
    value: '1937',
    label: 'Neugründung des heutigen Stadtteils',
    hint: 'Wikipedia bestätigt Neuansiedlung 1937 mit historischem Namensbezug zum wüsten Ort.',
  },
  {
    value: '1. Feb. 1937',
    label: 'Spatenstich im Erinnerungskorpus',
    hint: 'Chronik 2012 (OB-Grußwort) setzt Datum; Festschrift 1987 erläutert Vorgeschichte.',
  },
  {
    value: '~2.400',
    label: 'Einwohnerstand (Überblick 2012)',
    hint: 'Stadtteilverein in der Chronik 2012 – keine amtliche Fortschreibung durch die DorfApp.',
  },
  {
    value: '41 / 83',
    label: 'Seitenzahlen der PDFs',
    hint: '1987 Festschrift vs. 2012 Chronik (beide mit hoher Bilddichte).',
  },
  {
    value: '~100',
    label: 'Siedlergemeinschaft-Mitglieder (1987)',
    hint: 'Rundwert laut Festschrift im Deutschen Siedlerbund-Kapitel; aktuelle Mitgliederzahlen beim Verein erfragen.',
  },
];

export interface HistoryWorthKnowing {
  title: string;
  body: string;
}

export const historyWorthKnowing: HistoryWorthKnowing[] = [
  {
    title: 'Warum heißt es „Frauenweiler“?',
    body:
      'Die Chronik stellt den Namen mit Marienpatrozinium („Frawen“) und typischer Weiler-Endung dar; mit der politischen Löschung 1526 bleibt die Toponymie in Flurbezeichnungen erhalten.',
  },
  {
    title: 'Was unterscheidet Festschrift 1987 und Chronik 2012?',
    body:
      'Die Erstausgabe sitzt im Deutschen Siedlerbund mit Fokus auf Siedlerökonomie und Nachkriegsneuaufbau; die Folgeausgabe ist Stadt­teil­ver­eins­getragen, breiter bei Archäologie, Institutionen und Vereinslexikon.',
  },
  {
    title: 'Wie verifiziere ich Behauptungen außerhalb der PDFs?',
    body:
      'Für kommunale Rahmendaten (Stadtteilzugehörigkeit, Neugründung 1937) eignet sich die deutschsprachige Wikipedia zu Wiesloch; Originalfakten zu Personen und Festen bleiben in den Chroniken der Vereine.',
  },
  {
    title: 'Planen mit Karte & Flur',
    body:
      'OpenStreetMap zeigt Wege und ÖPNV; Flurnamen aus der Chronik helfen beim Spaziergang zur alten Siedlungsmulde jenseits der heutigen Bebauung.',
  },
  {
    title: 'Politische Einordnung der 1930er Jahre',
    body:
      'Die Festschrift warnt vor vereinfachendem Schuldzuschreiben, beschreibt aber NS-„Gleichschaltung“, Heimstättenpolitik und Reichsprogramme als strukturelle Bedingungen des Siedlungsbaus.',
  },
  {
    title: 'Kirchen & Seelsorge heute',
    body:
      'Wikipedia erwähnt St. Marien als Filialgemeinde unter Hl. Dreifaltigkeit Wiesloch – praktische Orientierung zusätzlich zu den Gemeindekapiteln in der Chronik 2012.',
  },
];

export interface HistoryFurtherLink {
  href: string;
  label: string;
  description: string;
  external?: boolean;
}

export const historyFurtherLinks: HistoryFurtherLink[] = [
  {
    href: '/',
    label: 'Zurück zur DorfApp',
    description: 'Termine, Hilfe-Angebote, Umfragen und News aus dem Stadtteil.',
    external: false,
  },
  {
    href: 'https://frauenweiler.org/',
    label: 'Stadtteilverein Frauenweiler',
    description: 'Kerwe, Projekte, Kontakt und Download der Chronik-PDFs.',
    external: true,
  },
  {
    href: 'https://www.wiesloch.de/',
    label: 'Stadt Wiesloch',
    description: 'Verwaltung, Bürgerservice, Stadtteilentwicklung.',
    external: true,
  },
  {
    href: 'https://de.wikipedia.org/wiki/Wiesloch#Geschichte',
    label: 'Wikipedia zu Wiesloch (Geschichte)',
    description:
      'Eckdaten etwa zur Neugründung Frauenweilers 1937 und zum mittelalterlichen Vorgängerort (1526 verwüstet) – keine Ersatzlektüre zur Vereinsgeschichte.',
    external: true,
  },
  {
    href: 'https://www.openstreetmap.org/?mlat=49.3080&mlon=8.7150&zoom=15',
    label: 'OpenStreetMap Stadtteilkarte',
    description: 'Vektordaten der Straßen zum Orientieren ohne kommerziellen Zwangsaccount.',
    external: true,
  },
  {
    href: 'https://nominatim.openstreetmap.org/ui/search.html?q=Frauenweiler%2C%20Wiesloch',
    label: 'OSM Suchtreffer „Frauenweiler, Wiesloch“',
    description: 'Hilft, Relationen/Wege je nach Zoom zu finden – nützlich vor Fußtouren.',
    external: true,
  },
];

export interface HistoryYearSpotlight {
  year: string;
  title: string;
  body: string;
}

export const historyYearSpotlights: HistoryYearSpotlight[] = [
  {
    year: '1526',
    title: 'Gemarkungsunion',
    body: 'Urkundlich fixiertes Ende des alten Weilers; Bewohner werden in Wiesloch umgesiedelt (Chronik/Festschrift; Wikipedia bestätigt Jahr).',
  },
  {
    year: '1936',
    title: 'Medien vor dem Spatenstich',
    body: 'Chronik 2012 zitiert Heidelberg NS-Propaganda-Ankündigung mit verfrühtem Datum – historische Quellenkritik im PDF-Kapitel erläutert.',
  },
  {
    year: '1951',
    title: 'Kirchliche Baumeilen',
    body: 'Spatenstich und spätere Grundsteinlegung dokumentieren konkreten Kirchenbau statt Kantinenprovisorium.',
  },
  {
    year: '1962',
    title: 'Kindergarten',
    body: 'Erster Kindergarten im wachsenden Stadtteil – sozialer Knotenpunkt vor Schulalter (Chronik).',
  },
  {
    year: '1969/70',
    title: 'Grundschule',
    body: 'Dauerhafte schulische Infrastruktur ergänzt das nachbarschaftliche Vereinsnetz – bis heute im Stadtbild.',
  },
  {
    year: '1973',
    title: 'Glockenbecher-Grabung',
    body: 'Herausgehobenes archäologisches Einzelfundensemble am Eichelweg in der Chronik 2012 mit Abbildungen.',
  },
  {
    year: '1987',
    title: '50 Jahre im Druck',
    body: 'Festschrift feiert Siedlerbundbezug, listet Vorstände und erzählt technische Details der Gründungsphase.',
  },
  {
    year: '2012',
    title: '75 Jahre Chronik',
    body: 'Stadtteilverein publiziert erweiterte Auflage mit Archäologie-Update und breitem Vereinskatalog.',
  },
];

export const historyThemeBlocks: HistoryThemeBlock[] = [
  {
    title: 'Urgeschichte unter unseren Füßen',
    lead:
      'Chronik und Festschrift binden Sandgruben, Bahndurchstich und Glockenbecher-Hockergräber an die heutige Gemarkung; Wikipedia ordnet Wiesloch in die früh besiedelte Rhein-Neckar-Region ein.',
    bullets: [
      'Bandkeramik und Glockenbecherfunde im Umfeld von Sandabbau und Industriegelände beschrieben.',
      'Bronze- und Urnenfelderkultur an Tonstellen und Gräberfeldern – mit Hinweis auf spätere Abbauverluste.',
      'Römerstraßen und Münzfunde erläutern Verkehrsachsen; alamannische Bestattungen komplettieren die Langzeitfolie.',
      'Chronik 2012 betont Notwendigkeit behutsamer Boden­nutzung angesichts noch erwartbarer Funde.',
    ],
    imageSrc: '/geschichte/h75-004.jpg',
    imageAlt: 'Dokumentation bronzezeitlicher Funde (Chronik 2012)',
  },
  {
    title: 'Vom Siedlerbund zum Stadtteilverein',
    lead:
      'Selbsthilfe der „kleinen Heime“ prägte den Nachkrieg; aus lockeren Arbeitsgemeinschaften wurde der Stadtteilverein als modernes Dach ehrenamtlicher Vielfalt.',
    bullets: [
      'Siedlerbund-Kapitel erklärt Beratungsleistungen, Versicherungen und Gartenfachberatung der 1980er.',
      'Stadtteilverein-Chronik beschreibt Übergang zu breitem Vereinskanon inkl. Kultur- und Sportangeboten.',
      'Beide PDFs sind die maßgeblichen Quellen für Bildnachweise und Zitate – die DorfApp verweist nur strukturiert.',
    ],
    imageSrc: '/geschichte/h50-005.jpg',
    imageAlt: 'Vereins- und Chronikseite (Auszug Broschüre 1987)',
  },
  {
    title: 'Stadtteil heute: Wohnen, Arbeiten, Gemeinschaft',
    lead:
      'Gewerbegebiet, Schule, Kirchen, Feuerwehr und Wählergemeinschaft bilden neben den Vereinen die „harten“ Strukturen; OpenStreetMap visualisiert Erreichbarkeit.',
    bullets: [
      'Chronik-Kapitel „Gewerbegebiet“ ordnet wirtschaftliche Nutzung südlich der Bahn ein.',
      'Feuerwehr, WGF und Kindertagesstätte zeigen Mischung aus öffentlich-rechtlichen und Bürgerinitiativen.',
      'Wikipedia nennt FC Frauenweiler und den Spielmanns- und Fanfarenzug als Beispiele lebendiger Musikkultur.',
    ],
    imageSrc: '/geschichte/h75-005.jpg',
    imageAlt: 'Seite aus der Chronik 2012 (Stadtteil / Vereinsleben)',
  },
];
