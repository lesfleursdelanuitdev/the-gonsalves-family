# The Gonsalves Family

A family history and genealogy project built with:

- **Next.js** – React framework with App Router
- **Tailwind CSS** – Utility-first styling
- **TanStack React Query** – Data fetching and caching
- **D3.js** – Data visualization (charts, family trees, etc.)

## Getting started

**Development:**
```bash
npm run dev
```
Uses Turbopack (default). If you see 404 or module errors, try `npm run dev:webpack` or `npm run build && npm run start:prod`.

**Production (recommended for local testing):**
```bash
npm run build && npm run start:prod
```
Opens on [http://localhost:3039](http://localhost:3039).

## Database (read-only)

This app uses the shared `@ligneous/prisma` package to read from the `ligneous_frontend` database. Use a read-only database user.

1. Copy `.env.example` to `.env.local` and set `DATABASE_URL`.
2. Ensure the read-only user exists (see `docs/read-only-db-user.md`).

## Python research API (optional)

`/api/research/[...path]` proxies to `ligneous-python-api` (`PYTHON_API_URL`, default `http://127.0.0.1:5001`).

Because this frontend is anonymous and uses a **read-only** DB role:

- Tree-scoped calls must use the configured public tree only: set **`PUBLIC_RESEARCH_TREE_ID`** or **`PUBLIC_STORY_TREE_ID`**, or the default name-based lookup (`resolveTreeId` → “Gonsalves Family Tree”). Other tree IDs return **403**.
- The proxy always sends **`X-Research-Persist: false`** so natural-language runs are **not** written to `research.query_runs` / `research.result_sets` on the Python side.

**Production:** The Next.js process must reach the Flask app. Defaults to **`http://127.0.0.1:5001`**. If you see **`Research API unavailable`** (often with `cause: connection_refused` in the JSON), either:

1. Run **ligneous-python-api** on that host and port (same machine as the `gonsalves-public.service` process), or  
2. Set **`PYTHON_API_URL`** in **`.env.local`** or **`.env.production`** in this app’s root to the real base URL (no trailing slash), then restart the service: **`sudo systemctl restart gonsalves-public.service`**.

The site runs under **systemd** as **`gonsalves-public.service`** (`WorkingDirectory` = this app root, `npm run start:prod` → **port 3039**), behind nginx. Set `PYTHON_API_URL` (and any other env) in **`.env.production`** / **`.env.local`** in the app root; it defaults to **`http://127.0.0.1:5001`**. First start: `cd …/the-gonsalves-family && npm ci && npm run build`, install the unit file, then `sudo systemctl enable --now gonsalves-public.service`.

`next build` does not need the Python API running; failures happen at runtime when `/api/research/*` proxies upstream.

## Images

- **Local images** stay in `public/images/` (crest, hero, journey photos, etc.).
- **`NEXT_PUBLIC_LIGNOUS_FRONTEND_URL`**: base URL for assets not served by this app. Use **`https://admin.gonsalvesfamily.com`** in production so OBJE paths under `/uploads/gedcom-admin/…` resolve correctly (see `resolveGedcomMediaFileRef` in `lib/images.ts`). For ligneous-frontend-only paths, `ligneousImage` / `resolveImageUrl("ligneous:…")` still apply.

## Shared auth cookie config

For shared session behavior across public + admin hosts, configure these identically in both apps:

- `AUTH_COOKIE_NAME`
- `AUTH_COOKIE_DOMAIN` (example: `.gonsalvesfamily.com` in production)
- optional `AUTH_COOKIE_SECURE`

This is a hard cutover: sessions from the previous cookie contract are not reused after deploy, so users will need to sign in again.

## Public stories (`/stories/...`)

Roadmap, gaps vs full spec, and phased work: **`docs/STORY_PUBLIC_READING_PLAN.md`**. Authoring / editor behavior lives in the admin repo (`the-gonsalves-family-admin/docs/STORY_CREATOR_DESCRIPTION.md`).

## Scripts

- `npm run dev` – Start development server
- `npm run build` – Build for production
- `npm run start` – Start production server
- `npm run lint` – Run ESLint
