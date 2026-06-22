# Public site (Next.js 16, standalone output).
# Build context is the MONOREPO ROOT (/srv/apps) because the app depends on
# file:../packages/* siblings. Build with:
#   cd /srv/apps && podman build \
#     -f the-gonsalves-family/Dockerfile \
#     --ignorefile the-gonsalves-family/.dockerignore \
#     -t public:dev .
FROM docker.io/library/node:22-bookworm-slim AS builder
WORKDIR /app

# Shared packages workspace: install it first. It carries the prisma CLI (a
# workspace devDep) and generates the Prisma client that @ligneous/prisma exposes.
COPY packages ./packages
WORKDIR /app/packages
RUN npm ci

# App deps. @ligneous/prisma's postinstall (prisma generate) now finds prisma on PATH.
WORKDIR /app/the-gonsalves-family
COPY the-gonsalves-family/package.json the-gonsalves-family/package-lock.json ./
RUN npm ci

# App source, then production build (emits .next/standalone).
COPY the-gonsalves-family ./
# Some pages prerender against the DB and read env. Mount .env.local as an ephemeral
# build secret (Next auto-loads it) so the build matches the host without baking any
# secret into image layers. Build with --network host so DATABASE_URL (127.0.0.1:5432)
# reaches the host Postgres. For CI without a DB, mark those pages dynamic instead.
RUN --mount=type=secret,id=dotenv,target=/app/the-gonsalves-family/.env.local \
    npm run build

# ---------- runtime ----------
FROM docker.io/library/node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3039 \
    HOSTNAME=0.0.0.0

# Standalone bundle preserves the monorepo layout (server.js under the-gonsalves-family/).
COPY --from=builder /app/the-gonsalves-family/.next/standalone ./
COPY --from=builder /app/the-gonsalves-family/.next/static ./the-gonsalves-family/.next/static
COPY --from=builder /app/the-gonsalves-family/public ./the-gonsalves-family/public

EXPOSE 3039
CMD ["node", "the-gonsalves-family/server.js"]
