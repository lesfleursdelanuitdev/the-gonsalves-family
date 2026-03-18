# PersonDetailOverlay refactor plan

Refactor the single-file `PersonDetailOverlay.tsx` (~706 lines) into a `PersonDetailOverlay/` folder with split API endpoints, one hook per section, presentational section components, and a **modern profile layout** with a dedicated profile header.

---

## 1. Profile header (modern profile look)

The overlay should read as a **modern profile**. The top of the overlay is a **profile header** that sets the tone and anchors the rest of the content.

**Profile header contents:**

- **Avatar** – Photo of the person when available; otherwise a **placeholder** (e.g. initials from name, or a generic person icon). Avatar is prominent and clearly part of the header (e.g. large circle or rounded square).
- **Person’s name** – Display name (same styling as today: first/last split, last name italic + underline if desired), sized and positioned as the primary heading for the profile.
- **Layout** – Header can be a horizontal strip (avatar left, name right) or a centered block (avatar above name). Design should feel like a typical “profile” or “card” header (e.g. social profile, contact card).

**Data and behavior:**

- Name comes from `useBasicPersonDetails` (or fallback from `person.name` when loading).
- Avatar: if the basic (or future) API ever returns a photo/avatar URL, use it; otherwise show a **placeholder** (initials derived from name, or a Lucide/icon placeholder). No backend change required for placeholder-only.
- Optional: basic endpoint could later add an optional `avatarUrl` or `photoUrl` field; ProfileHeader would then accept `avatarUrl?: string | null` and render image vs placeholder.

**Implementation:**

- New presentational component **`ProfileHeader`** (or `ProfileHeader.tsx` in the overlay folder). Props: `name` (or `displayName`), optional `avatarUrl`, optional `loading`. Renders avatar (or placeholder) + name; styling lives in `styles.ts` or inline as needed.
- Main overlay (`index.tsx`) renders the profile header first (inside the dialog, after backdrop), then the close button(s), then scrollable content (Birth, Death, Families, etc.). Header stays visible or scrolls with content depending on desired UX (fixed vs in-flow).

---

## 2. Backend: split endpoints

Add new API routes under `/api/tree/individuals/[xref]/detail/...`. Each returns only the data needed for that section. The existing `GET /api/tree/individuals/[xref]/detail` can remain for backward compatibility or be deprecated later; the overlay will use only the new endpoints.

| Endpoint | Purpose | Returns (conceptually) |
|----------|---------|------------------------|
| **GET …/detail/basic** | Name, birth, death (header + Birth/Death sections) | `{ name, xref, uuid, birth: { date, place, event? }, death: { date, place, event? } }` |
| **GET …/detail/families-as-child** | Families of origin | `{ familiesOfOrigin: [...] }` (same shape as current) |
| **GET …/detail/families-as-spouse** | Families as spouse | `{ familiesAsSpouse: [...] }` (same shape as current) |
| **GET …/detail/notes** | Notes | `{ notes: [...] }` |
| **GET …/detail/sources** | Sources | `{ sources: [...] }` |
| **GET …/detail/events** | Events (individual + family + child birth) | `{ events: [...] }` (same `DetailEvent[]` shape) |

- **URL shape:** Nested under current detail (e.g. `/api/tree/individuals/[xref]/detail/basic`) so “detail” stays the feature and more sub-routes can be added later.
- **Implementation:** Each route runs only the DB queries needed for that slice. Reuse patterns from the current detail route; extract shared helpers (e.g. resolve person by xref) to avoid duplication. Keep API as thin shell over core logic.
- **Errors:** Same as current detail (e.g. 404 when person not found, 500 on server error). Each endpoint is independent.

---

## 3. Hooks: one fetch per hook

Each hook takes **xref** and calls **its** endpoint. No shared “full detail” fetch; no context for the combined response.

| Hook | Endpoint | Returns |
|------|----------|--------|
| **useBasicPersonDetails(xref)** | GET …/detail/basic | `{ status, data: { name, xref, uuid, birth, death } \| null, error }` |
| **useFamiliesAsChild(xref)** | GET …/detail/families-as-child | `{ status, data: familiesOfOrigin[], error }` |
| **useFamiliesAsSpouse(xref)** | GET …/detail/families-as-spouse | `{ status, data: familiesAsSpouse[], error }` |
| **useNotes(xref)** | GET …/detail/notes | `{ status, data: notes[], error }` |
| **useSources(xref)** | GET …/detail/sources | `{ status, data: sources[], error }` |
| **useGedcomEvents(xref)** | GET …/detail/events | `{ status, data: events[], error }` |

- **Loading/error:** Each hook owns its own `status` and `error`. The overlay can show a single loading state until a chosen subset of hooks is settled (e.g. at least basic), or per-section loading/error.
- **Caching:** If you add SWR/React Query later, each hook can be keyed by `[xref, 'basic']`, `[xref, 'events']`, etc.
- **No provider** for overlay data: the overlay (or each section) calls the hook it needs with `person.xref`.

---

## 4. Overlay and sections

- **Main overlay** (`PersonDetailOverlay/index.tsx`):
  - Receives `person` (at least `person.xref`).
  - Calls the six hooks with `person.xref`.
  - Renders **profile header** first (avatar or placeholder + name from `useBasicPersonDetails`; fallback to `person.name` when loading).
  - Renders close button(s) (top and/or bottom as today).
  - Renders scrollable content: Birth, Death, Families as child, Families as spouse, Sources, Events, Notes — each section receives `data` (and optional `status`/`error`) from the corresponding hook.
  - Owns **tab state** (`familyOriginIndex`, `familySpouseIndex`) and passes it into `FamiliesAsChildSection` and `FamiliesAsSpouseSection`.

- **Sections:** Presentational only. They receive `data` (and optional `status`/`error`) and tab index/setters where needed. They do **not** call the API.

- **Loading/error strategy:** Decide and document (e.g. “show overlay loading while `useBasicPersonDetails` is loading”; show section-level loading/error for others, or “loading until all hooks resolved”).

---

## 5. File layout

### Backend (new routes)

- `.../api/tree/individuals/[xref]/detail/basic/route.ts`
- `.../api/tree/individuals/[xref]/detail/families-as-child/route.ts`
- `.../api/tree/individuals/[xref]/detail/families-as-spouse/route.ts`
- `.../api/tree/individuals/[xref]/detail/notes/route.ts`
- `.../api/tree/individuals/[xref]/detail/sources/route.ts`
- `.../api/tree/individuals/[xref]/detail/events/route.ts`

Shared logic (e.g. resolve person by xref) in helpers used by these routes (and optionally by the existing full detail route).

### Frontend – folder `PersonDetailOverlay/`

**Hooks**

- `hooks/useBasicPersonDetails.ts`
- `hooks/useFamiliesAsChild.ts`
- `hooks/useFamiliesAsSpouse.ts`
- `hooks/useNotes.ts`
- `hooks/useSources.ts`
- `hooks/useGedcomEvents.ts`
- Optional: `hooks/index.ts` (re-export all)

**Core**

- `types.ts` – all types; export `PersonDetailOverlayPerson`, `PersonDetailOverlayProps` and section payload types
- `styles.ts` – overlay, section, family grid, list, loading/error/close styles and constants
- `utils.ts` – `stripSlashesFromName`, `splitDisplayName`, `EVENT_TYPE_LABELS`; optionally `personRootHref`
- `PersonNameLink.tsx` – link to tree root with history
- **`ProfileHeader.tsx`** – profile header: avatar (or placeholder) + person’s name; presentational; props e.g. `name`, `avatarUrl?`, `loading?`
- Optional: `Section.tsx` – reusable section wrapper (title + icon + content)

**Sections (presentational)**

- `BirthSection.tsx`
- `DeathSection.tsx`
- `FamiliesAsChildSection.tsx`
- `FamiliesAsSpouseSection.tsx`
- `SourcesSection.tsx`
- `EventsSection.tsx`
- `NotesSection.tsx`

**Entry**

- `index.tsx` – main overlay: call hooks, render **profile header** + close button(s) + sections + bottom close; re-export component and public types

**Public API**

- Consumers keep: `import { PersonDetailOverlay, type PersonDetailOverlayPerson } from "@/…/PersonDetailOverlay"` (path to folder resolves to `index.tsx`).

---

## 6. Order of work

1. **Backend** – Add the six new routes; implement each so response shape matches what the corresponding hook expects; extract shared helpers from the current detail route where useful.
2. **Frontend – types and hooks** – Define types for each slice; implement the six hooks, each doing a single `fetch` to its endpoint and returning `{ status, data, error }`.
3. **Frontend – overlay refactor** – Create `PersonDetailOverlay/`; add styles, utils, types, `PersonNameLink`, **`ProfileHeader`** (avatar/placeholder + name); add optional `Section`; add section components; main overlay in `index.tsx` renders profile header, then calls the six hooks and passes data (and tab state) into sections; remove old single-file `PersonDetailOverlay.tsx` and fix imports so the folder is the single entry point.
4. **Optional** – Deprecate or remove the old `GET .../detail` route if nothing else uses it; add per-hook caching (e.g. SWR/React Query) later.

---

## 7. Summary

- **Profile header:** Modern profile look with a dedicated header: **avatar** (or placeholder when no photo) and **person’s name**; implemented as `ProfileHeader.tsx`; name from basic details, avatar optional from API later.
- **Endpoints:** Six new routes (basic, families-as-child, families-as-spouse, notes, sources, events); each returns only that section’s payload.
- **Hooks:** Six hooks, each calling one endpoint; no shared “full detail” fetch or context.
- **Overlay:** Renders profile header first, then close button(s), then scrollable sections; calls the six hooks and passes results into presentational sections; tab state lives in the overlay.
- **Sections:** Receive data (and optional status/error) and tab state where needed; no API calls.
