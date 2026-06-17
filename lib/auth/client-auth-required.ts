import { buildLoginWallPath } from "@/lib/auth/public-return-path";

export type AuthRequiredBody = {
  error?: string;
  requiresAuth?: boolean;
  loginUrl?: string;
};

export function redirectToLoginWall(loginUrl: string): void {
  window.location.assign(loginUrl);
}

export function shouldGateLivingTreePerson(
  isLiving: boolean | undefined,
  isAuthenticated: boolean,
): boolean {
  return Boolean(isLiving) && !isAuthenticated;
}

export function gateLivingTreePersonAccess(
  person: { uuid: string | null; isLiving?: boolean },
  isAuthenticated: boolean,
): boolean {
  if (!shouldGateLivingTreePerson(person.isLiving, isAuthenticated)) return false;
  const returnPath =
    person.uuid != null && person.uuid !== ""
      ? `/individuals/${encodeURIComponent(person.uuid)}`
      : typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/";
  redirectToLoginWall(buildLoginWallPath(returnPath));
  return true;
}

export function handleAuthRequiredResponse(body: AuthRequiredBody, fallbackReturnPath: string): boolean {
  if (body.requiresAuth && body.loginUrl) {
    redirectToLoginWall(body.loginUrl);
    return true;
  }
  if (body.requiresAuth) {
    redirectToLoginWall(buildLoginWallPath(fallbackReturnPath));
    return true;
  }
  return false;
}
