/** Curated NL search examples for the playground drawer (shown even when the API suggestion list differs). */

export type NlSearchSampleQuery = {
  /** Short grouping label for the list */
  category: string;
  query: string;
};

export const NL_SEARCH_SAMPLE_QUERIES: readonly NlSearchSampleQuery[] = [
  { category: "Overview & names", query: "How big is this tree? Give me a high-level summary." },
  { category: "Overview & names", query: "What are the most common first names?" },
  { category: "Overview & names", query: "What are the most common surnames?" },
  { category: "Overview & names", query: "What are the top male given names?" },
  { category: "Overview & names", query: "What are the top female given names?" },
  { category: "Overview & names", query: "How have popular first names changed by birth decade?" },
  { category: "Overview & names", query: "Show phonetically similar surname clusters (Soundex)." },
  { category: "Places & migration", query: "Who was born in Guyana?" },
  { category: "Places & migration", query: "Who died in Canada?" },
  { category: "Places & migration", query: "List marriages that took place in Georgetown." },
  { category: "Places & migration", query: "What are the most common birth countries in the tree?" },
  { category: "Places & migration", query: "Which surnames are most common among people born in Guyana?" },
  { category: "Lifespan & vital stats", query: "What is the average, minimum, and maximum age at death?" },
  { category: "Lifespan & vital stats", query: "Who lived the longest?" },
  { category: "Lifespan & vital stats", query: "Who died before age 70?" },
  { category: "Lifespan & vital stats", query: "Show people whose lifespan was between 80 and 90 years." },
  { category: "Lifespan & vital stats", query: "What are the most common recorded causes of death?" },
  { category: "Work & families", query: "What are the most common occupations recorded?" },
  { category: "Work & families", query: "Which families have the most children?" },
  { category: "Relatives & paths", query: "How are Anne Smith and John Brown related?" },
];
