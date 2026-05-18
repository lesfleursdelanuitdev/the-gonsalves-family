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
    return (
      pathname === "/tree" ||
      pathname.startsWith("/tree/") ||
      pathname === "/individuals" ||
      pathname.startsWith("/individuals/")
    );
  }
  if (group.id === "visualize") {
    return (
      pathname === "/visualize" ||
      pathname.startsWith("/visualize/") ||
      pathname.startsWith("/tree/viewer") ||
      pathname === "/timelines" ||
      pathname.startsWith("/timelines/") ||
      pathname === "/visualize/calendar" ||
      pathname.startsWith("/visualize/calendar/") ||
      pathname === "/maps" ||
      pathname.startsWith("/maps/")
    );
  }
  if (group.id === "archive") {
    return (
      pathname === "/archive" ||
      pathname.startsWith("/archive/") ||
      pathname === "/stories" ||
      pathname.startsWith("/stories/") ||
      pathname === "/media" ||
      pathname.startsWith("/media/") ||
      pathname === "/scrapbook-generator" ||
      pathname === "/collection-generator" ||
      pathname === "/album-generator"
    );
  }
  if (group.id === "culture") {
    return pathname === "/culture" || pathname.startsWith("/culture/");
  }
  if (group.id === "research") {
    return pathname === "/research" || pathname.startsWith("/research/");
  }
  if (group.id === "more") {
    return (
      pathname === "/more" ||
      pathname.startsWith("/more/") ||
      pathname === "/more/todays-anniversaries" ||
      pathname.startsWith("/more/todays-anniversaries/") ||
      pathname === "/more/upcoming-anniversaries" ||
      pathname.startsWith("/more/upcoming-anniversaries/") ||
      pathname === "/contact" ||
      pathname.startsWith("/contact/") ||
      pathname === "/contribute" ||
      pathname.startsWith("/contribute/") ||
      pathname === "/help" ||
      pathname.startsWith("/help/")
    );
  }
  return false;
}
