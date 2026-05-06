import type { SiteNavGroup } from "./navConfig";

export function isSiteNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/tree/viewer" && pathname.startsWith("/tree/viewer")) return true;
  if (href === "/timelines" && pathname.startsWith("/timelines")) return true;
  if (href === "/stories" && (pathname === "/stories" || pathname.startsWith("/stories/"))) {
    return true;
  }
  if (pathname.startsWith(`${href}/`)) return true;
  return false;
}

export function isSiteNavGroupActive(pathname: string, group: SiteNavGroup): boolean {
  if (group.id === "tree") {
    return pathname === "/tree" || pathname.startsWith("/tree/");
  }
  if (group.id === "archive") {
    return (
      pathname === "/archive" ||
      pathname.startsWith("/archive/") ||
      pathname === "/stories" ||
      pathname.startsWith("/stories/")
    );
  }
  if (group.id === "culture") {
    return pathname === "/culture" || pathname.startsWith("/culture/");
  }
  return false;
}
