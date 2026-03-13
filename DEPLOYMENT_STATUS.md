# Deployment Status: temp.gonsalvesfamily.com

## 1. Nginx Configuration ✅

**temp.gonsalvesfamily.com is configured in nginx** and is enabled.

- **Config file:** `/etc/nginx/sites-available/temp.gonsalvesfamily.com`
- **Symlink:** `/etc/nginx/sites-enabled/temp.gonsalvesfamily.com` → enabled
- **Proxy:** HTTP/HTTPS → `http://127.0.0.1:3039` (Next.js app)
- **SSL:** Let's Encrypt certificate at `/etc/letsencrypt/live/temp.gonsalvesfamily.com/`
- **Logs:** `/var/log/nginx/temp.gonsalvesfamily.com.access.log` and `.error.log`

The nginx config is correct and does not need changes for deployment. If you add `proxy_cache` later, do **not** cache the app location (or use a short TTL for it) so HTML is not cached and clients get fresh asset URLs after each deploy.

---

## 2. Keeping Static Files (CSS/JS) Working

### Why CSS sometimes doesn't load

1. **No production build** — `next start` requires assets in `.next/static/`. If only `.next/dev/` exists (from running `next dev`), production asset paths 404.
2. **Failed or partial build** — A build that errors or is interrupted can leave `.next/` in a broken state.
3. **Stale caches** — Old HTML cached in the browser (or by nginx) may reference asset paths from a previous build that no longer exist.
4. **PM2 wrong cwd** — If PM2 was started from a different directory, `pm2 restart` still runs the process from that original cwd, so it may be serving an old or missing `.next` folder.

### How we prevent this

- **Deploy script** — Use `npm run deploy` instead of manual build + restart. It verifies `.next/static/chunks` exists and has files before restarting PM2. If the build fails, the script exits and PM2 is not restarted.
- **Cache headers** — `next.config.ts` sets immutable cache headers for `/_next/static/*` so browsers cache hashed assets correctly.
- **Document no-cache** — `src/proxy.ts` sets `Cache-Control: no-store` on HTML/document responses (not on `/_next/static/*`) so after each deploy clients get fresh HTML with current chunk URLs; old cached HTML would otherwise point at previous build’s assets (404).
- **Don't run `next dev` on the production server** — Use `next dev` only in a development environment. On the server, run only `npm run build` and `next start` (via PM2).
- **PM2 cwd** — Start PM2 from the app root (e.g. `cd /apps/the-gonsalves-family && pm2 start npm --name temp-gonsalvesfamily -- start`) so the process uses that directory’s `.next` after deploy.

### Recommended deploy command

```bash
cd /apps/the-gonsalves-family
npm run deploy
```

This runs the deploy script which: builds → verifies static files → restarts PM2.

---

## 3. Manual Deploy Checklist

If not using `npm run deploy`:

1. Pull latest code
2. Install dependencies (if changed): `npm ci`
3. Run production build: `npm run build`
4. Verify `.next/static/chunks` exists and contains files
5. Restart PM2: `pm2 restart temp-gonsalvesfamily`
6. Confirm styles load at https://temp.gonsalvesfamily.com
