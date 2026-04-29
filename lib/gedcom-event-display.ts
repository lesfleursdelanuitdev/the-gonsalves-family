import type { LucideIcon } from "lucide-react";
import {
  Baby,
  Briefcase,
  CalendarDays,
  Church,
  Cross,
  Droplets,
  FileText,
  Flame,
  Gem,
  GraduationCap,
  Heart,
  HeartCrack,
  Home,
  Landmark,
  Plane,
  ScrollText,
  Table,
  Users,
} from "lucide-react";

/**
 * Human-readable labels for standard GEDCOM event tags (and common extensions).
 * Aligned with admin `GedcomEventTypeIcon` tag → icon choices.
 */
export const GEDCOM_EVENT_TYPE_LABELS: Record<string, string> = {
  BIRT: "Birth",
  CHR: "Christening",
  CHRA: "Adult christening",
  BAPM: "Baptism",
  CONF: "Confirmation",
  DEAT: "Death",
  BURI: "Burial",
  CREM: "Cremation",
  MARR: "Marriage",
  ENGA: "Engagement",
  DIV: "Divorce",
  ANUL: "Annulment",
  RESI: "Residence",
  OCCU: "Occupation",
  EDUC: "Education",
  GRAD: "Graduation",
  IMMI: "Immigration",
  EMIG: "Emigration",
  NATU: "Naturalization",
  CENS: "Census",
  PROP: "Property",
  WILL: "Will",
  ADOP: "Adoption",
  EVEN: "Event",
};

const GEDCOM_EVENT_LUCIDE_MAP: Record<string, LucideIcon> = {
  BIRT: Baby,
  CHR: Droplets,
  CHRA: Droplets,
  BAPM: Droplets,
  CONF: Church,
  DEAT: Cross,
  BURI: Landmark,
  CREM: Flame,
  MARR: Heart,
  ENGA: Gem,
  DIV: HeartCrack,
  ANUL: HeartCrack,
  RESI: Home,
  OCCU: Briefcase,
  EDUC: GraduationCap,
  GRAD: GraduationCap,
  IMMI: Plane,
  EMIG: Plane,
  NATU: ScrollText,
  CENS: Table,
  PROP: Landmark,
  WILL: FileText,
  ADOP: Users,
  EVEN: CalendarDays,
};

export function getGedcomEventLucideIcon(eventType: string | null | undefined): LucideIcon {
  const key = (eventType ?? "").toUpperCase().trim();
  return GEDCOM_EVENT_LUCIDE_MAP[key] ?? CalendarDays;
}

export function gedcomEventTypeDisplayLabel(eventType: string | null | undefined): string {
  const raw = (eventType ?? "").trim();
  const key = raw.toUpperCase();
  if (!key) return raw || "—";
  return GEDCOM_EVENT_TYPE_LABELS[key] ?? raw;
}
