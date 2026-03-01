import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faUser,
  faHouse,
  faCalendarDays,
  faSitemap,
  faLocationDot,
  faFont,
  faImages,
  faVideo,
  faMusic,
  faUtensils,
  faLanguage,
  faMapPin,
  faNewspaper,
} from "@fortawesome/free-solid-svg-icons";

export type NavItem = { label: string; href: string; icon?: IconDefinition };

export const TREE_MENU: NavItem[] = [
  { label: "Individuals", href: "/tree/individuals", icon: faUser },
  { label: "Families", href: "/tree/families", icon: faHouse },
  { label: "Events", href: "/tree/events", icon: faCalendarDays },
  { label: "Tree Viewer", href: "/tree/viewer", icon: faSitemap },
  { label: "Places", href: "/tree/places", icon: faLocationDot },
  { label: "Surnames", href: "/tree/surnames", icon: faFont },
];

export const ARCHIVE_MENU: NavItem[] = [
  { label: "Photos", href: "/archive/photos", icon: faImages },
  { label: "Videos", href: "/archive/videos", icon: faVideo },
  { label: "Audio", href: "/archive/audio", icon: faMusic },
];

export const CULTURE_MENU: NavItem[] = [
  { label: "Recipes", href: "/culture/recipes", icon: faUtensils },
  { label: "Language", href: "/culture/language", icon: faLanguage },
  { label: "Places", href: "/culture/places", icon: faMapPin },
  { label: "Articles", href: "/culture/articles", icon: faNewspaper },
];

export const NAV_LEFT: NavItem[] = [{ label: "Stories", href: "/stories" }];

export const NAV_RIGHT: NavItem[] = [{ label: "Search", href: "/search" }];
