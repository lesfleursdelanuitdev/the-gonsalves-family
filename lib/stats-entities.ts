/**
 * Configuration for each Statistics Notebook entity page.
 * Used by the landing page, routing, TOC sidebar, and data fetching.
 */

export type StatsTocItem = {
  id: string;
  label: string;    // short label shown in TOC
  question: string; // full research question (matches chart question)
};

export type StatsEntityDef = {
  slug: string;
  question: string;
  name: string;
  description: string;
  endpoints: string[];
  toc: StatsTocItem[];
};

export const STATS_ENTITIES: StatsEntityDef[] = [
  {
    slug: "names",
    question: "What names run in the family?",
    name: "Names",
    description: "The most popular first names and surnames, how common they are, and how their frequency compares across the tree.",
    endpoints: ["given-names?limit=30", "surnames?limit=30"],
    toc: [
      { id: "chart-names-top-given",    label: "Most common first names",  question: "Which first names appear most often?" },
      { id: "chart-names-given-dist",   label: "Name frequency spread",    question: "Are names unique, or do many people share them?" },
      { id: "chart-names-top-surnames", label: "Most common surnames",      question: "Which family names are most common?" },
      { id: "chart-names-surname-dist", label: "Surname frequency spread",  question: "How concentrated or spread are the surnames?" },
    ],
  },
  {
    slug: "individuals",
    question: "Who is in the tree?",
    name: "Individuals",
    description: "Counts, sex distribution, lifespan statistics, birth and death trends by decade, and how people connect to families.",
    endpoints: ["individuals?top_n=10"],
    toc: [
      { id: "chart-ind-longest",         label: "Longest-lived members",   question: "Who are the longest-lived family members?" },
      { id: "chart-ind-youngest",        label: "Youngest at death",       question: "Which family members died youngest?" },
      { id: "chart-ind-sex",             label: "Sex & living status",     question: "How are individuals split by sex and living status?" },
      { id: "chart-ind-birth-decade",    label: "Births by decade",        question: "Which decades saw the most births?" },
      { id: "chart-ind-death-decade",    label: "Deaths by decade",        question: "Which decades saw the most deaths?" },
      { id: "chart-ind-age-death",       label: "Age at death",            question: "What age did people typically die?" },
      { id: "chart-ind-birth-countries", label: "Birth countries",         question: "Where were most family members born?" },
    ],
  },
  {
    slug: "families",
    question: "How are families structured?",
    name: "Families",
    description: "Children per household, marriage patterns, divorce rates, and which places appear most on marriage records.",
    endpoints: ["families"],
    toc: [
      { id: "chart-fam-partner",          label: "Partners recorded",    question: "How often are both partners recorded on a family?" },
      { id: "chart-fam-marriage-decade",  label: "Marriage decades",     question: "Which decades had the most marriages?" },
      { id: "chart-fam-marriage-places",  label: "Marriage places",      question: "Where were most marriages recorded?" },
    ],
  },
  {
    slug: "events",
    question: "What life events are recorded?",
    name: "Events",
    description: "Every birth, death, marriage, burial, immigration, and other life event — how many have dates and places, and which decades they cluster in.",
    endpoints: ["events"],
    toc: [
      { id: "chart-ev-types",     label: "Event types",        question: "Which types of life events appear most often?" },
      { id: "chart-ev-year",      label: "Events over time",   question: "Which periods have the most recorded events?" },
      { id: "chart-ev-countries", label: "Event locations",    question: "In which countries did events take place?" },
      { id: "chart-ev-origin",    label: "Standard vs custom", question: "Are events from standard or custom record types?" },
    ],
  },
  {
    slug: "places",
    question: "Where did the family live?",
    name: "Places",
    description: "Every location in the tree — the countries, regions, and parishes where the family was born, married, and died.",
    endpoints: ["places"],
    toc: [
      { id: "chart-pl-ref-pie",   label: "How places are used",        question: "Which record types link to places most often?" },
      { id: "chart-pl-top",       label: "Most-referenced places",     question: "Which specific places appear across the most records?" },
      { id: "chart-pl-countries", label: "Countries",                  question: "Which countries appear most in the tree?" },
      { id: "chart-pl-states",    label: "Regions & states",           question: "Which regions or states appear most?" },
    ],
  },
  {
    slug: "dates",
    question: "What time periods are covered?",
    name: "Dates",
    description: "How complete date coverage is, the spread across centuries, precision levels, and which calendar systems appear.",
    endpoints: ["dates"],
    toc: [
      { id: "chart-dt-ref-pie",    label: "Which records have dates", question: "Which types of records have the most dated entries?" },
      { id: "chart-dt-top",        label: "Most-referenced dates",    question: "Which specific dates appear across the most records?" },
      { id: "chart-dt-qualifiers", label: "Date precision",           question: "How precise and qualified are the recorded dates?" },
      { id: "chart-dt-calendars",  label: "Calendar systems",         question: "Which calendar systems appear in the records?" },
      { id: "chart-dt-decades",    label: "Dates across centuries",   question: "How are dates distributed across the centuries?" },
    ],
  },
  {
    slug: "media",
    question: "What documents and photos exist?",
    name: "Media",
    description: "Photos, certificates, scans, and other media objects — how many there are, what types, and which records they're linked to.",
    endpoints: ["media?top_n=10"],
    toc: [
      { id: "chart-med-tags",        label: "Tags on media",           question: "Which tags are used most on photos and documents?" },
      { id: "chart-med-places",      label: "Locations in media",      question: "Which locations appear most across media items?" },
      { id: "chart-med-dates",       label: "Dates in media",          question: "Which dates appear most across media items?" },
      { id: "chart-med-individuals", label: "People with most media",  question: "Which people have the most photos and documents?" },
      { id: "chart-med-families",    label: "Families with most media",question: "Which families are best documented with media?" },
      { id: "chart-med-events",      label: "Events with most media",  question: "Which events are best documented with media?" },
    ],
  },
  {
    slug: "open-questions",
    question: "What is still unknown?",
    name: "Open Questions",
    description: "Outstanding research questions, unresolved gaps, and which people, families, and events have the most unknowns.",
    endpoints: ["open-questions?top_n=10"],
    toc: [
      { id: "chart-oq-resolved",    label: "Resolved vs open",           question: "How many research questions have been resolved?" },
      { id: "chart-oq-individuals", label: "People with most questions", question: "Which people have the most open research questions?" },
      { id: "chart-oq-media",       label: "Media with questions",       question: "Which media items still need research?" },
      { id: "chart-oq-families",    label: "Families with questions",    question: "Which families need the most further research?" },
      { id: "chart-oq-events",      label: "Events with questions",      question: "Which events have the most outstanding questions?" },
    ],
  },
  {
    slug: "notes",
    question: "What are the research notes?",
    name: "Notes",
    description: "The collection of research notes in the tree — how many, how long, and which people, events, and sources they're attached to.",
    endpoints: ["notes?top_n=10"],
    toc: [
      { id: "chart-notes-type",        label: "Where notes live",         question: "Which record types have the most research notes?" },
      { id: "chart-notes-top",         label: "Most-referenced notes",    question: "Which notes are the most widely referenced?" },
      { id: "chart-notes-individuals", label: "People with most notes",   question: "Who has the most research notes attached?" },
      { id: "chart-notes-families",    label: "Families with most notes", question: "Which families are most annotated with notes?" },
      { id: "chart-notes-events",      label: "Events with most notes",   question: "Which events have the most research notes?" },
      { id: "chart-notes-sources",     label: "Sources with most notes",  question: "Which sources have the most research notes?" },
    ],
  },
];

export function getEntityBySlug(slug: string): StatsEntityDef | undefined {
  return STATS_ENTITIES.find((e) => e.slug === slug);
}

export const VALID_ENTITY_SLUGS = STATS_ENTITIES.map((e) => e.slug);
