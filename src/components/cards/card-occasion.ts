import type { LucideIcon } from "lucide-react";
import { Cake, Heart, Skull } from "lucide-react";

/** Replaces list-card metrics when highlighting an upcoming anniversary on a person or family card. */
export type CardOccasionHighlight = {
  eventType: "BIRT" | "DEAT" | "MARR";
  title: string;
  subtitle: string;
  calendarDayLabel: string;
};

export const CARD_OCCASION_ICONS: Record<CardOccasionHighlight["eventType"], LucideIcon> = {
  BIRT: Cake,
  DEAT: Skull,
  MARR: Heart,
};
