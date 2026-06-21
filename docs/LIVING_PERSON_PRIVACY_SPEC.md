# Living person privacy — product spec

**App:** `the-gonsalves-family` (public family site)  
**Status:** Approved for implementation planning  
**Related:** [Public site auth UX](./PUBLIC_SITE_AUTH_UX_SPEC.md), `@ligneous/auth`, `@ligneous/prisma`, admin individual editor (`livingMode`)

Complements the privacy policy on `/privacy` (“Family Tree And Living People”).

---

## 1. Goals

1. **Protect living people** from public exposure of sensitive genealogy data while keeping the site useful for casual visitors.
2. **Make sign-in meaningful** — any family member with an account sees full content (see auth spec).
3. **Enforce privacy server-side** — UI hiding alone is insufficient; APIs and page loaders must apply the same rules.

---

## 2. Non-goals (v1)

- Per-person authorization (e.g. “only see yourself” or “only see relatives”) — **any authenticated user** sees all data.
- Redacting living people inside **published stories** (`/stories/...`) — deferred; see §11.
- Changing admin app auth or individual editor behavior.

---

## 3. Definitions

| Term | Meaning |
|------|---------|
| **Living person** | `GedcomIndividual.isLiving === true`, including admin overrides via `livingMode` (`auto` / `living` / `deceased`). **Sole source of truth** for privacy; do not use `personLifeStatus` heuristics on enforcement paths. |
| **Anonymous viewer** | No valid session cookie (`gonsalves_session` / `AUTH_COOKIE_NAME`). |
| **Authenticated viewer** | Valid session; any active user who can log in. |
| **Minimal living disclosure** | Display name + birth **year** only (`b. YYYY`). No portrait, profile link, places, full dates, death fields, counts, biography, or media attribution. |
| **Login wall** | Redirect to `/login?returnTo=<safe-path>`; after login, return to the requested resource. Details: [PUBLIC_SITE_AUTH_UX_SPEC.md](./PUBLIC_SITE_AUTH_UX_SPEC.md). |
| **Generated individual album** | `/media/album-view?kind=generated&type=individual&id=<individualId>`. |
| **Generated family album (scrapbook)** | `/media/album-view?kind=generated&type=family&id=<familyId>`. |
| **Living-linked entity** | A curated album, generated scrapbook, or GEDCOM media item whose **linked people set** (§6.6) is non-empty and every member is living. |
| **Person link** | A GEDCOM association that ties an entity to an individual, or to a family’s husband/wife partners (indirect living-person link). |

---

## 4. Policy summary

| Viewer | Living people |
|--------|----------------|
| **Anonymous** | Minimal disclosure on lists and tree; **login wall** on profiles and **living-linked** albums/media (§6.6); omit living names from “featured people” on otherwise-public media (§6.7) |
| **Authenticated** | **Full access** — same presentation as deceased individuals today |

---

## 5. Field rules

### 5.1 Minimal living DTO (anonymous)

When a living person appears in a **list, tree node, or relation row** (not behind a login wall):

```ts
type MinimalLivingPersonPublic = {
  id: string;           // React keys / tree graph; do not link to profile for anonymous users
  xref: string;         // tree layout
  displayName: string;
  birthYear: number | null;
  isLiving: true;
  // Absent: portraitSrc, birthDateLabel, birthPlace, death*, age, biography,
  // profileHref, occupation, nationality, notes, media, linkedAccounts, etc.
};
```

**Display format (UI):** `{displayName}` with optional ` · b. {birthYear}`.

**Dates-only principle:** Birth **year** only — not birth place, full birth date string, death information, or computed age.

### 5.2 Full person DTO (authenticated)

Existing `PublicIndividual` / `PublicIndividualProfile` and tree detail payloads unchanged.

### 5.3 Deceased individuals

No change for any viewer.

---

## 6. Surface requirements

### 6.1 Individual profile page

**Route:** `/individuals/[id]`

| Viewer | Behavior |
|--------|----------|
| Anonymous + living | **Login wall** — redirect to `/login?returnTo=/individuals/[id]`. No partial profile. |
| Anonymous + deceased | Full profile (current). |
| Authenticated | Full profile regardless of living status. |

**Data:** `loadPublicIndividualById` and `/api/tree/individuals/[xref]/detail/*` must not return full living payloads to anonymous callers (401 + login hint for API; redirect for documents).

---

### 6.2 Family profile page

**Route:** `/families/[id]` — `FamilyMemberCard` and mobile equivalents.

| Viewer | Living member |
|--------|----------------|
| Anonymous | Minimal living disclosure. No portrait. No born/died stat grid. No partner/child counts. No profile or chart actions. |
| Authenticated | Current card (portrait, dates, stats, links, charts). |

Applies to **partners** and **children**.

---

### 6.3 Individual profile — relation lists

On **deceased** profiles, living parents, siblings, partners, and children:

| Viewer | Living relation |
|--------|-----------------|
| Anonymous | Minimal living disclosure; no portrait; no profile link |
| Authenticated | Full relation card |

Components: `IndividualProfilePage`, `MobileIndividualProfile`, relation groups, `RelationAvatar`.

---

### 6.4 Tree viewer

**Routes:** `/tree/viewer`, `/tree/viewer/v2`, chart URLs.

| Viewer | Living node |
|--------|-------------|
| Anonymous | Name + birth year. No profile picture. No full `PersonDetailOverlay`; minimal peek only. No profile link. No media/album for living person. |
| Authenticated | Current behavior (portrait, overlay, media, links). |

**APIs:** pedigree, descendancy, sibling-view, individuals list, ancestors/descendants/ahnentafel, detail/basic (+ sibling detail routes).

---

### 6.5 Search & browse

**Routes:** `/search`, `/individuals`, advanced search, person pickers.

| Viewer | Living result |
|--------|-----------------|
| Anonymous | Minimal disclosure; no portrait; no profile link (or link → login wall) |
| Authenticated | Full row |

APIs: `/api/tree/advanced-search`, `/api/tree/advanced-search/general`, list loaders.

---

### 6.6 All-living-linked gate (albums & media)

**In scope:** curated albums, generated scrapbooks (individual and family), and GEDCOM media in every public bucket — **photos**, **documents**, **audio**, and **video**.

**Routes (examples):** `/media/album/[albumId]`, `/media/album-view?kind=generated&…`, `/archive/photos`, `/archive/documents`, `/archive/audio`, `/archive/videos`, `/media`, `/media/[id]`.

#### Linked people set

For each entity, build the set of people linked through GEDCOM **individual** or **family** associations only:

| Link type | People included |
|-----------|-----------------|
| Individual media / profile media | That individual |
| Family media / profile media | The family’s husband and wife (when present) |

**Not included in this set:** tags, places, events, sources, notes, or other metadata. Those associations do **not** exempt an entity from gating and do **not** add people to the set.

For a **curated album**, union the linked-people sets of **all media items** in the album.

For a **generated individual scrapbook**, the subject individual is the linked person.

For a **generated family scrapbook**, the family’s husband and wife are the linked people.

#### Decision table

| Linked people | Anonymous viewer | Authenticated viewer |
|---------------|------------------|----------------------|
| **None** | Public (full access) | Public |
| **At least one deceased** | Public | Public |
| **Non-empty and all living** | **Guarded** (§6.6.1) | Full access |

Implementation: `lib/auth/living-exclusive-media.ts` (`collectLinkedPeople`, `areAllLinkedPeopleLiving`, `shouldGateAllLivingLinkedEntity`).

#### 6.6.1 Guarded behavior (anonymous)

| Surface | Behavior |
|---------|----------|
| **Media list** (`/archive/*`, `/media` hub) | Show card with placeholder thumbnail (`/images/personCardBg.png`); no lightbox; click → login wall |
| **Media detail** (`/media/[id]`, `/api/media-view/[id]`) | 401 + `loginUrl`; no file URL in payload |
| **Curated album list** | Album remains listed; cover uses placeholder image |
| **Curated album view** (`/media/album/[albumId]`) | Login wall before album JSON |
| **Generated individual/family scrapbook lists** | **Omit** from anonymous browse lists (same as living-subject individual scrapbooks today) |
| **Generated scrapbook view** | Login wall before album JSON |

Authenticated viewers see real thumbnails, files, and album contents.

---

### 6.7 Media — “People featured” (otherwise-public media)

**Routes:** `/media/[id]`, album lightbox, `PublicAlbumLayout`.

When media is **public** under §6.6 (not all-living-linked) and still tags people:

| Viewer | Living tagged person |
|--------|----------------------|
| Anonymous | **Omit** from featured-people list. **Photo stays visible.** |
| Authenticated | Listed with name and links |

Data: `linkedIndividuals` in media detail, `resolve-public-album-view-model.ts`, `apply-public-album-living-privacy.ts`, `/api/media-view/[id]`.

---

### 6.8 Generated scrapbooks — living subjects

**Routes:** `/media/album-view?kind=generated&type=individual|family&id=…`

Covered by §6.6:

- **Individual:** gated when the subject is living.
- **Family:** gated when every linked partner (husband/wife) is living.

Other generated types (event, place, date, tag, note) remain public in v1 unless future rules say otherwise.

---

### 6.9 Curated albums

**Route:** `/media/album/[albumId]`

Covered by §6.6: gated when **every person linked across all album media** is living — not merely when the album is “attached” to one living profile.

---

### 6.10 Ahnentafel & charts

- Anonymous: name + birth year; no profile link for living entries.
- Authenticated: full entry with links.

---

### 6.11 Statistics & anniversaries

| Data | Anonymous |
|------|-----------|
| Aggregate counts (“N living”) | Allowed |
| Named lists | Minimal disclosure; no portraits |
| Birth place / age for living | Not shown |

---

## 7. Login wall (privacy-gated resources)

Protected for **anonymous** viewers only:

| Resource | Condition |
|----------|-----------|
| `/individuals/[id]` | Person is living |
| `/media/album-view?kind=generated&type=individual&id=…` | Subject individual is living |
| `/media/album-view?kind=generated&type=family&id=…` | All family partners linked to the scrapbook are living |
| `/media/album/[albumId]` | All people linked across album media are living (§6.6) |
| `/media/[id]`, `/archive/photos`, `/archive/documents`, `/archive/audio`, `/archive/videos` | Media item’s linked-people set is non-empty and all living (§6.6) |

**Document requests:** server `redirect()` to login.

**JSON APIs:** HTTP **401**:

```json
{
  "error": "Authentication required",
  "requiresAuth": true,
  "loginUrl": "/login?returnTo=%2Findividuals%2F..."
}
```

Client shells must redirect on 401 without flashing private content.

Login flow implementation: [PUBLIC_SITE_AUTH_UX_SPEC.md](./PUBLIC_SITE_AUTH_UX_SPEC.md).

---

## 8. Architecture

### 8.1 Central access module

`lib/auth/public-viewer-context.ts` (name TBD):

```ts
type PublicViewer = { kind: "anonymous" } | { kind: "authenticated"; user: SessionUser };

function resolvePublicViewer(request): Promise<PublicViewer>;
function canViewFullIndividual(viewer: PublicViewer, isLiving: boolean): boolean;
function minimalLivingPerson(row): MinimalLivingPersonPublic;
function redactLivingInPayload<T>(payload: T, viewer: PublicViewer): T;
```

### 8.2 Enforcement order

1. Resolve viewer from session cookie (`getCurrentUserFromToken`).
2. If `isLiving && anonymous` → minimal DTO, login wall, or 401.
3. Never rely on client-only checks.

### 8.3 Key files

| Area | Paths |
|------|-------|
| Profile loader | `lib/individuals/load-public-individuals.ts` |
| Profile page | `src/app/individuals/[id]/page.tsx` |
| Family UI | `src/components/families/FamilyMemberCard.tsx` |
| Individual relations | `IndividualProfilePage.tsx`, `MobileIndividualProfile.tsx` |
| Tree | `src/app/api/tree/**`, `PersonDetailOverlay/*` |
| Albums & media | `lib/auth/living-exclusive-media.ts`, `lib/auth/gate-living-album-access.ts`, `lib/album/load-public-albums-page-data.ts`, `lib/media/load-public-media.ts`, `resolve-public-album-view-model.ts`, `src/app/api/album-view/route.ts`, `src/app/api/media-view/[id]/route.ts` |
| Search | `AdvancedSearchPage.tsx`, advanced-search routes |

---

## 9. Acceptance criteria

- [ ] Anonymous `/individuals/[livingId]` → login; after login → full profile.
- [ ] No full living profile JSON to anonymous APIs.
- [ ] Family page living member: name + birth year only; no photo; no profile button.
- [ ] Living relation on deceased profile: same minimal rule.
- [ ] Tree: no living photos for anonymous; full for authenticated.
- [ ] Media (photos, documents, audio, video): all-living-linked items show placeholder + login for anonymous; full file for authenticated.
- [ ] Curated albums: login wall when all linked people across album media are living.
- [ ] Generated individual & family scrapbooks: login wall / hidden list when all linked people are living.
- [ ] Otherwise-public media: living omitted from “People featured” for anonymous.
- [ ] Authenticated: no redaction anywhere.

---

## 10. Implementation phases

| Phase | Scope |
|-------|--------|
| **P0** | Central viewer + `isLiving`; helper types; tests |
| **P1** | Profile login wall + detail API gates |
| **P2** | Family + relation minimal cards |
| **P3** | Tree viewer + tree APIs |
| **P4** | Search/list redaction |
| **P5** | Media featured-people filter (§6.7) |
| **P6** | All-living-linked album & media gates (§6.6) |

Depends on auth UX (session resolution) from [PUBLIC_SITE_AUTH_UX_SPEC.md](./PUBLIC_SITE_AUTH_UX_SPEC.md) — can stub viewer as anonymous until P7 there lands.

---

## 11. Deferred

- **Stories** — embed living names/photos; editorial, runtime redaction, or login-gate (separate doc when prioritized).
- **NL / research search proxy** — same minimal redaction for individual rows.
- **SEO** — `noindex` on living profile URLs for crawlers.

---

## 12. Revision history

| Date | Change |
|------|--------|
| 2026-06-15 | Split from combined spec; initial privacy spec |
| 2026-06-17 | §6.6 unified all-living-linked gate for albums, scrapbooks, and all media buckets; family indirect links |
