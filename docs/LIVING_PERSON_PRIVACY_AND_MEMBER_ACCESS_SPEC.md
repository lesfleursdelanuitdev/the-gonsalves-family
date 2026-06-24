# Living person privacy & member access — product spec

**App:** `the-gonsalves-family` (public family site)  
**Status:** Approved for implementation planning  
**Related:** `the-gonsalves-family-admin` (auth, messaging reference), `@ligneous/auth`, `@ligneous/prisma`

This spec defines how the public site treats **living individuals** for anonymous vs authenticated visitors, required **auth UX** on the public site, and **member messaging**. It complements the privacy policy copy on `/privacy` (“Family Tree And Living People”).

---

## 1. Goals

1. **Protect living people** from public exposure of sensitive genealogy data while keeping the site useful for casual visitors.
2. **Make sign-in meaningful** — any family member with an account sees full content.
3. **Enforce privacy server-side** — UI hiding alone is insufficient; APIs and page loaders must apply the same rules.
4. **Reuse existing auth** — shared session cookie with admin, existing login/logout/refresh/me routes, remember-me, and `returnTo` redirect flow.
5. **Add member messaging** on the public site using the existing `Message` / `MessageGroup` schema.

---

## 2. Non-goals (v1)

- Per-person authorization (e.g. “only see yourself” or “only see relatives”) — **any authenticated user** sees all data.
- Redacting living people inside **published stories** (`/stories/...`) — deferred; see §12.
- Changing admin app auth or individual editor behavior.
- Replacing the read-only DB role for general site reads (messaging writes use a separate path; see §10).

---

## 3. Definitions

| Term | Meaning |
|------|---------|
| **Living person** | A GEDCOM individual where `GedcomIndividual.isLiving === true` in the database, including admin overrides via `livingMode` (`auto` / `living` / `deceased`). This is the **sole source of truth** for privacy; retire ad-hoc public heuristics (`personLifeStatus`) for enforcement paths. |
| **Anonymous viewer** | No valid session cookie (`gonsalves_session` / `AUTH_COOKIE_NAME`). |
| **Authenticated viewer** | Valid session; any active user who can log in. |
| **Minimal living disclosure** | Display name + birth **year** only (`b. YYYY`). No portrait, no profile link, no places, no full dates, no death fields, no counts, no biography, no media metadata attribution. |
| **Login wall** | Redirect to `/login?returnTo=<safe-path>`; after successful login, return to the requested resource. |
| **Generated individual album** | Virtual scrapbook at `/media/album-view?kind=generated&type=individual&id=<individualId>`. |
| **Curated album attached to a living person** | A public curated album (`/media/album/[albumId]`) that is **linked from that living individual’s profile** (media / album section), or is designated as that person’s primary curated album in the public profile payload. |

---

## 4. Policy summary

| Viewer | Living people |
|--------|----------------|
| **Anonymous** | Minimal disclosure on lists and tree; **login wall** on profiles and living-person albums; omit living names from “featured people” on shared media |
| **Authenticated** | **Full access** — same presentation as deceased individuals today |

---

## 5. Field rules

### 5.1 Minimal living DTO (anonymous)

When a living person appears in a **list, tree node, or relation row** (not behind a login wall):

```ts
type MinimalLivingPersonPublic = {
  id: string;           // stable id for React keys / tree graph; do not expose via public profile URL
  xref: string;         // required for tree layout; do not link to profile for anonymous users
  displayName: string;  // gedcom display name
  birthYear: number | null;
  isLiving: true;
  // Explicitly absent: portraitSrc, birthDateLabel, birthPlace, death*, age, biography,
  // profileHref, occupation, nationality, notes, media, linkedAccounts, etc.
};
```

**Display format (UI):** `{displayName}` with optional ` · b. {birthYear}` when year is known.

**Dates-only principle:** For living people, anonymous users see **birth year only** — not birth place, not full birth date string, not death information, not computed age.

### 5.2 Full person DTO (authenticated)

Existing `PublicIndividual` / `PublicIndividualProfile` and tree detail payloads unchanged for authenticated viewers.

### 5.3 Deceased individuals

No change for any viewer.

---

## 6. Surface requirements

### 6.1 Individual profile page

**Route:** `/individuals/[id]`

| Viewer | Behavior |
|--------|----------|
| Anonymous + living | **Login wall** — server redirect to `/login?returnTo=/individuals/[id]` (sanitized). Do not render partial profile. |
| Anonymous + deceased | Full profile (current behavior). |
| Authenticated | Full profile regardless of living status. |

**Data:** `loadPublicIndividualById` and all `/api/tree/individuals/[xref]/detail/*` routes must reject or redact for anonymous + living (prefer **401** with login hint for API; redirect for document requests).

**Profile sections when authenticated only (living):** biography, timeline, photos, notes, open questions, linked accounts, media album links, relationship calculator, charts, full relation cards.

---

### 6.2 Family profile page

**Route:** `/families/[id]` — `FamilyMemberCard` and equivalents.

| Viewer | Living member |
|--------|----------------|
| Anonymous | **Minimal living disclosure** only. No portrait/avatar image. No “Born”/“Died” stat grid with full labels. No partner/children counts. No “View Profile”, ancestor, or descendancy actions. |
| Authenticated | Current card: portrait, full dates, stats, profile link, chart actions. |

Applies to **partners** and **children** on the family profile (desktop and mobile).

---

### 6.3 Individual profile — relation lists

**Routes:** `/individuals/[id]` (deceased subject viewing living relatives), mobile profile relation sections.

Same rule as §6.2 for any **living** parent, sibling, partner, or child listed on another person’s profile:

| Viewer | Living relation |
|--------|-----------------|
| Anonymous | Minimal living disclosure; no portrait; no link to living profile |
| Authenticated | Full relation card (current behavior) |

Components affected include relation groups, `RelationAvatar`, family-as-partner / family-as-child tabs.

---

### 6.4 Tree viewer

**Routes:** `/tree/viewer`, `/tree/viewer/v2`, related chart URLs.

| Viewer | Living node |
|--------|-------------|
| Anonymous | Show **display name + birth year** on node / peek. **No profile picture.** Do not open full **PersonDetailOverlay** with private fields; peek may show minimal text only. No link to living profile. No media/album section for living person. |
| Authenticated | Current behavior: portrait, overlay, media, album links, profile navigation. |

**APIs** returning person nodes must emit minimal DTO for anonymous living nodes:

- `/api/tree/pedigree`
- `/api/tree/descendancy`
- `/api/tree/sibling-view`
- `/api/tree/individuals`
- `/api/tree/individuals/[xref]/ancestors|descendants|ahnentafel`
- `/api/tree/individuals/[xref]/detail/basic` (and sibling detail routes)

---

### 6.5 Search & browse

**Routes:** `/search`, `/individuals`, advanced search, person pickers.

| Viewer | Living result row |
|--------|-------------------|
| Anonymous | Minimal living disclosure; **no portrait**; **no profile link** (or link goes to login wall) |
| Authenticated | Full row (current behavior) |

Applies to `/api/tree/advanced-search`, `/api/tree/advanced-search/general`, and list loaders.

---

### 6.6 Media — “People featured”

**Routes:** `/media/[id]`, album lightbox metadata, `PublicAlbumLayout` “People featured” lists.

**Rule:** When media is visible on a **deceased** person’s profile, in albums, or in scrapbooks, and the media tags one or more people:

| Viewer | Living tagged person |
|--------|----------------------|
| Anonymous | **Omit** from featured-people list (no name, no link). **The photo itself remains visible.** |
| Authenticated | Listed with name and links (current behavior). |

**Data paths:** `linkedIndividuals` on media detail API, album view models (`resolve-public-album-view-model.ts`), `/api/media-view/[id]`.

---

### 6.7 Generated albums (scrapbooks) — living subjects

**Routes:** `/media/album-view?kind=generated&type=individual|family|event|place|date|tag|note&id=…`

| Type | Gate when | Anonymous list cover (`/archive`, `/media`) | Anonymous album view |
|------|-----------|---------------------------------------------|----------------------|
| **Individual** | Subject is living | Placeholder | Login wall |
| **Family** | Any husband/wife partner is living | Placeholder | Login wall |
| **Event** | Any event participant is living | Placeholder | Login wall |
| **Place / date / tag / note** | Union of linked people across scrapbook media includes any living person | Placeholder | Login wall |

**API:** `GET /api/album-view?kind=generated&type=…&id=…` returns **401** + login hint when anonymous and the scrapbook-level gate applies.

---

### 6.8 Curated albums attached to living people

**Route:** `/media/album/[albumId]`

| Viewer | Behavior |
|--------|----------|
| Anonymous | **Login wall** when album is **attached to a living person** (see §3). |
| Authenticated | Full curated album. |

**API:** `GET /api/album-view?kind=curated&albumId=…` returns **401** when gated.

**Attachment detection (v1):** An album is attached when it is the curated album linked from the living individual’s public profile media section, or when album metadata explicitly ties `primaryIndividualId` to a living person (add field in resolver if not present today).

Curated albums that merely **contain** photos tagging a living person but are not that person’s attached album stay **public**; apply §6.6 for featured-people names only.

---

### 6.9 Ahnentafel & charts

Ahnentafel already hides lifespan/place for living entries in UI; align with this spec:

- Anonymous: name + birth year; no profile link for living entries.
- Authenticated: full entry with links.

---

### 6.10 Statistics & anniversaries

| Data | Anonymous |
|------|-----------|
| Aggregate counts (e.g. “N living”) | Allowed |
| Named lists of living people | Minimal disclosure only; no portraits |
| Birth place / age for living | Not shown |

---

## 7. Login wall

### 7.1 Mechanism

Reuse existing flow:

1. `@/lib/auth/public-return-path` — sanitize `returnTo`
2. `/login` — `LoginView` + `PublicSiteLoginForm`
3. `@/lib/auth/public-site-login` — POST `/api/auth/login`, then `window.location.assign(returnTo)`

### 7.2 Protected resources (anonymous)

| Resource | Condition |
|----------|-----------|
| `/individuals/[id]` | Person is living |
| `/media/album-view?kind=generated&type=individual&id=…` | Subject is living |
| `/media/album/[albumId]` | Curated album attached to living person |

### 7.3 Server vs client

- **Document requests (RSC/pages):** `redirect()` to login when unauthenticated.
- **Client fetches / JSON APIs:** HTTP **401** with body:

```json
{
  "error": "Authentication required",
  "requiresAuth": true,
  "loginUrl": "/login?returnTo=%2Findividuals%2F..."
}
```

Client shells (`album-view` page, profile) must redirect on 401 without flashing private content.

---

## 8. Auth UX (public site)

### 8.1 Session indicator

**Requirement:** Authenticated users see clear signed-in state in the navbar (desktop + mobile).

**Behavior:**

- On mount (and after login), `GET /api/auth/me` with `credentials: "include"`.
- **Signed out:** existing Login dropdown / mobile accordion.
- **Signed in:** replace or supplement with user label (`username` or `email` from session); optional “Member” badge.

**Files (starting points):** `DesktopLoginDropdown.tsx`, `MobileNavLoginAccordion.tsx`, `SiteNavigation.tsx`, `Navbar.tsx`.

### 8.2 Sign out

**Requirement:** Authenticated users can log out from the public site.

**Behavior:**

- Navbar control “Sign out”
- `POST /api/auth/logout` (existing proxy)
- Clear optional `localStorage` username if not remembering
- Redirect to `/` or reload current page (re-apply anonymous redaction)

### 8.3 Remember me

**Requirement:** Retain existing remember-me on public login (no regression).

**Current behavior (keep):**

- Checkbox on `PublicSiteLoginForm` (default checked)
- Sends `remember: true` → admin login → **30-day** session vs **24-hour** default
- Persists username in `localStorage` key `gonsalves-site-nav-admin-username` when checked

**Shared cookie env (both apps):** `AUTH_COOKIE_NAME`, `AUTH_COOKIE_DOMAIN`, `AUTH_COOKIE_SECURE` — documented in root `README.md`.

---

## 9. Member messaging (public site)

### 9.1 Goal

Authenticated family members can **receive and respond to messages** from other members on the public site.

### 9.2 Data model (existing)

From `@ligneous/prisma`:

- `Message` — direct messages (`senderId`, `recipientId`, `conversationId`, `content`, `isRead`, attachments)
- `MessageGroup` — optional group threads scoped to `treeId`
- `UserProfile.allowDirectMessages` — recipient opt-out

### 9.3 Community scope

Mirror admin tree community (`admin-message-tree-scope.ts`):

Users eligible as senders/recipients:

- Tree owners, maintainers, contributors
- Users with `UserIndividualLink` on the public tree

Public site uses configured public tree id (`PUBLIC_RESEARCH_TREE_ID` / `PUBLIC_STORY_TREE_ID` / default tree resolution).

### 9.4 Authorization rules

| Action | Rule |
|--------|------|
| List inbox | Authenticated; messages where user is sender or recipient (and in tree community scope) |
| Read message | Participant only |
| Send DM | Authenticated; recipient in community; recipient `allowDirectMessages !== false` |
| Mark read | Recipient only |
| Group messages | v2 — optional after direct messages |

### 9.5 UI (v1)

**Route:** `/messages` (or `/account/messages`)

- Inbox list (unread indicator)
- Thread view with reply
- Compose to community member (username search or picker)
- Navbar unread badge (optional v1.1)

### 9.6 Reference implementation

Admin app: `useAdminMessages`, `/api/admin/messages/*`, `useAdminMessagesRealtime` (SSE). Public site may proxy or reimplement with stricter “member-only” surface — no admin-only actions.

### 9.7 Write path & database

Public app uses **read-only** `DATABASE_URL` for most routes (`docs/read-only-db-user.md`). Messaging **requires writes**.

**Required approach (v1):**

- **Option A (recommended):** Public `/api/messages/*` **proxies mutations** to admin (or shared write API), same pattern as `/api/auth/login`. Reads may use read-only Prisma or proxied GET.
- **Option B:** Grant INSERT/UPDATE on `messages` (and required junction tables) to a dedicated DB role used only by message routes.

Document chosen approach in `docs/read-only-db-user.md` addendum when implemented.

---

## 10. Architecture

### 10.1 Central access module

Add `lib/auth/public-viewer-context.ts` (name TBD):

```ts
type PublicViewer = { kind: "anonymous" } | { kind: "authenticated"; user: SessionUser };

function resolvePublicViewer(request): Promise<PublicViewer>;
function canViewFullIndividual(viewer: PublicViewer, isLiving: boolean): boolean;
function minimalLivingPerson(row): MinimalLivingPersonPublic;
function redactLivingInPayload<T>(payload: T, viewer: PublicViewer): T;
```

Every public loader and API route that returns person or album data calls this module.

### 10.2 Enforcement order

1. Resolve viewer from session cookie (`getCurrentUserFromToken` — already used by `/api/auth/me`).
2. If `isLiving && anonymous` → apply minimal DTO, login wall, or 401 per surface rules.
3. Never rely on client-only checks.

### 10.3 Key files to touch

| Area | Paths |
|------|-------|
| Profile loader | `lib/individuals/load-public-individuals.ts` |
| Profile page | `src/app/individuals/[id]/page.tsx` |
| Family UI | `src/components/families/FamilyMemberCard.tsx`, `FamilyProfilePage.tsx` |
| Individual relations | `IndividualProfilePage.tsx`, `MobileIndividualProfile.tsx` |
| Tree APIs | `src/app/api/tree/**` |
| Tree UI | `PersonDetailOverlay/*`, fan peek modals |
| Albums | `lib/album/resolve-public-album-view-model.ts`, `src/app/api/album-view/route.ts` |
| Media | `src/app/media/[id]/page.tsx`, `src/app/api/media-view/[id]/route.ts` |
| Search | `AdvancedSearchPage.tsx`, advanced-search routes |
| Auth UX | Navbar site-nav components |
| Login | Existing — no policy change |
| Messages | **New** `src/app/messages/**`, `src/app/api/messages/**` |

---

## 11. Acceptance criteria

### Privacy

- [ ] Anonymous user opening `/individuals/[livingId]` lands on login; after login, sees full profile.
- [ ] Anonymous user never receives full living profile JSON from any API (verify with network tab / tests).
- [ ] Living person on `/families/[id]` shows name + birth year only; no photo; no profile button.
- [ ] Living relation on deceased profile follows same minimal rule.
- [ ] Tree viewer: living nodes have no photo for anonymous; authenticated sees photos.
- [ ] Media page: living person omitted from “People featured” for anonymous; photo still visible.
- [ ] Generated individual album for living person: login wall for anonymous.
- [ ] Curated album attached to living person: login wall for anonymous.
- [ ] Authenticated user sees all of the above without redaction.

### Auth UX

- [ ] Navbar shows signed-in identity when session valid.
- [ ] Sign out clears session and restores anonymous redaction.
- [ ] Remember me extends session to 30 days; username prefilled on return visit.

### Messaging

- [ ] Authenticated user can view inbox and reply.
- [ ] Anonymous user cannot access `/messages` (login wall).
- [ ] User with `allowDirectMessages: false` does not receive new DMs (sender sees clear error).
- [ ] Messages only between tree community members.

---

## 12. Deferred / follow-up

### Stories (`/stories/...`)

Published stories may embed names and photos of living people. **Not in v1.** Follow-up options:

1. Editorial — no publish if story exposes living people to anonymous readers
2. Runtime redaction in story renderer
3. Login-gate entire story if it references any living person

Track in a separate doc when prioritized.

### NL / research search proxy

Apply same minimal living redaction to research API proxy responses when result rows include individuals.

### SEO

Consider `noindex` on living profile URLs for anonymous crawlers (even with login wall).

---

## 13. Implementation phases

| Phase | Scope |
|-------|--------|
| **P0** | Central viewer + `isLiving` source of truth; helper types; tests |
| **P1** | Profile login wall + detail API gates |
| **P2** | Family + relation minimal cards |
| **P3** | Tree viewer + tree APIs redaction |
| **P4** | Search/list redaction |
| **P5** | Media featured-people filter |
| **P6** | Album login walls (generated + curated attached) |
| **P7** | Navbar session + sign out |
| **P8** | Messages MVP (inbox, read, reply, compose) |

Phases P1–P6 may partially overlap; P7 is independent; P8 depends on write-path decision (§9.7).

---

## 14. Revision history

| Date | Change |
|------|--------|
| 2026-06-15 | Initial spec from product planning sessions |
