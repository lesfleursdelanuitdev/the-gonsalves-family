# Public site auth UX — product spec

**App:** `the-gonsalves-family` (public family site)  
**Status:** Approved for implementation planning  
**Related:** [Living person privacy](./LIVING_PERSON_PRIVACY_SPEC.md), [Member messaging](./PUBLIC_SITE_MESSAGING_SPEC.md), `the-gonsalves-family-admin` (login API), `@ligneous/auth`

Covers sign-in UX, session visibility, sign-out, remember-me, and the **login wall** mechanism used by the privacy spec.

---

## 1. Goals

1. Family members can **sign in** on the public site (navbar + `/login`).
2. **Authenticated state is visible** in the UI — users know they are signed in.
3. Users can **sign out** without opening the admin app.
4. **Remember me** keeps long-lived sessions and prefills username.
5. **Login walls** on privacy-gated resources return users to the right page after sign-in.

---

## 2. Non-goals (v1)

- Registration / account creation on public site (use `/request-account`).
- Password reset on public site (may link to admin or email flow later).
- Role-based UI (all authenticated users are equivalent for content access).
- OAuth / social login.

---

## 3. Existing infrastructure (keep)

| Piece | Location |
|-------|----------|
| Login page | `/login` — `LoginView`, `PublicSiteLoginForm` |
| Login API | `POST /api/auth/login` → proxies to admin |
| Logout API | `POST /api/auth/logout` → proxies to admin |
| Refresh API | `POST /api/auth/refresh` → proxies to admin |
| Session probe | `GET /api/auth/me` — reads cookie locally via `@ligneous/auth` |
| Client submit | `lib/auth/public-site-login.ts` — `submitPublicSiteLogin` |
| Return path | `lib/auth/public-return-path.ts` |
| Admin origin | `lib/siteAdminLogin.ts` — `SITE_ADMIN_ORIGIN`, `SITE_ADMIN_LOGIN_HREF` |
| Proxy helper | `lib/auth/admin-auth-proxy.ts` |

**Shared cookie env (both public + admin apps):**

- `AUTH_COOKIE_NAME` (default: `gonsalves_session`)
- `AUTH_COOKIE_DOMAIN` (e.g. `.gonsalvesfamily.com`)
- `AUTH_COOKIE_SECURE`

Documented in root `README.md`.

---

## 4. Sign-in entry points

| Entry | Component |
|-------|-----------|
| Full page | `/login` |
| Desktop navbar | `DesktopLoginDropdown` — compact `PublicSiteLoginForm` |
| Mobile nav | `MobileNavLoginAccordion` — compact form |

Both compact forms link to full sign-in with `?returnTo=` preserved.

---

## 5. Session indicator (new)

### Requirement

Authenticated users see clear **signed-in state** in the navbar (desktop + mobile).

### Behavior

1. On mount and after login: `GET /api/auth/me` with `credentials: "include"`.
2. **Signed out:** show existing Login dropdown / accordion.
3. **Signed in:** show user label (`username` or `email` from `{ user }` response). Optional “Member” badge.

### Already on login page

`LoginView` checks `/api/auth/me` and shows “Signed in as …” + Continue — extend same pattern to navbar.

### Files to update

- `src/components/homepage/HeroAndMenu/Navbar/site-nav/DesktopLoginDropdown.tsx`
- `MobileNavLoginAccordion.tsx`
- `SiteNavigation.tsx` / `DesktopNav.tsx` / `MobileNavDrawer.tsx`
- Consider shared hook: `usePublicSession()` wrapping `/api/auth/me`

### Signed-in menu (v1)

When authenticated, replace or augment Login with:

- User label (non-clickable or opens small menu)
- **Sign out**
- Optional: link to `/messages` (see messaging spec)
- Optional: “Open admin console” → `SITE_ADMIN_LOGIN_HREF` (keep for maintainers)

---

## 6. Sign out (new)

### Requirement

Authenticated users log out from the public site.

### Behavior

1. Control: “Sign out” in navbar (signed-in menu).
2. `POST /api/auth/logout` with `credentials: "include"`.
3. If remember-me username should not persist, clear `localStorage` key `gonsalves-site-nav-admin-username` (only when user unchecked remember on last login — otherwise keep username prefilled).
4. Navigate to `/` or `router.refresh()` on current page so privacy redaction re-applies.

### Error handling

If logout fails, show brief error; optionally force navigation home anyway.

---

## 7. Remember me (retain — no regression)

### Requirement

Keep existing remember-me on all public login forms.

### Current behavior

- Checkbox on `PublicSiteLoginForm` (default **checked**).
- POST body includes `remember: boolean`.
- Admin login: `remember === true` → **30-day** session TTL; else **24-hour** default.
- When checked + successful login: `localStorage.setItem(NAV_ADMIN_USERNAME_KEY, username)`.
- When unchecked: remove stored username.

### UX copy

- Page variant: “Remember me on this device”
- Compact variant: “Remember me”

No change required unless copy audit requested.

---

## 8. Login wall

Used by [LIVING_PERSON_PRIVACY_SPEC.md](./LIVING_PERSON_PRIVACY_SPEC.md) for gated resources.

### Flow

1. Anonymous user hits protected resource.
2. **Server (RSC/page):** `redirect(`/login?returnTo=${encodeURIComponent(safePath)}`)`.
3. **Client fetch:** API returns 401 + `loginUrl`; client redirects.
4. User signs in via `submitPublicSiteLogin` → `window.location.assign(returnTo)`.
5. `sanitizePublicReturnPathExcludingLogin` prevents loops.

### Protected resources (privacy)

| Resource | Condition |
|----------|-----------|
| `/individuals/[id]` | Living person |
| `/media/album-view?kind=generated&type=individual&id=…` | Living subject |
| `/media/album/[albumId]` | Curated album attached to living person |

### Protected resources (messaging)

| Resource | Condition |
|----------|-----------|
| `/messages`, `/messages/*` | Always (any anonymous access) |

### Login page when already signed in

Existing `LoginView` behavior: show “Signed in as …” + **Continue** to `returnTo` — keep.

---

## 9. API error contract (401)

For JSON routes behind login wall:

```json
{
  "error": "Authentication required",
  "requiresAuth": true,
  "loginUrl": "/login?returnTo=%2F..."
}
```

Status: **401 Unauthorized**.

Clients: `album-view` page, future message fetches, any client-loaded gated content.

---

## 10. Architecture

### Session resolution (shared with privacy)

```ts
// lib/auth/public-viewer-context.ts
type PublicViewer =
  | { kind: "anonymous" }
  | { kind: "authenticated"; user: SessionUser };

async function resolvePublicViewer(): Promise<PublicViewer> {
  const token = /* cookie */;
  const user = await getCurrentUserFromToken(prisma, token, { touchSession: false });
  return user ? { kind: "authenticated", user } : { kind: "anonymous" };
}
```

Used by privacy redaction and message routes.

### Navbar session hook (suggested)

```ts
// hooks/usePublicSession.ts
{ user, isLoading, isAuthenticated, refetch }
```

---

## 11. Acceptance criteria

- [ ] Signed-in user sees identity in navbar (desktop + mobile).
- [ ] Signed-out user sees Login as today.
- [ ] Sign out clears session; anonymous redaction visible on reload.
- [ ] Remember me: 30-day session when checked; 24h when not.
- [ ] Username prefilled from localStorage on return visit when remember was used.
- [ ] Login wall: anonymous living profile → login → return to profile with full content.
- [ ] `/api/auth/me` returns `{ user: null }` when logged out without error.

---

## 12. Implementation phases

| Phase | Scope |
|-------|--------|
| **A0** | `usePublicSession` / `resolvePublicViewer` |
| **A1** | Navbar signed-in UI + sign out |
| **A2** | Wire viewer into privacy login walls (coordinate with privacy P1) |

Messaging and privacy can consume A0 in parallel.

---

## 13. Revision history

| Date | Change |
|------|--------|
| 2026-06-15 | Split from combined spec; initial auth UX spec |
