import type { LucideIcon } from "lucide-react";
import { SITE_ADMIN_LOGIN_HREF } from "@/lib/siteAdminLogin";
import {
  BookOpen,
  CalendarDays,
  GitBranch,
  Home,
  Images,
  Languages,
  MapPin,
  Music,
  Newspaper,
  Route,
  Search,
  User,
  UtensilsCrossed,
  Video,
} from "lucide-react";

export type SiteNavItem = {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

export type SiteNavGroup = {
  id: "tree" | "archive" | "culture";
  navLabel: string;
  sectionLabel: string;
  href: string;
  items: SiteNavItem[];
  /** Desktop dropdown alignment when near viewport edge */
  alignDropdownRight?: boolean;
};

export const SITE_NAV_GROUPS: SiteNavGroup[] = [
  {
    id: "tree",
    navLabel: "Tree",
    sectionLabel: "Explore the Tree",
    href: "/tree",
    alignDropdownRight: false,
    items: [
      {
        label: "Tree Viewer",
        href: "/tree/viewer",
        description: "Explore relationships visually",
        icon: GitBranch,
      },
      {
        label: "Individuals",
        href: "/tree/individuals",
        description: "Browse documented people",
        icon: User,
      },
      {
        label: "Families",
        href: "/tree/families",
        description: "View connected family groups",
        icon: Home,
      },
      {
        label: "Events",
        href: "/tree/events",
        description: "Trace births, marriages, migrations",
        icon: CalendarDays,
      },
      {
        label: "Places",
        href: "/tree/places",
        description: "Explore locations",
        icon: MapPin,
      },
      {
        label: "Natural language search",
        href: "/research/nl-search",
        description: "Ask analytics questions about the tree in plain language",
        icon: Search,
      },
      {
        label: "Timelines",
        href: "/timelines",
        description: "Follow history through time",
        icon: Route,
      },
    ],
  },
  {
    id: "archive",
    navLabel: "Archive",
    sectionLabel: "Family Archive",
    href: "/archive",
    /** Opens left from the trigger so the wide card stays on-screen near the search icon. */
    alignDropdownRight: true,
    items: [
      {
        label: "Stories",
        href: "/stories",
        description: "Family memories and histories",
        icon: BookOpen,
      },
      {
        label: "Photos",
        href: "/archive/photos",
        description: "Preserved family images",
        icon: Images,
      },
      {
        label: "Audio",
        href: "/archive/audio",
        description: "Voices and recordings",
        icon: Music,
      },
      {
        label: "Videos",
        href: "/archive/videos",
        description: "Moving image archive",
        icon: Video,
      },
    ],
  },
  {
    id: "culture",
    navLabel: "Culture",
    sectionLabel: "Culture & Heritage",
    href: "/culture",
    alignDropdownRight: true,
    items: [
      {
        label: "Articles",
        href: "/culture/articles",
        description: "Context and essays",
        icon: Newspaper,
      },
      {
        label: "Language",
        href: "/culture/language",
        description: "Words, names, and phrases",
        icon: Languages,
      },
      {
        label: "Places",
        href: "/culture/places",
        description: "Cultural geography",
        icon: MapPin,
      },
      {
        label: "Recipes",
        href: "/culture/recipes",
        description: "Food and memory",
        icon: UtensilsCrossed,
      },
    ],
  },
];

export const SITE_NAV_SEARCH_HREF = "/tree/viewer/searchDatabase";

export const SITE_NAV_LOGIN_HREF = SITE_ADMIN_LOGIN_HREF;
