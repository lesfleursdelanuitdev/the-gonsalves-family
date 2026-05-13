/**
 * PM2 process for the public Next.js site (e.g. temp.gonsalvesfamily.com).
 *
 * First time on the server:
 *   cd /apps/gonsalves-genealogy/the-gonsalves-family
 *   npm ci && npm run build
 *   pm2 start deployment/ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup   # follow the printed command if needed
 *
 * Later deploys: npm run deploy (build + pm2 restart temp-gonsalvesfamily).
 *
 * Port 3039 matches nginx proxy_pass in DEPLOYMENT_STATUS.md for this host.
 */
const path = require("node:path");

const cwd = path.resolve(__dirname, "..");

module.exports = {
  apps: [
    {
      name: "temp-gonsalvesfamily",
      cwd,
      script: path.join(cwd, "node_modules", ".bin", "next"),
      args: "start -p 3039",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        // ligneous-python-api (/api/research/* and tree analytics routes). Same host: loopback. No trailing slash.
        PYTHON_API_URL: process.env.PYTHON_API_URL ?? "http://127.0.0.1:5001",
        // Shared session cookie contract (must match admin app).
        AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME ?? "gonsalves_session",
        AUTH_COOKIE_DOMAIN: process.env.AUTH_COOKIE_DOMAIN ?? ".gonsalvesfamily.com",
        AUTH_COOKIE_SECURE: process.env.AUTH_COOKIE_SECURE ?? "true",
      },
    },
  ],
};
