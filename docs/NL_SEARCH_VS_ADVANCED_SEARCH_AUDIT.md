# AI/NL Analytics Search vs. Advanced Search — Capability Audit

**Date:** 2026-06-03
**Status:** Audit (no code changes) — feeds a prioritized remediation plan
**Question:** Can the AI/NL analytics search handle all the same queries the Advanced Search can?

## Verdict

**No.** The NL search handles the common query shapes well — and even adds a few filters Advanced Search lacks (occupation, nationality, cause-of-death, plus pure analytics like "top surnames" / lifespan stats) — but there are **substantial gaps**, concentrated in:

1. **Numeric range expressiveness** (arbitrary year / count ranges vs. decade buckets),
2. **Structural / relationship filters** (children, unions, adoption, multiple parent families),
3. **Event richness** (multi-type, date operators, attachment flags, person link),
4. **Media linking** (type multi-select, linked entity, tag, album, non-GEDCOM sources),
5. **Cross-category "search everything"**.

The two systems are **asymmetric**, not subset/superset.

### The binding constraint: the intent catalog

The NL ceiling is the **intent catalog**, not the SQL. The router system prompt is built from the catalog and enforces:

> "'params' MUST only contain fields documented for that intent."

— `ligneous-python-api/app/services/nl_search.py` (`_build_system_prompt`, ~L101–160)

So **any filter not listed in the catalog is unreachable**, even if the handler SQL could express it. Catalog: `ligneous-python-api/app/analytics/intents/catalog.py`.

---

## What the NL search already does well

`search_individuals` supports **compound AND** across its documented params, so multi-field queries like _"males named Silva born in the 1890s in Guyana"_ work today.

Documented params (`catalog.py:184–200`, handler `app/analytics/intents/search/handlers.py:15–62`):

`given_name`, `surname`, `birth_place`, `death_place`, `birth_decade`, `death_decade`, `sex`, `is_living`, `occupation`, `nationality`, `limit`.

NL-only strengths (Advanced Search has no equivalent):
- **Occupation** and **nationality** filters on individuals.
- **Cause** filter on events.
- **Analytics intents** (top surnames/given names, lifespan stats, causes of death, migration places, largest families, relationship-between, ancestors/descendants/cousins, etc.).

---

## Advanced Search — capability inventory

Single page (`src/components/search/AdvancedSearchPage.tsx`, route `/search`) with four modes, each its own API route under `src/app/api/tree/advanced-search/`. **All filters within a mode are AND-ed.**

### 1. People / Families / Names — `advanced-search/route.ts`

**Individuals**
- Name: full / surname / given — match type **contains | exact | soundex**
- Sex: M / F / unknown
- Living: yes / no
- **Birth year min/max**, **Death year min/max** (arbitrary ranges)
- Birth place / Death place — fuzzy across place hierarchy
- Has children: yes / no; **# children min/max**
- Multiple unions: yes / no; **# unions min/max**
- Multiple parent families: yes / no
- Has adopted parents: yes / no; Has adopted children: yes / no

**Families**
- Partner name (husband **and** wife): full / surname / given — contains | exact | soundex
- Divorced: yes / no
- **Union year min/max**
- Union place — fuzzy hierarchy
- Family has children: yes / no; **# children min/max**

### 2. Events — `advanced-search/events/route.ts`
- **Linked to person** (picker) + scope: individual / family / both
- **Event type — multi-select** (BIRT, DEAT, BURI, CHR, BAPM, MARR, DIV, OCCU, RESI, EMIG, IMMI, CENS, NATU, GRAD, EVEN)
- **Date** — qualifier **exact / about / before / after / between** with year / month / day
- Place — fuzzy hierarchy
- Has notes / Has media / Has sources: yes / no each

### 3. Media — `advanced-search/media/route.ts`
- Title — substring
- **Media type — multi-select** (image, document, audio, video, story, recipe)
- **Linked to** person / family
- **Tag** (by id), **Album** (by id)
- Sources: GEDCOM + **site + user + story** media

### 4. General (multi-category keyword) — `advanced-search/general/route.ts`
- Keyword(s) with match type contains | exact | soundex and **AND / OR** logic
- **Categories (multi-select, OR-ed):** People, Families, Events, Surnames, Given names, Places, Notes, Media
- Returns top results **across all selected categories at once**

---

## NL Search — documented params (the reachable surface)

From `catalog.py`:

| Intent | Documented params |
|---|---|
| `search_individuals` | given_name, surname, birth_place, death_place, birth_decade, death_decade, sex, is_living, occupation, nationality, limit |
| `search_families` | partner_surname, marriage_place, marriage_decade, min_children, is_divorced, limit |
| `search_events` | event_type (single substring), place, decade, cause, limit |
| `search_notes` | text, is_top_level, limit |
| `search_sources` | title, author, text, limit |
| `search_media` | title, description, form (substring), limit |

(Plus 27 analytics/relationship intents not relevant to the Advanced-Search comparison.)

---

## Gap matrix (Advanced → NL)

### Individuals
| Advanced capability | NL today | Gap |
|---|---|---|
| Name exact / soundex | substring only | ❌ |
| Birth/death **year range** | **decade** bucket only | ❌ |
| Has children / # children (min/max) | — | ❌ |
| Multiple unions / # unions (min/max) | — | ❌ |
| Multiple parent families | — | ❌ |
| Adopted parents / children | — | ❌ |
| sex, living, birth/death place, occupation, nationality | yes | ✅ |

### Families
| Advanced capability | NL today | Gap |
|---|---|---|
| Partner **given name** | partner_surname only | ❌ |
| Partner exact / soundex | substring only | ❌ |
| Union **year range** | marriage_decade bucket | ❌ |
| # children **max** / **childless** | min_children only | ⚠️ partial |
| divorced, marriage place | yes | ✅ |

### Events
| Advanced capability | NL today | Gap |
|---|---|---|
| Link to specific **person** + scope | — | ❌ |
| **Multiple** event types (OR) | single substring | ❌ |
| Date operators (before/after/between/about, m/d) | `decade` window only | ❌ |
| Has notes / media / sources | — | ❌ |
| place | yes | ✅ |
| cause | yes | ✅ (NL-only) |

### Media
| Advanced capability | NL today | Gap |
|---|---|---|
| Media **type multi-select** | `form` substring | ❌ |
| Linked to person / family | — | ❌ |
| Tag / Album | — | ❌ |
| Non-GEDCOM sources (site/user/story) | gedcom_media_v2 only | ❌ |
| title / description | yes | ✅ |

### General
| Advanced capability | NL today | Gap |
|---|---|---|
| Search **across categories at once** | routes to ONE intent | ❌ |
| Explicit keyword AND / OR | — | ❌ |

---

## Structural themes behind the gaps

1. **Range expressiveness.** Advanced Search is built on `min/max` ranges (years, counts). NL collapses these to **decade buckets** (`birth_decade`, `marriage_decade`) and single `min_children`. This is the most pervasive gap and touches the most real queries.
2. **Whole missing filter families.** Structural/relationship predicates (children, unions, adoption, multiple parents), event attachments + date operators + multi-type, and media linking (entity/tag/album/source) exist in neither the catalog nor the handlers.

---

## Reliability caveat (separate from capability)

Even for **documented** params, NL depends on the LLM populating them. The **keyword fallback router** (`nl_search.py`, `_KEYWORD_RULES_SPEC_PREPEND` and following, ~L163+) extracts far less — mostly intent + `limit`. Advanced Search is deterministic; NL is probabilistic. So "handle the same query" has two dimensions:
- **Capability** — the catalog/handler gaps above.
- **Consistency** — whether the parser reliably fills the params it *is* allowed to emit.

---

## Remediation plan (prioritized)

Each gap is a **three-part add**: (a) **catalog** param so the LLM may emit it → (b) **handler SQL** so it filters → (c) optionally a **keyword rule** for the LLM-unavailable fallback. Handlers already build dynamic `WHERE` clause lists, so most additions are additive and low-risk.

1. **Year ranges** — add `min_birth_year/max_birth_year` (and death, and family `min/max_marriage_year`) to the individuals/families catalog + handlers. _Highest impact._
2. **Structural individual filters** — `has_children`, `min/max_children`, `min/max_unions`, `multiple_unions`, `multiple_parent_families`, `adopted_parents`, `adopted_children`.
3. **Event richness** — `event_types` (list / IN), date `operator` + `year/month/day`, `has_notes/has_media/has_sources`, `person` link + scope.
4. **Name match type** — `match: contains | exact | soundex` on individuals / families / surnames.
5. **Media linking** — `media_types` (list), `linked_person/linked_family`, `tag`, `album`; broaden beyond `gedcom_media_v2` to site/user/story media.
6. **Cross-category** — a `search_all` intent (or have the UI fan out) to mirror General search.

Keep decade params as convenience aliases alongside the new year-range params (back-compat with existing prompts/examples).

---

## File reference

**NL search (backend — `ligneous-python-api`)**
- Router prompt: `app/services/nl_search.py` (`_build_system_prompt`, keyword rules)
- Intent catalog (param contract): `app/analytics/intents/catalog.py`
- Registry (intent → handler): `app/analytics/intents/registry.py`
- Handlers: `app/analytics/intents/{search,places,demographics,names,relationships}/handlers.py`
- Row cap: `app/config.py` (`NL_MAX_ROWS`)

**NL search (frontend — `the-gonsalves-family`)**
- Proxy: `src/app/api/research/[...path]/route.ts`
- Playground / result: `src/components/research/NlSearchPlayground.tsx`, `NlSearchResult.tsx`
- Friendly summaries: `src/components/research/nlSearchIntentSummary.ts`
- Display formatting: `lib/analytics-format.ts`

**Advanced Search (frontend — `the-gonsalves-family`)**
- UI (all 4 modes): `src/components/search/AdvancedSearchPage.tsx`
- API: `src/app/api/tree/advanced-search/route.ts` (people/families/names), `…/events/route.ts`, `…/media/route.ts`, `…/general/route.ts` (+ `general/sql-helpers.ts`)
