import type { LucideIcon } from "lucide-react";
import {
  User,
  Home,
  CalendarDays,
  GitBranch,
  MapPin,
  Type,
  Images,
  Video,
  Music,
  UtensilsCrossed,
  Languages,
  Newspaper,
  Map,
  Route,
  FileSignature,
  BarChart3,
} from "lucide-react";

export type NavItem = { label: string; href: string; icon?: LucideIcon };

export const TREE_MENU: NavItem[] = [
  { label: "Events", href: "/tree/events", icon: CalendarDays },
  { label: "Families", href: "/tree/families", icon: Home },
  { label: "Given Names", href: "/tree/given-names", icon: FileSignature },
  { label: "Individuals", href: "/tree/individuals", icon: User },
  { label: "Maps", href: "/maps", icon: Map },
  { label: "Places", href: "/tree/places", icon: MapPin },
  { label: "Statistics", href: "/tree/statistics", icon: BarChart3 },
  { label: "Surnames", href: "/tree/surnames", icon: Type },
  { label: "Timelines", href: "/timelines", icon: Route },
  { label: "Tree Viewer", href: "/tree/viewer", icon: GitBranch },
];

export const ARCHIVE_MENU: NavItem[] = [
  { label: "Audio", href: "/archive/audio", icon: Music },
  { label: "Photos", href: "/archive/photos", icon: Images },
  { label: "Videos", href: "/archive/videos", icon: Video },
];

export const CULTURE_MENU: NavItem[] = [
  { label: "Articles", href: "/culture/articles", icon: Newspaper },
  { label: "Language", href: "/culture/language", icon: Languages },
  { label: "Places", href: "/culture/places", icon: MapPin },
  { label: "Recipes", href: "/culture/recipes", icon: UtensilsCrossed },
];

export const NAV_LEFT: NavItem[] = [{ label: "Stories", href: "/stories" }];

export const NAV_RIGHT: NavItem[] = [{ label: "Search", href: "/tree/viewer/searchDatabase" }];
