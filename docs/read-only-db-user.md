# Read-only database user for the-gonsalves-family

This app needs read-only access to the `ligneous_frontend` PostgreSQL database. Create a dedicated user with `SELECT` privileges only.

## Option 1: Automated script

```bash
ADMIN_DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/postgres" \
GONSALVES_READONLY_PASSWORD="your_secure_readonly_password" \
./scripts/setup-readonly-db.sh
```

This creates the user and writes `DATABASE_URL` to `.env.local`.

## Option 2: Manual SQL (run as superuser)

```sql
CREATE USER gonsalves_readonly WITH PASSWORD 'your_secure_password';

GRANT CONNECT ON DATABASE ligneous_frontend TO gonsalves_readonly;

-- Connect to ligneous_frontend first, then:
\c ligneous_frontend

GRANT USAGE ON SCHEMA public TO gonsalves_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO gonsalves_readonly;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO gonsalves_readonly;
```

Then add to `the-gonsalves-family/.env.local`:

```
DATABASE_URL="postgresql://gonsalves_readonly:your_secure_password@localhost:5432/ligneous_frontend?sslmode=disable"
```

Replace `localhost:5432` and add `sslmode=require` if your database uses SSL.

## Member messaging writes

Most public routes use the read-only `DATABASE_URL` above. **Direct messages** are an exception:

- **Reads** (inbox, message detail, recipients, unread count) use read-only Prisma on the public app.
- **Writes** (send, mark read) proxy to the admin app (`NEXT_PUBLIC_LIGNOUS_FRONTEND_URL`) with the member session cookie, same pattern as `/api/auth/login`.

No extra DB grants are required on the public read-only user for messaging v1.

## After new migrations (albums, junction tables, etc.)

`ALTER DEFAULT PRIVILEGES` only applies to objects created by the **same database role** that ran it. If migrations create tables as another role (for example `postgres`), the read-only user may not get `SELECT` on new tables.

Symptoms: public `/api/album-view?kind=curated&…` returns **500** (sometimes with an empty body in front of nginx), while `kind=generated` still works, because curated queries hit `albums` / `album_gedcom_media`.

**Fix** (run on `ligneous_frontend` as a superuser):

```sql
GRANT SELECT ON ALL TABLES IN SCHEMA public TO gonsalves_readonly;
```

Re-run this whenever you add tables the public site must read. Optionally fix default privileges for your migration role so future tables inherit `SELECT` for `gonsalves_readonly`.
