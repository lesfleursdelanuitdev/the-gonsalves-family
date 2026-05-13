import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  CalendarRange,
  MapPin,
  Tag,
  User,
  UsersRound,
} from "lucide-react";

export type AlbumGeneratorSourceId =
  | "individual"
  | "family"
  | "event"
  | "place"
  | "date"
  | "tag";

export type AlbumGeneratorSourceDef = {
  id: AlbumGeneratorSourceId;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const ALBUM_GENERATOR_SOURCES: AlbumGeneratorSourceDef[] = [
  {
    id: "individual",
    title: "Individual",
    description: "Gather media linked to one person in the tree.",
    icon: User,
  },
  {
    id: "family",
    title: "Family",
    description: "Combine photos from a household or family group.",
    icon: UsersRound,
  },
  {
    id: "event",
    title: "Event",
    description: "Births, weddings, migrations, and other milestones.",
    icon: CalendarDays,
  },
  {
    id: "place",
    title: "Place",
    description: "Images tied to a village, city, or region.",
    icon: MapPin,
  },
  {
    id: "date",
    title: "Date",
    description: "A span of years to draw memories from.",
    icon: CalendarRange,
  },
  {
    id: "tag",
    title: "Tag / theme",
    description: "Curate around a theme or archival tag.",
    icon: Tag,
  },
];
