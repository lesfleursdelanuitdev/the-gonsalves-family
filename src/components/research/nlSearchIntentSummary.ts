import { formatGedcomFullNameForDisplay, formatGender } from "@/lib/individual-mapper";

// Plain-language, user-facing summary of what a search did — shown instead of the
// model's internal `rationale`, which references intent identifiers (e.g. "top_surnames")
// and debug strings ("keyword search_individuals compound (surname+birth_place)") that
// mean nothing to a reader.

type Bag = Record<string, unknown> | null | undefined;

function s(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function firstNonEmpty(...vals: string[]): string {
  for (const v of vals) if (v) return v;
  return "";
}

/** Last person's display name in a path array (used for relationship endpoints). */
function lastFullName(v: unknown): string {
  if (!Array.isArray(v)) return "";
  for (let i = v.length - 1; i >= 0; i--) {
    const el = v[i] as Record<string, unknown> | null;
    if (el && typeof el === "object" && typeof el.full_name === "string" && el.full_name.trim()) {
      return formatGedcomFullNameForDisplay(el.full_name);
    }
  }
  return "";
}

const ORDINALS: Record<string, string> = {
  first: "first",
  second: "second",
  third: "third",
  fourth: "fourth",
  fifth: "fifth",
};

/** e.g. "before age 50", "at age 102". */
function ageAtDeathPhrase(op: string, age: number | null): string {
  if (age == null) return "by their age at death";
  const a = `age ${age}`;
  switch (op) {
    case "lt":
      return `before ${a}`;
    case "lte":
      return `by ${a}`;
    case "gt":
      return `after ${a}`;
    case "gte":
      return `at or after ${a}`;
    case "eq":
      return `at ${a}`;
    default:
      return `around ${a}`;
  }
}

/** Returns a friendly sentence, or "" when the intent is unknown (caller shows nothing). */
export function nlSearchIntentSummary(intent: string, result: Bag, params: Bag): string {
  const r = (result ?? {}) as Record<string, unknown>;
  const p = (params ?? {}) as Record<string, unknown>;

  const place = firstNonEmpty(s(r.place), s(r.locality), s(p.place), s(p.locality));
  const term = firstNonEmpty(s(r.name), s(p.name), s(p.surname), s(p.given_name), s(p.q), s(p.query));
  const birthPlace = s(p.birth_place);
  const decade = num(r.decade) ?? num(p.decade);
  const sexLabel = formatGender(firstNonEmpty(s(r.sex), s(p.sex)), null);
  const matching = term ? ` matching “${term}”` : "";

  switch (intent) {
    case "top_given_names":
      return "Showing the most common given names in the family tree.";
    case "top_surnames":
      return "Showing the most common surnames in the family tree.";
    case "given_name_lookup":
      return term ? `Showing given names matching “${term}”.` : "Showing matching given names.";
    case "surname_lookup":
      return term ? `Showing surnames matching “${term}”.` : "Showing matching surnames.";
    case "names_by_decade":
      return "Showing the most common given names, grouped by the decade people were born.";
    case "names_by_sex":
      return sexLabel
        ? `Showing the most common given names for ${sexLabel.toLowerCase()} individuals.`
        : "Showing the most common given names, split by sex.";
    case "surname_soundex_groups":
      return "Grouping surnames that sound alike, so spelling variants stay together.";
    case "tree_summary":
      return "Showing an overview of the whole family tree.";

    case "individuals_by_locality": {
      const facet = firstNonEmpty(s(r.facet), s(p.facet));
      const where = place || "that place";
      if (facet === "birth") return `Showing people born in ${where}.`;
      if (facet === "death") return `Showing people who died in ${where}.`;
      if (facet === "burial") return `Showing people buried in ${where}.`;
      if (facet === "both") return `Showing people born or who died in ${where}.`;
      return `Showing people connected to ${where}.`;
    }
    case "marriages_by_place":
      return place ? `Showing marriages that took place in ${place}.` : "Showing marriages, grouped by where they happened.";
    case "individual_events_by_place":
      return place ? `Showing life events that took place in ${place}.` : "Showing life events, grouped by where they happened.";

    case "individuals_age_at_death": {
      const op = firstNonEmpty(s(r.operator), s(p.op), s(p.operator));
      const age = num(r.age) ?? num(p.age);
      return `Showing people who died ${ageAtDeathPhrase(op, age)}.`;
    }
    case "individuals_lifespan_years": {
      const min = num(r.min_years) ?? num(p.min_years);
      const max = num(r.max_years) ?? num(p.max_years);
      if (min != null && max != null) return `Showing people who lived between ${min} and ${max} years.`;
      if (min != null) return `Showing people who lived at least ${min} years.`;
      if (max != null) return `Showing people who lived at most ${max} years.`;
      return "Showing people by how many years they lived.";
    }

    case "individual_ancestors": {
      const gens = num(r.max_generations) ?? num(p.max_generations);
      return gens != null
        ? `Showing the selected person’s ancestors, up to ${gens} generations back.`
        : "Showing the selected person’s ancestors.";
    }
    case "individual_descendants": {
      const gens = num(r.max_generations) ?? num(p.max_generations);
      return gens != null
        ? `Showing the selected person’s descendants, down to ${gens} generations.`
        : "Showing the selected person’s descendants.";
    }
    case "individual_cousins": {
      const degree = firstNonEmpty(s(r.degree), s(p.degree));
      const label = ORDINALS[degree.toLowerCase()] ?? degree;
      return label ? `Showing the selected person’s ${label} cousins.` : "Showing the selected person’s cousins.";
    }
    case "relationship_between": {
      const a = lastFullName(r.path_lca_to_source);
      const b = lastFullName(r.path_lca_to_target);
      return a && b ? `Showing how ${a} and ${b} are related.` : "Showing how these two people are related.";
    }

    case "born_in_place":
      return place ? `Showing people born in ${place}.` : "Showing people born in that place.";
    case "died_in_place":
      return place ? `Showing people who died in ${place}.` : "Showing people who died in that place.";
    case "born_in_decade":
      return decade != null ? `Showing people born in the ${decade}s.` : "Showing people born in that decade.";

    case "lifespan_stats":
      return "Showing how long people in the tree tended to live.";
    case "longest_lived":
      return "Showing the longest-lived people in the tree.";
    case "largest_families":
      return "Showing the families with the most children.";
    case "cause_of_death":
      return "Showing the most common recorded causes of death.";
    case "migration_places":
      return "Showing the most common birth countries — where families came from.";
    case "surname_by_place":
      return place ? `Showing the most common surnames in ${place}.` : "Showing the most common surnames, grouped by place.";
    case "occupation_stats":
      return "Showing the most common occupations in the tree.";

    case "search_individuals":
      if (term && birthPlace) return `Showing individuals matching “${term}”, born in ${birthPlace}.`;
      if (!term && birthPlace) return `Showing individuals born in ${birthPlace}.`;
      return `Showing individuals${matching}.`;
    case "search_families":
      return `Showing families${matching}.`;
    case "search_events":
      return `Showing life events${matching}.`;
    case "search_notes":
      return `Showing research notes${matching}.`;
    case "search_sources":
      return `Showing sources${matching}.`;
    case "search_media":
      return `Showing photos and documents${matching}.`;

    case "unsupported":
      return "I couldn’t match this to a known question — try rephrasing it.";
    default:
      return "";
  }
}
