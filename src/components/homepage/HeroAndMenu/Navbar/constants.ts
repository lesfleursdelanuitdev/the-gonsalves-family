import { BookOpen } from "lucide-react";
import type { NavItem } from "@/components/navbar/constants";
import {
  ARCHIVE_MENU,
  CULTURE_MENU,
  TREE_MENU,
} from "@/components/navbar/constants";

export { TREE_MENU, CULTURE_MENU };

/** Archive menu items with Stories, sorted alphabetically */
export const ARCHIVE_MENU_V2: NavItem[] = [
  ...ARCHIVE_MENU,
  { label: "Stories", href: "/stories", icon: BookOpen },
].sort((a, b) => a.label.localeCompare(b.label));
