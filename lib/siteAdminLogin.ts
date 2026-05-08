/**
 * Sign-in for the admin app (the-gonsalves-family-admin).
 * Set `NEXT_PUBLIC_LIGNOUS_FRONTEND_URL` (e.g. https://admin.gonsalvesfamily.com).
 */
const adminOrigin = (() => {
  const base = (process.env.NEXT_PUBLIC_LIGNOUS_FRONTEND_URL ?? "").trim().replace(/\/$/, "");
  return base || "https://admin.gonsalvesfamily.com";
})();

export const SITE_ADMIN_ORIGIN = adminOrigin;
export const SITE_ADMIN_LOGIN_HREF = `${SITE_ADMIN_ORIGIN}/login`;
