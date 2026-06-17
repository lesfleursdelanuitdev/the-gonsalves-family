# Public site member messaging — product spec

**App:** `the-gonsalves-family` (public family site)  
**Status:** Approved for implementation planning  
**Related:** [Public site auth UX](./PUBLIC_SITE_AUTH_UX_SPEC.md), `the-gonsalves-family-admin` (reference implementation), `@ligneous/prisma`

Authenticated family members can **receive and respond to direct messages** from other members on the public site.

---

## 1. Goals

1. Members communicate on the **public site** without using the admin console.
2. Reuse existing **`Message`** / **`MessageGroup`** schema and admin community scoping rules.
3. Respect **`UserProfile.allowDirectMessages`** opt-out.
4. Anonymous users cannot access messaging (login wall).

---

## 2. Non-goals (v1)

- Group messaging / message groups UI (schema exists; ship after DMs).
- Message attachments upload UI (schema supports attachments; optional v1.1).
- Real-time SSE on public site (admin has `/api/admin/messages/stream`; optional v1.1).
- Admin moderation tools on public site.
- Email notifications for new messages.
- Messaging non-community users or external email addresses.

---

## 3. Data model (existing)

From `@ligneous/prisma`:

### Message

| Field | Purpose |
|-------|---------|
| `senderId` | Author |
| `recipientId` | DM recipient (nullable if group) |
| `groupId` | Group thread (v2) |
| `conversationId` | Threads multiple recipient rows from one compose |
| `subject`, `content` | Body |
| `isRead`, `readAt` | Read state |
| `attachments` | `Media[]` via relation |

### MessageGroup

Tree-scoped groups with `members` — **v2**.

### UserProfile

- `allowDirectMessages` (default `true`) — when `false`, user cannot receive new DMs.

---

## 4. Community scope

Mirror admin: `the-gonsalves-family-admin/lib/admin/admin-message-tree-scope.ts`.

**Eligible users** (senders and recipients) on the **public tree**:

- Tree owners (`TreeOwner`)
- Tree maintainers (`TreeMaintainer`)
- Tree contributors (`TreeContributor`)
- Users with `UserIndividualLink` for that tree

**Tree id resolution:** same as public site elsewhere — `PUBLIC_RESEARCH_TREE_ID`, `PUBLIC_STORY_TREE_ID`, or default name-based lookup (`resolveTreeId`).

A user with an account who is **not** in the community cannot be messaged (and should not appear in compose picker).

---

## 5. Authorization rules

| Action | Rule |
|--------|------|
| Access `/messages` | Authenticated only; else login wall |
| List inbox | Participant; message in tree community scope |
| List sent | `senderId === currentUser.id` |
| Read message by id | Participant (`senderId` or `recipientId` match) AND tree scope |
| Send DM | Authenticated; sender in community; recipient in community; recipient `allowDirectMessages !== false` |
| Mark read | `recipientId === currentUser.id` only |
| Delete | **v2** — not in v1 unless admin parity required |

**Participant filter** (same as admin):

```ts
OR: [
  { senderId: userId },
  { recipientId: userId },
  { group: { members: { some: { id: userId } } } },
]
```

---

## 6. UI (v1)

### Routes

| Route | Purpose |
|-------|---------|
| `/messages` | Inbox (default tab) |
| `/messages/sent` | Sent messages (optional tab or filter) |
| `/messages/[id]` | Thread / message detail + reply |
| `/messages/compose` | New message (or modal from inbox) |

All routes: login wall for anonymous users.

### Inbox

- List: subject (or content preview), sender display name, date, unread indicator
- Empty state with link to compose
- Pagination or “load more” if list is long

### Thread / detail

- Full message content
- Sender/recipient labels
- Reply form (pre-fill `conversationId` when replying in thread)
- Mark as read on open (recipient)

### Compose

- Recipient picker: search community members by username / display name
- Subject (optional for reply; required for new thread — match admin behavior)
- Content (required)
- Send → redirect to thread or inbox
- Error if recipient opted out of DMs

### Navbar integration

- Link “Messages” when signed in
- Unread badge count (**v1.1** optional; include API in v1 for future badge)

---

## 7. API (public site)

New routes under `src/app/api/messages/` (exact paths TBD):

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/messages` | Inbox list (`?folder=inbox\|sent`) |
| GET | `/api/messages/unread-count` | Count for navbar badge |
| GET | `/api/messages/[id]` | Single message |
| POST | `/api/messages` | Send (create) |
| PATCH | `/api/messages/[id]` | Mark read |
| GET | `/api/messages/recipients` | Community member search for compose |

All routes require authenticated session; return 401 otherwise.

### Send payload (example)

```json
{
  "recipientId": "uuid",
  "subject": "Optional subject",
  "content": "Message body",
  "conversationId": "uuid | null"
}
```

### List item shape (example)

```json
{
  "id": "uuid",
  "subject": "…",
  "contentPreview": "…",
  "isRead": false,
  "createdAt": "ISO8601",
  "sender": { "id": "…", "username": "…", "displayName": "…" },
  "recipient": { "id": "…", "username": "…", "displayName": "…" },
  "conversationId": "…"
}
```

Align field names with admin `AdminMessageListItem` where possible to allow shared types later.

---

## 8. Write path & database

Public app uses **read-only** `DATABASE_URL` for most routes (`docs/read-only-db-user.md`). Messages require **INSERT/UPDATE**.

### Recommended (v1): proxy to admin

Public `/api/messages/*` **proxies** to new or existing admin routes (same pattern as `/api/auth/login`):

- Pros: public DB stays read-only; authorization centralized
- Cons: admin must expose member-safe endpoints (not `/api/admin/messages` with admin-only guards)

**Alternative:** scoped DB grants — `INSERT`/`UPDATE` on `messages` only for a `gonsalves_messages` role.

Document the chosen approach in `docs/read-only-db-user.md` when implemented.

### Read path

- **Option 1:** Read-only Prisma on public app (SELECT on `messages`, `users`, `user_profiles`) — sufficient if RLS not used.
- **Option 2:** Proxy GET to admin — consistent but heavier.

Recommendation: **read via read-only Prisma** on public app; **write via proxy** to admin member API.

---

## 9. Reference implementation (admin)

| Area | Admin path |
|------|------------|
| Hooks | `src/hooks/useAdminMessages.ts`, `useSendMessage`, `useMarkMessageRead` |
| API | `src/app/api/admin/messages/**` |
| Scope | `lib/admin/admin-message-tree-scope.ts` |
| Realtime | `useAdminMessagesRealtime` → SSE `/api/admin/messages/stream` |

Public site UI should be **simpler** — member-facing copy, no admin authz (`requireCan`, etc.).

---

## 10. Security & privacy

- Never expose messages to non-participants.
- Rate-limit send endpoint (abuse prevention) — match admin if present.
- Sanitize message content on display (XSS) — use same escaping as admin.
- Do not leak community user emails in recipient search; show username + display name only.
- Messages are **not** visible to anonymous users, including via direct API id guess (404 or 403).

---

## 11. Acceptance criteria

- [ ] Anonymous `/messages` → login wall.
- [ ] Authenticated user sees inbox with messages where they are sender or recipient.
- [ ] User can compose DM to community member; message appears in recipient inbox.
- [ ] User can reply; `conversationId` groups thread sensibly.
- [ ] Opening message as recipient marks it read.
- [ ] Recipient with `allowDirectMessages: false` — send fails with clear error.
- [ ] Non-community user not in recipient picker / send rejected.
- [ ] User A cannot read user B’s messages (id not in participant set).

---

## 12. Implementation phases

| Phase | Scope |
|-------|--------|
| **M0** | Write-path decision; admin member API or DB grants |
| **M1** | Public API: list, get, send, mark read |
| **M2** | `/messages` inbox + detail + reply UI |
| **M3** | Compose + recipient search |
| **M4** | Navbar link + unread count (optional) |
| **M5** | Group messages, attachments, SSE (v2) |

Depends on [PUBLIC_SITE_AUTH_UX_SPEC.md](./PUBLIC_SITE_AUTH_UX_SPEC.md) phase A0 (session) and A1 (navbar).

---

## 13. Revision history

| Date | Change |
|------|--------|
| 2026-06-15 | Split from combined spec; initial messaging spec |
