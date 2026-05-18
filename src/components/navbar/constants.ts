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
  Feather,
  FileText,
  HandHelping,
  LifeBuoy,
  Link2,
  Mail,
  Newspaper,
  Map,
  Route,
  FileSignature,
  BarChart3,
  ScrollText,
} from "lucide-react";

export type NavItem = { label: string; href: string; icon?: LucideIcon };

export const TREE_MENU: NavItem[] = [
  { label: "Events", href: "/tree/events", icon: CalendarDays },
  { label: "Families", href: "/families", icon: Home },
  { label: "Given Names", href: "/given-names", icon: FileSignature },
  { label: "Individuals", href: "/individuals", icon: User },
  { label: "Places", href: "/tree/places", icon: MapPin },
  { label: "Statistics", href: "/tree/statistics", icon: BarChart3 },
  { label: "Surnames", href: "/surnames", icon: Type },
  { label: "Tree Viewer", href: "/tree/viewer", icon: GitBranch },
];

export const VISUALIZE_MENU: NavItem[] = [
  { label: "Tree Viewer", href: "/tree/viewer", icon: GitBranch },
  { label: "Timelines", href: "/timelines", icon: Route },
  { label: "Calendar", href: "/visualize/calendar", icon: CalendarDays },
  { label: "Maps", href: "/maps", icon: Map },
  { label: "Story Viewer", href: "/visualize/story-viewer", icon: Newspaper },
  { label: "Timeline/Map Combo", href: "/visualize/timeline-map", icon: Map },
];

export const ARCHIVE_MENU: NavItem[] = [
  { label: "Audio", href: "/archive/audio", icon: Music },
  { label: "Documents", href: "/archive/documents", icon: ScrollText },
  { label: "Notes", href: "/archive/notes", icon: FileText },
  { label: "Photos", href: "/archive/photos", icon: Images },
  { label: "Videos", href: "/archive/videos", icon: Video },
];

export const CULTURE_MENU: NavItem[] = [
  { label: "Articles", href: "/culture/articles", icon: Newspaper },
  { label: "Language", href: "/culture/language", icon: Languages },
  { label: "Folklore", href: "/culture/folklore", icon: Feather },
  { label: "Recipes", href: "/culture/recipes", icon: UtensilsCrossed },
];

export const NAV_LEFT: NavItem[] = [{ label: "Stories", href: "/stories" }];

export const MORE_MENU: NavItem[] = [
  { label: "About Creators", href: "/more/about-creators", icon: User },
  { label: "Upcoming Anniversaries", href: "/more/upcoming-anniversaries", icon: CalendarDays },
  { label: "Useful Links", href: "/more/useful-links", icon: Link2 },
  { label: "Contact", href: "/contact", icon: Mail },
  { label: "Contribute", href: "/contribute", icon: HandHelping },
  { label: "Help", href: "/help", icon: LifeBuoy },
];

export const NAV_RIGHT: NavItem[] = [{ label: "Search", href: "/tree/viewer/searchDatabase" }];
