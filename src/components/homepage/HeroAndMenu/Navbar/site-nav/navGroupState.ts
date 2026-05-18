import type { SiteNavGroup } from "./navConfig";
import { SITE_NAV_GROUPS } from "./navConfig";

export type SiteNavGroupId = SiteNavGroup["id"];

export function createSiteNavGroupState(
  value = false
): Record<SiteNavGroupId, boolean> {
  return Object.fromEntries(
    SITE_NAV_GROUPS.map((group) => [group.id, value])
  ) as Record<SiteNavGroupId, boolean>;
}
