# Public story reading — gaps and follow-up plan

This document tracks **gaps vs the full spec** for published stories on **the-gonsalves-family** (`/stories/...`): cover treatment, story viewer, article deep linking, and environment/data contracts. It complements admin-side authoring docs (e.g. `the-gonsalves-family-admin/docs/STORY_CREATOR_DESCRIPTION.md`).

---

## Principles

- Reuse **`@ligneous/album-view`** for cover **selection** logic; keep **`StoryCover`** as the presentational shell (it already mirrors **PublicAlbumLayout** visually: full-bleed image, scale, blur, bottom gradient, overlapping avatar).
- Prefer **server-side** resolution for hero/cover URLs (today: `lib/stories/story-hero-urls.ts`) so the client receives plain URLs.
- **Do not** rename `StoryDocument` / junction tables to `linkedIndividuals` etc.; keep **`linkedRecords` + `placeLinks`** (and related models) as the source of truth—only add **adapters/mappers** at boundaries.

**Key files today**

| Area | Path |
|------|------|
| Hero URL resolution | `lib/stories/story-hero-urls.ts` |
| Article page + TOC | `src/components/stories/StoryArticlePage.tsx`, `src/components/stories/StoryTocNav.tsx` |
| Cover UI | `src/components/stories/StoryCover.tsx` |
| Viewer + URL state | `src/components/stories/StoryViewerClient.tsx`, `src/components/stories/StoryViewerNav.tsx` |
| Public album cover (reference) | `src/components/album/PublicAlbumLayout.tsx` |
| Album cover helper | `packages/ligneous-album-view/src/pick-cover.ts` (`resolveAlbumCoverMedia`, `pickCoverMediaFromSummaries`) |
| Gedcom media URL base | `lib/images.ts` (`resolveGedcomMediaFileRef`) |

---

## Phase 1 — Cover treatment + `resolveAlbumCoverMedia`

### Gap

`resolveStoryHeroUrls` resolves `coverMediaId` / `profileMediaId` by kind with direct Prisma lookups. It does **not** build `MediaSummary[]` or call **`resolveAlbumCoverMedia`**, so fallback behavior (preferred id missing from the candidate set, deterministic raster pick via `stableKey`) can **diverge** from curated/generated albums (`lib/album/resolve-public-album-view-model.ts`).

### Plan

1. **Define the “story cover candidate set”**  
   Decide which rows become `MediaSummary` (e.g. explicit story cover + profile ids, plus any linked story media that should participate in fallback—block-embedded media, gallery links, etc.). Document the rule in a comment on the builder function.

2. **Add `storyMediaRowsToSummaries(...)`** (e.g. under `lib/stories/`)  
   Map `{ id, title, fileRef, form, description? }` → `MediaSummary` (same shape as `toSummary` in `lib/album/resolve-public-album-view-model.ts`).

3. **Call `resolveAlbumCoverMedia(preferredId, summaries, stableKey)`**  
   - `preferredId`: `story.coverMediaId` (trimmed).  
   - `stableKey`: stable per story, e.g. **`story.id`** or canonical **`slug`**.  
   - Map the chosen summary’s `fileRef` through **`resolveGedcomMediaFileRef`** (and the same pattern for site/user media kinds if they appear in summaries).

4. **Profile / avatar**  
   Keep explicit **`profileMediaId`** resolution unless product wants “profile id must win only when present in summaries”—then document and optionally run a second `resolveAlbumCoverMedia` with a distinct stable key suffix (e.g. `stableKey + ':profile'`).

5. **Raster / bucket alignment**  
   If albums use **`inferMediaBucketKind`** (or similar) to avoid using non-raster as full-bleed cover, reuse the same checks for **URL selection** only (layout stays in `StoryCover`).

### Exit criteria

- With a **missing** preferred cover id but other raster summaries in the set, the story hero uses the **same deterministic pick** as album logic for the same `stableKey`.  
- With a **valid** preferred id present in the set, that row wins.

---

## Phase 2 — Story viewer polish

### Gap

`StoryViewerClient` wires **`mode`**, **`section`**, **`block`**, prev/next, and **keyboard** arrows in a basic way. Edge cases: **timeline mode with no dated blocks**, **mode switch**, **scroll-to-active block** after navigation.

**Reference:** `src/components/stories/StoryViewerClient.tsx`, `src/components/stories/StoryViewerNav.tsx`.

### Plan

1. **Empty / invalid states**  
   - Timeline + **`timelineBlocks.length === 0`**: disable timeline mode or force **`mode=pages`**, strip **`block`**, normalize URL with `router.replace`.  
   - **`section`** missing or unknown: clamp to first section and normalize URL once.

2. **Scroll / focus**  
   After `setQuery` (especially timeline + `block`), **`scrollIntoView`** (and optional focus) on the highlighted block; add **`scroll-margin`** in CSS if headers overlap fixed UI.

3. **Keyboard**  
   Ignore **ArrowLeft/ArrowRight** when focus is in **`input` / `textarea` / contenteditable**. Optional: **Home/End** for first/last section or timeline step.

4. **Pagination semantics**  
   If the spec defines true “pages” (one chunk per screen), add an explicit query param (e.g. `page`) or section index contract; otherwise document that “pages” = one **section** per view.

### Exit criteria

Mode switches never leave an empty body or a broken query string; changing **`section` / `block`** scrolls the active block into view; keyboard does not steal focus from form fields.

---

## Phase 3 — Single-page article deep linking

### Gap

`StoryTocNav` updates **`?section=`** and smooth-scrolls on **`/stories/[slug]`**; full “never reload” polish is limited to that client path. Initial load with **`?section=`** may race layout/scroll; ensure **`encodeURIComponent(slug)`** everywhere routes are built (some links use raw `slug`).

**Reference:** `src/components/stories/StoryTocNav.tsx`, `src/components/stories/StoryArticlePage.tsx`.

### Plan

1. **Initial URL**  
   If **`section`** is absent, optionally **`replace`** with the first section id for shareable anchors—or document “omit = top of article” and do not mutate URL.

2. **Scroll spy (optional)**  
   **`IntersectionObserver`** to update **`?section=`** while scrolling (throttled), guarded against fighting explicit TOC **`go()`** clicks.

3. **Query preservation**  
   When updating **`section`**, merge existing **`URLSearchParams`** (same pattern as `StoryViewerClient`’s `setQuery`).

4. **Viewer ↔ article**  
   “View as article” already passes **`section=`**; normalize slug encoding on all **`router.replace`** / **`Link`** targets.

### Exit criteria

TOC, browser back/forward, and cold loads with **`?section=`** behave predictably; no double-scroll jank.

---

## Phase 4 — Environment and data contract

### Requirements

1. **`PUBLIC_STORY_TREE_ID`** (or the env name your code expects—keep in sync with `lib/stories/story-queries.ts` and related loaders) must be set so **`/stories/...`** resolves the correct tree. Document in **`.env.example`** and fail or surface a clear error if missing in production.

2. **Published slug**  
   - **Admin:** prevent publish without a non-null, non-empty **slug** (validation + optional DB constraint).  
   - **Public:** define behavior on slug change (**404** vs **redirect**).

3. **Media base URL**  
   **`NEXT_PUBLIC_LIGNOUS_FRONTEND_URL`** must point at the origin that serves **`/uploads/...`** (typically admin). See `README.md` → Images.

### Exit criteria

Cannot publish without a usable slug; public story routes fail clearly when tree env is missing; OBJE paths resolve consistently.

---

## Suggested implementation order

| Order | Phase | Rationale |
|------|--------|-----------|
| 1 | Phase 4 (env + slug) | Unblocks reliable QA of all reading UI |
| 2 | Phase 1 (cover + `resolveAlbumCoverMedia`) | Single algorithm with albums |
| 3 | Phase 2 (viewer) | Core reading flow |
| 4 | Phase 3 (article URL polish) | Lower risk once viewer is stable |

---

## Testing checklist

- [ ] Story with **only fallback** media (no `coverMediaId`): cover matches album deterministic rule for chosen `stableKey`.  
- [ ] Story with **invalid** `coverMediaId` but valid gallery: fallback applies.  
- [ ] **Timeline** mode with **no dated blocks**: URL and UI recover without blank content.  
- [ ] Article **`?section=`** on cold load: correct section in view.  
- [ ] **`NEXT_PUBLIC_LIGNOUS_FRONTEND_URL`** / tree env: documented and verified in staging + production.

---

## Out of scope (explicit)

- Renaming **StoryDocument** or junctions to **`linkedIndividuals`**-style names.  
- Replacing **`linkedRecords` + `placeLinks`** with a new graph model—adapters only if needed for UI.

---

*Last updated: plan captured from implementation review; adjust file paths if modules move.*
